from first_commit.story_view import build_demo_stories, cluster_matched_articles


def test_demo_groups_have_a_state_or_regional_anchor() -> None:
    payload = build_demo_stories()
    assert payload["matched_groups"] > 0
    for story in payload["stories"]:
        assert any(" — India" not in source for source in story["sources"])


def test_clustering_supports_three_four_and_five_article_stories() -> None:
    edges = []
    offset = 0
    expected_sizes = (3, 4, 5)
    for size in expected_sizes:
        # A chain is enough to prove transitive grouping:
        # 0--1--2, rather than requiring every pair to be labeled.
        for index in range(offset, offset + size - 1):
            edges.append((index, index + 1, object()))
        offset += size

    groups = cluster_matched_articles(offset, edges)

    assert sorted(len(group) for group in groups) == [3, 4, 5]
