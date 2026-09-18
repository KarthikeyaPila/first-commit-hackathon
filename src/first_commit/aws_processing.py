"""One idempotent ingestion run for the deployed AWS processor."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import tempfile
from typing import Any
import uuid

from .aws_contract import (
    article_record,
    run_record,
    state_story_record,
    story_membership_record,
    story_record,
)
from .clustering import build_global_stories
from .dedupe import deduplicate_articles
from .feeds import fetch_source
from .models import Article
from .pipeline import pipeline_stages
from .sources import SOURCES, Source
from .state_routing import route_article
from .storage import _serialize_article


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


STAGE_LABELS = {
    "fetch_sources": "Fetch RSS sources",
    "parse_articles": "Parse article entries",
    "normalize_articles": "Normalize article metadata",
    "deduplicate_articles": "Deduplicate articles",
    "classify_states": "Classify state relevance",
    "tfidf_vectorization": "Build TF-IDF features",
    "neighbor_retrieval": "Retrieve sparse headline neighbors",
    "weighted_tfidf_scoring": "Score weighted TF-IDF candidates",
    "keyword_entity_signals": "Evaluate keyword/entity/time signals",
    "graph_clustering": "Build story graph clusters",
    "rank_stories": "Rank and name stories",
    "persist_outputs": "Persist results to DynamoDB",
}


def _initial_stage_progress() -> list[dict[str, Any]]:
    return [
        {
            "stage_id": stage_id,
            "label": STAGE_LABELS[stage_id],
            "status": "QUEUED",
            "started_at": None,
            "completed_at": None,
            "metrics": {},
            "error": None,
        }
        for stage_id in pipeline_stages()
    ]


def _update_stage(
    table: Any,
    run_id: str,
    stage_id: str,
    status: str,
    metrics: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    item = table.get_item(Key={"PK": f"RUN#{run_id}", "SK": "META"}).get("Item")
    if not item:
        return
    progress = [dict(stage) for stage in item.get("stage_progress", [])]
    stage = next((entry for entry in progress if entry.get("stage_id") == stage_id), None)
    if stage is None:
        stage = {
            "stage_id": stage_id,
            "label": STAGE_LABELS.get(stage_id, stage_id),
            "started_at": None,
            "completed_at": None,
            "metrics": {},
            "error": None,
        }
        progress.append(stage)
    stage["status"] = status
    if status == "RUNNING" and not stage.get("started_at"):
        stage["started_at"] = _now()
    if status in {"COMPLETE", "FAILED", "SKIPPED"}:
        stage["completed_at"] = _now()
    if metrics:
        stage["metrics"] = {**stage.get("metrics", {}), **metrics}
    if error:
        stage["error"] = error
    item["stage_progress"] = progress
    item["current_stage"] = stage_id
    table.put_item(Item=run_record(item))


def _source_selection(event: dict[str, Any]) -> tuple[Source, ...]:
    requested = event.get("source_ids")
    if not isinstance(requested, list):
        configured = os.environ.get("AWS_SOURCE_IDS", "")
        requested = [item.strip() for item in configured.split(",") if item.strip()]
    active = [source for source in SOURCES if source.active]
    if requested:
        selected = [source for source in active if source.source_id in requested]
        if not selected:
            raise ValueError("source_ids did not identify any active sources")
        return tuple(selected)
    return tuple(active)


def _fetch_report(source: Source) -> tuple[dict[str, Any], list[Article]]:
    report: dict[str, Any] = {
        "source_id": source.source_id,
        "name": source.name,
        "scope": source.scope,
        "states": list(source.states),
        "rss_url": source.rss_url,
        "max_entries": source.max_entries,
        "feed_health": "ERROR",
        "articles_found": 0,
        "error": None,
    }
    try:
        articles = fetch_source(source, source.max_entries)
    except Exception as error:  # noqa: BLE001 - one bad feed must not fail the run
        report["error"] = f"{type(error).__name__}: {error}"
        return report, []
    report["feed_health"] = "OK"
    report["articles_found"] = len(articles)
    return report, articles


def _write_records(table: Any, records: list[dict[str, Any]]) -> None:
    with table.batch_writer() as batch:
        for record in records:
            batch.put_item(Item=record)


@contextmanager
def _snapshot_file(run_id: str, articles: list[Article]):
    payload = {
        "run_id": run_id,
        "run_config": {},
        "articles": [_serialize_article(article) for article in articles],
    }
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", prefix="first-commit-", delete=False
    ) as handle:
        json.dump(payload, handle, ensure_ascii=False)
        path = Path(handle.name)
    try:
        yield path
    finally:
        path.unlink(missing_ok=True)


def _build_story_records(
    run_id: str,
    articles: list[Article],
    progress_callback: Any = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    with _snapshot_file(run_id, articles) as snapshot_path:
        output = build_global_stories(
            snapshot_path,
            max_articles=4000,
            max_stories=80,
            progress_callback=progress_callback,
        )
    article_ids_by_url = {article.url: article.article_id for article in articles}
    records: list[dict[str, Any]] = []
    for story in output.get("stories", []):
        story_articles = story.get("articles", [])
        article_ids = [
            article_ids_by_url[item["url"]]
            for item in story_articles
            if item.get("url") in article_ids_by_url
        ]
        enriched = {**story, "article_ids": article_ids}
        records.append(story_record(enriched, run_id, str(output.get("algorithm_version", "unknown"))))
        for article_id in article_ids:
            records.append(story_membership_record(str(story["story_id"]), run_id, article_id))
        for state in story.get("states", []):
            records.append(state_story_record(str(state), run_id, str(story["story_id"])))
    summary = {
        key: output.get(key, 0)
        for key in (
            "articles_considered", "candidate_pairs", "matched_edges",
            "matched_groups", "articles_in_groups", "articles_ungrouped",
        )
    }
    summary["matching_method"] = output.get("matching_method")
    return records, summary


def process_latest_news(table: Any, event: dict[str, Any]) -> dict[str, Any]:
    """Fetch active feeds and persist an idempotent run plus article records."""

    run_id = str(event.get("run_id") or f"run-{uuid.uuid4().hex}")
    existing = table.get_item(Key={"PK": f"RUN#{run_id}", "SK": "META"}).get("Item")
    if existing and existing.get("status") in {"running", "completed"}:
        return existing

    sources = _source_selection(event)
    started_at = _now()
    initial = {
        "run_id": run_id,
        "status": "running",
        "started_at": started_at,
        "completed_at": None,
        "current_stage": "fetch_sources",
        "stage_progress": _initial_stage_progress(),
        "run_config": {
            "source_ids": [source.source_id for source in sources],
            "feed_workers": int(os.environ.get("FEED_WORKERS", "8")),
        },
    }
    table.put_item(Item=run_record(initial))

    current_stage = {"stage_id": "fetch_sources"}


    def mark_stage(
        stage_id: str,
        status: str,
        metrics: dict[str, Any] | None = None,
        error: str | None = None,
    ) -> None:
        if status == "RUNNING":
            current_stage["stage_id"] = stage_id
        _update_stage(table, run_id, stage_id, status, metrics, error)


    try:
        mark_stage("fetch_sources", "RUNNING", {"feeds_attempted": len(sources)})
        reports: list[dict[str, Any]] = []
        all_articles: list[Article] = []
        workers = max(1, min(int(os.environ.get("FEED_WORKERS", "8")), len(sources)))
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(_fetch_report, source) for source in sources]
            for future in futures:
                report, articles = future.result()
                reports.append(report)
                all_articles.extend(articles)

        mark_stage(
            "fetch_sources",
            "COMPLETE",
            {
                "feeds_attempted": len(sources),
                "feeds_ok": sum(report.get("feed_health") == "OK" for report in reports),
                "feeds_failed": sum(report.get("feed_health") == "ERROR" for report in reports),
                "articles_fetched": len(all_articles),
            },
        )
        mark_stage("parse_articles", "RUNNING")
        mark_stage("parse_articles", "COMPLETE", {"articles_parsed": len(all_articles)})
        mark_stage("normalize_articles", "RUNNING")
        mark_stage("normalize_articles", "COMPLETE", {"articles_normalized": len(all_articles)})

        mark_stage("deduplicate_articles", "RUNNING", {"articles_before": len(all_articles)})
        unique_articles, duplicates_removed = deduplicate_articles(all_articles)
        mark_stage(
            "deduplicate_articles",
            "COMPLETE",
            {
                "articles_before": len(all_articles),
                "articles_unique": len(unique_articles),
                "duplicates_removed": duplicates_removed,
            },
        )

        mark_stage("classify_states", "RUNNING", {"articles": len(unique_articles)})
        article_records: list[dict[str, Any]] = []
        state_matches = 0
        for article in unique_articles:
            source = next(item for item in sources if item.source_id == article.source_id)
            payload = _serialize_article(article)
            routing = route_article(article, source)
            payload["candidate_states"] = list(routing.states)
            payload["state_confidence"] = routing.confidence
            state_matches += len(routing.states)
            article_records.append(article_record(payload, run_id))
        mark_stage(
            "classify_states",
            "COMPLETE",
            {
                "articles": len(unique_articles),
                "state_matches": state_matches,
                "unresolved_articles": sum(
                    not record.get("candidate_states")
                    for record in article_records
                ),
            },
        )

        story_records, grouping_summary = _build_story_records(
            run_id,
            unique_articles,
            progress_callback=mark_stage,
        )

        mark_stage(
            "persist_outputs",
            "RUNNING",
            {"records_to_write": len(article_records) + len(story_records)},
        )
        _write_records(table, article_records + story_records)
        mark_stage(
            "persist_outputs",
            "COMPLETE",
            {
                "article_records": len(article_records),
                "story_records": len(story_records),
            },
        )

        completed = {
            **initial,
            "status": "completed",
            "completed_at": _now(),
            "current_stage": "persist_outputs",
            "stage_progress": [
                {
                    **stage,
                    "status": "COMPLETE" if stage.get("status") == "RUNNING" else stage.get("status"),
                    "completed_at": stage.get("completed_at") or _now(),
                }
                for stage in table.get_item(
                    Key={"PK": f"RUN#{run_id}", "SK": "META"}
                ).get("Item", {}).get("stage_progress", [])
            ],
            "articles_found": len(all_articles),
            "articles_unique": len(unique_articles),
            "duplicates_removed": duplicates_removed,
            "feeds": reports,
            "story_count": sum(1 for record in story_records if record.get("entity_type") == "story"),
            "grouping_summary": grouping_summary,
        }
        table.put_item(Item=run_record(completed))
        return completed
    except Exception as error:
        mark_stage(
            current_stage["stage_id"],
            "FAILED",
            error=f"{type(error).__name__}: {error}",
        )
        latest = table.get_item(
            Key={"PK": f"RUN#{run_id}", "SK": "META"}
        ).get("Item", {})
        failed = {
            **latest,
            **initial,
            "status": "failed",
            "completed_at": _now(),
            "current_stage": current_stage["stage_id"],
            "stage_progress": latest.get("stage_progress", initial["stage_progress"]),
            "error": f"{type(error).__name__}: {error}",
        }
        table.put_item(Item=run_record(failed))
        raise
