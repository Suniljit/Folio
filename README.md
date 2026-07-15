# Folio

A personal portfolio tracker: a FastAPI JSON API backend with a React SPA frontend. Track holdings, view live prices, and monitor unrealized P&L in a single editable table.

## Features

- Live stock prices via [yfinance](https://github.com/ranaroussi/yfinance) (auto-refreshes every 30 seconds)
- Live options mark prices via Interactive Brokers (requires TWS running locally — see [Prerequisites](#prerequisites))
- Inline editing — click any cell to edit; add or delete rows directly in the table
- Calculated columns (Current Price, Total Cost, Market Value, Unrealized P&L) update automatically
- Portfolio summary: total market value, total cost, and total unrealized P&L
- Persistent storage in a local SQLite file (`portfolio.db`)

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) for Python dependency management
- Node.js + npm for the frontend
- For options pricing: an Interactive Brokers account with Trader Workstation (TWS) or IB Gateway running locally and API access enabled. Without it, the Options Trades tab shows an "IBKR not connected" banner and prices read `0.0`. See [docs/ibkr-tws-setup.md](docs/ibkr-tws-setup.md) for setup and [.env.example](.env.example) for connection settings.

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

## macOS desktop app

Folio can also run as a native-feeling macOS app via Electron, which wraps the existing backend/frontend and spawns them automatically instead of requiring manual server commands.

```bash
# Install root-level Electron dependencies (only needed once)
npm install

# Run the desktop app in dev mode (spawns backend + frontend dev servers automatically)
npm run electron:dev

# Build a distributable .dmg (frontend build + backend freeze + packaging)
npm run electron:build
```

The packaged app is unsigned (personal use only, no Apple Developer account) — on first launch, right-click the app and choose **Open** to bypass Gatekeeper. See [ADR 009](docs/adr/009-electron-desktop-packaging.md) for details, including where the packaged app stores its data.

## Project layout

```
folio/
├── electron/
│   ├── main.js       # Electron main process: spawns backend, health-checks, opens window
│   └── preload.js    # minimal preload (renderer talks to /api over HTTP, no IPC)
├── package.json       # Electron dependencies + electron:dev/electron:build scripts
├── electron-builder.yml  # macOS packaging config (.dmg output)
├── folio-backend.spec    # PyInstaller spec for freezing the backend
├── backend/
│   ├── main.py       # FastAPI app: routes, CORS, static frontend mount
│   ├── run_server.py # uvicorn.run() entry point, used as the PyInstaller target
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
├── INDEX.md          # navigation index for all docs
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

Backend (run from repo root):

| Tool | Command |
|------|---------|
| Tests | `uv run pytest` |
| Lint | `uv run ruff check .` |
| Format | `uv run ruff format .` |
| Type check | `uv run ty check` |

Frontend (run from `frontend/`):

| Tool | Command |
|------|---------|
| Tests | `npm run test` |
| Lint | `npm run lint` |
| Format | `npm run format` (check only: `npm run format:check`) |
| Type check | `npm run build` (runs `tsc -b` before bundling) |

## Further reading

See [`INDEX.md`](INDEX.md) for a full map of all documentation, including [docs/ibkr-tws-setup.md](docs/ibkr-tws-setup.md) for IBKR/TWS setup.
