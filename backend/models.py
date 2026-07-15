from typing import Optional

from sqlmodel import Field, SQLModel


class Holding(SQLModel, table=True):
    __tablename__ = "holdings"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str = Field(default="")
    ticker: str
    shares_owned: float = Field(default=0.0)
    avg_price: float = Field(default=0.0)
    fees: float = Field(default=0.0)


class OptionTrade(SQLModel, table=True):
    __tablename__ = "option_trades"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    origin: str = Field(default="")
    open_date: str = Field(default="")
    ticker: str
    strategy: str = Field(default="")
    option_type: str = Field(default="")
    expiration_date: str = Field(default="")
    buying_power: float = Field(default=0.0)
    buy_price: float = Field(default=0.0)
    fees: float = Field(default=0.0)
    rolls_credit: float = Field(default=0.0)
    last_trade_date: str = Field(default="")
    strike: float = Field(default=0.0)
    entry_price: float = Field(default=0.0)
    contracts: float = Field(default=0.0)
