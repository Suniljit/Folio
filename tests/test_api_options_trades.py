from datetime import date, timedelta


def test_get_option_trades_empty_db(client):
    response = client.get("/api/options-trades")

    assert response.status_code == 200
    assert response.json()["option_trades"] == []


def test_post_option_trades_full_replace(client):
    first = client.post(
        "/api/options-trades",
        json={
            "option_trades": [
                {"ticker": "AAPL", "origin": "Sunil", "qty": -100, "entry_price": 5},
                {"ticker": "MSFT", "origin": "Adam", "qty": -100, "entry_price": 9.75},
            ]
        },
    )
    assert first.status_code == 200
    assert len(first.json()["option_trades"]) == 2

    second = client.post(
        "/api/options-trades",
        json={
            "option_trades": [
                {"ticker": "NVDA", "origin": "Sunil", "qty": -100, "entry_price": 6.25},
            ]
        },
    )
    assert second.status_code == 200
    trades = second.json()["option_trades"]
    assert len(trades) == 1
    assert trades[0]["ticker"] == "NVDA"


def test_computed_fields_match_formulas(client):
    expiration = date.today() + timedelta(days=30)
    response = client.post(
        "/api/options-trades",
        json={
            "option_trades": [
                {
                    "ticker": "NVDA",
                    "origin": "Sunil",
                    "expiration_date": expiration.isoformat(),
                    "qty": -100,
                    "entry_price": 6.25,
                },
            ]
        },
    )

    row = response.json()["option_trades"][0]
    assert row["entry_value"] == -100 * 6.25
    assert row["remaining_dte"] == 30


def test_blank_expiration_date_defaults_dte_to_zero(client):
    response = client.post(
        "/api/options-trades",
        json={
            "option_trades": [
                {"ticker": "NVDA", "origin": "Sunil", "qty": -100, "entry_price": 6.25},
            ]
        },
    )

    row = response.json()["option_trades"][0]
    assert row["remaining_dte"] == 0


def test_empty_ticker_rows_are_dropped(client):
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
