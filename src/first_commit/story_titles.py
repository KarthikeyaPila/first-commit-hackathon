"""Deterministic representative headlines for grouped stories."""

from __future__ import annotations

from typing import Mapping, Sequence

from .models import Article


def choose_story_title(
    articles: Sequence[Article],
    source_by_id: Mapping[str, object],
) -> str:
    """Choose a source headline to represent a grouped story.

    We deliberately reuse a real publisher headline instead of synthesizing a
    new claim. State/regional headlines are preferred because they are the
    anchor for the state-first product; among those, readable and recent
    headlines win. The original headlines remain attached to the story.
    """

    candidates = [article for article in articles if article.headline.strip()]
    if not candidates:
        return "Untitled story"

    def rank(article: Article) -> tuple[int, int, int, float, str]:
        source = source_by_id.get(article.source_id)
        scope = getattr(source, "scope", "NATIONAL")
        is_anchor = int(scope != "NATIONAL")
        headline = " ".join(article.headline.split())
        length_quality = int(35 <= len(headline) <= 140)
        punctuation_quality = int(not headline.endswith(("...", "…")))
        published_timestamp = article.published_at.timestamp() if article.published_at else 0.0
        return (
            is_anchor,
            length_quality,
            punctuation_quality,
            published_timestamp,
            headline,
        )

    return max(candidates, key=rank).headline.strip()
