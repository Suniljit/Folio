# Folio

A personal portfolio tracker: a FastAPI JSON API backend with a React SPA frontend. Track holdings, view live prices, and monitor unrealized P&L in a single editable table.

## Features

- Live stock prices via [yfinance](https://github.com/ranaroussi/yfinance) (auto-refreshes every 30 seconds)
- Inline editing — click any cell to edit; add or delete rows directly in the table
- Calculated columns (Current Price, Total Cost, Market Value, Unrealized P&L) update automatically
- Portfolio summary: total market value, total cost, and total unrealized P&L
- Persistent storage in a local SQLite file (`portfolio.db`)

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) for Python dependency management
- Node.js + npm for the frontend

## Quickstart

```bash
# Install backend dependencies
uv sync

# Build the frontend (only needed once, or after frontend changes)
cd frontend && npm install && npm run build && cd ..

# Run the app
uv run uvicorn backend.main:app
```

The app opens at `http://localhost:8000`.

### Active frontend development

Run two servers instead of building the frontend each time:

```bash
# Terminal 1 — backend, with auto-reload
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2 — frontend dev server (proxies /api to :8000)
cd frontend && npm run dev
```

Open `http://localhost:5173`.

## Project layout

```
folio/
├── backend/
│   ├── main.py       # FastAPI app: routes, CORS, static frontend mount
│   ├── api/
│   │   └── holdings.py   # GET/POST /api/holdings
│   ├── schemas.py    # Pydantic request/response models
│   ├── db.py         # SQLModel sessions: init_db, get_holdings, save_holdings
│   ├── models.py     # SQLModel table definitions (Holding, and future models)
│   ├── prices.py     # yfinance price fetching
│   ├── alembic.ini   # Alembic configuration
│   └── alembic/      # database migration scripts
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # layout, polling, dirty-state orchestration
│   │   ├── api.ts            # fetch wrappers
│   │   ├── format.ts         # currency formatting
│   │   ├── components/       # StatCards, HoldingsTable, HoldingRow, etc.
│   │   └── styles/           # CSS custom properties + component styles
│   └── vite.config.ts        # dev proxy: /api -> :8000
├── tests/            # pytest suite for the API
├── pyproject.toml    # backend dependencies and tooling config
├── portfolio.db      # SQLite database (created on first run, git-ignored)
├── README.md         # this file
├── index.md          # navigation index for all docs
└── docs/             # design and reference documentation
    ├── architecture.md
    ├── data-model.md
    ├── column-reference.md
    ├── user-guide.md
    └── adr/          # architectural decision records
```

## Usage

1. Click **+ Add holding** at the bottom of the table to add a holding.
2. Fill in **Company**, **Ticker**, **Shares**, **Avg Price**, and **Fees**.
3. Click **Save Changes** to persist to the database.
4. Prices refresh automatically every 30 seconds.

> Unsaved edits are cleared on auto-refresh. Save before the 30-second window elapses.

## Tooling

| Tool | Command |
|------|---------|
| Backend tests | `uv run pytest` |
| Lint | `uv run ruff check .` |
| Format | `uv run ruff format .` |
| Type check | `uv run ty check` |
| Frontend build | `npm run build` (in `frontend/`) |

## Further reading

See [`index.md`](index.md) for a full map of all documentation.
