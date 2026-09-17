from datetime import datetime, timezone

from first_commit.models import Article
from first_commit.sources import Source
from first_commit.story_titles import choose_story_title


def test_story_title_prefers_state_anchor_headline() -> None:
    national = Source("national", "National", "NATIONAL", (), "EN", "https://example.com/n")
    state = Source("state", "State", "STATE", ("Kerala",), "EN", "https://example.com/s")
    articles = [
        Article(
            source_id="national",
            url="https://example.com/n",
            headline="National report says major development happened",
            published_at=datetime(2026, 9, 18, tzinfo=timezone.utc),
        ),
        Article(
            source_id="state",
            url="https://example.com/s",
            headline="Kerala government announces major development",
            published_at=datetime(2026, 9, 17, tzinfo=timezone.utc),
        ),
    ]

    assert choose_story_title(articles, {"national": national, "state": state}) == (
        "Kerala government announces major development"
    )


def test_story_title_falls_back_when_headlines_are_missing() -> None:
    assert choose_story_title([], {}) == "Untitled story"
