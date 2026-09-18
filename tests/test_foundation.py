from first_commit.models import Article
from first_commit.pipeline import pipeline_stages
from first_commit.feeds import parse_feed_xml
from first_commit.sources import SOURCES
from first_commit.state_routing import route_article, state_source_directory
from first_commit.lambda_handlers import _latest_completed_run_id, _query_all


class _RunTable:
    def __init__(self, runs: dict[str, dict[str, str]]) -> None:
        self.runs = runs

    def get_item(self, *, Key: dict[str, str]) -> dict[str, object]:
        run_id = Key["PK"].removeprefix("RUN#")
        return {"Item": self.runs.get(run_id)}


class _PagedTable:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    def query(self, **kwargs: object) -> dict[str, object]:
        self.calls.append(kwargs)
        if len(self.calls) == 1:
            return {"Items": [{"id": "first"}], "LastEvaluatedKey": {"PK": "next"}}
        return {"Items": [{"id": "second"}]}


def test_dynamodb_queries_read_all_pages() -> None:
    table = _PagedTable()

    assert _query_all(table, KeyConditionExpression="state") == [
        {"id": "first"},
        {"id": "second"},
    ]
    assert table.calls[1]["ExclusiveStartKey"] == {"PK": "next"}


def test_latest_completed_run_filters_historical_state_runs() -> None:
    projections = [
        {"run_id": "run-old"},
        {"run_id": "run-new"},
        {"run_id": "run-failed"},
    ]
    table = _RunTable({
        "run-old": {"status": "completed", "completed_at": "2026-09-18T10:00:00+00:00"},
        "run-new": {"status": "completed", "completed_at": "2026-09-18T11:00:00+00:00"},
        "run-failed": {"status": "failed", "completed_at": "2026-09-18T12:00:00+00:00"},
    })

    assert _latest_completed_run_id(table, projections) == "run-new"


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

    assert stages[0] == "fetch_sources"
    assert stages[-1] == "persist_outputs"
    assert "tfidf_vectorization" in stages
    assert "generate_embeddings" not in stages


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


def test_aws_records_have_stable_single_table_keys() -> None:
    from first_commit.aws_contract import (
        article_record,
        state_story_record,
        story_membership_record,
        story_record,
    )

    article = article_record({"article_id": "article-1", "headline": "Headline"}, "run-1")
    story = story_record({"story_id": "story-1", "story_title": "Title"}, "run-1", "global-v1")
    membership = story_membership_record("story-1", "run-1", "article-1")
    projection = state_story_record("Kerala", "run-1", "story-1")

    assert article["PK"] == "ARTICLE#article-1"
    assert story["PK"] == "STORY#run-1#story-1"
    assert story["GSI1PK"] == "RUN#run-1"
    assert story["GSI1SK"] == "STORY#story-1"
    assert membership["SK"] == "ARTICLE#article-1"
    assert projection["PK"] == "STATE#Kerala"
    assert {item["schema_version"] for item in (article, story, membership, projection)} == {"1"}


def test_local_aws_adapter_exports_run_and_article_records() -> None:
    from first_commit.aws_adapter import build_ingestion_records

    article = Article(source_id="source-a", url="https://example.com/story", headline="Headline")
    records = build_ingestion_records({"run_id": "run-1", "status": "completed"}, [article])
    assert [record["entity_type"] for record in records] == ["run", "article"]
    assert records[1]["PK"] == f"ARTICLE#{article.article_id}"


def test_ingestion_config_uses_bounded_feed_workers() -> None:
    from first_commit.config import PrototypeConfig

    assert PrototypeConfig().feed_workers == 8


def test_lambda_health_handler_is_local_and_json() -> None:
    from first_commit.lambda_handlers import api_handler

    response = api_handler({"rawPath": "/health"}, None)
    assert response["statusCode"] == 200
    assert '"ok": true' in response["body"]


def test_aws_processor_persists_articles_and_is_idempotent(monkeypatch) -> None:
    from first_commit import aws_processing
    from first_commit.models import Article
    from first_commit.sources import Source

    class BatchWriter:
        def __init__(self, table):
            self.table = table

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def put_item(self, *, Item):
            self.table.put_item(Item=Item)

    class FakeTable:
        def __init__(self):
            self.items = {}

        def get_item(self, *, Key):
            return {"Item": self.items.get((Key["PK"], Key["SK"]))}

        def put_item(self, *, Item):
            self.items[(Item["PK"], Item["SK"])] = Item

        def batch_writer(self):
            return BatchWriter(self)

    source = Source("test-source", "Test", "STATE", ("Kerala",), "EN", "https://example.test/rss")
    article = Article(source_id="test-source", url="https://example.test/story", headline="A story")
    monkeypatch.setattr(aws_processing, "SOURCES", (source,))
    monkeypatch.setattr(aws_processing, "_fetch_report", lambda _source: ({"source_id": "test-source", "feed_health": "OK", "articles_found": 1, "error": None}, [article]))

    table = FakeTable()
    result = aws_processing.process_latest_news(table, {"run_id": "run-test"})

    assert result["status"] == "completed"
    assert result["articles_unique"] == 1
    assert result["current_stage"] == "persist_outputs"
    stages = {stage["stage_id"]: stage for stage in result["stage_progress"]}
    assert stages["tfidf_vectorization"]["status"] == "SKIPPED"
    assert stages["tfidf_vectorization"]["metrics"]["reason"] == "no eligible articles"
    assert stages["persist_outputs"]["status"] == "COMPLETE"
    assert table.items[("ARTICLE#" + article.article_id, "META")]["candidate_states"] == ["Kerala"]
    assert aws_processing.process_latest_news(table, {"run_id": "run-test"})["status"] == "completed"


def test_story_clustering_groups_a_clear_cross_source_event(tmp_path) -> None:
    from first_commit.clustering import build_global_stories
    from first_commit.models import Article
    from first_commit.storage import save_snapshot
    from datetime import datetime, timezone

    timestamp = datetime(2026, 9, 18, 10, 0, tzinfo=timezone.utc)
    articles = [
        Article(
            source_id="the-hindu-india",
            url="https://example.test/national-event",
            headline="Government approves new rail project in Andhra Pradesh",
            summary="The cabinet approved a new rail project in Andhra Pradesh.",
            published_at=timestamp,
        ),
        Article(
            source_id="the-hindu-andhra-pradesh",
            url="https://example.test/state-event",
            headline="New rail project approved for Andhra Pradesh by cabinet",
            summary="A cabinet decision approved the new rail project in Andhra Pradesh.",
            published_at=timestamp,
        ),
    ]
    snapshot = tmp_path / "snapshot.json"
    save_snapshot(articles, snapshot, run_id="run-test-story")

    progress = []
    result = build_global_stories(snapshot, progress_callback=lambda stage, status, metrics: progress.append((stage, status, metrics)))

    assert result["story_count"] == 1
    assert result["matched_edges"] == 1
    assert result["stories"][0]["article_count"] == 2
    completed = {stage for stage, status, _metrics in progress if status == "COMPLETE"}
    assert {"tfidf_vectorization", "neighbor_retrieval", "weighted_tfidf_scoring", "keyword_entity_signals", "graph_clustering", "rank_stories"} <= completed


def test_lambda_state_directory_and_state_story_validation() -> None:
    from first_commit.lambda_handlers import api_handler

    directory = api_handler({"rawPath": "/states"}, None)
    assert directory["statusCode"] == 200
    assert "Kerala" in directory["body"]

    stories = api_handler({"rawPath": "/states/Kerala/stories"}, None)
    assert stories["statusCode"] == 400


def test_lambda_story_comparison_requires_both_identifiers() -> None:
    from first_commit.lambda_handlers import api_handler

    response = api_handler({"rawPath": "/stories/run-1/story-1"}, None)
    assert response["statusCode"] == 400
