from datetime import date, timedelta
from unittest.mock import AsyncMock, patch


def test_get_option_trades_empty_db(client):
    response = client.get("/api/options-trades")

    assert response.status_code == 200
    assert response.json()["option_trades"] == []


def test_post_option_trades_full_replace(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=0.0)):
        first = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "AAPL", "origin": "Sunil", "contracts": 1, "entry_price": 5},
                    {"ticker": "MSFT", "origin": "Adam", "contracts": 1, "entry_price": 9.75},
                ]
            },
        )
        assert first.status_code == 200
        assert len(first.json()["option_trades"]) == 2

        second = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "NVDA", "origin": "Sunil", "contracts": 1, "entry_price": 6.25},
                ]
            },
        )
        assert second.status_code == 200
        trades = second.json()["option_trades"]
        assert len(trades) == 1
        assert trades[0]["ticker"] == "NVDA"


def test_computed_fields_match_formulas_for_short(client):
    expiration = date.today() + timedelta(days=30)
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {
                        "ticker": "NVDA",
                        "origin": "Sunil",
                        "option_type": "put",
                        "direction": "short",
                        "expiration_date": expiration.isoformat(),
                        "strike": 100,
                        "contracts": 1,
                        "entry_price": 6.25,
                        "rolls_credit": 2.0,
                        "fees": 1.0,
                        "buying_power": 10000.0,
                    },
                ]
            },
        )

    row = response.json()["option_trades"][0]
    entry_value = 1 * 6.25 * 100
    pl_open = (6.25 - 8.0) * 100 * 1
    total_pl = pl_open + 2.0 - 1.0
    assert row["entry_value"] == entry_value
    assert row["remaining_dte"] == 30
    assert row["current_price"] == 8.0
    assert row["pl_open"] == pl_open
    assert row["pct_pl"] == pl_open / entry_value
    assert row["total_pl"] == total_pl
    assert row["roi"] == total_pl / 10000.0


def test_computed_fields_match_formulas_for_long(client):
    expiration = date.today() + timedelta(days=30)
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {
                        "ticker": "NVDA",
                        "origin": "Sunil",
                        "option_type": "call",
                        "direction": "long",
                        "expiration_date": expiration.isoformat(),
                        "strike": 100,
                        "contracts": 1,
                        "entry_price": 6.25,
                        "rolls_credit": 2.0,
                        "fees": 1.0,
                        "buying_power": 10000.0,
                    },
                ]
            },
        )

    row = response.json()["option_trades"][0]
    entry_value = 1 * 6.25 * 100
    pl_open = (8.0 - 6.25) * 100 * 1
    total_pl = pl_open + 2.0 - 1.0
    assert row["entry_value"] == entry_value
    assert row["pl_open"] == pl_open
    assert row["pct_pl"] == pl_open / entry_value
    assert row["total_pl"] == total_pl
    assert row["roi"] == total_pl / 10000.0


def test_pct_pl_and_roi_default_to_zero_when_denominator_is_zero(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=0.0)):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "NVDA", "origin": "Sunil", "contracts": 0, "entry_price": 0},
                ]
            },
        )

    row = response.json()["option_trades"][0]
    assert row["pct_pl"] == 0.0
    assert row["roi"] == 0.0


def test_blank_expiration_date_defaults_dte_to_zero(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=0.0)):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "NVDA", "origin": "Sunil", "contracts": 1, "entry_price": 6.25},
                ]
            },
        )

    row = response.json()["option_trades"][0]
    assert row["remaining_dte"] == 0


def test_empty_ticker_rows_are_dropped(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=0.0)):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "", "origin": "No Ticker"},
                    {"ticker": "   ", "origin": "Blank Ticker"},
                    {"ticker": "AAPL", "origin": "Valid"},
                ]
            },
        )

    trades = response.json()["option_trades"]
    assert len(trades) == 1
    assert trades[0]["ticker"] == "AAPL"


def test_option_price_fetch_failure_falls_back_to_zero(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=0.0)):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "AAPL", "origin": "Sunil", "contracts": 1, "entry_price": 5},
                ]
            },
        )

    row = response.json()["option_trades"][0]
    assert row["current_price"] == 0.0


def test_ibkr_unreachable_falls_back_to_zero_and_flags_disconnected(client):
    with (
        patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=None)),
        patch("backend.api.options_trades.ensure_connected", new=AsyncMock(return_value=False)),
    ):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "AAPL", "origin": "Sunil", "contracts": 1, "entry_price": 5},
                ]
            },
        )

    body = response.json()
    assert body["ibkr_connected"] is False
    assert body["option_trades"][0]["current_price"] == 0.0


def test_ibkr_connected_flag_true_when_connection_succeeds(client):
    with (
        patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)),
        patch("backend.api.options_trades.ensure_connected", new=AsyncMock(return_value=True)),
    ):
        response = client.post(
            "/api/options-trades",
            json={
                "option_trades": [
                    {"ticker": "AAPL", "origin": "Sunil", "contracts": 1, "entry_price": 5},
                ]
            },
        )

    assert response.json()["ibkr_connected"] is True
