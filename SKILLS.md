# SKILLS.md — First Commit development playbook

This is a project-specific playbook for a new Codex collaborator. It describes
how to apply engineering, research, RSS, UI, AWS, testing, and Git skills here.
It does not replace Codex system-level skills.

## Repository reconnaissance

Before editing:

1. Run git status --short --branch.
2. List files with rg --files.
3. Read AGENTS.md and the relevant docs file.
4. Search symbols with rg -n.
5. Read the target module and recent git log.
6. Preserve unrelated changes, especially Explore-India.html and error.md.

Prefer the existing small standard-library architecture over a new framework.

## Documentation skill

Use each document for one purpose:

- AGENTS.md: current operational truth.
- SKILLS.md: this playbook.
- docs/first_commit_codex_handoff.md: original decisions.
- docs/PROJECT_TECHNOLOGY_AND_RESOURCES.md: resource history.
- docs/india_news_rss_registry.md: source registry and health.
- docs/DEVELOPMENT_CHECKPOINTS.md: ignored progress tracker.

When scope, architecture, thresholds, sources, AWS decisions, or UI behavior
changes, update the relevant docs file in the same stage. Append current results
without erasing useful historical decisions.

## RSS research skill

When adding feeds:

1. Search the publisher’s official RSS directory or site first.
2. Record exact URL, publisher, language, scope, and state tuple.
3. Prefer national/state feeds before hundreds of city/category feeds.
4. Validate the exact URL with fetch_source(source, 3), preferably concurrently
   for a large batch but with reasonable request load.
5. Active means usable parsed entries, not just HTTP 200.
6. Preserve failed official candidates as active=False with last_error.
7. Update docs/india_news_rss_registry.md with counts, failures, directory links,
   and licensing caveats.
8. Recheck duplicate volume and source caps after a real ingestion run.

Quality checks include reachable HTTP, parseable XML, headline and URL,
reasonable dates/GUIDs, correct state scope, and sustained freshness.

Do not manufacture URLs from a state page or old third-party list. RSS
availability does not automatically grant public redistribution rights; public
AWS use requires respecting terms or obtaining permission.

## Ingestion/data-quality skill

Current flow:

source registry → active feed fetch → XML parse → normalized Article →
deduplicate → snapshot → API/UI

Preserve these invariants:

- GUID → canonical URL → content hash dedupe order. Persist the resulting deterministic
  article_id so repeated fetches can upsert the same publisher article.
- Duplicate provenance remains available.
- A failed feed does not abort the run. Active feeds are fetched with a bounded
  worker pool (currently 8) and reports remain deterministic in source order.
- Feed reports include status, feed_health, error, articles_found, and cap.
- active=False sources are skipped during normal ingestion.
- High-volume national feeds generally cap at 100; normal feeds at 50.
- Clustering processes the full eligible snapshot; bounded sparse neighbor retrieval prevents a dense pair matrix.
- Do not add an age cutoff without revisiting the original decision.
- RSS discovery retention and the publication-time soft signal are separate.

When article counts are unexpectedly low, inspect active source count, per-feed
counts, parse errors, duplicate count, snapshot size, source caps, preview limits,
and stale snapshot/cache behavior.

## Matching/clustering skill

Baseline:

- Embed/compare headline + summary + lead.
- Retrieve candidates with state/source awareness, time proximity, headline
  neighbors, lexical fallback, and global graph construction. Cache snapshot headline artifacts. Keep candidate retrieval and global scoring
  deterministic; defer further performance parallelism until after AWS.
- Use weighted TF-IDF, entities, keywords, state, genre where available, and time.
- Outcomes are MATCH, CANDIDATE, and NEW STORY.
- Explanations must show actual similarity/shared metadata; never invent reasons.
- State groups project globally clustered stories.
- State sources anchor their state; national sources supplement coverage.
- National-national and multiple-state-source pairs may chain when they match.
- Current TF-IDF-only MATCH cutoff is 0.40. Story outputs carry run_id,
  algorithm_version, and run_config metadata.
- Prefer false splits over false merges.

Sparse grouping diagnosis:

1. Count snapshot articles.
2. Count candidates.
3. Count MATCH, CANDIDATE, and ungrouped.
4. Inspect state/source filtering.
5. Inspect the weak publication-time signal; there is no hard time window.
6. Inspect retrieval and lexical fallback.
7. Check cross-language token mismatch.
8. Review labels before lowering thresholds.

A low group count is not proof of skipped data.

## Benchmark skill

Generated experiment files live in ignored data/processed/:

- benchmark_pairs.csv: active manual benchmark.
- benchmark_pairs_balanced.csv: experimental stratified benchmark.
- candidate_reviews.csv: persistent live candidate labels.
- tfidf_results.json, embedding_results.json, error_analysis.json: outputs.

The active benchmark must not be silently replaced. Record reasoning with manual
same/different labels. Compare models on stored labels and error analysis before
claiming improvement.

## UI/API skill

The current UI is intentionally basic and verifies the real backend.

For loading/story-card issues:

- Read error.md.
- Inspect /api/feeds, /api/state-sources, and /api/stories.
- Check server logs and story cache.
- Do not hide errors behind endless loading.
- Show explicit empty, error, and review-queue states.
- Keep state headings first-class.
- Show source, scope, state, language, freshness, and error information where
  useful.
- The React/TypeScript/Vite frontend is now the justified framework path; preserve the basic helper UI separately.
- Never add political-bias labels.

## Story-title skill

A grouped story needs a human-readable heading. Use the shared
choose_story_title helper. Reuse a real publisher headline, preferring the
state/regional anchor, readable length, and recency. Keep all source headlines
for comparison. Never synthesize facts or use a political framing label in the
title. Test both anchor preference and missing-headline fallback.

Representative story headlines are implemented and exposed through the API/UI;
future title changes must preserve the original publisher headlines for
comparison.

## Market-context skill

Market data is a separate context branch, not an input to article matching or story
clustering. The current prototype fetches NIFTY 50, Sensex, USD/INR, gold, and silver
in parallel through the keyless Yahoo Finance chart endpoint, stores the latest
snapshot at `MARKET#latest`, and exposes it through `GET /market`. Quote metadata
is retained for freshness and debugging, but the future UI may display only values
and changes. Provider failures must not fail the news run. Validate units carefully:
index values are INR, USD/INR is INR per USD, and gold/silver are converted to INR per 10 grams using 1 troy ounce =
31.1034768 grams. This is market context, not investment advice.

## AWS skill

AWS is required, not optional.

Preferred shape:

    EventBridge Scheduler → processing Lambda → DynamoDB
    API Gateway → API Lambda → DynamoDB
    Static frontend → S3/CloudFront if useful

Implement in this order:

1. Stable DynamoDB keys and records (the local contract is in aws_contract.py).
   The SAM stack in infra/template.yaml is deployed in ap-south-1. The local
   adapter and the deployed processor both use the same record contract.
2. Idempotent ingestion and processing.
3. Source health and run status.
4. Keep the deployed weighted TF-IDF path explainable and Lambda-suitable;
   embeddings remain a separate future experiment, not a live UI stage.
5. Timeout, retry, and partial-failure handling. The deployed processing Lambda
   retries asynchronous failures twice within one hour; exhausted events go to a
   retained SQS queue. The EventBridge rule is explicitly disabled by default.
6. Story/state/comparison/run APIs.
7. Hourly EventBridge schedule. The rule exists in the deployed SAM stack with
   `rate(1 hour)` but is disabled by default; enable it deliberately only after
   cost and failure monitoring are accepted.
   Story records now use RunStoriesIndex for run-scoped API queries, and state
   projections are queryable through /states/{state}/stories.
8. Thin vertical deployment with a small source set.
   The deployed POST /process trigger accepts optional source_ids for controlled runs.
9. Expand source volume after observability works.
   scikit-learn is currently packaged directly in both Lambda artifacts; optimize
   into a shared layer only if deployment or cold-start measurements require it.

Avoid unnecessary microservices, permanent raw archives, credentials in Git,
and a public deployment that ignores publisher RSS terms.

## Testing and verification skill

Minimum code verification:

    python3 -m compileall -q src
    if [ -x .venv/bin/pytest ]; then .venv/bin/pytest -q; else python3 -m pytest -q; fi
    git diff --check

The current suite contains 31 tests; update this count when tests are added or
removed.

Source changes additionally require live parser validation and a report of
candidate, active/parseable, inactive, and error counts.

Clustering changes additionally require candidate funnel, grouped article/story,
review queue, ungrouped counts, and inspection of explanations.

API/UI changes additionally require a manual local-page check when possible.

## Git/collaboration skill

Use one focused checkpoint at a time:

1. Make a coherent change.
2. Verify it.
3. Update docs and local checkpoint.
4. Stage named intended paths only.
5. Commit with a focused message.
6. Push origin/main.
7. Report result and next safe step.

Never use broad git add ., git reset --hard, git clean -fd, or broad deletion.
If the shell sandbox blocks a safe operation, use the approved escalated route;
do not change the project workflow.

## Communication skill

Lead with the result. During longer tasks, give short updates covering
discovery, change, validation, and remaining uncertainty.

Final handoff should name changed files, behavior, tests, commit/push status,
limitations, and the next safe step. Never call a feed, model, story count, or
AWS deployment production-ready without verification.

## Exact current resume point

Sutradhar has a deployed AWS processing backend in `ap-south-1`. The completed path includes RSS ingestion, normalization, deduplication, state routing, sparse TF-IDF grouping, story naming, DynamoDB persistence, state/story/comparison APIs, retries, failure capture, and real stage telemetry. Market context is cached at `/market`; gold and silver are INR per 10 grams.

The next work is frontend-only product integration: build the India map, printing-press “look inside” transition, animated control-system view driven by the real run-stage API, state story output, market strip, and frontend hosting. Keep credentials out of source control and leave the hourly schedule disabled by default.
