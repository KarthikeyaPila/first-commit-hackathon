# AGENTS.md — First Commit project handoff

## Start here

This file is the operational handoff for the First Commit hackathon project.
Read this file first, then read SKILLS.md and the documents in docs/:

1. docs/first_commit_codex_handoff.md — original product decisions.
2. docs/PROJECT_TECHNOLOGY_AND_RESOURCES.md — technology and resource history.
3. docs/india_news_rss_registry.md — source URLs, validation, and usage notes.
4. docs/DEVELOPMENT_CHECKPOINTS.md — local ignored progress tracker.
5. README.md — setup and demo commands.

The docs directory is authoritative. The original root Markdown documents were
moved there.

## Mission

This is an India-first, state-first news comparison product for the WeMakeDevs
× AWS First Commit hackathon.

Product flow:

    India map → select state → discover stories → compare source coverage

The system groups reports that likely describe the same specific event and lets
the reader compare headlines, summaries, timestamps, sources, and observable
coverage differences.

Do not add political labels such as left/center/right, pro-government, neutral,
or government-critical. The product presents evidence and lets the reader
decide. Do not build a source ideology classifier.

Keep this distinction clear:

- Source: publisher or feed.
- State: the user’s news lens.
- Story: the underlying event.
- Genre: a limited article category.

False merges are worse than false splits. A questionable article belongs in the
review queue or Other Stories rather than the wrong story.

## Current repository state

Branch: main

Latest pushed commits:

- e8afceb — representative story headlines
- a424f5f — project handoff and development playbook
- 4ba7186 — final RSS publisher sweep
- 190df7a — deep RSS publisher coverage
- cb2d817 — diverse regional RSS sources
- 7ca1464 — per-source caps and clustering ceiling
- 326a7b1 — nationwide RSS coverage
- 76ae8c3 — state-grouped story projections

User-owned untracked files may exist:

- Explore-India.html
- error.md

Do not delete, overwrite, or stage those files unless explicitly requested.

## Current implementation

Python 3.11+ project. Required runtime code uses the standard library;
research and development packages are optional dependencies in pyproject.toml.

- src/first_commit/models.py: Article and PairLabel dataclasses. Clustering text
  combines headline, summary, and lead.
- src/first_commit/sources.py: Source registry with source_id, name, scope,
  states, language, rss_url, max_entries, active, feed_health, and last_error.
- src/first_commit/feeds.py: RSS/Atom fetch, XML parsing, text cleanup, dates,
  GUIDs, URLs, and content hashes.
- src/first_commit/dedupe.py: GUID → canonical URL → content hash deduplication;
  duplicate provenance is preserved.
- src/first_commit/storage.py: latest normalized snapshot in ignored
  data/processed/ingestion_latest.json.
- src/first_commit/state_routing.py: state signals and support for 28 states plus
  8 Union Territories.
- src/first_commit/matching.py: explainable weighted TF-IDF similarity, entities,
  keywords, state, and time.
- src/first_commit/clustering.py: global story graph clustering and state
  projections; current ceiling is 4,000 articles.
- src/first_commit/story_view.py: story formatting, explanations, source metadata,
  and article cards.
- src/first_commit/benchmark.py: pair generation, labeling, TF-IDF evaluation,
  Sentence Transformer evaluation, and error analysis.
- src/first_commit/pipeline.py: intended stage order from RSS fetch through
  output writing.
- src/first_commit/server.py: local API/UI server and real ingestion trigger.
  GET routes: /, /api/benchmark, /api/feeds, /api/state-sources, /api/stories.
  POST routes: /api/candidates/label, /api/benchmark/label, /api/ingest.
  Story results are cached by snapshot modification time.
- web/index.html: basic ingestion, source/state, candidate-labeling, and
  story-card UI. Keep backend status real; do not use fake loading animation.

## RSS coverage

The registry currently has 157 records:

- 136 active
- 21 inactive with validation reasons

The latest deep search added 68 records:

- 55 active additions
- 13 inactive additions

Added publisher families include ABP News, Amar Ujala, Live Hindustan,
Oneindia, Business Standard, and Firstpost. Earlier layers include English
national and regional feeds, The Hawk nationwide feeds, India Today, and The
Tribune.

The latest additions were live-tested through the project parser:

- First deep batch: 48 active feeds, all parseable.
- Final publisher sweep: 7 active feeds, all parseable.

Never invent RSS URLs. New feeds must come from an official directory or
publisher page, then pass fetch_source(source, 3). If a listed URL returns 404,
410, timeout, parse error, 503, or empty XML, preserve it as active=False with
a useful last_error.

Known gap: Ladakh has no dependable dedicated RSS endpoint. Do not reuse
Jammu & Kashmir’s feed as Ladakh-specific coverage.

The Hindi layer may increase duplicate and cross-language matching noise. Measure
a fresh run before changing clustering thresholds.

## Research results and limitations

The manually labeled benchmark has 100 pairs: 39 same-story and 61 different.

- TF-IDF baseline: about 95.0% accuracy and 0.937 F1 on local labels.
- Sentence Transformer tested: sentence-transformers/all-MiniLM-L6-v2.
- Original error review: 5 TF-IDF mistakes and 6 embedding mistakes.
- The original benchmark remains active; the balanced/stratified benchmark is
  experimental.
- Full-snapshot runs have produced roughly 7–30 grouped stories from roughly
  1,200 articles depending on snapshot, sources, retrieval, and thresholds.
- Headlines alone are not used. Matching uses headline, summary, lead, and
  metadata explanations.
- A low story count does not prove that processing skipped articles. Inspect
  total articles, candidates, MATCH, CANDIDATE, and ungrouped counts.

Current TF-IDF-only MATCH cutoff is 0.40, calibrated from 122 live labels.
Embedding-assisted cutoffs are separate.

## Story naming

Grouped stories expose story_title in the API and UI. It is a deterministic
representative publisher headline, not an LLM-generated claim:

- Prefer a state/regional anchor headline over a national headline.
- Prefer readable, non-truncated headlines and then the most recent headline.
- Keep every original article headline visible below the story title.
- Use Untitled story only when no grouped article has a headline.

If the title rule changes, update src/first_commit/story_titles.py and its tests.
Do not hide the source headline or present a synthesized title as fact.

## Required next phase

AWS is mandatory for the finished project.

1. Define DynamoDB records for sources, articles, stories, and runs.
2. Keep one logical processing invocation:
   ingest → extract → normalize → state → genre → embed → cluster → aggregate.
3. Add state, story, comparison, and run-status API endpoints.
4. Add a manual Process Latest News trigger.
5. Add hourly EventBridge scheduling.
6. Deploy processing Lambda and API Gateway/Lambda.
7. Add retries, idempotency, freshness, and failure history.
8. Deploy the frontend against the real API.
9. Use S3 for static deployment if useful, not as a permanent raw-news archive
   without a deliberate retention decision.

The original v1 scope was English-only. The registry now contains validated Hindi
feeds for volume experiments. Decide explicitly before adding multilingual NLP
or translation.

## Development contract

For every meaningful change:

1. Inspect current code and preserve unrelated edits.
2. Make the smallest coherent implementation.
3. Run compile checks, relevant tests, and git diff --check.
4. Live-test feeds when source ingestion changes.
5. Update the relevant document in docs/.
6. Stage only intended paths.
7. Commit with a focused message.
8. Push to origin/main.
9. Report files, behavior, tests, commit, push status, and limitations.

Never use broad git add ., destructive resets, broad deletion, or stage the two
user-owned untracked files.

## Normal commands

    python3 -m venv .venv
    .venv/bin/pip install -e '.[research,dev]'
    if [ -x .venv/bin/pytest ]; then .venv/bin/pytest -q; else python3 -m pytest -q; fi
    PYTHONPATH=src .venv/bin/python -m first_commit.server
    python3 -m compileall -q src
    git diff --check
    git status --short --branch

Run the server, open http://127.0.0.1:8000, and click Process latest news.
Generated snapshots, labels, model caches, and raw captures are ignored.

## Resume checklist

- Read AGENTS.md, SKILLS.md, and the relevant docs.
- Check git status and recent commits.
- Run the 17-test suite before changing behavior.
- Read error.md when the user reports a browser/runtime issue.
- Inspect API payloads and cache behavior before changing the UI.
- Treat DEVELOPMENT_CHECKPOINTS.md as a local tracker, not something to blindly
  stage.
- Continue with AWS deployment as the required next phase. Multilingual matching
  is deliberately deferred; feed-health history and frontend work remain later
  follow-up options.
