from datetime import datetime, timezone

from first_commit.matching import score_pair
from first_commit.models import Article
from first_commit.sources import Source


def _source(source_id: str, states: tuple[str, ...] = ()) -> Source:
    return Source(
        source_id=source_id,
        name=source_id,
        scope="NATIONAL" if not states else "STATE",
        states=states,
        language="en",
        rss_url="https://example.com/feed.xml",
    )


def test_matching_returns_match_with_agreeing_signals() -> None:
    first = Article(
        source_id="first",
        url="https://example.com/1",
        headline="Modi launches new health scheme in Andhra Pradesh",
        summary="The Prime Minister launched the scheme in Amaravati.",
        published_at=datetime(2026, 9, 17, 10, tzinfo=timezone.utc),
    )
    second = Article(
        source_id="second",
        url="https://example.com/2",
        headline="PM Modi launches health scheme at Amaravati",
        summary="The new scheme was launched in Andhra Pradesh.",
        published_at=datetime(2026, 9, 17, 12, tzinfo=timezone.utc),
    )

    decision = score_pair(
        first, second, _source("first"), _source("second"),
        tfidf_similarity=0.50, embedding_similarity=0.85,
    )

    assert decision.outcome == "MATCH"
    assert "compatible state routing" in decision.reasons
    assert decision.signals["state_overlap"] is True


def test_matching_rejects_conflicting_states() -> None:
    first = Article(
        source_id="first",
        url="https://example.com/1",
        headline="Flood warning issued in Andhra Pradesh",
    )
    second = Article(
        source_id="second",
        url="https://example.com/2",
        headline="Flood warning issued in Kerala",
    )

    decision = score_pair(
        first, second, _source("first"), _source("second"),
        tfidf_similarity=0.90, embedding_similarity=0.90,
    )

    assert decision.outcome == "NEW_STORY"
    assert decision.signals["state_conflict"] is True


def test_weighted_similarity_prioritizes_headline_and_handles_missing_context() -> None:
    from first_commit.matching import weighted_tfidf_similarities

    first = Article(
        source_id="first",
        url="https://example.com/1",
        headline="Major bridge opens in Vijayawada",
        summary="Officials discuss unrelated agricultural plans.",
    )
    second = Article(
        source_id="second",
        url="https://example.com/2",
        headline="Major bridge opens in Vijayawada",
    )

    score = weighted_tfidf_similarities([first, second], [(0, 1)])[0]
    assert score > 0.50


def test_tfidf_only_match_uses_its_lower_score_scale() -> None:
    first = Article(
        source_id="first",
        url="https://example.com/1",
        headline="State approves new irrigation project",
    )
    second = Article(
        source_id="second",
        url="https://example.com/2",
        headline="Government approves irrigation project",
    )

    decision = score_pair(
        first, second, _source("first"), _source("second"),
        tfidf_similarity=0.90,
    )

    assert decision.outcome == "MATCH"
