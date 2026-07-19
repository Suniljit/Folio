import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlmodel import Session, create_engine, select

from backend.models import Holding, OptionTrade

_data_dir = os.environ.get("FOLIO_DATA_DIR")
DB_PATH = (
    Path(_data_dir) / "portfolio.db" if _data_dir else Path(__file__).parent.parent / "portfolio.db"
)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(f"sqlite:///{DB_PATH}")


def init_db() -> None:
    alembic_cfg = Config(Path(__file__).parent / "alembic.ini")
    command.upgrade(alembic_cfg, "head")


def get_holdings() -> list[Holding]:
    with Session(engine) as session:
        return list(session.exec(select(Holding).order_by("id")).all())


def create_holding(row: Holding) -> Holding:
    with Session(engine) as session:
        row.id = None
        session.add(row)
        session.commit()
        session.refresh(row)
        return row


def update_holding(holding_id: int, row: Holding) -> Holding | None:
    with Session(engine) as session:
        existing = session.get(Holding, holding_id)
        if existing is None:
            return None
        existing.company_name = row.company_name
        existing.ticker = row.ticker
        existing.shares_owned = row.shares_owned
        existing.avg_price = row.avg_price
        existing.fees = row.fees
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing


def delete_holding(holding_id: int) -> bool:
    with Session(engine) as session:
        existing = session.get(Holding, holding_id)
        if existing is None:
            return False
        session.delete(existing)
        session.commit()
        return True


def get_option_trades() -> list[OptionTrade]:
    with Session(engine) as session:
        return list(session.exec(select(OptionTrade).order_by("id")).all())


def create_option_trade(row: OptionTrade) -> OptionTrade:
    with Session(engine) as session:
        row.id = None
        session.add(row)
        session.commit()
        session.refresh(row)
        return row


def update_option_trade(trade_id: int, row: OptionTrade) -> OptionTrade | None:
    with Session(engine) as session:
        existing = session.get(OptionTrade, trade_id)
        if existing is None:
            return None
        existing.origin = row.origin
        existing.open_date = row.open_date
        existing.ticker = row.ticker
        existing.strategy = row.strategy
        existing.option_type = row.option_type
        existing.direction = row.direction
        existing.expiration_date = row.expiration_date
        existing.buying_power = row.buying_power
        existing.buy_price = row.buy_price
        existing.fees = row.fees
        existing.rolls_credit = row.rolls_credit
        existing.last_trade_date = row.last_trade_date
        existing.strike = row.strike
        existing.entry_price = row.entry_price
        existing.contracts = row.contracts
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing


def delete_option_trade(trade_id: int) -> bool:
    with Session(engine) as session:
        existing = session.get(OptionTrade, trade_id)
        if existing is None:
            return False
        session.delete(existing)
        session.commit()
        return True
