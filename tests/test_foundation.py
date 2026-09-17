from first_commit.models import Article
from first_commit.pipeline import pipeline_stages


def test_clustering_text_uses_headline_summary_and_lead() -> None:
    article = Article(
        source_id="test-source",
        url="https://example.com/story",
        headline="New policy announced",
        summary="The state approved a new policy.",
        lead="Officials said the policy will begin next month.",
    )

    assert article.clustering_text == (
        "New policy announced\n\n"
        "The state approved a new policy.\n\n"
        "Officials said the policy will begin next month."
    )


def test_pipeline_stages_are_explicit_and_ordered() -> None:
    stages = pipeline_stages()

    assert stages[0] == "fetch_rss"
    assert stages[-1] == "write_outputs"
    assert "generate_embeddings" in stages
    assert "cluster_stories" in stages
