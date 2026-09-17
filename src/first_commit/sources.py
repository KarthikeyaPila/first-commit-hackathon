"""Curated source registry used by the ingestion experiment."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Source:
    source_id: str
    name: str
    scope: str
    states: tuple[str, ...]
    language: str
    rss_url: str
    active: bool = True


# The initial benchmark sources will be finalized after feed validation.
SOURCES: tuple[Source, ...] = ()
