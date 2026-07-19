from unittest.mock import patch

VALID_HOLDING = {
    "company_name": "Apple",
    "ticker": "AAPL",
    "shares_owned": 10,
    "avg_price": 100,
    "fees": 5,
}


def test_get_holdings_empty_db(client):
    response = client.get("/api/holdings")

    assert response.status_code == 200
    body = response.json()
    assert body["holdings"] == []
    assert body["totals"] == {"market_value": 0.0, "total_cost": 0.0, "unrealized_pl": 0.0}


def test_create_holding_returns_computed_fields(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 150.0}):
        response = client.post("/api/holdings", json=VALID_HOLDING)

    assert response.status_code == 201
    row = response.json()
    assert row["id"] is not None
    assert row["current_price"] == 150.0
    assert row["total_cost"] == 10 * 100 + 5
    assert row["market_value"] == 10 * 150.0
    assert row["unrealized_pl"] == row["market_value"] - row["total_cost"]


def test_created_holding_appears_in_get_with_correct_totals(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 150.0, "MSFT": 300.0}):
        client.post("/api/holdings", json=VALID_HOLDING)
        client.post(
            "/api/holdings",
            json={
                "company_name": "Microsoft",
                "ticker": "MSFT",
                "shares_owned": 5,
                "avg_price": 200,
                "fees": 5,
            },
        )

        response = client.get("/api/holdings")

    body = response.json()
    assert len(body["holdings"]) == 2
    expected_market_value = 10 * 150.0 + 5 * 300.0
    expected_total_cost = (10 * 100 + 5) + (5 * 200 + 5)
    assert body["totals"]["market_value"] == expected_market_value
    assert body["totals"]["total_cost"] == expected_total_cost
    assert body["totals"]["unrealized_pl"] == expected_market_value - expected_total_cost


def test_update_holding_changes_fields_and_keeps_id(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 150.0}):
        created = client.post("/api/holdings", json=VALID_HOLDING).json()

        response = client.put(
            f"/api/holdings/{created['id']}",
            json={**VALID_HOLDING, "shares_owned": 20},
        )

    assert response.status_code == 200
    row = response.json()
    assert row["id"] == created["id"]
    assert row["shares_owned"] == 20


def test_update_nonexistent_holding_returns_404(client):
    response = client.put("/api/holdings/999", json=VALID_HOLDING)
    assert response.status_code == 404


def test_delete_holding_removes_it(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 150.0}):
        created = client.post("/api/holdings", json=VALID_HOLDING).json()

        delete_response = client.delete(f"/api/holdings/{created['id']}")
        assert delete_response.status_code == 204

        get_response = client.get("/api/holdings")

    assert get_response.json()["holdings"] == []


def test_delete_nonexistent_holding_returns_404(client):
    response = client.delete("/api/holdings/999")
    assert response.status_code == 404


def test_price_fetch_failure_falls_back_to_zero(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 0.0}):
        response = client.post("/api/holdings", json=VALID_HOLDING)

    row = response.json()
    assert row["current_price"] == 0.0
    assert row["market_value"] == 0.0


def test_blank_company_name_is_rejected(client):
    response = client.post("/api/holdings", json={**VALID_HOLDING, "company_name": "  "})
    assert response.status_code == 422


def test_invalid_ticker_is_rejected(client):
    response = client.post("/api/holdings", json={**VALID_HOLDING, "ticker": "TOOLONG"})
    assert response.status_code == 422


def test_ticker_is_normalized_to_uppercase(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 150.0}):
        response = client.post("/api/holdings", json={**VALID_HOLDING, "ticker": "aapl"})

    assert response.status_code == 201
    assert response.json()["ticker"] == "AAPL"


def test_zero_shares_owned_is_rejected(client):
    response = client.post("/api/holdings", json={**VALID_HOLDING, "shares_owned": 0})
    assert response.status_code == 422


def test_negative_avg_price_is_rejected(client):
    response = client.post("/api/holdings", json={**VALID_HOLDING, "avg_price": -1})
    assert response.status_code == 422


def test_negative_fees_is_rejected(client):
    response = client.post("/api/holdings", json={**VALID_HOLDING, "fees": -1})
    assert response.status_code == 422


def test_zero_fees_is_allowed(client):
    with patch("backend.api.holdings.fetch_prices", return_value={"AAPL": 150.0}):
        response = client.post("/api/holdings", json={**VALID_HOLDING, "fees": 0})

    assert response.status_code == 201
