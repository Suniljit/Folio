import time

from fastapi import APIRouter

from backend.db import get_holdings, save_holdings
from backend.models import Holding
from backend.prices import fetch_prices
from backend.schemas import HoldingOut, HoldingsResponse, HoldingsSaveRequest, Totals

router = APIRouter(prefix="/api/holdings", tags=["holdings"])

_PRICE_CACHE_TTL = 30
_price_cache: dict[tuple[str, ...], tuple[float, dict[str, float]]] = {}


def _cached_prices(tickers: list[str]) -> dict[str, float]:
    key = tuple(sorted(tickers))
    now = time.monotonic()
    cached = _price_cache.get(key)
    if cached is not None and now - cached[0] < _PRICE_CACHE_TTL:
        return cached[1]
    prices = fetch_prices(list(key))
    _price_cache[key] = (now, prices)
    return prices


def _build_response(holdings: list[Holding]) -> HoldingsResponse:
    tickers = list({h.ticker.upper() for h in holdings if h.ticker.strip()})
    prices = _cached_prices(tickers)

    rows: list[HoldingOut] = []
    total_market_value = 0.0
    total_cost_sum = 0.0
    for h in holdings:
        assert h.id is not None
        current_price = prices.get(h.ticker.upper(), 0.0)
        total_cost = h.avg_price * h.shares_owned + h.fees
        market_value = h.shares_owned * current_price
        unrealized_pl = market_value - total_cost
        rows.append(
            HoldingOut(
                id=h.id,
                company_name=h.company_name,
                ticker=h.ticker,
                shares_owned=h.shares_owned,
                avg_price=h.avg_price,
                fees=h.fees,
                current_price=current_price,
                total_cost=total_cost,
                market_value=market_value,
                unrealized_pl=unrealized_pl,
            )
        )
        total_market_value += market_value
        total_cost_sum += total_cost

    return HoldingsResponse(
        holdings=rows,
        totals=Totals(
            market_value=total_market_value,
            total_cost=total_cost_sum,
            unrealized_pl=total_market_value - total_cost_sum,
        ),
    )


@router.get("", response_model=HoldingsResponse)
def read_holdings() -> HoldingsResponse:
    return _build_response(get_holdings())


@router.post("", response_model=HoldingsResponse)
def write_holdings(payload: HoldingsSaveRequest) -> HoldingsResponse:
    rows = [
        Holding(
            company_name=h.company_name,
            ticker=h.ticker.strip().upper(),
            shares_owned=h.shares_owned,
            avg_price=h.avg_price,
            fees=h.fees,
        )
        for h in payload.holdings
        if h.ticker.strip()
    ]
    save_holdings(rows)
    _price_cache.clear()
    return _build_response(get_holdings())
