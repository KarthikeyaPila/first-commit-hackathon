"""Deterministic article deduplication for ingestion snapshots."""

from __future__ import annotations

from dataclasses import replace
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .models import Article


TRACKING_PARAMETERS = {
    "fbclid", "gclid", "mc_cid", "mc_eid", "ref",
    "utm_campaign", "utm_medium", "utm_source", "utm_term",
}


def canonical_url(url: str) -> str:
    """Remove fragments and common tracking parameters from an article URL."""

    parts = urlsplit(url.strip())
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query)
        if key.casefold() not in TRACKING_PARAMETERS
    ]
    return urlunsplit((
        parts.scheme.casefold(),
        parts.netloc.casefold(),
        parts.path.rstrip("/"),
        urlencode(query),
        "",
    ))


def _article_keys(article: Article) -> tuple[tuple[str, str], ...]:
    keys: list[tuple[str, str]] = []
    if article.rss_guid:
        keys.append(("guid", f"{article.source_id}:{article.rss_guid}"))
    url = canonical_url(article.url)
    if url:
        keys.append(("url", url))
    if article.content_hash:
        keys.append(("content_hash", article.content_hash))
    return tuple(keys)


def deduplication_key(article: Article) -> tuple[str, str]:
    """Return the highest-priority available identity key."""

    keys = _article_keys(article)
    return keys[0] if keys else ("content_hash", article.clustering_text.casefold())


def deduplicate_articles(articles: list[Article]) -> tuple[list[Article], int]:
    """Return unique articles and merge source provenance for duplicates."""

    unique: list[Article] = []
    aliases: dict[tuple[str, str], int] = {}
    for article in articles:
        keys = _article_keys(article)
        existing_index = next((aliases[key] for key in keys if key in aliases), None)
        if existing_index is None:
            existing_index = len(unique)
            unique.append(replace(
                article,
                url=canonical_url(article.url),
                provenance_source_ids=article.provenance_source_ids or (article.source_id,),
            ))
        else:
            existing = unique[existing_index]
            provenance = tuple(dict.fromkeys(
                existing.provenance_source_ids + (article.source_id,)
            ))
            unique[existing_index] = replace(existing, provenance_source_ids=provenance)
        for key in keys:
            aliases[key] = existing_index
    return unique, len(articles) - len(unique)
