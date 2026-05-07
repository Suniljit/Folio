# Documentation Index

Navigation guide for all documentation in this repository. Intended for both human readers and AI agents.

## Quick orientation

| Question | Go to |
|----------|-------|
| How do I run this? | [README.md](README.md) |
| What does the app do? | [docs/architecture.md](docs/architecture.md) |
| What data is stored and how? | [docs/data-model.md](docs/data-model.md) |
| What do each of the columns mean? | [docs/column-reference.md](docs/column-reference.md) |
| How do I use the UI? | [docs/user-guide.md](docs/user-guide.md) |
| Why was X built this way? | [docs/adr/](docs/adr/) |
| What's being built next? | [ROADMAP.md](ROADMAP.md) |

---

## File map

### Root

| File | Contents |
|------|----------|
| [`README.md`](README.md) | Setup, quickstart, project layout |
| [`ROADMAP.md`](ROADMAP.md) | Feature roadmap: phases, target DB schema, decisions log |
| [`index.md`](index.md) | This file — documentation navigation |
| [`app.py`](app.py) | Streamlit entry point; UI layout, auto-refresh, save logic |
| [`db.py`](db.py) | SQLModel sessions: `init_db`, `get_holdings`, `save_holdings` |
| [`models.py`](models.py) | SQLModel table definitions (`Holding`; future models added here) |
| [`prices.py`](prices.py) | `fetch_prices` — loops yfinance `fast_info.last_price` per ticker |
| [`pyproject.toml`](pyproject.toml) | Dependencies, ruff config |
| [`alembic.ini`](alembic.ini) | Alembic configuration (DB URL, script location) |
| [`alembic/`](alembic/) | Migration scripts; `env.py` wired to SQLModel metadata |

### `docs/` — Design and reference

| File | Contents |
|------|----------|
| [`docs/architecture.md`](docs/architecture.md) | System overview, component diagram, data flow, key design decisions |
| [`docs/data-model.md`](docs/data-model.md) | SQLite schema, stored vs. calculated columns, formulas |
| [`docs/column-reference.md`](docs/column-reference.md) | All 9 display columns: definition, source, editability |
| [`docs/user-guide.md`](docs/user-guide.md) | Step-by-step UI usage, known limitations |

### `docs/adr/` — Architectural Decision Records

| File | Decision |
|------|----------|
| [`docs/adr/001-frontend-framework.md`](docs/adr/001-frontend-framework.md) | Streamlit over React+FastAPI or CLI |
| [`docs/adr/002-data-storage.md`](docs/adr/002-data-storage.md) | SQLite over CSV/JSON or in-memory |
| [`docs/adr/003-price-data-source.md`](docs/adr/003-price-data-source.md) | yfinance over Finnhub or Twelve Data |
| [`docs/adr/004-auto-refresh-strategy.md`](docs/adr/004-auto-refresh-strategy.md) | `streamlit-autorefresh` over `time.sleep` or manual button |
| [`docs/adr/005-save-strategy.md`](docs/adr/005-save-strategy.md) | Explicit save button over auto-save on edit |
| [`docs/adr/006-orm.md`](docs/adr/006-orm.md) | SQLModel + Alembic over raw sqlite3 |