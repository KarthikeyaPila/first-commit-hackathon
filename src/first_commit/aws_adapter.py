"""Local adapter from pipeline outputs to the AWS persistence contract."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .aws_contract import article_record, run_record
from .config import PROCESSED_DATA_DIR
from .models import Article
from .storage import _serialize_article


AWS_RECORDS_PATH = PROCESSED_DATA_DIR / "aws_records_latest.json"


def build_ingestion_records(run: dict[str, Any], articles: list[Article]) -> list[dict[str, Any]]:
    """Convert one completed local ingestion into DynamoDB-shaped records."""

    run_id = str(run["run_id"])
    records = [run_record(run)]
    records.extend(
        article_record(_serialize_article(article), run_id)
        for article in articles
    )
    return records


def save_local_records(
    records: list[dict[str, Any]],
    path: Path = AWS_RECORDS_PATH,
) -> Path:
    """Write an inspectable local export using the eventual AWS record shape."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, indent=2, ensure_ascii=False) + chr(10))
    return path
