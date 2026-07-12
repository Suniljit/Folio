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
