"""Small AWS Lambda entry points for the first deployment slice."""

from __future__ import annotations

import json
import os
from typing import Any


def _response(status_code: int, body: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def api_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Serve the first read-only health and run-status API endpoints."""

    path = event.get("rawPath", "")
    if path == "/health":
        return _response(200, {"ok": True, "service": "first-commit-api"})

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
    """Placeholder entry point until RSS packaging and scheduling are added."""

    return _response(501, {
        "error": "processing pipeline is not deployed yet",
        "message": "The AWS foundation is deployed before RSS execution is connected.",
    })
