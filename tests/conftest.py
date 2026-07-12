import pytest
from sqlmodel import create_engine

from backend import db


@pytest.fixture
def temp_engine(tmp_path, monkeypatch):
    db_path = tmp_path / "test_portfolio.db"
    engine = create_engine(f"sqlite:///{db_path}")
    monkeypatch.setattr(db, "DB_PATH", db_path)
    monkeypatch.setattr(db, "engine", engine)
    return engine


@pytest.fixture
def client(temp_engine):
    from fastapi.testclient import TestClient

    from backend.api import holdings as holdings_api
    from backend.main import app

    holdings_api._price_cache.clear()
    with TestClient(app) as test_client:
        yield test_client
