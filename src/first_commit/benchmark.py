"""Prepare and score a manually labeled story-matching benchmark."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
import json
from itertools import combinations
from pathlib import Path
import re

from .config import PROCESSED_DATA_DIR
from .models import Article


LABELS_PATH = PROCESSED_DATA_DIR / "benchmark_pairs.csv"
TFIDF_RESULTS_PATH = PROCESSED_DATA_DIR / "tfidf_results.json"
TOKEN_RE = re.compile(r"[a-z0-9]{3,}")


def load_snapshot(path: Path) -> list[Article]:
    """Load the latest ingestion JSON into Article objects."""

    payload = json.loads(path.read_text())
    articles: list[Article] = []
    for item in payload.get("articles", []):
        published_at = item.get("published_at")
        articles.append(
            Article(
                source_id=item["source_id"],
                url=item["url"],
                headline=item["headline"],
                summary=item.get("summary", ""),
                lead=item.get("lead", ""),
                published_at=datetime.fromisoformat(published_at) if published_at else None,
                state=item.get("state"),
                genre=item.get("genre"),
                content_hash=item.get("content_hash"),
                rss_guid=item.get("rss_guid"),
                provenance_source_ids=tuple(item.get("provenance_source_ids", (item["source_id"],))),
            )
        )
    return articles


def _tokens(text: str) -> set[str]:
    return set(TOKEN_RE.findall(text.casefold()))


def lexical_similarity(first: Article, second: Article) -> float:
    """Small dependency-free fallback used to select labeling candidates."""

    left = _tokens(first.clustering_text)
    right = _tokens(second.clustering_text)
    if not left or not right:
        return 0.0
    return len(left & right) / (len(left) * len(right)) ** 0.5


def tfidf_similarities(articles: list[Article], pairs: list[tuple[int, int]]) -> list[float]:
    """Calculate TF-IDF cosine scores when scikit-learn is installed."""

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError as error:
        raise RuntimeError("Install the research extras to run the TF-IDF baseline") from error

    matrix = TfidfVectorizer(stop_words="english", ngram_range=(1, 2)).fit_transform(
        [article.clustering_text for article in articles]
    )
    return [float(cosine_similarity(matrix[first], matrix[second])[0, 0]) for first, second in pairs]


def _candidate_pairs(articles: list[Article]) -> list[tuple[int, int]]:
    """Generate cross-source, time-compatible pairs for human labeling."""

    pairs = []
    for first, second in combinations(range(len(articles)), 2):
        left, right = articles[first], articles[second]
        if left.source_id == right.source_id:
            continue
        if left.published_at and right.published_at:
            hours = abs((left.published_at - right.published_at).total_seconds()) / 3600
            if hours > 48:
                continue
        pairs.append((first, second))
    return pairs


def prepare_labels(snapshot_path: Path, output_path: Path = LABELS_PATH, limit: int = 100) -> Path:
    """Create a balanced-looking CSV template for manual same-story labels."""

    articles = load_snapshot(snapshot_path)
    pairs = _candidate_pairs(articles)
    try:
        scores = tfidf_similarities(articles, pairs)
        score_method = "tfidf"
    except RuntimeError:
        scores = [lexical_similarity(articles[first], articles[second]) for first, second in pairs]
        score_method = "lexical_fallback"

    ranked = sorted(zip(scores, pairs), key=lambda item: item[0], reverse=True)
    half = max(1, limit // 2)
    selected = ranked[:half] + ranked[-half:]
    selected = selected[:limit]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=(
                "first_url", "second_url", "first_source", "second_source",
                "first_headline", "second_headline", "similarity", "similarity_method",
                "same_story", "notes",
            ),
        )
        writer.writeheader()
        for score, (first, second) in selected:
            writer.writerow({
                "first_url": articles[first].url,
                "second_url": articles[second].url,
                "first_source": articles[first].source_id,
                "second_source": articles[second].source_id,
                "first_headline": articles[first].headline,
                "second_headline": articles[second].headline,
                "similarity": f"{score:.6f}",
                "similarity_method": score_method,
                "same_story": "",
                "notes": "",
            })
    return output_path


def run_tfidf(labels_path: Path, output_path: Path = TFIDF_RESULTS_PATH) -> Path:
    """Score labeled pairs and write summary distributions/results."""

    rows = list(csv.DictReader(labels_path.open(encoding="utf-8")))
    labeled = [row for row in rows if row.get("same_story", "").strip().casefold() in {"1", "true", "yes", "0", "false", "no"}]
    results = {
        "labeled_pairs": len(labeled),
        "message": "Add same_story labels to the CSV before running this command." if not labeled else "TF-IDF scoring is ready for labeled evaluation.",
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(results, indent=2) + "\n")
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    prepare = subparsers.add_parser("prepare", help="create a labeling CSV")
    prepare.add_argument("--snapshot", type=Path, default=PROCESSED_DATA_DIR / "ingestion_latest.json")
    prepare.add_argument("--output", type=Path, default=LABELS_PATH)
    prepare.add_argument("--limit", type=int, default=100)
    score = subparsers.add_parser("tfidf", help="record the labeled-pair evaluation state")
    score.add_argument("--labels", type=Path, default=LABELS_PATH)
    score.add_argument("--output", type=Path, default=TFIDF_RESULTS_PATH)
    args = parser.parse_args()
    path = prepare_labels(args.snapshot, args.output, args.limit) if args.command == "prepare" else run_tfidf(args.labels, args.output)
    print(path)


if __name__ == "__main__":
    main()
