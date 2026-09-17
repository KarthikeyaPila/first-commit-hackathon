from first_commit.models import Article
from first_commit.pipeline import pipeline_stages
from first_commit.feeds import parse_feed_xml
from first_commit.sources import SOURCES


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


def test_rss_parser_extracts_article_metadata() -> None:
    xml = b"""<?xml version='1.0'?><rss><channel><item>
      <guid>story-1</guid><title>  A headline  </title>
      <link>https://example.com/story-1</link>
      <description><![CDATA[<p>A summary.</p>]]></description>
      <pubDate>Wed, 17 Sep 2026 10:00:00 GMT</pubDate>
    </item></channel></rss>"""

    articles = parse_feed_xml(xml, SOURCES[0])

    assert len(articles) == 1
    assert articles[0].headline == "A headline"
    assert articles[0].summary == "A summary."
    assert articles[0].published_at is not None


def test_sources_expose_feed_health_state() -> None:
    assert SOURCES[0].feed_health == "NOT_CHECKED"
    assert SOURCES[0].last_error is None
