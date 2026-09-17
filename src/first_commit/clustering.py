"""Global article graph clustering for the story comparison prototype."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from .benchmark import load_snapshot, lexical_similarity
from .matching import score_pair, weighted_tfidf_similarities
from .models import Article
from .sources import SOURCES
from .state_routing import route_article


def build_global_stories(
    snapshot_path: Path,
    *,
    max_articles: int = 4000,
    max_neighbors_per_source: int = 12,
    max_stories: int = 80,
    use_embeddings: bool = False,
) -> dict[str, object]:
    """Build global story clusters, then project their articles to states."""

    articles = load_snapshot(snapshot_path)
    articles.sort(
        key=lambda article: article.published_at.timestamp() if article.published_at else 0,
        reverse=True,
    )
    articles = articles[:max_articles]
    source_by_id = {source.source_id: source for source in SOURCES}
    articles = [article for article in articles if article.source_id in source_by_id]
    if not articles:
        return {
            "stories": [],
            "articles_considered": 0,
            "story_count": 0,
            "articles_ungrouped": 0,
            "matching_method": "global story graph",
        }

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        use_tfidf = True
        headline_matrix = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
        ).fit_transform([article.headline for article in articles])
        headline_similarities = cosine_similarity(headline_matrix)
    except ImportError:
        use_tfidf = False
        headline_similarities = None

    source_indexes = {
        source_id: [
            index for index, article in enumerate(articles)
            if article.source_id == source_id
        ]
        for source_id in source_by_id
    }

    def time_compatible(first: int, second: int) -> bool:
        first_time = articles[first].published_at
        second_time = articles[second].published_at
        if not first_time or not second_time:
            return True
        return abs((first_time - second_time).total_seconds()) / 3600 <= 48

    def nearest_candidates(index: int, indexes: list[int]) -> list[int]:
        if use_tfidf:
            return sorted(
                indexes,
                key=lambda other: float(headline_similarities[index, other]),
                reverse=True,
            )[:max_neighbors_per_source]
        return sorted(
            indexes,
            key=lambda other: lexical_similarity(articles[index], articles[other]),
            reverse=True,
        )[:max_neighbors_per_source]

    candidate_pairs: set[tuple[int, int]] = set()
    for index in range(len(articles)):
        for source_id, indexes in source_indexes.items():
            if articles[index].source_id == source_id:
                continue
            for other in nearest_candidates(index, [
                other for other in indexes if time_compatible(index, other)
            ]):
                candidate_pairs.add(tuple(sorted((index, other))))

    pairs = sorted(candidate_pairs)
    try:
        text_scores = weighted_tfidf_similarities(articles, pairs)
        score_method = "weighted TF-IDF"
    except RuntimeError:
        text_scores = [
            lexical_similarity(articles[first], articles[second])
            for first, second in pairs
        ]
        score_method = "lexical fallback"

    semantic_scores: list[float | None] = [None] * len(pairs)
    embeddings = None
    if use_embeddings:
        try:
            from sentence_transformers import SentenceTransformer

            model = SentenceTransformer(
                "sentence-transformers/all-MiniLM-L6-v2",
                device="cpu",
            )
            embeddings = model.encode(
                [article.clustering_text for article in articles],
                batch_size=32,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            semantic_scores = [
                float(embeddings[first] @ embeddings[second])
                for first, second in pairs
            ]
            score_method += " + Sentence Transformer"
        except ImportError:
            pass

    parents = list(range(len(articles)))
    edges: list[tuple[int, int, object]] = []
    review_candidates: list[dict[str, object]] = []
    decision_counts = {"MATCH": 0, "CANDIDATE": 0, "NEW_STORY": 0}

    def find(index: int) -> int:
        while parents[index] != index:
            parents[index] = parents[parents[index]]
            index = parents[index]
        return index

    def union(first: int, second: int) -> None:
        first_root, second_root = find(first), find(second)
        if first_root != second_root:
            parents[second_root] = first_root

    for (first, second), text_score, semantic_score in zip(
        pairs, text_scores, semantic_scores
    ):
        decision = score_pair(
            articles[first],
            articles[second],
            source_by_id[articles[first].source_id],
            source_by_id[articles[second].source_id],
            tfidf_similarity=text_score,
            embedding_similarity=semantic_score,
            reject_state_conflict=False,
        )
        decision_counts[decision.outcome] += 1
        if decision.outcome == "MATCH":
            union(first, second)
            edges.append((first, second, decision))
        elif decision.outcome == "CANDIDATE":
            review_candidates.append({
                "score": round(decision.score, 4),
                "reasons": decision.reasons,
                "signals": decision.signals,
                "first_source": source_by_id[articles[first].source_id].name,
                "first_headline": articles[first].headline,
                "first_url": articles[first].url,
                "second_source": source_by_id[articles[second].source_id].name,
                "second_headline": articles[second].headline,
                "second_url": articles[second].url,
            })

    groups: dict[int, list[int]] = defaultdict(list)
    for index in range(len(articles)):
        groups[find(index)].append(index)

    stories = []
    grouped_indexes: set[int] = set()
    for indexes in groups.values():
        if len(indexes) < 2:
            continue
        grouped_indexes.update(indexes)
        group_edges = [
            decision for first, second, decision in edges
            if first in indexes and second in indexes
        ]
        stories.append({
            "story_id": f"global-story-{len(stories) + 1}",
            "article_count": len(indexes),
            "states": sorted({
                state
                for index in indexes
                for state in route_article(
                    articles[index],
                    source_by_id[articles[index].source_id],
                ).states
            }),
            "sources": sorted({
                source_by_id[articles[index].source_id].name
                for index in indexes
            }),
            "reasons": _unique_reasons(group_edges),
            "articles": [
                {
                    "source": source_by_id[articles[index].source_id].name,
                    "headline": articles[index].headline,
                    "url": articles[index].url,
                    "published_at": (
                        articles[index].published_at.isoformat()
                        if articles[index].published_at else None
                    ),
                }
                for index in indexes
            ],
        })

    stories.sort(key=lambda story: (story["article_count"], story["sources"]), reverse=True)
    review_candidates.sort(key=lambda candidate: candidate["score"], reverse=True)
    visible_stories = stories[:max_stories]
    return {
        "stories": visible_stories,
        "state_groups": _project_state_groups(visible_stories),
        "articles_considered": len(articles),
        "candidate_pairs": len(pairs),
        "decision_counts": decision_counts,
        "matched_edges": len(edges),
        "story_count": len(stories),
        "matched_groups": len(stories),
        "articles_in_groups": len(grouped_indexes),
        "articles_ungrouped": len(articles) - len(grouped_indexes),
        "candidate_reviews": review_candidates[:100],
        "matching_method": (
            "global story graph · per-source retrieval · "
            + score_method
        ),
    }


def _project_state_groups(stories: list[dict[str, object]]) -> list[dict[str, object]]:
    """Project each grouped story into its backend-owned state sections."""
    grouped: dict[str, list[dict[str, object]]] = defaultdict(list)
    for story in stories:
        states = story.get("states") or ["National / Unassigned"]
        for state in states:
            projected = dict(story)
            projected["state"] = state
            grouped[str(state)].append(projected)
    return [
        {
            "state": state,
            "story_count": len(state_stories),
            "stories": state_stories,
        }
        for state, state_stories in sorted(grouped.items())
    ]


def _unique_reasons(decisions: list[object]) -> list[str]:
    reasons = []
    for decision in decisions:
        for reason in decision.reasons:
            if reason not in reasons:
                reasons.append(reason)
    return reasons[:5]
