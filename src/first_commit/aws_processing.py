"""One idempotent ingestion run for the deployed AWS processor."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import os
from typing import Any
import uuid

from .aws_contract import article_record, run_record
from .dedupe import deduplicate_articles
from .feeds import fetch_source
from .models import Article
from .sources import SOURCES, Source
from .state_routing import route_article
from .storage import _serialize_article


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


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
        "run_config": {
            "source_ids": [source.source_id for source in sources],
            "feed_workers": int(os.environ.get("FEED_WORKERS", "8")),
        },
    }
    table.put_item(Item=run_record(initial))

    try:
        reports: list[dict[str, Any]] = []
        all_articles: list[Article] = []
        workers = max(1, min(int(os.environ.get("FEED_WORKERS", "8")), len(sources)))
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(_fetch_report, source) for source in sources]
            for future in futures:
                report, articles = future.result()
                reports.append(report)
                all_articles.extend(articles)

        unique_articles, duplicates_removed = deduplicate_articles(all_articles)
        article_records: list[dict[str, Any]] = []
        for article in unique_articles:
            source = next(item for item in sources if item.source_id == article.source_id)
            payload = _serialize_article(article)
            routing = route_article(article, source)
            payload["candidate_states"] = list(routing.states)
            payload["state_confidence"] = routing.confidence
            article_records.append(article_record(payload, run_id))
        _write_records(table, article_records)

        completed = {
            **initial,
            "status": "completed",
            "completed_at": _now(),
            "articles_found": len(all_articles),
            "articles_unique": len(unique_articles),
            "duplicates_removed": duplicates_removed,
            "feeds": reports,
        }
        table.put_item(Item=run_record(completed))
        return completed
    except Exception as error:
        failed = {
            **initial,
            "status": "failed",
            "completed_at": _now(),
            "error": f"{type(error).__name__}: {error}",
        }
        table.put_item(Item=run_record(failed))
        raise
