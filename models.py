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
