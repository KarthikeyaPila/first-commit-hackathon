"""Small market-context adapter for Sutradhar's AWS pipeline.

The first integration uses Yahoo Finance's public chart endpoint for a
hackathon-friendly, keyless prototype. It is intentionally isolated from news
matching and must not be treated as investment advice.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen


MARKET_INSTRUMENTS: tuple[dict[str, str], ...] = (
    {"key": "nifty50", "label": "NIFTY 50", "symbol": "^NSEI"},
    {"key": "sensex", "label": "Sensex", "symbol": "^BSESN"},
    {"key": "usd_inr", "label": "USD/INR", "symbol": "INR=X"},
    {"key": "gold", "label": "Gold", "symbol": "GC=F"},
    {"key": "silver", "label": "Silver", "symbol": "SI=F"},
)

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1d&interval=1d"


def _fetch_quote(instrument: dict[str, str]) -> dict[str, Any]:
    symbol = instrument["symbol"]
    request = Request(
        YAHOO_CHART_URL.format(symbol=quote(symbol, safe="")),
        headers={"User-Agent": "Sutradhar/1.0"},
    )
    with urlopen(request, timeout=8) as response:
        payload = json.load(response)
    result = payload["chart"]["result"][0]
    meta = result["meta"]
    price = meta.get("regularMarketPrice")
    previous = meta.get("previousClose") or meta.get("chartPreviousClose")
    if price is None:
        raise ValueError("quote returned no regular market price")
    change = float(price) - float(previous) if previous is not None else None
    change_percent = (change / float(previous) * 100) if change is not None and previous else None
    return {
        "key": instrument["key"],
        "label": instrument["label"],
        "value": float(price),
        "change": change,
        "change_percent": change_percent,
        "currency": (
            "INR" if instrument["key"] in {"nifty50", "sensex"}
            else "INR per USD" if instrument["key"] == "usd_inr"
            else "USD per troy ounce"
        ),
        "status": "OK",
        "error": None,
    }


def _convert_metals_to_inr(results: list[dict[str, Any]]) -> None:
    usd_inr = next((item for item in results if item.get("key") == "usd_inr"), None)
    rate = usd_inr.get("value") if usd_inr and usd_inr.get("status") == "OK" else None
    for item in results:
        if item.get("key") not in {"gold", "silver"} or item.get("status") != "OK":
            continue
        if rate is None:
            item.update({
                "value": None,
                "change": None,
                "change_percent": None,
                "currency": None,
                "status": "ERROR",
                "error": "USD/INR quote unavailable for conversion",
            })
            continue
        item["value"] = float(item["value"]) * float(rate) * 10 / 31.1034768
        if item.get("change") is not None:
            item["change"] = float(item["change"]) * float(rate) * 10 / 31.1034768
        item["currency"] = "INR per 10 grams"


def fetch_market_snapshot() -> dict[str, Any]:
    """Fetch configured market quotes in parallel without failing news ingestion."""
    fetched_at = datetime.now(timezone.utc).isoformat()
    results: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=len(MARKET_INSTRUMENTS)) as executor:
        futures = [executor.submit(_fetch_quote, instrument) for instrument in MARKET_INSTRUMENTS]
        for instrument, future in zip(MARKET_INSTRUMENTS, futures):
            try:
                results.append(future.result())
            except Exception as error:
                results.append({
                    "key": instrument["key"],
                    "label": instrument["label"],
                    "value": None,
                    "change": None,
                    "change_percent": None,
                    "currency": None,
                    "status": "ERROR",
                    "error": f"{type(error).__name__}: {error}",
                })
    _convert_metals_to_inr(results)
    return {
        "status": "OK" if any(item["status"] == "OK" for item in results) else "ERROR",
        "fetched_at": fetched_at,
        "provider": "Yahoo Finance chart endpoint",
        "instruments": results,
    }
