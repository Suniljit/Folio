import re
from datetime import date

from pydantic import BaseModel, field_validator, model_validator

TICKER_PATTERN = r"^[A-Z]{1,5}$"


def _require_ticker(v: str) -> str:
    v = v.strip().upper()
    if not re.match(TICKER_PATTERN, v):
        raise ValueError("Ticker must be 1-5 uppercase letters")
    return v


def _require_non_empty(v: str, label: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError(f"{label} is required")
    return v


def _require_date(v: str, label: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError(f"{label} is required")
    try:
        date.fromisoformat(v)
    except ValueError:
        raise ValueError(f"{label} must be a valid date") from None
    return v


def _optional_date(v: str, label: str) -> str:
    v = v.strip()
    if not v:
        return v
    try:
        date.fromisoformat(v)
    except ValueError:
        raise ValueError(f"{label} must be a valid date") from None
    return v


class HoldingIn(BaseModel):
    company_name: str
    ticker: str
    shares_owned: float
    avg_price: float
    fees: float = 0.0

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, v: str) -> str:
        return _require_non_empty(v, "Company name")

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        return _require_ticker(v)

    @field_validator("shares_owned")
    @classmethod
    def validate_shares_owned(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Shares owned must be greater than 0")
        return v

    @field_validator("avg_price")
    @classmethod
    def validate_avg_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Average price must be greater than 0")
        return v

    @field_validator("fees")
    @classmethod
    def validate_fees(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Fees cannot be negative")
        return v


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
    rolls_credit: float = 0.0
    last_trade_date: str = ""
    strike: float
    entry_price: float
    contracts: float

    @field_validator("origin")
    @classmethod
    def validate_origin(cls, v: str) -> str:
        return _require_non_empty(v, "Origin")

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        return _require_ticker(v)

    @field_validator("strategy")
    @classmethod
    def validate_strategy(cls, v: str) -> str:
        return _require_non_empty(v, "Strategy")

    @field_validator("option_type")
    @classmethod
    def validate_option_type(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("call", "put"):
            raise ValueError("Option type must be 'call' or 'put'")
        return v

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("long", "short"):
            raise ValueError("Direction must be 'long' or 'short'")
        return v

    @field_validator("open_date")
    @classmethod
    def validate_open_date(cls, v: str) -> str:
        return _require_date(v, "Open date")

    @field_validator("expiration_date")
    @classmethod
    def validate_expiration_date(cls, v: str) -> str:
        return _require_date(v, "Expiration date")

    @field_validator("last_trade_date")
    @classmethod
    def validate_last_trade_date(cls, v: str) -> str:
        return _optional_date(v, "Last trade date")

    @field_validator("strike")
    @classmethod
    def validate_strike(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Strike must be greater than 0")
        return v

    @field_validator("entry_price")
    @classmethod
    def validate_entry_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Entry price must be greater than 0")
        return v

    @field_validator("contracts")
    @classmethod
    def validate_contracts(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Contracts must be greater than 0")
        if v != int(v):
            raise ValueError("Contracts must be a whole number")
        return v

    @field_validator("buying_power")
    @classmethod
    def validate_buying_power(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Buying power must be greater than 0")
        return v

    @field_validator("buy_price")
    @classmethod
    def validate_buy_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Buy price must be greater than 0")
        return v

    @field_validator("fees")
    @classmethod
    def validate_fees(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Fees cannot be negative")
        return v

    @field_validator("rolls_credit")
    @classmethod
    def validate_rolls_credit(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Rolls credit cannot be negative")
        return v

    @model_validator(mode="after")
    def validate_date_order(self) -> "OptionTradeIn":
        if date.fromisoformat(self.expiration_date) < date.fromisoformat(self.open_date):
            raise ValueError("Expiration date must not be before open date")
        return self


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
