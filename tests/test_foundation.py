from first_commit.models import Article
from first_commit.pipeline import pipeline_stages
from first_commit.feeds import parse_feed_xml
from first_commit.sources import SOURCES
from first_commit.state_routing import route_article, state_source_directory


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


def test_national_article_routes_only_when_state_signal_is_present() -> None:
    article = Article(
        source_id="the-hindu-india",
        url="https://example.com/story",
        headline="New investment announced for Amaravati project",
    )

    routing = route_article(article, SOURCES[0])

    assert routing.states == ("Andhra Pradesh",)
    assert routing.confidence == "TEXT_MATCH"
    assert "amaravati" in routing.matched_terms["Andhra Pradesh"]


def test_state_source_directory_includes_national_sources_for_each_state() -> None:
    directory = state_source_directory()
    kerala = next(item for item in directory if item["state"] == "Kerala")

    assert any(source["scope"] == "NATIONAL" for source in kerala["sources"])
    assert any(source["name"] == "Onmanorama — Kerala" for source in kerala["sources"])


def test_sources_expose_feed_health_state() -> None:
    assert SOURCES[0].feed_health == "NOT_CHECKED"
    assert SOURCES[0].last_error is None


def test_deduplication_canonicalizes_urls_and_merges_provenance() -> None:
    from first_commit.dedupe import canonical_url, deduplicate_articles

    first = Article(
        source_id="source-a",
        url="https://example.com/story/?utm_source=feed",
        headline="Same story",
        rss_guid="a-1",
        provenance_source_ids=("source-a",),
    )
    second = Article(
        source_id="source-b",
        url="https://example.com/story/",
        headline="Same story",
        provenance_source_ids=("source-b",),
    )

    assert canonical_url(first.url) == "https://example.com/story"
    unique, removed = deduplicate_articles([first, second])

    assert len(unique) == 1
    assert removed == 1
    assert unique[0].provenance_source_ids == ("source-a", "source-b")
    assert unique[0].article_id == first.article_id


def test_article_id_is_stable_and_uses_fallback_identity() -> None:
    from first_commit.models import Article

    with_guid = Article(source_id="source-a", url="https://example.com/one", headline="Headline", rss_guid="guid-1")
    repeated_fetch = Article(source_id="source-a", url="https://example.com/one", headline="Updated headline", rss_guid="guid-1")
    assert with_guid.article_id == repeated_fetch.article_id

    with_url = Article(source_id="source-a", url="https://example.com/one", headline="Headline")
    assert with_url.article_id != with_guid.article_id

    with_content = Article(source_id="source-a", url="", headline="", content_hash="content-1")
    assert with_content.article_id.startswith("article-")


def test_high_volume_national_sources_have_higher_caps() -> None:
    national = {source.source_id: source for source in SOURCES if source.scope == "NATIONAL"}
    assert national["the-hindu-india"].max_entries == 100
    assert national["ndtv-india"].max_entries == 100
    assert next(source for source in SOURCES if source.scope == "STATE").max_entries == 50

def test_article_store_upserts_repeated_fetches(tmp_path) -> None:
    from first_commit.storage import upsert_articles

    path = tmp_path / "articles.json"
    first = Article(source_id="source-a", url="https://example.com/story", headline="Headline", rss_guid="guid-1")
    assert upsert_articles([first], path)["new"] == 1
    result = upsert_articles([first], path)
    assert result["new"] == 0
    assert result["unchanged"] == 1
    assert result["stored"] == 1


def test_snapshot_keeps_run_metadata(tmp_path) -> None:
    from first_commit.storage import save_snapshot
    import json

    path = tmp_path / "snapshot.json"
    save_snapshot([], path, run_id="run-1", run_config={"threshold": 0.4})
    payload = json.loads(path.read_text())
    assert payload["run_id"] == "run-1"
    assert payload["run_config"]["threshold"] == 0.4

def test_snapshot_metadata_is_available_for_versioned_outputs(tmp_path) -> None:
    from first_commit.benchmark import load_snapshot_metadata
    import json

    path = tmp_path / "snapshot.json"
    path.write_text(json.dumps({"run_id": "run-123", "run_config": {"threshold": 0.4}, "articles": []}))
    metadata = load_snapshot_metadata(path)
    assert metadata == {"run_id": "run-123", "run_config": {"threshold": 0.4}}
