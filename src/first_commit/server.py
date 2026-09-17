"""Small local API and browser UI for verifying RSS ingestion."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from .config import PrototypeConfig
from .feeds import fetch_source
from .sources import SOURCES
from .state_routing import route_article, state_source_directory


WEB_DIR = Path(__file__).resolve().parents[2] / "web"
_last_run: dict[str, object] = {
    "status": "not_started",
    "started_at": None,
    "completed_at": None,
    "feeds": [],
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _article_payload(article, source):
    routing = route_article(article, source)
    return {
        "headline": article.headline,
        "url": article.url,
        "published_at": article.published_at.isoformat() if article.published_at else None,
        "summary": article.summary,
        "candidate_states": list(routing.states),
        "state_confidence": routing.confidence,
        "state_matches": {state: list(terms) for state, terms in routing.matched_terms.items()},
    }

def run_ingestion() -> dict[str, object]:
    """Fetch every active source and return UI-friendly run information."""

    global _last_run
    started_at = _now()
    reports: list[dict[str, object]] = []
    _last_run = {"status": "running", "started_at": started_at, "completed_at": None, "feeds": reports}

    config = PrototypeConfig()
    for source in SOURCES:
        if not source.active:
            continue
        report: dict[str, object] = {
            "source_id": source.source_id,
            "name": source.name,
            "scope": source.scope,
            "states": list(source.states),
            "rss_url": source.rss_url,
            "status": "fetching",
            "feed_health": source.feed_health,
            "fetched_at": None,
            "articles_found": 0,
            "articles": [],
            "error": source.last_error,
        }
        try:
            articles = fetch_source(source, config.max_entries_per_source)
            report["status"] = "ok"
            report["feed_health"] = "OK"
            report["fetched_at"] = _now()
            report["articles_found"] = len(articles)
            report["articles"] = [_article_payload(article, source) for article in articles[:10]]
        except Exception as error:  # noqa: BLE001 - a failed feed must not stop other feeds
            report["status"] = "error"
            report["feed_health"] = "ERROR"
            report["error"] = f"{type(error).__name__}: {error}"
        reports.append(report)

    _last_run = {
        "status": "completed",
        "started_at": started_at,
        "completed_at": _now(),
        "feeds": reports,
    }
    return _last_run


class RequestHandler(BaseHTTPRequestHandler):
    """Serve the verification UI and its small JSON API."""

    def _send_json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/feeds":
            self._send_json(_last_run)
            return
        if path == "/api/state-sources":
            self._send_json({"states": state_source_directory()})
            return
        if path in {"/", "/index.html"}:
            body = (WEB_DIR / "index.html").read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802
        if urlparse(self.path).path == "/api/ingest":
            self._send_json(run_ingestion())
            return
        self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def log_message(self, format: str, *args: object) -> None:
        print(f"[server] {format % args}")


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 8000), RequestHandler)
    print("First Commit verification UI: http://127.0.0.1:8000")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
