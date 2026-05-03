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
| Why was X built this way? | [ADR/](ADR/index.md) |
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

### `ADR/` — Architectural Decision Records

| File | Decision |
|------|----------|
| [`ADR/index.md`](ADR/index.md) | Index of all ADRs with status and one-line summary |
| [`ADR/001-frontend-framework.md`](ADR/001-frontend-framework.md) | Streamlit over React+FastAPI or CLI |
| [`ADR/002-data-storage.md`](ADR/002-data-storage.md) | SQLite over CSV/JSON or in-memory |
| [`ADR/003-price-data-source.md`](ADR/003-price-data-source.md) | yfinance over Finnhub or Twelve Data |
| [`ADR/004-auto-refresh-strategy.md`](ADR/004-auto-refresh-strategy.md) | `streamlit-autorefresh` over `time.sleep` or manual button |
| [`ADR/005-save-strategy.md`](ADR/005-save-strategy.md) | Explicit save button over auto-save on edit |

---

## Key concepts for AI agents

- **Stored fields**: `company_name`, `ticker`, `shares_owned`, `avg_price`, `fees` — persisted in `portfolio.db` via the `Holding` SQLModel class in `models.py`.
- **Calculated fields**: `current_price`, `total_cost`, `market_value`, `unrealized_pl` — derived at render time in `app.py`, never stored.
- **Data model**: `get_holdings()` returns `list[Holding]`; `app.py` calls `h.model_dump()` to build the DataFrame and constructs `Holding(...)` objects in the save block.
- **Save flow**: `app.py` reads `edited_df` from `st.data_editor`, strips empty-ticker rows, builds `list[Holding]`, and calls `db.save_holdings()` which does a full DELETE + re-INSERT in a single SQLModel session (no partial updates; row IDs are not stable across saves).
- **Schema migrations**: managed by Alembic. `init_db()` calls `alembic upgrade head` on every startup (no-op if already at head). To add columns, run `alembic revision --autogenerate -m "..."` then `alembic upgrade head`.
- **Price cache**: `_fetch_prices` is decorated with `@st.cache_data(ttl=30)`. Cache is explicitly cleared on save to force a fresh fetch for any newly added tickers.
- **Auto-refresh**: `st_autorefresh(interval=30_000)` triggers a browser-side JS rerun every 30 seconds. This re-executes the entire Streamlit script, pulling fresh DB data and re-fetching prices (subject to the 30s cache TTL).
