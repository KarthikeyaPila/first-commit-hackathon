"""Core data structures for articles and benchmark labels."""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Article:
    source_id: str
    url: str
    headline: str
    summary: str = ""
    lead: str = ""
    published_at: datetime | None = None
    state: str | None = None
    genre: str | None = None
    content_hash: str | None = None

    @property
    def clustering_text(self) -> str:
        """Return the concise representation used for story matching."""

        parts = [self.headline, self.summary, self.lead]
        return "\n\n".join(part.strip() for part in parts if part.strip())


@dataclass(frozen=True)
class PairLabel:
    first_url: str
    second_url: str
    same_story: bool
    notes: str = ""
