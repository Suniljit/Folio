import time
from datetime import date

from fastapi import APIRouter, HTTPException

from backend.db import (
    create_option_trade,
    delete_option_trade,
    get_option_trades,
    update_option_trade,
)
from backend.ibkr_client import ensure_connected, fetch_option_mark
from backend.models import OptionTrade
from backend.schemas import OptionTradeIn, OptionTradeOut, OptionTradesResponse

router = APIRouter(prefix="/api/options-trades", tags=["options-trades"])

_PRICE_CACHE_TTL = 30
_CONNECTION_FAILURE_TTL = 5
_price_cache: dict[tuple, tuple[float, float | None]] = {}


async def _cached_option_price(
    ticker: str, expiration_date: str, strike: float, option_type: str
) -> float | None:
    key = (ticker, expiration_date, strike, option_type)
    now = time.monotonic()
    cached = _price_cache.get(key)
    if cached is not None:
        ttl = _PRICE_CACHE_TTL if cached[1] is not None else _CONNECTION_FAILURE_TTL
        if now - cached[0] < ttl:
            return cached[1]
    price = await fetch_option_mark(ticker, expiration_date, strike, option_type)
    _price_cache[key] = (now, price)
    return price


async def _to_out(t: OptionTrade) -> OptionTradeOut:
    assert t.id is not None
    today = date.today()
    entry_value = t.contracts * t.entry_price * 100
    try:
        remaining_dte = (date.fromisoformat(t.expiration_date) - today).days
    except ValueError:
        remaining_dte = 0

    current_price = await _cached_option_price(
        t.ticker, t.expiration_date, t.strike, t.option_type
    )
    current_price = current_price if current_price is not None else 0.0
    if t.direction == "short":
        pl_open = (t.entry_price - current_price) * 100 * t.contracts
    else:
        pl_open = (current_price - t.entry_price) * 100 * t.contracts
    pct_pl = pl_open / entry_value if entry_value != 0 else 0.0
    total_pl = pl_open + t.rolls_credit - t.fees
    roi = total_pl / t.buying_power if t.buying_power != 0 else 0.0

    return OptionTradeOut(
        id=t.id,
        origin=t.origin,
        open_date=t.open_date,
        ticker=t.ticker,
        strategy=t.strategy,
        option_type=t.option_type,
        direction=t.direction,
        expiration_date=t.expiration_date,
        buying_power=t.buying_power,
        buy_price=t.buy_price,
        fees=t.fees,
        rolls_credit=t.rolls_credit,
        last_trade_date=t.last_trade_date,
        strike=t.strike,
        entry_price=t.entry_price,
        contracts=t.contracts,
        entry_value=entry_value,
        remaining_dte=remaining_dte,
        current_price=current_price,
        pl_open=pl_open,
        pct_pl=pct_pl,
        total_pl=total_pl,
        roi=roi,
    )


async def _build_response(trades: list[OptionTrade]) -> OptionTradesResponse:
    ibkr_connected = await ensure_connected()
    rows = [await _to_out(t) for t in trades]
    return OptionTradesResponse(option_trades=rows, ibkr_connected=ibkr_connected)


def _to_model(payload: OptionTradeIn) -> OptionTrade:
    return OptionTrade(
        origin=payload.origin,
        open_date=payload.open_date,
        ticker=payload.ticker,
        strategy=payload.strategy,
        option_type=payload.option_type,
        direction=payload.direction,
        expiration_date=payload.expiration_date,
        buying_power=payload.buying_power,
        buy_price=payload.buy_price,
        fees=payload.fees,
        rolls_credit=payload.rolls_credit,
        last_trade_date=payload.last_trade_date,
        strike=payload.strike,
        entry_price=payload.entry_price,
        contracts=payload.contracts,
    )


@router.get("", response_model=OptionTradesResponse)
async def read_option_trades() -> OptionTradesResponse:
    return await _build_response(get_option_trades())


@router.post("", response_model=OptionTradeOut, status_code=201)
async def create_option_trade_endpoint(payload: OptionTradeIn) -> OptionTradeOut:
    row = create_option_trade(_to_model(payload))
    _price_cache.clear()
    return await _to_out(row)


@router.put("/{trade_id}", response_model=OptionTradeOut)
async def update_option_trade_endpoint(trade_id: int, payload: OptionTradeIn) -> OptionTradeOut:
    row = update_option_trade(trade_id, _to_model(payload))
    if row is None:
        raise HTTPException(status_code=404, detail="Option trade not found")
    _price_cache.clear()
    return await _to_out(row)


@router.delete("/{trade_id}", status_code=204)
async def delete_option_trade_endpoint(trade_id: int) -> None:
    if not delete_option_trade(trade_id):
        raise HTTPException(status_code=404, detail="Option trade not found")
    _price_cache.clear()
