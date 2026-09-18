"""Actual processing stages emitted to the run-status API and UI."""


def pipeline_stages() -> tuple[str, ...]:
    """Return only stages executed by the current deployed pipeline."""

    return (
        "fetch_sources",
        "parse_articles",
        "normalize_articles",
        "deduplicate_articles",
        "classify_states",
        "tfidf_vectorization",
        "neighbor_retrieval",
        "weighted_tfidf_scoring",
        "keyword_entity_signals",
        "graph_clustering",
        "rank_stories",
        "persist_outputs",
    )
