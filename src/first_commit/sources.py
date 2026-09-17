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


# These are deliberately kept in code for the first local validation slice.
# Feed health is checked by the ingestion API; a source is not considered
# reliable until it has passed that check repeatedly.
SOURCES: tuple[Source, ...] = (
    Source(
        source_id="the-hindu-india",
        name="The Hindu — India",
        scope="NATIONAL",
        states=(),
        language="EN",
        rss_url="https://www.thehindu.com/news/national/feeder/default.rss",
    ),
    Source(
        source_id="indian-express-india",
        name="The Indian Express — India",
        scope="NATIONAL",
        states=(),
        language="EN",
        rss_url="https://indianexpress.com/section/india/feed/",
    ),
    Source(
        source_id="the-hindu-andhra-pradesh",
        name="The Hindu — Andhra Pradesh",
        scope="STATE",
        states=("Andhra Pradesh",),
        language="EN",
        rss_url="https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss",
    ),
    Source(
        source_id="new-indian-express-andhra-pradesh",
        name="The New Indian Express — Andhra Pradesh",
        scope="STATE",
        states=("Andhra Pradesh",),
        language="EN",
        rss_url="https://www.newindianexpress.com/states/andhra-pradesh/feed",
        # Preserved in the registry, but hidden from active runs after live
        # validation returned HTTP 404 for this endpoint.
        active=False,
    ),
)
