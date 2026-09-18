## CURRENT IMPLEMENTATION SNAPSHOT - 18 September 2026

The historical technology record below is preserved. Current corrections: the project is now named **Sutradhar**; AWS is deployed in `ap-south-1`; the runtime has 32 passing tests; RSS ingestion is parallelized with a bounded worker pool; grouping uses sparse nearest-neighbor retrieval plus vectorized weighted TF-IDF scoring; and the AWS Lambda path persists detailed stage telemetry.

The deployed stack persists runs, articles, stories, memberships, and state projections in DynamoDB, exposes API Gateway routes for processing, runs, states, stories, comparisons, and market context, retries asynchronous processing twice, and retains failures in SQS. Market context currently covers NIFTY 50, Sensex, USD/INR, gold, and silver. Gold and silver are converted from USD per troy ounce to INR per 10 grams using `USD/oz * USD/INR * 10 / 31.1034768`.

The frontend/control-system experience is implemented locally in `sutradhar-react/`, a React/Vite app that preserves the working `final.html` reference shell: its paper palette, editorial masthead, ticker, map draw/hover/click motion, printing-press bridge, state dispatch page, and pipeline reveal are retained while stories, comparisons, telemetry, and market values remain API-backed. `src/backendApi.js` is the thin API bridge and accepts `VITE_API_BASE_URL`; the local reference experience remains usable if the API is unavailable. The older `frontend/` rewrite is not the current UI source of truth. `infra/frontend-hosting.yaml` defines the intended private S3 + CloudFront deployment, but the first account-level deployment attempt was blocked because AWS requires account verification before creating CloudFront resources. The temporary fallback in `infra/frontend-s3-temporary.yaml` is live at `http://first-commit-sutradhar-2026.s3-website.ap-south-1.amazonaws.com`; it is HTTP-only and publicly readable for the hackathon demo. The failed CloudFront stack is `first-commit-news-frontend-dev`; its CloudFront resources rolled back and its retained empty S3 bucket remains for cleanup or reuse after verification. Keep the deployed AWS resources and credentials out of source control.

# First Commit — Technology and Resource Register

**Snapshot date:** 17 September 2026  
**Project stage:** RSS ingestion and local verification UI  
**Repository:** `first-commit-hackathon`

This document records what the project is currently using, what has actually
been verified, and what is planned next.

## Product scope

The product is an India-first, state-first news comparison experience:

```text
India → Select state → Discover stories → Compare source coverage
```

The product will organize coverage and expose observable differences. It will
not assign political ideology or tell the reader which source is correct.

The v1 scope remains English-language sources, national and state/regional
publications, recent/current news discovered through RSS, a small number of
reliable states first, and same-story clustering as the main NLP problem.

## Technology currently in use

| Area | Current choice | Status |
|---|---|---|
| Language | Python 3.11+ | Used |
| Project packaging | `pyproject.toml` with setuptools | Used |
| RSS/Atom transport | Python `urllib.request` | Used |
| RSS/Atom parsing | Python `xml.etree.ElementTree` | Used |
| Text cleanup | Python `html` and regular expressions | Used |
| Article model | Python dataclasses | Used |
| Local API | Python `http.server` | Used |
| Verification UI | Plain HTML, CSS, and browser JavaScript | Used |
| Local API format | JSON | Used |
| Static data storage | Local `data/raw` and `data/processed` directories | Directories created; persistence not implemented |
| Version control | Git | Used |
| Remote repository | GitHub `origin/main` | Used |
| Tests | pytest configuration and foundation tests | Configured; pytest package still needs installation |
| Linting | Ruff configuration | Configured; not yet run |
| NLP dependencies | NumPy, pandas, scikit-learn, Sentence Transformers | Declared as optional; not yet used |
| Cloud runtime | AWS Lambda, EventBridge Scheduler, DynamoDB, API Gateway | Planned; not deployed |
| Object storage | S3 | Optional/planned for static deployment only; not a raw-news archive |

## Implemented software components

### `src/first_commit/feeds.py`

- Fetches a source RSS/Atom URL with a descriptive User-Agent
- Parses RSS 2.0 and basic Atom entries
- Extracts headline, URL, summary, publication time, and GUID/ID
- Normalizes HTML fragments and whitespace
- Generates a deterministic content identity hash
- Limits the number of entries processed per source

### `src/first_commit/sources.py`

Defines the source registry fields:

```text
source_id
name
scope: NATIONAL | STATE | REGIONAL
states
language
rss_url
active
```

### `src/first_commit/server.py`

Provides the local verification service:

```text
GET  /
GET  /api/feeds
POST /api/ingest
```

The server fetches active sources, keeps the latest run in memory, and returns
per-source status, errors, timestamps, article counts, and article previews.

### `web/index.html`

The first UI verifies the ingestion stage by showing active source count,
healthy feed count, total article count, feed status and errors, source scope
and RSS URL, and the first ten articles returned by each source.

The UI is deliberately simple so it can later gain state filters, story
clusters, similarity scores, and source-comparison panels without replacing the
ingestion view.

## Resources currently used

### Repository resources

| Resource | Purpose |
|---|---|
| `first_commit_codex_handoff.md` | Full product decision record and architecture direction |
| `README.md` | Setup and current-stage instructions |
| `DEVELOPMENT_CHECKPOINTS.md` | Local ignored development tracker |
| `data/raw/` | Reserved for local raw feed captures; currently ignored |
| `data/processed/` | Reserved for normalized/experiment output; currently ignored |
| `Untitled-2025-05-18-1637.svg` | Existing design/reference asset |

### Runtime resources

At the current stage, the application uses only the configured public RSS/Atom
endpoints and local machine resources. No AWS account, database, model API, or
external paid service has been connected yet.

## Sources used and verified so far

The first live validation run returned **150 articles from three working feeds**
(50 entries per active feed). The results below describe the registry after
that run.

| Source | Scope | Feed | Status | Notes |
|---|---|---|---|---|
| The Hindu — India | National | [`default.rss`](https://www.thehindu.com/news/national/feeder/default.rss) | Active and verified | Returned 50 articles |
| The Indian Express — India | National | [`India feed`](https://indianexpress.com/section/india/feed/) | Active and verified | Returned 50 articles |
| The Hindu — Andhra Pradesh | State | [`Andhra Pradesh feed`](https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss) | Active and verified | Returned 50 articles |
| The New Indian Express — Andhra Pradesh | State | [`configured endpoint`](https://www.newindianexpress.com/states/andhra-pradesh/feed) | Preserved, inactive | Returned HTTP 404 |

These are source-health results, not a quality or political-bias judgment.

## Latest full-registry health check

On 17 September 2026, the concrete feeds from the RSS registry document were
imported and checked through the local ingestion pipeline.

- 40 source records are configured after duplicate cleanup
- 39 sources are active; one previously known 404 source remains inactive
- 38 feeds returned parseable RSS/XML data
- 2 feeds failed:
  - ThePrint — ParseError: syntax error: line 1, column 0
  - New Indian Express — Kerala — ParseError: not well-formed (invalid token): line 5, column 2400
- One duplicate The Indian Express Kerala entry was removed after the health run
- The registry's AP page URLs were not imported because the document marks them
  as coverage pages rather than confirmed RSS endpoints

The failed sources remain preserved and active for now so their errors can be
seen in the verification UI. They should be deactivated after we decide whether
to replace or repair their feed URLs.

## Proposed national source expansion

The target is **five to six national sources total**. The current two sources
would be supplemented with the four below. “Varied viewpoints” should be
treated as editorial/source diversity, not as a hard-coded left/center/right
label. We will compare actual coverage after ingestion rather than declaring an
outlet's ideology in the product.

| Candidate | Feed or official feed directory | Why it is useful | Status |
|---|---|---|---|
| Hindustan Times | [`India News RSS`](https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml) · [`RSS directory`](https://www.hindustantimes.com/rss) | Large national newsroom and distinct editorial workflow | Imported; live health checked |
| NDTV | [`India RSS`](https://feeds.feedburner.com/ndtvnews-india-news) · [`official RSS page`](https://www.ndtv.com/rss?site=classic) | National breaking-news coverage and another newsroom style | Imported; live health checked |
| Times of India | [`India RSS`](https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms) · [`official RSS page`](https://timesofindia.indiatimes.com/rss.cms) | High-volume national and city coverage | Imported; live health checked |
| ThePrint | [`site feed`](https://theprint.in/feed/) · [`About`](https://theprint.in/about-us/) | Ground reporting, analysis, and opinion-oriented coverage | Imported; live health checked |

The first expansion experiment should add these one at a time, run the UI,
record response counts and errors, and only then mark each source active.

### Feed-use constraints to respect

Publisher terms matter. NDTV's RSS page describes its feeds as free for
personal, non-commercial use with attribution. Times of India's RSS page also
restricts copying, redistribution, hosting, aggregation, and commercial use
without consent. Before public deployment or retaining article content, we
need to review permissions and use only the headline/excerpt/link data allowed
by the source, or request permission where needed.

## Proposed state/regional expansion

The immediate goal is **three to four usable state/regional sources per demo
state**, not three or four weak feeds everywhere. Andhra Pradesh remains the
first state because it already has a working state-specific feed.

### Feeds to validate next

| Candidate | State/region | Feed | Status |
|---|---|---|---|
| The Hindu — Andhra Pradesh | Andhra Pradesh | [`AP feed`](https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss) | Already verified |
| Indian Express — Kerala | Kerala | [`Kerala feed`](https://indianexpress.com/section/india/kerala/feed/) | Official endpoint found; not yet tested |
| Indian Express — Hyderabad | Telangana / Hyderabad | [`Hyderabad feed`](https://indianexpress.com/section/cities/hyderabad/feed/) | Official endpoint found; not yet tested |
| Onmanorama — Kerala | Kerala | [`Kerala RSS`](https://www.onmanorama.com/kerala.feeds.onmrss.xml) · [`RSS policy page`](https://www.onmanorama.com/rss.html) | Official endpoint found; permission constraints require review |
| AP Herald — English politics | Andhra Pradesh | [`English feed`](http://feeds.feedburner.com/apherald-politics-english) · [`feed directory`](https://www.indiaherald.com/fan/en/) | Candidate; not yet tested |

The regional list is intentionally a validation queue. We should not put a
candidate into the active registry until it has passed live checks for HTTP
status, valid XML, entry quality, English content, duplication, and sustained
freshness.

## Current data flow

```text
Configured source registry
        ↓
Fetch active RSS/Atom feeds
        ↓
Parse headline, URL, summary, date, GUID/ID
        ↓
Normalize text and calculate identity hash
        ↓
Return per-source health report
        ↓
Display articles and errors in local verification UI
```

## Not implemented yet

The following are still future stages:

- Full article-page extraction and cleaned article body
- GUID → canonical URL → content-hash deduplication pipeline
- Persistent article and run storage
- State relevance detection
- Genre classification
- Sentence Transformer embeddings
- TF-IDF baseline
- Manual same-story benchmark labels
- Hybrid story clustering and confidence explanations
- Story comparison API and UI
- AWS deployment and hourly scheduler
- Automatic feed-health history and source deactivation

## Next resource checkpoint

1. Add and live-test the four national candidates.
2. Validate three to four state/regional feeds for Andhra Pradesh, Kerala, or
   Telangana.
3. Record article counts, parse quality, freshness, duplicate behavior, and
   publisher restrictions.
4. Keep only reliable English feeds active.
5. Commit the expanded registry and the feed-validation results.

## References

The candidate feed URLs and publisher feed policies were checked against the
publishers' RSS or source pages on 17 September 2026:

- [Hindustan Times RSS directory](https://www.hindustantimes.com/rss)
- [NDTV RSS page and terms](https://www.ndtv.com/rss?site=classic)
- [Times of India RSS page and terms](https://timesofindia.indiatimes.com/rss.cms)
- [The Indian Express RSS directory](https://indianexpress.com/rss/)
- [Onmanorama RSS page and terms](https://www.onmanorama.com/rss.html)
- [AP Herald feed directory](https://www.indiaherald.com/fan/en/)

## Market context integration

The AWS processing path now fetches a separate market snapshot in parallel across
five configured instruments: NIFTY 50, Sensex, USD/INR, gold, and silver. The
prototype uses the keyless Yahoo Finance chart endpoint, stores the latest
snapshot in DynamoDB at MARKET#latest, and exposes it through GET /market.
Market failures are isolated so they do not fail the news pipeline. The future UI
can display only values and changes while retaining provider and fetched-at fields
for internal freshness/debugging.
