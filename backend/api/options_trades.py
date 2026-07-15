import time
from datetime import date

from fastapi import APIRouter

from backend.db import get_option_trades, save_option_trades
from backend.models import OptionTrade
from backend.option_prices import fetch_option_price
from backend.schemas import OptionTradeOut, OptionTradesResponse, OptionTradesSaveRequest

router = APIRouter(prefix="/api/options-trades", tags=["options-trades"])

_PRICE_CACHE_TTL = 30
_price_cache: dict[tuple, tuple[float, float]] = {}


def _cached_option_price(
    ticker: str, expiration_date: str, strike: float, option_type: str
) -> float:
    key = (ticker, expiration_date, strike, option_type)
    now = time.monotonic()
    cached = _price_cache.get(key)
    if cached is not None and now - cached[0] < _PRICE_CACHE_TTL:
        return cached[1]
    price = fetch_option_price(ticker, expiration_date, strike, option_type)
    _price_cache[key] = (now, price)
    return price


def _build_response(trades: list[OptionTrade]) -> OptionTradesResponse:
    today = date.today()

    rows: list[OptionTradeOut] = []
    for t in trades:
        assert t.id is not None
        entry_value = t.contracts * t.entry_price * 100
        try:
            remaining_dte = (date.fromisoformat(t.expiration_date) - today).days
        except ValueError:
            remaining_dte = 0

        current_price = _cached_option_price(t.ticker, t.expiration_date, t.strike, t.option_type)
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

    return OptionTradesResponse(option_trades=rows)


@router.get("", response_model=OptionTradesResponse)
def read_option_trades() -> OptionTradesResponse:
    return _build_response(get_option_trades())


@router.post("", response_model=OptionTradesResponse)
def write_option_trades(payload: OptionTradesSaveRequest) -> OptionTradesResponse:
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
    return _build_response(get_option_trades())
