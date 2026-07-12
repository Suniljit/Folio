from unittest.mock import patch


def test_get_holdings_empty_db(client):
    response = client.get("/api/holdings")

    assert response.status_code == 200
    body = response.json()
    assert body["holdings"] == []
    assert body["totals"] == {"market_value": 0.0, "total_cost": 0.0, "unrealized_pl": 0.0}


def test_post_holdings_full_replace(client):
    with patch("backend.api.holdings.fetch_prices", return_value={}):
        first = client.post(
            "/api/holdings",
            json={
                "holdings": [
                    {
                        "company_name": "Apple",
                        "ticker": "AAPL",
                        "shares_owned": 10,
                        "avg_price": 100,
                        "fees": 5,
                    },
                    {
                        "company_name": "Microsoft",
                        "ticker": "MSFT",
                        "shares_owned": 5,
                        "avg_price": 200,
                        "fees": 5,
                    },
                ]
            },
        )
        assert first.status_code == 200
        assert len(first.json()["holdings"]) == 2

        second = client.post(
            "/api/holdings",
            json={
                "holdings": [
                    {
                        "company_name": "NVIDIA",
                        "ticker": "NVDA",
                        "shares_owned": 2,
                        "avg_price": 400,
                        "fees": 5,
                    },
                ]
            },
        )
        assert second.status_code == 200
        holdings = second.json()["holdings"]
        assert len(holdings) == 1
        assert holdings[0]["ticker"] == "NVDA"


def test_computed_fields_match_formulas(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 150.0}):
        response = client.post(
            "/api/holdings",
            json={
                "holdings": [
                    {
                        "company_name": "Apple",
                        "ticker": "AAPL",
                        "shares_owned": 10,
                        "avg_price": 100,
                        "fees": 5,
                    },
                ]
            },
        )

    row = response.json()["holdings"][0]
    assert row["current_price"] == 150.0
    assert row["total_cost"] == 10 * 100 + 5
    assert row["market_value"] == 10 * 150.0
    assert row["unrealized_pl"] == row["market_value"] - row["total_cost"]

    totals = response.json()["totals"]
    assert totals["market_value"] == row["market_value"]
    assert totals["total_cost"] == row["total_cost"]
    assert totals["unrealized_pl"] == row["unrealized_pl"]


def test_empty_ticker_rows_are_dropped(client):
    with patch("backend.api.holdings.fetch_prices", return_value={}):
        response = client.post(
            "/api/holdings",
            json={
                "holdings": [
                    {
                        "company_name": "No Ticker",
                        "ticker": "",
                        "shares_owned": 1,
                        "avg_price": 1,
                        "fees": 0,
                    },
                    {
                        "company_name": "Blank Ticker",
                        "ticker": "   ",
                        "shares_owned": 1,
                        "avg_price": 1,
                        "fees": 0,
                    },
                    {
                        "company_name": "Valid",
                        "ticker": "AAPL",
                        "shares_owned": 1,
                        "avg_price": 1,
                        "fees": 0,
                    },
                ]
            },
        )

    holdings = response.json()["holdings"]
    assert len(holdings) == 1
    assert holdings[0]["ticker"] == "AAPL"


def test_price_fetch_failure_falls_back_to_zero(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 0.0}):
        response = client.post(
            "/api/holdings",
            json={
                "holdings": [
                    {
                        "company_name": "Apple",
                        "ticker": "AAPL",
                        "shares_owned": 10,
                        "avg_price": 100,
                        "fees": 5,
                    },
                ]
            },
        )

    row = response.json()["holdings"][0]
    assert row["current_price"] == 0.0
    assert row["market_value"] == 0.0
