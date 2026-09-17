"""First-pass state routing for the ingestion verification stage."""

from __future__ import annotations

from dataclasses import dataclass

from .models import Article
from .sources import Source


# These are the initial demo states. More states can be added without changing
# the routing API once we have reliable source coverage for them.
SUPPORTED_STATES: tuple[str, ...] = (
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
    "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
)

STATE_ALIASES: dict[str, tuple[str, ...]] = {
    "Andhra Pradesh": ("andhra pradesh", "vijayawada", "visakhapatnam", "vizag", "amaravati", "tirupati", "guntur", "nellore", "kurnool"),
    "Telangana": ("telangana", "hyderabad", "warangal", "secunderabad", "nizamabad", "karimnagar"),
    "Kerala": ("kerala", "kochi", "cochin", "thiruvananthapuram", "trivandrum", "kozhikode", "calicut", "malappuram"),
    "Karnataka": ("karnataka", "bengaluru", "bangalore", "mysuru", "mysore", "mangaluru", "mangalore", "hubballi", "hubli"),
    "Tamil Nadu": ("tamil nadu", "chennai", "madurai", "coimbatore", "salem", "tiruchirappalli", "trichy"),
    "Maharashtra": ("maharashtra", "mumbai", "pune", "nagpur", "nashik", "thane", "chhatrapati sambhajinagar", "aurangabad"),
    "Delhi": ("delhi", "new delhi", "ncr", "gurugram", "gurgaon", "noida", "faridabad"),
    "West Bengal": ("west bengal", "kolkata", "calcutta", "siliguri", "durgapur", "howrah"),
}


@dataclass(frozen=True)
class StateRouting:
    states: tuple[str, ...]
    confidence: str
    matched_terms: dict[str, tuple[str, ...]]


def route_article(article: Article, source: Source) -> StateRouting:
    """Return candidate state views for an article and why they were selected.

    State/regional sources get a source-based prior. National sources need a
    text signal before they enter a state view. This is intentionally a
    candidate router; later state relevance logic can replace it without
    changing the source registry or API shape.
    """

    if source.states:
        return StateRouting(source.states, "SOURCE_SCOPE", {state: () for state in source.states})

    text = article.clustering_text.casefold()
    matches = {
        state: tuple(term for term in aliases if term in text)
        for state, aliases in STATE_ALIASES.items()
    }
    matches = {state: terms for state, terms in matches.items() if terms}
    return StateRouting(tuple(matches), "TEXT_MATCH" if matches else "UNASSIGNED", matches)


def state_source_directory(sources: tuple[Source, ...] = ()) -> list[dict[str, object]]:
    """Build the UI's state-to-source directory.

    National sources are listed for every supported state as potential
    contributors, while state/regional sources appear only under their mapped
    states.
    """

    if not sources:
        from .sources import SOURCES

        sources = SOURCES

    active_sources = [source for source in sources if source.active]
    result: list[dict[str, object]] = []
    for state in SUPPORTED_STATES:
        state_sources = [source for source in active_sources if state in source.states]
        national_sources = [source for source in active_sources if source.scope == "NATIONAL"]
        def source_payload(source):
            return {
                "source_id": source.source_id,
                "name": source.name,
                "scope": source.scope,
                "feed_health": source.feed_health,
            }

        result.append(
            {
                "state": state,
                "national_sources": [source_payload(source) for source in national_sources],
                "local_sources": [source_payload(source) for source in state_sources],
                "sources": [source_payload(source) for source in (*national_sources, *state_sources)],
            }
        )
    return result
