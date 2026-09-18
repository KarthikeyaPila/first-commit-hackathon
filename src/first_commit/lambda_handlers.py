"""Small AWS Lambda entry points for the first deployment slice."""

from __future__ import annotations

import json
from decimal import Decimal
import os
import uuid
from typing import Any
from urllib.parse import unquote


def _json_default(value: Any) -> int | float | str:
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    return str(value)


def _response(status_code: int, body: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=_json_default),
    }


def _latest_completed_run_id(table: Any, projections: list[dict[str, Any]]) -> str | None:
    """Return the newest completed run represented by state projections."""

    latest: tuple[str, str] | None = None
    for run_id in {str(item.get("run_id")) for item in projections if item.get("run_id")}:
        run = table.get_item(Key={"PK": f"RUN#{run_id}", "SK": "META"}).get("Item") or {}
        if run.get("status") != "completed":
            continue
        completed_at = str(run.get("completed_at") or "")
        if latest is None or completed_at > latest[0]:
            latest = (completed_at, run_id)
    return latest[1] if latest else None


def api_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Serve the first read-only health and run-status API endpoints."""

    path = event.get("rawPath", "")
    if path == "/health":
        return _response(200, {"ok": True, "service": "first-commit-api"})

    if path == "/market":
        import boto3
        if not os.environ.get("TABLE_NAME"):
            return _response(500, {"error": "TABLE_NAME is not configured"})
        table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
        item = table.get_item(Key={"PK": "MARKET#latest", "SK": "META"}).get("Item")
        if item is None:
            return _response(404, {"error": "market snapshot not found"})
        return _response(200, item)

    if path == "/states":
        from .state_routing import state_source_directory

        return _response(200, {"states": state_source_directory()})

    if path.startswith("/states/") and path.endswith("/articles"):
        state = unquote(path[len("/states/") : -len("/articles")].strip("/"))
        if not state or not os.environ.get("TABLE_NAME"):
            return _response(400, {"error": "state is required"})
        import boto3
        from boto3.dynamodb.conditions import Key

        table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
        projections = table.query(
            KeyConditionExpression=Key("PK").eq(f"STATE#{state}"),
        ).get("Items", [])
        latest_run_id = _latest_completed_run_id(table, projections)
        article_projections = [
            projection for projection in projections
            if projection.get("entity_type") == "state_article"
            and projection.get("run_id") == latest_run_id
        ]
        from .sources import SOURCES
        sources = {source.source_id: source for source in SOURCES}
        articles_by_source: dict[str, dict[str, Any]] = {}
        for projection in article_projections:
            article_id = projection.get("article_id")
            if not article_id:
                continue
            article = table.get_item(
                Key={"PK": f"ARTICLE#{article_id}", "SK": "META"}
            ).get("Item")
            if not article:
                continue
            source_id = str(article.get("source_id") or "unknown")
            source = sources.get(source_id)
            article["source"] = {
                "source_id": source_id,
                "name": source.name if source else source_id,
                "scope": source.scope if source else None,
                "states": list(source.states) if source else [],
                "language": source.language if source else None,
            }
            existing = articles_by_source.get(source_id)
            if existing is None or str(article.get("published_at") or "") > str(existing.get("published_at") or ""):
                articles_by_source[source_id] = article
        articles = sorted(
            articles_by_source.values(),
            key=lambda article: str(article.get("published_at") or ""),
            reverse=True,
        )[:30]
        return _response(200, {"state": state, "run_id": latest_run_id, "articles": articles})

    if path.startswith("/states/") and path.endswith("/stories"):
        state = unquote(path[len("/states/") : -len("/stories")].strip("/"))
        if not state or not os.environ.get("TABLE_NAME"):
            return _response(400, {"error": "state is required"})
        import boto3
        from boto3.dynamodb.conditions import Key

        table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
        projections = table.query(
            KeyConditionExpression=Key("PK").eq(f"STATE#{state}"),
        ).get("Items", [])
        latest_run_id = _latest_completed_run_id(table, projections)
        if latest_run_id:
            projections = [
                projection
                for projection in projections
                if projection.get("run_id") == latest_run_id
            ]
        stories = []
        for projection in projections:
            run_id = projection.get("run_id")
            story_id = projection.get("story_id")
            if not run_id or not story_id:
                continue
            story = table.get_item(
                Key={"PK": f"STORY#{run_id}#{story_id}", "SK": "META"}
            ).get("Item")
            if story:
                story["state"] = state
                stories.append(story)
        return _response(200, {"state": state, "run_id": latest_run_id, "stories": stories})

    if path == "/process":
        function_name = os.environ.get("PROCESSOR_FUNCTION_NAME")
        if not function_name:
            return _response(500, {"error": "PROCESSOR_FUNCTION_NAME is not configured"})
        import boto3

        run_id = f"run-{uuid.uuid4().hex}"
        payload = {"run_id": run_id}
        raw_body = event.get("body")
        if raw_body:
            try:
                requested = json.loads(raw_body)
            except (TypeError, json.JSONDecodeError):
                return _response(400, {"error": "body must be valid JSON"})
            if isinstance(requested, dict) and isinstance(requested.get("source_ids"), list):
                payload["source_ids"] = requested["source_ids"]
        boto3.client("lambda").invoke(
            FunctionName=function_name,
            InvocationType="Event",
            Payload=json.dumps(payload).encode("utf-8"),
        )
        return _response(202, {"run_id": run_id, "status": "queued"})

    if path.startswith("/stories/"):
        parts = [unquote(part) for part in path.strip("/").split("/")]
        if len(parts) == 3:
            _, run_id, story_id = parts
            if not run_id or not story_id or not os.environ.get("TABLE_NAME"):
                return _response(400, {"error": "run_id and story_id are required"})
            import boto3
            table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
            story = table.get_item(
                Key={"PK": f"STORY#{run_id}#{story_id}", "SK": "META"}
            ).get("Item")
            if story is None:
                return _response(404, {"error": "story not found"})
            from .sources import SOURCES
            sources = {source.source_id: source for source in SOURCES}
            articles = []
            for article_id in story.get("article_ids", []):
                article = table.get_item(
                    Key={"PK": f"ARTICLE#{article_id}", "SK": "META"}
                ).get("Item")
                if article:
                    source = sources.get(article.get("source_id"))
                    article["source"] = {
                        "source_id": article.get("source_id"),
                        "name": source.name if source else article.get("source_id"),
                        "scope": source.scope if source else None,
                        "states": list(source.states) if source else [],
                        "language": source.language if source else None,
                    }
                    articles.append(article)
            return _response(200, {"run_id": run_id, "story": story, "articles": articles})

        run_id = parts[-1] if len(parts) == 2 else ""
        if not run_id or not os.environ.get("TABLE_NAME"):
            return _response(400, {"error": "run_id is required"})
        import boto3
        from boto3.dynamodb.conditions import Key

        table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
        result = table.query(
            IndexName="RunStoriesIndex",
            KeyConditionExpression=Key("GSI1PK").eq(f"RUN#{run_id}"),
        )
        return _response(200, {"run_id": run_id, "stories": result.get("Items", [])})

    if path.startswith("/runs/"):
        run_id = path.rsplit("/", 1)[-1]
        if not run_id or not os.environ.get("TABLE_NAME"):
            return _response(400, {"error": "run_id is required"})
        import boto3

        table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
        item = table.get_item(Key={"PK": f"RUN#{run_id}", "SK": "META"}).get("Item")
        if item is None:
            return _response(404, {"error": "run not found"})
        return _response(200, item)

    return _response(404, {"error": "not found"})


def processing_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Run one real RSS ingestion and persist its records in DynamoDB."""

    table_name = os.environ.get("TABLE_NAME")
    if not table_name:
        return _response(500, {"error": "TABLE_NAME is not configured"})
    import boto3

    from .aws_processing import process_latest_news

    try:
        result = process_latest_news(boto3.resource("dynamodb").Table(table_name), event or {})
    except Exception as error:  # noqa: BLE001 - failed runs are persisted for inspection
        return _response(500, {"error": "processing failed", "detail": str(error)})
    status = 202 if result.get("status") == "running" else 200
    return _response(status, result)
