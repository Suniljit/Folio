from pydantic import BaseModel


class HoldingIn(BaseModel):
    company_name: str = ""
    ticker: str
    shares_owned: float = 0.0
    avg_price: float = 0.0
    fees: float = 0.0


class HoldingsSaveRequest(BaseModel):
    holdings: list[HoldingIn]


class HoldingOut(BaseModel):
    id: int
    company_name: str
    ticker: str
    shares_owned: float
    avg_price: float
    fees: float
    current_price: float
    total_cost: float
    market_value: float
    unrealized_pl: float


class Totals(BaseModel):
    market_value: float
    total_cost: float
    unrealized_pl: float


class HoldingsResponse(BaseModel):
    holdings: list[HoldingOut]
    totals: Totals


class OptionTradeIn(BaseModel):
    origin: str = ""
    open_date: str = ""
    ticker: str
    strategy: str = ""
    option_type: str = ""
    direction: str = "short"
    expiration_date: str = ""
    buying_power: float = 0.0
    buy_price: float = 0.0
    fees: float = 0.0
    rolls_credit: float = 0.0
    last_trade_date: str = ""
    strike: float = 0.0
    entry_price: float = 0.0
    contracts: float = 0.0


class OptionTradesSaveRequest(BaseModel):
    option_trades: list[OptionTradeIn]


class OptionTradeOut(BaseModel):
    id: int
    origin: str
    open_date: str
    ticker: str
    strategy: str
    option_type: str
    direction: str
    expiration_date: str
    buying_power: float
    buy_price: float
    fees: float
    rolls_credit: float
    last_trade_date: str
    strike: float
    entry_price: float
    contracts: float
    entry_value: float
    remaining_dte: int
    current_price: float
    pl_open: float
    pct_pl: float
    total_pl: float
    roi: float


class OptionTradesResponse(BaseModel):
    option_trades: list[OptionTradeOut]
    ibkr_connected: bool = True
