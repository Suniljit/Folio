import time

from fastapi import APIRouter, HTTPException

from backend.db import create_holding, delete_holding, get_holdings, update_holding
from backend.models import Holding
from backend.prices import fetch_prices
from backend.schemas import HoldingIn, HoldingOut, HoldingsResponse, Totals

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


def _to_out(h: Holding, current_price: float) -> HoldingOut:
    assert h.id is not None
    total_cost = h.avg_price * h.shares_owned + h.fees
    market_value = h.shares_owned * current_price
    unrealized_pl = market_value - total_cost
    return HoldingOut(
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


def _build_response(holdings: list[Holding]) -> HoldingsResponse:
    tickers = list({h.ticker.upper() for h in holdings})
    prices = _cached_prices(tickers)

    rows = [_to_out(h, prices.get(h.ticker.upper(), 0.0)) for h in holdings]
    total_market_value = sum(r.market_value for r in rows)
    total_cost_sum = sum(r.total_cost for r in rows)

    return HoldingsResponse(
        holdings=rows,
        totals=Totals(
            market_value=total_market_value,
            total_cost=total_cost_sum,
            unrealized_pl=total_market_value - total_cost_sum,
        ),
    )


def _to_model(payload: HoldingIn) -> Holding:
    return Holding(
        company_name=payload.company_name,
        ticker=payload.ticker,
        shares_owned=payload.shares_owned,
        avg_price=payload.avg_price,
        fees=payload.fees,
    )


@router.get("", response_model=HoldingsResponse)
def read_holdings() -> HoldingsResponse:
    return _build_response(get_holdings())


@router.post("", response_model=HoldingOut, status_code=201)
def create_holding_endpoint(payload: HoldingIn) -> HoldingOut:
    row = create_holding(_to_model(payload))
    _price_cache.clear()
    prices = _cached_prices([row.ticker.upper()])
    return _to_out(row, prices.get(row.ticker.upper(), 0.0))


@router.put("/{holding_id}", response_model=HoldingOut)
def update_holding_endpoint(holding_id: int, payload: HoldingIn) -> HoldingOut:
    row = update_holding(holding_id, _to_model(payload))
    if row is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    _price_cache.clear()
    prices = _cached_prices([row.ticker.upper()])
    return _to_out(row, prices.get(row.ticker.upper(), 0.0))


@router.delete("/{holding_id}", status_code=204)
def delete_holding_endpoint(holding_id: int) -> None:
    if not delete_holding(holding_id):
        raise HTTPException(status_code=404, detail="Holding not found")
    _price_cache.clear()
