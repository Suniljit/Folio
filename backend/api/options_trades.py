import time
from datetime import date

from fastapi import APIRouter

from backend.db import get_option_trades, save_option_trades
from backend.ibkr_client import ensure_connected, fetch_option_mark
from backend.models import OptionTrade
from backend.schemas import OptionTradeOut, OptionTradesResponse, OptionTradesSaveRequest

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


async def _build_response(trades: list[OptionTrade]) -> OptionTradesResponse:
    today = date.today()
    ibkr_connected = await ensure_connected()

    rows: list[OptionTradeOut] = []
    for t in trades:
        assert t.id is not None
        entry_value = t.contracts * t.entry_price * 100
        try:
            remaining_dte = (date.fromisoformat(t.expiration_date) - today).days
        except ValueError:
            remaining_dte = 0

        current_price = await _cached_option_price(
            t.ticker, t.expiration_date, t.strike, t.option_type
        )
        current_price = current_price if current_price is not None else 0.0
        pl_open = (current_price - t.entry_price) * 100 * t.contracts
        pct_pl = pl_open / entry_value if entry_value != 0 else 0.0
        total_pl = pl_open + t.rolls_credit - t.fees
        roi = total_pl / t.buying_power if t.buying_power != 0 else 0.0

        rows.append(
            OptionTradeOut(
                id=t.id,
                origin=t.origin,
                open_date=t.open_date,
                ticker=t.ticker,
                strategy=t.strategy,
                option_type=t.option_type,
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
        )

    return OptionTradesResponse(option_trades=rows, ibkr_connected=ibkr_connected)


@router.get("", response_model=OptionTradesResponse)
async def read_option_trades() -> OptionTradesResponse:
    return await _build_response(get_option_trades())


@router.post("", response_model=OptionTradesResponse)
async def write_option_trades(payload: OptionTradesSaveRequest) -> OptionTradesResponse:
    rows = [
        OptionTrade(
            origin=t.origin,
            open_date=t.open_date,
            ticker=t.ticker.strip().upper(),
            strategy=t.strategy,
            option_type=t.option_type,
            expiration_date=t.expiration_date,
            buying_power=t.buying_power,
            buy_price=t.buy_price,
            fees=t.fees,
            rolls_credit=t.rolls_credit,
            last_trade_date=t.last_trade_date,
            strike=t.strike,
            entry_price=t.entry_price,
            contracts=t.contracts,
        )
        for t in payload.option_trades
        if t.ticker.strip()
    ]
    save_option_trades(rows)
    _price_cache.clear()
    return await _build_response(get_option_trades())
