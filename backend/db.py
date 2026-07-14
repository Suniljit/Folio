import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlmodel import Session, create_engine, delete, select

from backend.models import Holding

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


def save_holdings(rows: list[Holding]) -> None:
    with Session(engine) as session:
        session.exec(delete(Holding))
        for h in rows:
            h.id = None
            session.add(h)
        session.commit()
