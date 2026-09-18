# Sutradhar

Sutradhar is an India-first, state-first news comparison system for the
WeMakeDevs x AWS First Commit hackathon.

The product flow is:

```text
India map -> select state -> discover stories -> compare source coverage
```

The system fetches Indian RSS feeds, deduplicates articles, routes them to
states, finds likely cross-source matches, clusters them into stories, and
preserves each publisher's original headline for comparison. It does not assign
political ideology or tell readers which source is correct.

## Current status

The AWS backend is deployed in Mumbai (`ap-south-1`) and includes:

- Parallel RSS ingestion from the active source registry
- Stable article IDs and GUID -> canonical URL -> content-hash deduplication
- State routing for 28 states and 8 Union Territories
- Sparse nearest-neighbor retrieval across the full eligible snapshot
- Explainable weighted TF-IDF matching using headline, summary, lead, entities,
  keywords, source/state signals, and publication time
- Global story graph clustering with state projections
- Deterministic representative story titles
- DynamoDB persistence for runs, articles, stories, memberships, and projections
- API Gateway/Lambda APIs for processing, runs, states, stories, comparisons, and
  cached market context
- Live processing-stage telemetry with statuses and metrics
- Lambda retry handling and retained SQS failure queue
- Disabled-by-default hourly EventBridge rule
- Cached NIFTY 50, Sensex, USD/INR, gold, and silver market context

The frontend is still the next major phase. The intended Sutradhar experience
will connect an India map to a MERIDIAN-style printing press, let the user
"look inside" the machine, animate the real processing graph, and return
processed stories to the state map.

## Repository layout

```text
src/first_commit/
  feeds.py              RSS/Atom fetching and parsing
  sources.py            Source registry and feed health
  models.py             Article and benchmark dataclasses
  dedupe.py             Stable article deduplication
  state_routing.py      State signals and source routing
  matching.py           Explainable weighted TF-IDF scoring
  clustering.py         Sparse retrieval and story graph clustering
  story_titles.py       Deterministic story naming
  story_view.py         Local story formatting/cards
  market_data.py        Market quote adapter and INR conversion
  aws_contract.py        DynamoDB record contract
  aws_processing.py      AWS processing pipeline
  lambda_handlers.py     AWS API and processing handlers
  server.py             Local verification API/UI server
web/index.html           Current helper UI
infra/template.yaml      SAM/CloudFormation deployment
tests/                   Automated tests
docs/                    Product, resource, registry, and checkpoint records
data/                    Ignored local snapshots and experiment outputs
```

## Local setup

```bash
python3 -m venv .venv
.venv/bin/pip install -e '.[research,dev]'
```

Run checks:

```bash
if [ -x .venv/bin/pytest ]; then .venv/bin/pytest -q; else python3 -m pytest -q; fi
python3 -m compileall -q src
git diff --check
```

The current suite has 31 tests.

## Run the local helper UI

```bash
PYTHONPATH=src .venv/bin/python -m first_commit.server
```

Open http://127.0.0.1:8000. The local helper can fetch RSS feeds, show feed
health, inspect state/source mappings, label candidate pairs, and preview local
story cards.

## AWS API

Current deployed API base:

```text
https://nechnrnjk0.execute-api.ap-south-1.amazonaws.com
```

Important endpoints:

```text
GET  /health
GET  /states
GET  /runs/{run_id}
GET  /stories/{run_id}
GET  /stories/{run_id}/{story_id}
GET  /states/{state}/stories
GET  /market
POST /process
```

Start a controlled AWS run:

```bash
curl -X POST   'https://nechnrnjk0.execute-api.ap-south-1.amazonaws.com/process'   -H 'content-type: application/json'   --data '{"source_ids":["the-hindu-india"]}'
```

The response returns a `run_id`. Poll `/runs/{run_id}` to see stage progress,
metrics, grouping summary, feed health, and market context.

Use multiple sources for meaningful grouping. A one-source run correctly produces
zero cross-source candidate pairs and zero grouped stories.

## Market context

The processing run fetches these instruments in parallel:

- NIFTY 50
- Sensex
- USD/INR
- Gold
- Silver

Gold and silver are converted from USD per troy ounce into INR per 10 grams:

```text
USD/troy ounce * USD/INR * 10 / 31.1034768
```

The latest snapshot is stored at `MARKET#latest` and returned by `GET /market`.
The UI may display only values and changes; provider and fetch metadata remain
available for freshness and debugging. This is market context, not investment
advice.

## AWS deployment

Credentials must remain outside the repository. The current local CLI profile
is `karthikeya-pila` in `ap-south-1`.

```bash
/home/ditsco/.local/bin/sam validate --template-file infra/template.yaml
/home/ditsco/.local/bin/sam build --template-file infra/template.yaml --build-dir .aws-sam/build
/home/ditsco/.local/bin/sam deploy   --template-file .aws-sam/build/template.yaml   --config-file /absolute/path/to/infra/samconfig.toml   --profile karthikeya-pila
```

The hourly EventBridge rule exists but is explicitly disabled. Do not enable it
until hourly cost and failure behavior are deliberately accepted.

## Next implementation phase

1. Add state fallback coverage for recent unmatched articles.
2. Build the Sutradhar homepage around the India map and printing press.
3. Connect the real `/runs/{run_id}` stage telemetry to the animated pipeline.
4. Return completed story outputs to the map and state feeds.
5. Add story comparison and market context presentation.
6. Deploy the frontend to AWS and run the final multi-source demo.

## Handoff rules

Read `AGENTS.md`, `SKILLS.md`, and the relevant documents in `docs/` before
changing behavior. Preserve `SUTRADHAR_targeted_fixes.html` and `error.md` if
they are present and untracked. Make focused changes, run tests, update docs,
commit, and push to `origin/main`. Never commit credentials or use broad
staging/deletion commands.
