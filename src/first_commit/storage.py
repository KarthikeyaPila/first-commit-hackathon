"""Local JSON persistence used by ingestion and clustering experiments."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path

from .config import PROCESSED_DATA_DIR
from .models import Article


SNAPSHOT_PATH = PROCESSED_DATA_DIR / "ingestion_latest.json"
ARTICLE_STORE_PATH = PROCESSED_DATA_DIR / "articles.json"
RUN_HISTORY_PATH = PROCESSED_DATA_DIR / "runs.jsonl"


def _serialize_article(article: Article) -> dict[str, object]:
    return {
        "article_id": article.article_id,
        "source_id": article.source_id,
        "provenance_source_ids": list(article.provenance_source_ids or (article.source_id,)),
        "rss_guid": article.rss_guid,
        "url": article.url,
        "headline": article.headline,
        "summary": article.summary,
        "lead": article.lead,
        "published_at": article.published_at.isoformat() if article.published_at else None,
        "state": article.state,
        "genre": article.genre,
        "content_hash": article.content_hash,
    }


def save_snapshot(
    articles: list[Article],
    path: Path = SNAPSHOT_PATH,
    *,
    run_id: str | None = None,
    run_config: dict[str, object] | None = None,
) -> Path:
    """Write the latest normalized snapshot with reproducibility metadata."""

    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "saved_at": datetime.now(timezone.utc).isoformat(),
        "run_id": run_id,
        "run_config": run_config or {},
        "article_count": len(articles),
        "articles": [_serialize_article(article) for article in articles],
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + chr(10))
    return path


def upsert_articles(articles: list[Article], path: Path = ARTICLE_STORE_PATH) -> dict[str, int]:
    """Upsert articles by deterministic ID and report new/updated/unchanged counts."""

    path.parent.mkdir(parents=True, exist_ok=True)
    existing: dict[str, dict[str, object]] = {}
    if path.exists():
        existing = json.loads(path.read_text())
    new_count = updated_count = unchanged_count = 0
    for article in articles:
        item = _serialize_article(article)
        article_id = str(item["article_id"])
        if article_id not in existing:
            new_count += 1
        elif existing[article_id] == item:
            unchanged_count += 1
        else:
            updated_count += 1
        existing[article_id] = item
    path.write_text(json.dumps(existing, indent=2, ensure_ascii=False, sort_keys=True) + chr(10))
    return {"new": new_count, "updated": updated_count, "unchanged": unchanged_count, "stored": len(existing)}


def append_run(run: dict[str, object], path: Path = RUN_HISTORY_PATH) -> Path:
    """Append one completed or failed run summary for later observability."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(run, ensure_ascii=False, sort_keys=True) + chr(10))
    return path
