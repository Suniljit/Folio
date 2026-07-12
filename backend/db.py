from pathlib import Path

from alembic.config import Config
from sqlmodel import Session, create_engine, delete, select

from alembic import command
from models import Holding

DB_PATH = Path(__file__).parent / "portfolio.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


def init_db() -> None:
    alembic_cfg = Config(Path(__file__).parent / "alembic.ini")
    command.upgrade(alembic_cfg, "head")


def get_holdings() -> list[Holding]:
    with Session(engine) as session:
        return list(session.exec(select(Holding).order_by("id")).all())


def save_holdings(rows: list[Holding]) -> None:
    with Session(engine) as session:
        session.exec(delete(Holding))
        for h in rows:
            h.id = None
            session.add(h)
        session.commit()
