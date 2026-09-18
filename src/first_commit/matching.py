"""Explainable pair scoring for the first story-matching strategy."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import re

from .models import Article
from .sources import Source
from .state_routing import route_article


TOKEN_RE = re.compile(r"[a-z0-9]{3,}")
PROPER_TOKEN_RE = re.compile(r"\b(?:[A-Z][A-Za-z]{2,}|[A-Z]{2,})\b")
STOPWORDS = {
    "about", "after", "also", "amid", "been", "being", "from", "have", "into",
    "more", "over", "said", "says", "that", "than", "their", "there", "this",
    "under", "were", "with", "will", "would", "year", "years",
}


@dataclass(frozen=True)
class MatchDecision:
    """A matching result with its component signals and explanation."""

    outcome: str
    score: float
    reasons: tuple[str, ...]
    signals: dict[str, float | bool | None]


def _keywords(article: Article) -> set[str]:
    return {
        token for token in TOKEN_RE.findall(article.clustering_text.casefold())
        if token not in STOPWORDS
    }


def _entities(article: Article) -> set[str]:
    """Extract lightweight proper-name signals without a heavy NER dependency."""

    return {
        token.casefold()
        for token in PROPER_TOKEN_RE.findall(article.clustering_text)
        if token.casefold() not in STOPWORDS
    }


def _time_signal(first: Article, second: Article) -> tuple[float | None, str | None]:
    if not first.published_at or not second.published_at:
        return None, None
    hours = abs((first.published_at - second.published_at).total_seconds()) / 3600
    return max(0.0, 1.0 - min(hours, 48.0) / 48.0), f"published {hours:.1f} hours apart"

def weighted_tfidf_similarities(
    articles: list[Article],
    pairs: list[tuple[int, int]],
) -> list[float]:
    """Compare fields with headline-first weights and missing-field renormalization."""

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError as error:
        raise RuntimeError("Install the research extras for weighted text similarity") from error

    fields = (
        ("headline", 0.65),
        ("summary", 0.25),
        ("lead", 0.10),
    )
    field_scores: dict[str, list[float]] = {}
    for field, _ in fields:
        values = [getattr(article, field).strip() for article in articles]
        if not any(values):
            continue
        try:
            matrix = TfidfVectorizer(
                stop_words="english", ngram_range=(1, 2)
            ).fit_transform(values)
        except ValueError:
            continue
        if pairs:
            first_indexes, second_indexes = zip(*pairs)
            pair_scores = matrix[list(first_indexes)].multiply(
                matrix[list(second_indexes)]
            ).sum(axis=1)
            field_scores[field] = [float(score) for score in pair_scores.A1]
        else:
            field_scores[field] = []

    scores = []
    for pair_index, (first, second) in enumerate(pairs):
        available = [
            (weight, field_scores[field][pair_index])
            for field, weight in fields
            if field in field_scores
            and getattr(articles[first], field).strip()
            and getattr(articles[second], field).strip()
        ]
        weight_total = sum(weight for weight, _ in available)
        scores.append(
            sum(weight * score for weight, score in available) / weight_total
            if weight_total else 0.0
        )
    return scores


def score_pair(
    first: Article,
    second: Article,
    first_source: Source,
    second_source: Source,
    *,
    tfidf_similarity: float | None = None,
    embedding_similarity: float | None = None,
    reject_state_conflict: bool = True,
) -> MatchDecision:
    """Score a pair using text, metadata, and state signals.

    Thresholds are intentionally conservative starting points and should be
    calibrated against a larger held-out benchmark before production use.
    """

    first_states = set(route_article(first, first_source).states)
    second_states = set(route_article(second, second_source).states)
    state_overlap = bool(first_states & second_states)
    state_conflict = bool(first_states and second_states and not state_overlap)

    first_keywords = _keywords(first)
    second_keywords = _keywords(second)
    keyword_union = first_keywords | second_keywords
    keyword_overlap = (
        len(first_keywords & second_keywords) / len(keyword_union)
        if keyword_union else 0.0
    )

    first_entities = _entities(first)
    second_entities = _entities(second)
    entity_union = first_entities | second_entities
    entity_overlap = (
        len(first_entities & second_entities) / len(entity_union)
        if entity_union else 0.0
    )

    time_signal, time_reason = _time_signal(first, second)
    semantic_values = [
        value for value in (tfidf_similarity, embedding_similarity)
        if value is not None
    ]
    semantic_signal = sum(semantic_values) / len(semantic_values) if semantic_values else 0.0

    score = (
        0.55 * semantic_signal
        + 0.20 * entity_overlap
        + 0.15 * keyword_overlap
        + 0.10 * (time_signal if time_signal is not None else 0.5)
    )
    reasons: list[str] = []
    if embedding_similarity is not None and embedding_similarity >= 0.56:
        reasons.append("high semantic similarity")
    if tfidf_similarity is not None and tfidf_similarity >= 0.165:
        reasons.append("shared headline/context wording")
    if entity_overlap >= 0.20:
        reasons.append("shared named-entity signals")
    if state_overlap:
        score += 0.08
        reasons.append("compatible state routing")
    elif state_conflict:
        score -= 0.25
        reasons.append("conflicting state routing")
    if time_reason:
        reasons.append(time_reason)
    if not reasons:
        reasons.append("weak similarity and metadata evidence")

    # Embeddings and TF-IDF have different score scales. Candidate review
    # labels support a modest TF-IDF cutoff reduction while keeping the
    # lower-scoring band available for human review. The live candidate
    # labels support a 0.40 TF-IDF cutoff with a precision/recall tradeoff.
    match_threshold = 0.62 if embedding_similarity is not None else 0.40
    candidate_threshold = 0.40 if embedding_similarity is not None else 0.30
    if state_conflict or score < candidate_threshold:
        outcome = "NEW_STORY"
    elif score >= match_threshold and not state_conflict:
        outcome = "MATCH"
    else:
        outcome = "CANDIDATE"

    return MatchDecision(
        outcome=outcome,
        score=round(max(0.0, min(score, 1.0)), 6),
        reasons=tuple(reasons),
        signals={
            "tfidf_similarity": tfidf_similarity,
            "embedding_similarity": embedding_similarity,
            "semantic_signal": round(semantic_signal, 6),
            "keyword_overlap": round(keyword_overlap, 6),
            "entity_overlap": round(entity_overlap, 6),
            "time_signal": round(time_signal, 6) if time_signal is not None else None,
            "state_overlap": state_overlap,
            "state_conflict": state_conflict,
        },
    )
