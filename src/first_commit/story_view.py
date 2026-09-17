"""Small local story-card view for inspecting matching decisions."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from .benchmark import LABELS_PATH, _evaluate_scores, _labeled_rows, lexical_similarity
from .matching import score_pair, weighted_tfidf_similarities
from .models import Article
from .sources import SOURCES

def cluster_matched_articles(
    article_count: int,
    matched_edges: list[tuple[int, int, object]],
) -> list[list[int]]:
    """Return connected article groups from pairwise MATCH decisions."""

    parents = list(range(article_count))

    def find(index: int) -> int:
        while parents[index] != index:
            parents[index] = parents[parents[index]]
            index = parents[index]
        return index

    def union(first: int, second: int) -> None:
        first_root, second_root = find(first), find(second)
        if first_root != second_root:
            parents[second_root] = first_root

    for first, second, _ in matched_edges:
        union(first, second)

    groups: dict[int, list[int]] = defaultdict(list)
    for index in range(article_count):
        groups[find(index)].append(index)
    return [indexes for indexes in groups.values() if len(indexes) > 1]


def build_demo_stories(
    snapshot_path: Path | None = None,
    *,
    max_stories: int = 30,
) -> dict[str, object]:
    """Group benchmark articles using the explainable matching scorer."""

    labeled, _ = _labeled_rows(LABELS_PATH)
    rows = labeled
    source_by_id = {source.source_id: source for source in SOURCES}
    article_by_url: dict[str, Article] = {}
    for row in rows:
        for prefix in ("first", "second"):
            url = row.get(f"{prefix}_url", "")
            if url and url not in article_by_url:
                article_by_url[url] = Article(
                    source_id=row.get(f"{prefix}_source", ""),
                    url=url,
                    headline=row.get(f"{prefix}_headline", ""),
                )
    articles = list(article_by_url.values())
    articles = [
        article for article in articles
        if article.source_id in source_by_id
    ]
    article_index = {article.url: index for index, article in enumerate(articles)}
    if not rows or not articles:
        return {
            "stories": [],
            "articles_considered": len(articles),
            "matched_groups": 0,
            "matching_method": "no benchmark candidates available",
        }

    edges: list[tuple[int, int, object]] = []
    scores: list[float] = []
    actual: list[bool] = []

    row_indexes = []
    for row in rows:
        first = article_index.get(row.get("first_url", ""))
        second = article_index.get(row.get("second_url", ""))
        if first is not None and second is not None:
            row_indexes.append((row, first, second))
    try:
        weighted_scores = weighted_tfidf_similarities(
            articles,
            [(first, second) for _, first, second in row_indexes],
        )
        use_tfidf = True
    except RuntimeError:
        weighted_scores = [
            lexical_similarity(articles[first], articles[second])
            for _, first, second in row_indexes
        ]
        use_tfidf = False

    for (row, first, second), similarity in zip(row_indexes, weighted_scores):
        # National reports may match each other, but their group must
        # eventually connect to a state/regional anchor to appear in a state view.
        decision = score_pair(
            articles[first],
            articles[second],
            source_by_id[articles[first].source_id],
            source_by_id[articles[second].source_id],
            tfidf_similarity=similarity,
        )
        scores.append(similarity)
        actual.append(row.get("same_story", "").strip().casefold() in {"1", "true", "yes"})
        if decision.outcome == "MATCH":
            edges.append((first, second, decision))

    groups = cluster_matched_articles(len(articles), edges)
    stories = []
    for indexes in groups:
        if len(indexes) < 2:
            continue
        has_state_anchor = any(
            source_by_id[articles[index].source_id].scope != "NATIONAL"
            for index in indexes
        )
        if not has_state_anchor:
            continue
        group_edges = [
            (first, second, decision)
            for first, second, decision in edges
            if first in indexes and second in indexes
        ]
        stories.append({
            "story_id": f"story-{len(stories) + 1}",
            "article_count": len(indexes),
            "sources": sorted({
                source_by_id[articles[index].source_id].name
                for index in indexes
            }),
            "reasons": _unique_reasons([decision for _, _, decision in group_edges]),
            "articles": [
                {
                    "source": source_by_id[articles[index].source_id].name,
                    "headline": articles[index].headline,
                    "url": articles[index].url,
                }
                for index in indexes
            ],
        })

    stories.sort(key=lambda story: (story["article_count"], story["sources"]), reverse=True)
    summary = _evaluate_scores(scores, actual, "tfidf_cosine_headline") if scores else {}
    return {
        "stories": stories[:max_stories],
        "articles_considered": len(articles),
        "matched_groups": len(stories),
        "matching_method": (
            "state-anchor → national-coverage matching with TF-IDF"
            if use_tfidf else
            "state-anchor → national-coverage matching with lexical fallback"
        ),
        "benchmark_pairs": len(rows),
        "benchmark_metrics": summary,
    }


def _unique_reasons(decisions: list[object]) -> list[str]:
    reasons = []
    for decision in decisions:
        for reason in decision.reasons:
            if reason not in reasons:
                reasons.append(reason)
    return reasons[:5]
