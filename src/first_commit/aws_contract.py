"""AWS persistence contract without requiring boto3 at runtime.

The functions here produce DynamoDB-ready records. Deployment code can later
write these records through boto3 without changing the domain pipeline.
"""

from __future__ import annotations

from typing import Any


SCHEMA_VERSION = "1"


def _record(pk: str, sk: str, entity_type: str, **values: Any) -> dict[str, Any]:
    return {
        "PK": pk,
        "SK": sk,
        "entity_type": entity_type,
        "schema_version": SCHEMA_VERSION,
        **values,
    }


def run_record(run: dict[str, Any]) -> dict[str, Any]:
    run_id = str(run["run_id"])
    return _record(
        f"RUN#{run_id}",
        "META",
        "run",
        run_id=run_id,
        status=run.get("status", "unknown"),
        started_at=run.get("started_at"),
        completed_at=run.get("completed_at"),
        articles_found=run.get("articles_found", 0),
        articles_unique=run.get("articles_unique", 0),
        duplicates_removed=run.get("duplicates_removed", 0),
        run_config=run.get("run_config", {}),
    )


def article_record(article: dict[str, Any], run_id: str) -> dict[str, Any]:
    article_id = str(article["article_id"])
    return _record(
        f"ARTICLE#{article_id}",
        "META",
        "article",
        article_id=article_id,
        run_id=run_id,
        source_id=article.get("source_id"),
        url=article.get("url"),
        canonical_url=article.get("url"),
        headline=article.get("headline", ""),
        summary=article.get("summary", ""),
        lead=article.get("lead", ""),
        published_at=article.get("published_at"),
        state=article.get("state"),
        genre=article.get("genre"),
        content_hash=article.get("content_hash"),
    )


def story_record(story: dict[str, Any], run_id: str, algorithm_version: str) -> dict[str, Any]:
    story_id = str(story["story_id"])
    return _record(
        f"STORY#{run_id}#{story_id}",
        "META",
        "story",
        run_id=run_id,
        story_id=story_id,
        algorithm_version=algorithm_version,
        story_title=story.get("story_title", "Untitled story"),
        states=story.get("states", []),
        article_count=story.get("article_count", 0),
        sources=story.get("sources", []),
    )


def story_membership_record(story_id: str, run_id: str, article_id: str) -> dict[str, Any]:
    return _record(
        f"STORY#{run_id}#{story_id}",
        f"ARTICLE#{article_id}",
        "story_membership",
        run_id=run_id,
        story_id=story_id,
        article_id=article_id,
    )


def state_story_record(state: str, run_id: str, story_id: str) -> dict[str, Any]:
    return _record(
        f"STATE#{state}",
        f"STORY#{run_id}#{story_id}",
        "state_story",
        state=state,
        run_id=run_id,
        story_id=story_id,
    )
