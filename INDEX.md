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
| [`INDEX.md`](INDEX.md) | This file — documentation navigation |
| [`pyproject.toml`](pyproject.toml) | Backend dependencies, ruff/taskipy config |
| [`tests/`](tests/) | pytest suite for the API |

### `backend/` — FastAPI app

| File | Contents |
|------|----------|
| [`backend/main.py`](backend/main.py) | FastAPI app: routes, CORS, static frontend mount for prod |
| [`backend/api/holdings.py`](backend/api/holdings.py) | `GET`/`POST /api/holdings` — computed columns, price caching |
| [`backend/schemas.py`](backend/schemas.py) | Pydantic request/response models |
| [`backend/db.py`](backend/db.py) | SQLModel sessions: `init_db`, `get_holdings`, `save_holdings` |
| [`backend/models.py`](backend/models.py) | SQLModel table definitions (`Holding`; future models added here) |
| [`backend/prices.py`](backend/prices.py) | `fetch_prices` — loops yfinance `fast_info.last_price` per ticker |
| [`backend/alembic.ini`](backend/alembic.ini) | Alembic configuration (DB URL, script location) |
| [`backend/alembic/`](backend/alembic/) | Migration scripts; `env.py` wired to SQLModel metadata |

### `frontend/` — React SPA

| File | Contents |
|------|----------|
| [`frontend/src/App.tsx`](frontend/src/App.tsx) | Layout, 30s polling, dirty-state tracking, save orchestration |
| [`frontend/src/api.ts`](frontend/src/api.ts) | `getHoldings`, `saveHoldings` fetch wrappers |
| [`frontend/src/components/`](frontend/src/components/) | `StatCards`, `HoldingsTable`, `HoldingRow`, `AddHoldingButton`, `AddHoldingModal`, `SaveButton`, `Toast` |
| [`frontend/src/styles/`](frontend/src/styles/) | CSS custom properties (design tokens) and component styling |
| `frontend/src/*.test.ts(x)`, [`frontend/src/test/`](frontend/src/test/) | Vitest + React Testing Library tests and shared fixtures/setup |
| [`frontend/vite.config.ts`](frontend/vite.config.ts) | Dev server + `/api` proxy to the backend; also configures the Vitest test environment |
| [`frontend/.prettierrc.json`](frontend/.prettierrc.json) | Prettier formatting rules |

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
| [`docs/adr/001-frontend-framework.md`](docs/adr/001-frontend-framework.md) | Streamlit over React+FastAPI or CLI — **superseded by ADR 007** |
| [`docs/adr/002-data-storage.md`](docs/adr/002-data-storage.md) | SQLite over CSV/JSON or in-memory |
| [`docs/adr/003-price-data-source.md`](docs/adr/003-price-data-source.md) | yfinance over Finnhub or Twelve Data |
| [`docs/adr/004-auto-refresh-strategy.md`](docs/adr/004-auto-refresh-strategy.md) | `streamlit-autorefresh` over `time.sleep` or manual button (original Streamlit mechanism; see ADR 007 for the SPA replacement) |
| [`docs/adr/005-save-strategy.md`](docs/adr/005-save-strategy.md) | Explicit save button over auto-save on edit |
| [`docs/adr/006-orm.md`](docs/adr/006-orm.md) | SQLModel + Alembic over raw sqlite3 |
| [`docs/adr/007-frontend-framework-revisit.md`](docs/adr/007-frontend-framework-revisit.md) | FastAPI + React/Vite over Streamlit, for pixel-accurate design fidelity |