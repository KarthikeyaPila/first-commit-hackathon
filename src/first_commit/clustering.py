"""Global article graph clustering for the story comparison prototype."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Any, Callable

from .benchmark import load_snapshot, load_snapshot_metadata, lexical_similarity
from .matching import score_pair, weighted_tfidf_similarities
from .models import Article
from .sources import SOURCES
from .state_routing import route_article
from .story_titles import choose_story_title


STORY_ALGORITHM_VERSION = "global-story-graph-v2-sparse-retrieval"
_HEADLINE_MATRIX_CACHE: dict[tuple[str, int, int], tuple[object, object, object, object]] = {}


def _report_stage(
    callback: Callable[[str, str, dict[str, Any]], None] | None,
    stage_id: str,
    status: str,
    metrics: dict[str, Any] | None = None,
) -> None:
    if callback is not None:
        callback(stage_id, status, metrics or {})


def build_global_stories(
    snapshot_path: Path,
    *,
    max_articles: int | None = None,
    max_neighbors_per_source: int = 12,
    max_stories: int = 80,
    use_embeddings: bool = False,
    progress_callback: Callable[[str, str, dict[str, Any]], None] | None = None,
) -> dict[str, object]:
    """Build global story clusters, then project their articles to states."""

    snapshot_metadata = load_snapshot_metadata(snapshot_path)
    run_id = snapshot_metadata.get("run_id") or "unversioned"
    articles = load_snapshot(snapshot_path)
    articles.sort(
        key=lambda article: article.published_at.timestamp() if article.published_at else 0,
        reverse=True,
    )
    if max_articles is not None:
        articles = articles[:max_articles]
    source_by_id = {source.source_id: source for source in SOURCES}
    articles = [article for article in articles if article.source_id in source_by_id]
    if not articles:
        for stage_id in (
            "tfidf_vectorization", "neighbor_retrieval",
            "weighted_tfidf_scoring", "keyword_entity_signals",
            "graph_clustering", "rank_stories",
        ):
            _report_stage(progress_callback, stage_id, "SKIPPED", {"reason": "no eligible articles"})
        return {
            "stories": [],
            "articles_considered": 0,
            "story_count": 0,
            "articles_ungrouped": 0,
            "matching_method": "global story graph",
            "run_id": run_id,
            "algorithm_version": STORY_ALGORITHM_VERSION,
            "run_config": snapshot_metadata.get("run_config", {}),
        }

    _report_stage(progress_callback, "tfidf_vectorization", "RUNNING", {"documents": len(articles)})
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.neighbors import NearestNeighbors

        cache_key = (str(snapshot_path.resolve()), snapshot_path.stat().st_mtime_ns, len(articles))
        cached = _HEADLINE_MATRIX_CACHE.get(cache_key)
        if cached is None:
            headline_matrix = TfidfVectorizer(
                stop_words="english",
                ngram_range=(1, 2),
            ).fit_transform([article.headline for article in articles])
            neighbor_count = min(
                len(articles),
                max(128, max_neighbors_per_source * 16 + 1),
            )
            neighbor_model = NearestNeighbors(
                n_neighbors=neighbor_count,
                metric="cosine",
                algorithm="brute",
                n_jobs=-1,
            ).fit(headline_matrix)
            headline_distances, headline_neighbors = neighbor_model.kneighbors(
                headline_matrix,
                return_distance=True,
            )
            _HEADLINE_MATRIX_CACHE.clear()
            _HEADLINE_MATRIX_CACHE[cache_key] = (
                headline_matrix,
                headline_distances,
                headline_neighbors,
                neighbor_count,
            )
        else:
            headline_matrix, headline_distances, headline_neighbors, neighbor_count = cached
        use_tfidf = True
        _report_stage(
            progress_callback,
            "tfidf_vectorization",
            "COMPLETE",
            {"documents": len(articles), "features": int(headline_matrix.shape[1]), "cached": cached is not None},
        )
    except ImportError:
        use_tfidf = False
        headline_matrix = None
        _report_stage(progress_callback, "tfidf_vectorization", "SKIPPED", {"reason": "scikit-learn unavailable"})

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

    candidate_pairs: set[tuple[int, int]] = set()
    _report_stage(progress_callback, "neighbor_retrieval", "RUNNING", {"articles": len(articles)})
    if use_tfidf:
        # Walk a bounded global neighbor list instead of materializing the full
        # article-by-article cosine matrix. Retain up to the configured number
        # of nearest, time-compatible articles from each other source.
        for index in range(len(articles)):
            selected_by_source: dict[str, int] = defaultdict(int)
            for _distance, other in zip(
                headline_distances[index], headline_neighbors[index]
            ):
                other = int(other)
                if other == index:
                    continue
                source_id = articles[other].source_id
                if source_id == articles[index].source_id:
                    continue
                if selected_by_source[source_id] >= max_neighbors_per_source:
                    continue
                if not time_compatible(index, other):
                    continue
                candidate_pairs.add(tuple(sorted((index, other))))
                selected_by_source[source_id] += 1
    else:
        for index in range(len(articles)):
            for source_id, indexes in source_indexes.items():
                if articles[index].source_id == source_id:
                    continue
                compatible = [other for other in indexes if time_compatible(index, other)]
                ranked = sorted(
                    compatible,
                    key=lambda other: lexical_similarity(articles[index], articles[other]),
                    reverse=True,
                )
                for other in ranked[:max_neighbors_per_source]:
                    candidate_pairs.add(tuple(sorted((index, other))))

    _report_stage(progress_callback, "neighbor_retrieval", "COMPLETE", {"candidate_pairs": len(candidate_pairs)})
    pairs = sorted(candidate_pairs)
    _report_stage(progress_callback, "weighted_tfidf_scoring", "RUNNING", {"candidate_pairs": len(pairs)})
    try:
        text_scores = weighted_tfidf_similarities(articles, pairs)
        score_method = "weighted TF-IDF"
        _report_stage(progress_callback, "weighted_tfidf_scoring", "COMPLETE", {"pairs": len(pairs), "method": score_method})
    except RuntimeError:
        text_scores = [
            lexical_similarity(articles[first], articles[second])
            for first, second in pairs
        ]
        score_method = "lexical fallback"
        _report_stage(progress_callback, "weighted_tfidf_scoring", "SKIPPED", {"pairs": len(pairs), "method": score_method})

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

    _report_stage(progress_callback, "keyword_entity_signals", "RUNNING", {"pairs": len(pairs)})
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
                "review_id": f"{run_id}-review-{len(review_candidates) + 1}",
                "algorithm_version": STORY_ALGORITHM_VERSION,
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

    _report_stage(progress_callback, "keyword_entity_signals", "COMPLETE", {"matches": decision_counts["MATCH"], "candidates": decision_counts["CANDIDATE"], "new_stories": decision_counts["NEW_STORY"]})
    _report_stage(progress_callback, "graph_clustering", "RUNNING", {"matched_edges": len(edges)})
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
            "story_id": f"{run_id}-story-{len(stories) + 1}",
            "algorithm_version": STORY_ALGORITHM_VERSION,
            "story_title": choose_story_title([articles[index] for index in indexes], source_by_id),
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

    _report_stage(progress_callback, "graph_clustering", "COMPLETE", {"connected_components": len(groups), "matched_edges": len(edges)})
    _report_stage(progress_callback, "rank_stories", "RUNNING", {"stories": len(stories)})
    stories.sort(key=lambda story: (story["article_count"], story["sources"]), reverse=True)
    _report_stage(progress_callback, "rank_stories", "COMPLETE", {"stories": len(stories), "visible_stories": min(len(stories), max_stories)})
    review_candidates.sort(key=lambda candidate: candidate["score"], reverse=True)
    visible_stories = stories[:max_stories]
    return {
        "stories": visible_stories,
        "run_id": run_id,
        "algorithm_version": STORY_ALGORITHM_VERSION,
        "run_config": snapshot_metadata.get("run_config", {}),
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
