
from first_commit import market_data


def test_market_snapshot_fetches_all_configured_instruments(monkeypatch) -> None:
    def fake_quote(instrument):
        return {
            "key": instrument["key"],
            "label": instrument["label"],
            "value": 100.0,
            "change": 1.0,
            "change_percent": 1.0,
            "currency": "INR",
            "status": "OK",
            "error": None,
        }

    monkeypatch.setattr(market_data, "_fetch_quote", fake_quote)
    snapshot = market_data.fetch_market_snapshot()

    assert snapshot["status"] == "OK"
    assert [item["key"] for item in snapshot["instruments"]] == [
        "nifty50", "sensex", "usd_inr", "gold", "silver"
    ]


def test_market_snapshot_keeps_quote_failures_isolated(monkeypatch) -> None:
    def fake_quote(instrument):
        if instrument["key"] == "gold":
            raise TimeoutError("provider timeout")
        return {
            "key": instrument["key"],
            "label": instrument["label"],
            "value": 100.0,
            "change": None,
            "change_percent": None,
            "currency": "INR",
            "status": "OK",
            "error": None,
        }

    monkeypatch.setattr(market_data, "_fetch_quote", fake_quote)
    snapshot = market_data.fetch_market_snapshot()

    gold = next(item for item in snapshot["instruments"] if item["key"] == "gold")
    assert snapshot["status"] == "OK"
    assert gold["status"] == "ERROR"
    assert "TimeoutError" in gold["error"]
