from datetime import date, timedelta
from unittest.mock import AsyncMock, patch


def valid_trade(**overrides) -> dict:
    expiration = date.today() + timedelta(days=30)
    open_date = date.today().isoformat()
    trade = {
        "origin": "Sunil",
        "open_date": open_date,
        "ticker": "NVDA",
        "strategy": "CSP",
        "option_type": "put",
        "direction": "short",
        "expiration_date": expiration.isoformat(),
        "buying_power": 10000.0,
        "buy_price": 6.25,
        "fees": 1.0,
        "rolls_credit": 2.0,
        "last_trade_date": "",
        "strike": 100,
        "entry_price": 6.25,
        "contracts": 1,
    }
    trade.update(overrides)
    return trade


def test_get_option_trades_empty_db(client):
    response = client.get("/api/options-trades")

    assert response.status_code == 200
    assert response.json()["option_trades"] == []


def test_create_option_trade_appears_in_get(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        created = client.post("/api/options-trades", json=valid_trade())
        assert created.status_code == 201

        response = client.get("/api/options-trades")

    trades = response.json()["option_trades"]
    assert len(trades) == 1
    assert trades[0]["ticker"] == "NVDA"


def test_computed_fields_match_formulas_for_short(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        response = client.post("/api/options-trades", json=valid_trade(direction="short"))

    row = response.json()
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
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        response = client.post(
            "/api/options-trades", json=valid_trade(option_type="call", direction="long")
        )

    row = response.json()
    entry_value = 1 * 6.25 * 100
    pl_open = (8.0 - 6.25) * 100 * 1
    total_pl = pl_open + 2.0 - 1.0
    assert row["entry_value"] == entry_value
    assert row["pl_open"] == pl_open
    assert row["pct_pl"] == pl_open / entry_value
    assert row["total_pl"] == total_pl
    assert row["roi"] == total_pl / 10000.0


def test_update_option_trade_changes_fields_and_keeps_id(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        created = client.post("/api/options-trades", json=valid_trade()).json()

        response = client.put(
            f"/api/options-trades/{created['id']}",
            json=valid_trade(strike=110),
        )

    assert response.status_code == 200
    row = response.json()
    assert row["id"] == created["id"]
    assert row["strike"] == 110


def test_update_nonexistent_option_trade_returns_404(client):
    response = client.put("/api/options-trades/999", json=valid_trade())
    assert response.status_code == 404


def test_delete_option_trade_removes_it(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        created = client.post("/api/options-trades", json=valid_trade()).json()

        delete_response = client.delete(f"/api/options-trades/{created['id']}")
        assert delete_response.status_code == 204

        get_response = client.get("/api/options-trades")

    assert get_response.json()["option_trades"] == []


def test_delete_nonexistent_option_trade_returns_404(client):
    response = client.delete("/api/options-trades/999")
    assert response.status_code == 404


def test_option_price_fetch_failure_falls_back_to_zero(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=0.0)):
        response = client.post("/api/options-trades", json=valid_trade())

    assert response.json()["current_price"] == 0.0


def test_ibkr_unreachable_falls_back_to_zero_and_flags_disconnected(client):
    with (
        patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=None)),
        patch("backend.api.options_trades.ensure_connected", new=AsyncMock(return_value=False)),
    ):
        client.post("/api/options-trades", json=valid_trade())
        response = client.get("/api/options-trades")

    body = response.json()
    assert body["ibkr_connected"] is False
    assert body["option_trades"][0]["current_price"] == 0.0


def test_ibkr_connected_flag_true_when_connection_succeeds(client):
    with (
        patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)),
        patch("backend.api.options_trades.ensure_connected", new=AsyncMock(return_value=True)),
    ):
        client.post("/api/options-trades", json=valid_trade())
        response = client.get("/api/options-trades")

    assert response.json()["ibkr_connected"] is True


def test_missing_origin_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(origin="  "))
    assert response.status_code == 422


def test_missing_strategy_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(strategy=""))
    assert response.status_code == 422


def test_invalid_ticker_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(ticker="TOOLONG"))
    assert response.status_code == 422


def test_invalid_option_type_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(option_type="straddle"))
    assert response.status_code == 422


def test_invalid_direction_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(direction="sideways"))
    assert response.status_code == 422


def test_blank_open_date_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(open_date=""))
    assert response.status_code == 422


def test_blank_expiration_date_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(expiration_date=""))
    assert response.status_code == 422


def test_expiration_before_open_date_is_rejected(client):
    open_date = date.today().isoformat()
    expiration_before_open = (date.today() - timedelta(days=1)).isoformat()
    response = client.post(
        "/api/options-trades",
        json=valid_trade(open_date=open_date, expiration_date=expiration_before_open),
    )
    assert response.status_code == 422


def test_invalid_last_trade_date_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(last_trade_date="not-a-date"))
    assert response.status_code == 422


def test_blank_last_trade_date_is_allowed(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        response = client.post("/api/options-trades", json=valid_trade(last_trade_date=""))

    assert response.status_code == 201


def test_zero_strike_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(strike=0))
    assert response.status_code == 422


def test_zero_entry_price_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(entry_price=0))
    assert response.status_code == 422


def test_zero_contracts_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(contracts=0))
    assert response.status_code == 422


def test_fractional_contracts_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(contracts=1.5))
    assert response.status_code == 422


def test_zero_buying_power_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(buying_power=0))
    assert response.status_code == 422


def test_zero_buy_price_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(buy_price=0))
    assert response.status_code == 422


def test_negative_fees_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(fees=-1))
    assert response.status_code == 422


def test_zero_fees_is_allowed(client):
    with patch("backend.api.options_trades.fetch_option_mark", new=AsyncMock(return_value=8.0)):
        response = client.post("/api/options-trades", json=valid_trade(fees=0))

    assert response.status_code == 201


def test_negative_rolls_credit_is_rejected(client):
    response = client.post("/api/options-trades", json=valid_trade(rolls_credit=-1))
    assert response.status_code == 422
