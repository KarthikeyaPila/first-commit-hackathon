## CURRENT STATE OVERRIDE - 18 September 2026

This historical handoff remains useful for the original product decisions, but the project has progressed substantially. The current product name is **Sutradhar**. AWS is mandatory and the deployed backend is in `ap-south-1` under stack `first-commit-news-dev`. The live path is RSS fetch/parse -> normalize -> deduplicate -> state routing -> weighted TF-IDF -> sparse neighbor retrieval -> candidate scoring -> keyword/entity/time signals -> graph clustering -> deterministic story naming/ranking -> DynamoDB persistence.

The deployed API includes health, processing, run status with detailed stage telemetry, state stories, story details, comparisons, and cached market context. Gold and silver are presented as INR per 10 grams. The hourly schedule exists but is disabled. The next major work is the Sutradhar frontend: India map -> printing press -> animated real pipeline -> state-wise story output, followed by frontend hosting/polish. Do not restart the old prototype or embeddings plan unless explicitly requested.

For exact resource names, current commits, tests, commands, and credential rules, use `AGENTS.md`, `SKILLS.md`, `README.md`, and `src/CHATGPT_PROJECT_CONTEXT.md`.

# First Commit — Codex Handoff / Project Decision Record

## Purpose

This document is the handoff from the design/brainstorming conversation into Codex.

The project is for the WeMakeDevs × AWS First Commit hackathon (Sept. 17–20, 2026). The team is optimizing primarily for the Ship It track and secondarily for Best UI.

Core principle:

> Build one highly convincing, working news-comparison experience rather than an over-broad system with many unreliable features.

The product is India-first and state-first: the user begins with India, selects a state, sees the current news landscape for that state, and can inspect how multiple national and state/regional sources cover the same story.

---

# 1. How the idea evolved

## Original concept

Initial concept:

> India → State → Topic → Story → Sources → Perspectives

The original idea used an interactive map of India as the primary information architecture. A user selects a state, sees relevant stories, then compares how multiple sources cover the same story.

The first version considered Left / Center / Right classification.

## First major pivot

That became:

- Pro-Government
- Neutral
- Government-Critical

The plan was to build a deterministic/statistical article-framing classifier using signals such as sentiment, emotionally loaded language, adjectives/verbs around political actors, attribution, direct quotation, headline vs body, named entities, repeated framing terms, etc.

Important linguistic distinction discussed:

> “The opposition called the minister corrupt”  
> vs  
> “The corrupt minister”

The first is attributed speech; the second is direct journalist-authored language.

## Final pivot away from political classification

A developer suggested a simpler approach:

> Give the user the list of stories with the different sources and let the user decide.

We agreed this is better for the hackathon.

Why:

1. Political framing is subjective and difficult to establish reliably.
2. A classifier could create false authority.
3. The core user need can be met without making the political judgment.
4. Removing the classifier eliminates one of the biggest technical risks.
5. The interesting ML problem becomes identifying the same story across differently written articles.
6. The user gets agency: the product presents evidence rather than telling them what conclusion to draw.

Current product promise:

> **Pick an Indian state. We find the same stories across national and state-level news sources, put the coverage together, and let you compare how each source reported it.**

---

# 2. Current product concept

The central flow is:

> INDIA → SELECT STATE → STATE NEWS VIEW → SELECT STORY → COMPARE SOURCES

The map remains the primary information architecture.

The state is a news lens, not merely article metadata.

Core distinction:

> Source ≠ State ≠ Story

A source can be national or state/regional.

A story is an underlying event/news item.

A state view asks:

> What stories are relevant to this particular state, and how are different sources covering them?

A national publication can appear in an Andhra Pradesh view when the article is about what is happening in Andhra Pradesh.

A state publication can appear alongside it.

The product is not trying to build an abstract multi-state story graph for the user. The current direction is to focus a state's view on that state's own news.

---

# 3. Modes

## A. Segregation mode

The old political-classification concept is gone.

Current meaning:

> Select state → discover relevant stories → cluster same-story coverage → compare national/state sources.

No Pro-Government / Neutral / Critical labels in v1.

## B. Genre mode

Same state-first philosophy:

> Select state → select genre → see relevant stories → cluster source coverage.

National and state/regional sources can both contribute.

---

# 4. Geography

The architecture should support India broadly, but we do NOT need perfect operational coverage of all 28 states + 8 UTs for the hackathon.

For the demo, prioritize roughly:

> 8 states with strong reliable RSS coverage.

Better:

> 8 genuinely good states with reliable data

than:

> 36 states with broken/weak data.

---

# 5. Language

v1 = English only.

No translation layer.

No regional-language NLP.

Reason:

- simpler ingestion
- simpler NLP
- better reliability
- better scope control

Regional languages are a future extension.

---

# 6. Sources

Two source classes:

1. National
2. State/regional

Target:

> Minimum 3, maximum 5 reliable English RSS sources per state.

Use a curated source registry.

Source metadata:

```text
source_id
name
scope: NATIONAL | STATE | REGIONAL
states: [...]
language: EN
rss_url
active
last_fetched_at
```

If a source feed breaks:

> Hide it from active coverage, but preserve the source record.

If duplicate URLs point to the same article:

> Deduplicate the article while preserving source provenance.

---

# 7. RSS ingestion

RSS is the source of discovery.

We deliberately do NOT impose a publication-age cutoff.

Instead:

> Fetch the RSS feed and process newly discovered entries.

An article can be old but still be processed if it is newly discovered in our dataset.

Because feeds can be large, keep a configurable maximum number of entries processed per source per run.

Automatic schedule:

> Every hour.

Manual trigger:

> Process Latest News

The manual button must execute the real backend pipeline.

Deduplication priority:

```text
RSS GUID
  ↓
canonical URL
  ↓
content hash fallback
```

If RSS has a headline/link but article extraction fails:

> discard the article from the analytical dataset.

---

# 8. Article representation

Store:

```text
Article
├── article_id
├── source_id
├── RSS GUID
├── canonical URL
├── headline
├── cleaned article text
├── publication timestamp
├── state relevance
├── named entities
├── keywords
├── genre
├── clustering data
└── processing metadata
```

We are NOT building a permanent raw-news archive in S3.

Retention:

- keep recent/current-day news
- no indefinite historical story clusters in v1
- preserve processing metadata for later analysis

---

# 9. State relevance

The state is a strict news lens.

Signals for determining state relevance:

- locations
- people
- organizations
- government bodies
- headline
- article body
- topic/context
- named entities

Use high + medium confidence state assignments.

For current v1, one article/story is associated with one state for the state-specific view.

Question being answered:

> “Is this story about what is happening in this state?”

Not:

> “Does this national article happen to mention this state?”

---

# 10. Genres

Keep genres limited.

Current selectable genres:

- Business & Economy
- Society & Education
- Sports

Politics & Government is the default context and does not need a separate selectable genre.

Each article gets one genre.

Genre is a toggle.

---

# 11. Story clustering — current technical core

This is now the most important ML/NLP component.

Problem:

> Different publications can describe the same real-world event using very different wording.

Need to identify:

> “These articles probably describe the same story.”

For v1:

> One story cluster = one specific event/news story.

Not a broad topic and not an indefinite evolving thread.

False merging is worse than false splitting.

Why:

- false merging makes source comparison misleading
- splitting one story into two is less damaging

Unclustered stories can appear under:

> Other Stories

---

# 12. Embedding-based clustering

Current direction:

> Use a Hugging Face Sentence Transformer to encode each article into vector space and compare vectors using cosine similarity.

Important terminology:

- not vector cross product
- use dot product / cosine similarity

Formula:

```text
similarity(e1,e2) =
(e1 · e2) / (||e1|| ||e2||)
```

Candidate model:

> sentence-transformers/all-MiniLM-L6-v2

It produces 384-dimensional embeddings and is intended for semantic similarity, clustering, and semantic search.

Do NOT hard-lock the model before testing it against real data.

---

# 13. What gets embedded

Do NOT blindly embed the whole article.

Create a clustering text:

```text
[Headline]

[RSS summary]

[First ~2–4 paragraphs / lead]
```

Reason:

- headline carries the event
- summary carries the central story
- lead paragraphs contain key facts
- avoids unnecessary body noise/truncation

---

# 14. Hybrid clustering

Do NOT rely only on:

> cosine similarity > arbitrary threshold

Recommended pipeline:

```text
New article
   ↓
Generate embedding
   ↓
Find nearest existing stories/articles
   ↓
Semantic similarity
   ↓
Lightweight metadata validation
```

Validation signals:

- state
- publication time
- people
- organizations
- locations
- numbers
- genre
- keywords

This gives:

> semantic matching + explainability

Example explanation:

```text
Why were these grouped?

Semantic similarity: 0.87

Shared entities:
• Andhra Pradesh Government
• Amaravati
• Person X

Shared location:
• Andhra Pradesh

Publication window:
• 3 hours

Shared keywords:
• industrial policy
• investment
```

Exact thresholds must be empirically determined.

---

# 15. Candidate generation

Before similarity calculations, narrow the candidate pool with:

- state relevance
- genre compatibility
- time proximity
- entity/keyword compatibility

All four were considered appropriate.

Initial clustering window:

> 48 hours

This is independent of ingestion retention.

Make it configurable:

```text
CLUSTER_TIME_WINDOW_HOURS = 48
```

Tune after testing.

---

# 16. Clustering outcomes

Use:

```text
MATCH
CANDIDATE
NEW STORY
```

Medium-confidence matches can be automatically attached, but aggressively avoid false merges.

Story structure:

```text
Story
├── story_id
├── state
├── genre
├── normalized title
├── first_seen_at
├── latest_seen_at
├── representative_embedding
├── entities[]
├── keywords[]
└── articles[]
```

Story title:

> Generate a normalized title from common/semantic story information.

Do not simply copy a publisher's headline.

---

# 17. Immediate validation experiment

This is the NEXT TASK.

Before building the whole application:

1. Find several real English Indian RSS feeds.
2. Pull approximately 50–100 articles.
3. Store source, URL, headline, summary/lead, timestamp.
4. Manually label:
   - same-story pairs
   - different-story pairs
5. Generate sentence embeddings.
6. Calculate cosine similarities.
7. Run a TF-IDF + cosine baseline.
8. Compare their similarity distributions.
9. Check whether the embedding approach separates same-story from different-story articles.
10. Tune thresholds based on observed data.
11. Choose the final clustering method.
12. Then integrate clustering into the AWS system.

The experiment should answer:

> **Can semantic embeddings reliably recognize the same story in real Indian news feeds?**

If yes: proceed.

If not: improve the text representation, combine with metadata, or fall back to TF-IDF/statistical matching.

Do not let model choice become a theoretical debate; let real data decide.

---

# 18. UI direction

The user shared an Excalidraw sketch as a rough UI concept.

The important interaction hierarchy is:

```text
INDIA MAP
   ↓
SELECT STATE
   ↓
STATE NEWS VIEW
   ↓
SELECT STORY
   ↓
SOURCE COMPARISON
```

When a state is selected:

- selected state is visually prominent
- other states can fade/de-emphasize
- stories appear around/alongside the state
- selecting a story opens comparison

The detailed visual design is explicitly NOT locked yet.

---

# 19. Story comparison UI

Potential structure:

```text
STORY:
AP Cabinet approves new industrial policy

┌───────────────┬───────────────┬───────────────┐
│ Source A      │ Source B      │ Source C      │
│ Headline      │ Headline      │ Headline      │
│ Published     │ Published     │ Published     │
│ Entities      │ Entities      │ Entities      │
│ Quotes        │ Quotes        │ Quotes        │
│ Numbers       │ Numbers       │ Numbers       │
│ Read article  │ Read article  │ Read article  │
└───────────────┴───────────────┴───────────────┘

WHY WERE THESE GROUPED?

✓ Same people
✓ Same organization
✓ Same location
✓ Similar semantic representation
✓ Similar publication window
```

Do not label a source as politically Pro-Government / Neutral / Critical.

Instead, expose objective comparison observations where useful:

- headline wording
- publication time
- people mentioned
- organizations
- locations
- government references
- opposition references
- number/identity of quoted speakers
- key numbers
- common keywords

These are observations rather than political judgments.

---

# 20. Pipeline UI

Keep the visible processing pipeline:

```text
Fetching RSS
↓
Extracting articles
↓
Normalizing
↓
Finding state relevance
↓
Finding genre
↓
Generating embeddings
↓
Clustering stories
↓
Updating aggregates
```

Important:

> show REAL backend processing state, not fake animation.

Per-source panel:

```text
Source       Last fetched   Articles found   Status
```

Freshness:

> Last fetched

and global:

> Updated X minutes ago

Per-source freshness doesn't need to dominate the main UI.

---

# 21. AWS architecture

Core:

```text
EventBridge Scheduler
        ↓
Lambda
        ↓
RSS ingestion
        ↓
Article extraction
        ↓
Normalization
        ↓
State / genre
        ↓
Embedding generation
        ↓
Story matching
        ↓
DynamoDB
        ↓
API Gateway + Lambda
        ↓
Frontend
```

Primary AWS services:

- EventBridge Scheduler
- Lambda
- DynamoDB
- API Gateway

S3 is optional for static/deployment needs, but not the permanent raw-news archive.

Avoid unnecessary microservice complexity.

---

# 22. Processing deployment

For the hackathon, one processing invocation with clear logical stages is preferred:

```text
ingest()
extract()
normalize()
classify_state()
classify_genre()
generate_embedding()
cluster()
aggregate()
```

These can initially execute in one Lambda.

Keep logical separation so they can be split later.

Use automatic retries for failures.

Manual pipeline trigger is separate from scheduled execution.

Frontend can poll backend processing status.

---

# 23. Bedrock / AI story

Earlier we considered using Bedrock for political classification. That classification is no longer part of v1.

Bedrock can still be tested for semantic story matching if useful.

Potential technical comparison:

```text
Approach 1 — LLM / Bedrock
        ↓
High flexibility
        ↓
Potential continuous-ingestion cost / latency

Approach 2 — Sentence embeddings + deterministic/statistical pipeline
        ↓
Lower operating cost
        ↓
Reproducible
        ↓
Explainable
        ↓
Suitable for hourly RSS processing
```

IMPORTANT:

Do not claim “Bedrock was too expensive” unless the team actually measures it.

A measured comparison is better than a generic claim.

---

# 24. Scope and feature discipline

Do NOT add:

- political bias detection
- historical source ideology score
- multilingual NLP
- perfect all-state coverage
- complex microservices
- WebSockets just for appearance
- full news search
- date/perspective filters
- multiple overlapping ML systems unless tested
- LLM classification of every article

Core product:

> Map → State → Story → Compare Sources

---

# 25. Data discovery / retention

No general search required.

No source search.

No date filter.

No perspective filter.

Genre is a toggle.

Retention is recent/current-day data.

Processing metadata is retained.

---

# 26. Methodology

Nice-to-have page explaining:

- state relevance
- genre detection
- embeddings
- clustering
- source comparison
- AWS pipeline
- limitations

But do not sacrifice core product functionality to build documentation.

---

# 27. Difficulty

Subjective estimate from the brainstorming:

> Overall difficulty ≈ 8/10

Approximate component difficulty:

| Component | Difficulty |
|---|---:|
| India map | 6/10 |
| RSS ingestion | 4/10 |
| Article extraction | 5/10 |
| State relevance | 6/10 |
| Genre | 4/10 |
| Story clustering | 7/10 |
| Comparison extraction | 5–6/10 |
| AWS pipeline | 6/10 |
| Live status UI | 5/10 |
| Final polish | 8/10 |

The biggest uncertainty is no longer political framing classification.

It is:

> **Can embeddings reliably identify same-story coverage in the actual RSS corpus?**

---

# 28. Competition / winning strategy

We discussed that recent WeMakeDevs winners can be considerably more technically exotic: autonomous infrastructure/SRE systems, visual workflow generators, scraping automation, research systems, accessibility/vision systems, etc.

Therefore:

> There will be projects that look more technically sophisticated than this.

That does NOT mean this project cannot compete.

Its advantages are:

1. Immediate user understanding.
2. Strong visual identity through the India/state map.
3. Real data pipeline.
4. Meaningful AWS usage.
5. A technically legitimate semantic-clustering problem.
6. Very clear demo flow.
7. The user remains the final decision-maker.

The earlier subjective assessment was:

> Top 10 is a legitimate target, but not something to assume.

The project should optimize for a convincing demo rather than maximum technical complexity.

---

# 29. Most important risks

Current risk ranking:

| Risk | Severity |
|---|---:|
| Story clustering quality | VERY HIGH |
| Scope explosion | VERY HIGH |
| State relevance quality | HIGH |
| RSS/source reliability | HIGH |
| UI execution | HIGH |
| AWS implementation | MODERATE |
| Genre classification | LOW |

The highest-value experiment is therefore the embedding benchmark.

---

# 30. Priority order

## P0 — Must work

1. Reliable RSS ingestion
2. Correct state-specific story selection
3. Reliable story clustering
4. Story/source comparison
5. AWS deployment
6. India → State → Story UX

## P1 — Valuable

7. Real processing status
8. Feed freshness
9. Clean source registry
10. Objective comparison observations
11. Strong story detail view

## P2 — Nice to have

12. Methodology page
13. Bedrock comparison
14. Admin corrections
15. More states
16. Historical analytics

---

# 31. Current thesis

> **An India-first, state-first news comparison platform that automatically discovers when multiple sources are covering the same story, groups that coverage, and lets the reader compare the reporting side by side.**

Core philosophy:

> **We organize and expose the information. We do not tell the reader what political conclusion to make.**

---

# 32. Exact next action in Codex

Do NOT start by building the full application.

Build a small research/validation prototype first.

### Prototype requirements

- ingest several real Indian English RSS feeds
- collect ~50–100 articles
- generate clustering text
- generate embeddings with a small Hugging Face Sentence Transformer
- calculate cosine similarity
- construct a manually labeled same-story/different-story benchmark
- compare against TF-IDF cosine baseline
- inspect false positives and false negatives
- determine practical thresholds
- decide whether to use embeddings alone or hybrid embeddings + metadata

Only after this experiment succeeds should the full AWS/frontend implementation begin.

---

# Source/context notes

The earlier project-context document established the original hierarchy and AWS philosophy: India → State → Topic → Story → Sources → Perspectives, plus RSS ingestion, extraction, normalization, state/topic classification, story clustering, DynamoDB/API architecture, and the preference for explainable/reproducible processing.

The user's decision sheet contains the detailed choices above, including English-only v1, national + state/regional sources, 3–5 sources/state, hourly RSS, the Process Latest News trigger, state relevance, limited genres, clustering choices, map behavior, AWS services, retention, and hackathon scope.
