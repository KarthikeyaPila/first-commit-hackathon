"""Local JSON snapshots used by the clustering benchmark."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path

from .config import PROCESSED_DATA_DIR
from .models import Article


SNAPSHOT_PATH = PROCESSED_DATA_DIR / "ingestion_latest.json"


def _serialize_article(article: Article) -> dict[str, object]:
    return {
        "article_id": article.article_id,
        "source_id": article.source_id,
        "provenance_source_ids": list(
            article.provenance_source_ids or (article.source_id,)
        ),
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


def save_snapshot(articles: list[Article], path: Path = SNAPSHOT_PATH) -> Path:
    """Write a repeatable latest-ingestion snapshot for later experiments."""

    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "saved_at": datetime.now(timezone.utc).isoformat(),
        "article_count": len(articles),
        "articles": [_serialize_article(article) for article in articles],
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + chr(10))
    return path
