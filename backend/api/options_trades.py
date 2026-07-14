from datetime import date

from fastapi import APIRouter

from backend.db import get_option_trades, save_option_trades
from backend.models import OptionTrade
from backend.schemas import OptionTradeOut, OptionTradesResponse, OptionTradesSaveRequest

router = APIRouter(prefix="/api/options-trades", tags=["options-trades"])


def _build_response(trades: list[OptionTrade]) -> OptionTradesResponse:
    today = date.today()

    rows: list[OptionTradeOut] = []
    for t in trades:
        assert t.id is not None
        entry_value = t.qty * t.entry_price
        try:
            remaining_dte = (date.fromisoformat(t.expiration_date) - today).days
        except ValueError:
            remaining_dte = 0
        rows.append(
            OptionTradeOut(
                id=t.id,
                origin=t.origin,
                open_date=t.open_date,
                ticker=t.ticker,
                strategy=t.strategy,
                expiration_date=t.expiration_date,
                buying_power=t.buying_power,
                buy_price=t.buy_price,
                fees=t.fees,
                rolls_credit=t.rolls_credit,
                last_trade_date=t.last_trade_date,
                strike=t.strike,
                entry_price=t.entry_price,
                qty=t.qty,
                entry_value=entry_value,
                remaining_dte=remaining_dte,
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
            expiration_date=t.expiration_date,
            buying_power=t.buying_power,
            buy_price=t.buy_price,
            fees=t.fees,
            rolls_credit=t.rolls_credit,
            last_trade_date=t.last_trade_date,
            strike=t.strike,
            entry_price=t.entry_price,
            qty=t.qty,
        )
        for t in payload.option_trades
        if t.ticker.strip()
    ]
    save_option_trades(rows)
    return _build_response(get_option_trades())
