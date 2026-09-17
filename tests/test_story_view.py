from first_commit.story_view import build_demo_stories


def test_demo_groups_have_a_state_or_regional_anchor() -> None:
    payload = build_demo_stories()
    assert payload["matched_groups"] > 0
    for story in payload["stories"]:
        assert any(" — India" not in source for source in story["sources"])
