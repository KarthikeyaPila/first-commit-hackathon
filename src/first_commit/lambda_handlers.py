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


def api_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Serve the first read-only health and run-status API endpoints."""

    path = event.get("rawPath", "")
    if path == "/health":
        return _response(200, {"ok": True, "service": "first-commit-api"})

    if path == "/states":
        from .state_routing import state_source_directory

        return _response(200, {"states": state_source_directory()})

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
        return _response(200, {"state": state, "stories": stories})

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
        run_id = path.rsplit("/", 1)[-1]
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
