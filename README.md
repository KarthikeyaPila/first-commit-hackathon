# First Commit — News Comparison Prototype

An India-first, state-first news comparison platform for the WeMakeDevs × AWS
First Commit hackathon.

The product flow is:

```text
India map → Select state → Discover stories → Compare source coverage
```

## Current stage

This repository currently contains the foundation for the story-clustering
research prototype. The first experiment will ingest approximately 50–100
articles from curated Indian English RSS feeds and compare sentence embeddings
against a TF-IDF baseline.

## Repository layout

```text
data/
  raw/                 Local RSS/article captures (ignored)
  processed/           Experiment outputs (ignored)
src/first_commit/
  config.py            Reproducible prototype settings
  models.py            Article and benchmark data structures
  pipeline.py          Processing stage boundaries
  sources.py           Curated source registry
tests/                 Foundation tests
first_commit_codex_handoff.md
```

## Development checkpoints

Each meaningful stage will be verified, committed, and pushed so the project
can be safely recovered if a later experiment breaks something.

The next checkpoint is the RSS ingestion and feed-validation experiment.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[research,dev]'
pytest
```
