"""Small local story-card view for inspecting matching decisions."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from .benchmark import LABELS_PATH, _evaluate_scores, _labeled_rows, lexical_similarity, load_snapshot
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

def build_snapshot_stories(
    snapshot_path: Path,
    *,
    max_articles: int = 2000,
    max_neighbors: int = 8,
    max_stories: int = 60,
    use_embeddings: bool = False,
) -> dict[str, object]:
    """Cluster the full snapshot using sparse nearest-neighbor candidates."""

    articles = load_snapshot(snapshot_path)
    articles.sort(
        key=lambda article: article.published_at.timestamp() if article.published_at else 0,
        reverse=True,
    )
    articles = articles[:max_articles]
    source_by_id = {source.source_id: source for source in SOURCES}
    articles = [
        article for article in articles
        if article.source_id in source_by_id
    ]
    if not articles:
        return {
            "stories": [],
            "articles_considered": 0,
            "matched_groups": 0,
            "matching_method": "full snapshot clustering",
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
        headline_matrix = None

    def time_compatible(first: int, second: int) -> bool:
        first_time = articles[first].published_at
        second_time = articles[second].published_at
        if not first_time or not second_time:
            return True
        return abs((first_time - second_time).total_seconds()) / 3600 <= 48

    def source_compatible(anchor: int, candidate: int) -> bool:
        anchor_source = source_by_id[articles[anchor].source_id]
        candidate_source = source_by_id[articles[candidate].source_id]
        if anchor_source.scope == "NATIONAL" and candidate_source.scope == "NATIONAL":
            return False
        if anchor_source.scope == "NATIONAL" or candidate_source.scope == "NATIONAL":
            return True
        return bool(set(anchor_source.states) & set(candidate_source.states))

    def nearest_candidates(anchor: int, candidate_indexes: list[int]) -> list[int]:
        if use_tfidf:
            ranked = sorted(
                candidate_indexes,
                key=lambda candidate: float(headline_similarities[anchor, candidate]),
                reverse=True,
            )
        else:
            ranked = sorted(
                candidate_indexes,
                key=lambda candidate: lexical_similarity(articles[anchor], articles[candidate]),
                reverse=True,
            )
        return ranked[:max_neighbors]

    # First pass: every state/regional anchor searches each compatible source.
    anchor_indexes = [
        index
        for index, article in enumerate(articles)
        if source_by_id[article.source_id].scope != "NATIONAL"
    ]
    source_indexes = {
        source_id: [index for index, article in enumerate(articles) if article.source_id == source_id]
        for source_id in source_by_id
    }
    candidate_pairs: set[tuple[int, int]] = set()
    for anchor in anchor_indexes:
        for source_id, indexes in source_indexes.items():
            candidates = [
                candidate for candidate in indexes
                if candidate != anchor
                and articles[candidate].source_id != articles[anchor].source_id
                and source_compatible(anchor, candidate)
                and time_compatible(anchor, candidate)
            ]
            for candidate in nearest_candidates(anchor, candidates):
                candidate_pairs.add(tuple(sorted((anchor, candidate))))

    pairs = sorted(candidate_pairs)
    try:
        weighted_scores = weighted_tfidf_similarities(articles, pairs)
        score_method = "weighted TF-IDF"
    except RuntimeError:
        weighted_scores = [
            lexical_similarity(articles[first], articles[second])
            for first, second in pairs
        ]
        score_method = "lexical fallback"

    embedding_scores: list[float | None] = [None] * len(pairs)
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
            embedding_scores = [
                float(embeddings[first] @ embeddings[second])
                for first, second in pairs
            ]
            score_method += " + Sentence Transformer"
        except ImportError:
            pass

    edges: list[tuple[int, int, object]] = []
    outcome_counts = {"MATCH": 0, "CANDIDATE": 0, "NEW_STORY": 0}

    def evaluate_pairs(
        pair_list: list[tuple[int, int]],
        tfidf_scores: list[float],
        semantic_scores: list[float | None],
    ) -> list[int]:
        matched = []
        for (first, second), tfidf_score, embedding_score in zip(
            pair_list, tfidf_scores, semantic_scores
        ):
            decision = score_pair(
                articles[first],
                articles[second],
                source_by_id[articles[first].source_id],
                source_by_id[articles[second].source_id],
                tfidf_similarity=tfidf_score,
                embedding_similarity=embedding_score,
            )
            outcome_counts[decision.outcome] += 1
            if decision.outcome == "MATCH":
                edges.append((first, second, decision))
                if source_by_id[articles[first].source_id].scope == "NATIONAL":
                    matched.append(first)
                if source_by_id[articles[second].source_id].scope == "NATIONAL":
                    matched.append(second)
        return matched

    matched_national = set(evaluate_pairs(pairs, weighted_scores, embedding_scores))

    # Second pass: national reports can form coverage chains after anchoring.
    national_pairs: set[tuple[int, int]] = set()
    for anchor in matched_national:
        candidates = [
            candidate for candidate, article in enumerate(articles)
            if candidate != anchor
            and source_by_id[article.source_id].scope == "NATIONAL"
            and articles[candidate].source_id != articles[anchor].source_id
            and time_compatible(anchor, candidate)
        ]
        for candidate in nearest_candidates(anchor, candidates):
            pair = tuple(sorted((anchor, candidate)))
            if pair not in candidate_pairs:
                national_pairs.add(pair)

    if national_pairs:
        extra_pairs = sorted(national_pairs)
        try:
            extra_scores = weighted_tfidf_similarities(articles, extra_pairs)
        except RuntimeError:
            extra_scores = [
                lexical_similarity(articles[first], articles[second])
                for first, second in extra_pairs
            ]
        extra_embeddings = [
            float(embeddings[first] @ embeddings[second])
            if embeddings is not None else None
            for first, second in extra_pairs
        ]
        evaluate_pairs(extra_pairs, extra_scores, extra_embeddings)
        pairs.extend(extra_pairs)

    groups = cluster_matched_articles(len(articles), edges)
    stories = []
    for indexes in groups:
        has_state_anchor = any(
            source_by_id[articles[index].source_id].scope != "NATIONAL"
            for index in indexes
        )
        if not has_state_anchor:
            continue
        group_edges = [
            decision for first, second, decision in edges
            if first in indexes and second in indexes
        ]
        stories.append({
            "story_id": f"snapshot-story-{len(stories) + 1}",
            "article_count": len(indexes),
            "states": sorted({
                state
                for index in indexes
                for state in _article_states(
                    articles[index],
                    source_by_id[articles[index].source_id],
                )
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
    grouped_indexes = {
        index
        for indexes in groups
        if any(
            source_by_id[articles[index].source_id].scope != "NATIONAL"
            for index in indexes
        )
        for index in indexes
    }
    return {
        "stories": stories[:max_stories],
        "articles_considered": len(articles),
        "candidate_pairs": len(pairs),
        "decision_counts": outcome_counts,
        "matched_edges": len(edges),
        "matched_groups": len(stories),
        "articles_in_groups": len(grouped_indexes),
        "articles_ungrouped": len(articles) - len(grouped_indexes),
        "matching_method": (
            "full snapshot · headline neighbor retrieval · "
            + score_method + " · state-anchored grouping"
        ),
    }

def _article_states(article: Article, source) -> tuple[str, ...]:
    from .state_routing import route_article

    return route_article(article, source).states


def _unique_reasons(decisions: list[object]) -> list[str]:
    reasons = []
    for decision in decisions:
        for reason in decision.reasons:
            if reason not in reasons:
                reasons.append(reason)
    return reasons[:5]
