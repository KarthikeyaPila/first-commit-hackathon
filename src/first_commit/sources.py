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
    feed_health: str = "NOT_CHECKED"
    last_error: str | None = None


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
    Source(
        source_id="hindustan-times-india",
        name="Hindustan Times — India",
        scope="NATIONAL",
        states=(),
        language="EN",
        rss_url="https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
    ),
    Source(
        source_id="ndtv-india",
        name="NDTV — India",
        scope="NATIONAL",
        states=(),
        language="EN",
        rss_url="https://feeds.feedburner.com/ndtvnews-india-news",
    ),
    Source(
        source_id="times-of-india-india",
        name="Times of India — India",
        scope="NATIONAL",
        states=(),
        language="EN",
        rss_url="https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    ),
    Source(
        source_id="theprint-india",
        name="ThePrint — India",
        scope="NATIONAL",
        states=(),
        language="EN",
        rss_url="https://theprint.in/feed/",
    ),
    Source(
        source_id="indian-express-kerala",
        name="The Indian Express — Kerala",
        scope="STATE",
        states=("Kerala",),
        language="EN",
        rss_url="https://indianexpress.com/section/india/kerala/feed/",
    ),
    Source(
        source_id="indian-express-hyderabad",
        name="The Indian Express — Hyderabad",
        scope="REGIONAL",
        states=("Telangana",),
        language="EN",
        rss_url="https://indianexpress.com/section/cities/hyderabad/feed/",
    ),
    Source(
        source_id="onmanorama-kerala",
        name="Onmanorama — Kerala",
        scope="STATE",
        states=("Kerala",),
        language="EN",
        rss_url="https://www.onmanorama.com/kerala.feeds.onmrss.xml",
    ),
    Source(
        source_id="ap-herald-english",
        name="AP Herald — English",
        scope="STATE",
        states=("Andhra Pradesh",),
        language="EN",
        rss_url="http://feeds.feedburner.com/apherald-politics-english",
    ),
    Source(
        source_id="the-hans-india-ap-telangana",
        name="The Hans India — Andhra Pradesh & Telangana",
        scope="REGIONAL",
        states=("Andhra Pradesh", "Telangana"),
        language="EN",
        rss_url="https://www.thehansindia.com/feed",
    ),
)
