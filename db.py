import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "portfolio.db"


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS holdings (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name  TEXT    NOT NULL DEFAULT '',
                ticker        TEXT    NOT NULL,
                shares_owned  REAL    NOT NULL DEFAULT 0,
                avg_price     REAL    NOT NULL DEFAULT 0,
                fees          REAL    NOT NULL DEFAULT 0
            )
        """)


def get_holdings() -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM holdings ORDER BY id").fetchall()
        return [dict(row) for row in rows]


def save_holdings(rows: list[dict]) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM holdings")
        conn.executemany(
            "INSERT INTO holdings (company_name, ticker, shares_owned, avg_price, fees) "
            "VALUES (:company_name, :ticker, :shares_owned, :avg_price, :fees)",
            rows,
        )
