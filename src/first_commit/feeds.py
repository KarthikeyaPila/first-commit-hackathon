"""RSS/Atom ingestion primitives for the local validation prototype.

This module intentionally uses the Python standard library. The first goal is
to validate real feeds and article metadata before adding heavier extraction or
NLP dependencies.
"""

from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
import hashlib
import re
from typing import Callable
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

from .models import Article
from .sources import Source


USER_AGENT = "FirstCommitNews/0.1 (+local research prototype)"
_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


def clean_text(value: str | None) -> str:
    """Remove markup and normalize whitespace from RSS text fields."""

    if not value:
        return ""
    without_tags = _TAG_RE.sub(" ", unescape(value))
    return _WHITESPACE_RE.sub(" ", without_tags).strip()


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def _child_text(element: ET.Element, *names: str) -> str:
    wanted = {name.lower() for name in names}
    for child in element:
        if _local_name(child.tag) in wanted and child.text:
            return child.text
    return ""


def _entry_url(entry: ET.Element) -> str:
    for child in entry:
        if _local_name(child.tag) == "link":
            href = child.attrib.get("href", "").strip()
            if href:
                return href
            if child.text:
                return child.text.strip()
    return ""


def parse_published(value: str) -> datetime | None:
    """Parse common RSS and Atom date formats into UTC-aware datetimes."""

    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def parse_feed_xml(xml_payload: bytes, source: Source) -> list[Article]:
    """Parse RSS 2.0 or Atom entries into the project's Article model."""

    root = ET.fromstring(xml_payload)
    entries: list[Article] = []
    for element in root.iter():
        if _local_name(element.tag) not in {"item", "entry"}:
            continue

        headline = clean_text(_child_text(element, "title"))
        url = _entry_url(element)
        summary = clean_text(_child_text(element, "description", "summary", "content"))
        published = _child_text(element, "pubDate", "published", "updated", "date")
        guid = clean_text(_child_text(element, "guid", "id"))
        content_hash = hashlib.sha256(
            clean_text(f"{headline}\n{summary}").casefold().encode("utf-8")
        ).hexdigest()

        if headline and url:
            entries.append(
                Article(
                    source_id=source.source_id,
                    url=url,
                    headline=headline,
                    summary=summary,
                    published_at=parse_published(published),
                    content_hash=content_hash,
                    rss_guid=guid or None,
                    provenance_source_ids=(source.source_id,),
                )
            )
    return entries


def fetch_source(
    source: Source,
    max_entries: int,
    opener: Callable[..., object] = urlopen,
) -> list[Article]:
    """Fetch and parse one source, limiting work per ingestion run."""

    request = Request(source.rss_url, headers={"User-Agent": USER_AGENT})
    with opener(request, timeout=20) as response:
        payload = response.read()
    return parse_feed_xml(payload, source)[:max_entries]
