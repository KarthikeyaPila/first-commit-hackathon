"""Pipeline stage boundaries for the first research iteration."""


def pipeline_stages() -> tuple[str, ...]:
    """Return the planned stages in execution order."""

    return (
        "fetch_rss",
        "extract_articles",
        "normalize_articles",
        "classify_state",
        "classify_genre",
        "generate_embeddings",
        "cluster_stories",
        "write_outputs",
    )
