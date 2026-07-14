# Architecture

## Overview

Folio is a single-user, locally-hosted web app: a React single-page frontend talking to a FastAPI JSON API backend. Data lives in a local SQLite file; prices are fetched on-demand from Yahoo Finance via yfinance.

```
Browser (localhost:8000, or :5173 in dev)
        │
        │  HTTP (fetch)
        ▼
┌───────────────────────────────────────┐
│         backend/main.py (FastAPI)      │
│  ┌───────────────┐                     │
│  │ api/holdings.py│                    │
│  └───────┬────────┘                    │
│          │                             │
│  ┌───────┴──────┐   ┌───────────────┐  │
│  │  db.py       │   │  prices.py    │  │
│  │  (SQLite)    │   │  (yfinance)   │  │
│  └──────┬───────┘   └──────┬────────┘  │
│         │                  │           │
└─────────┼──────────────────┼───────────┘
          │                  │
    portfolio.db       api.finance.yahoo.com
    (local file)       (HTTP, ~30s cached)
```

The React frontend (`frontend/`) holds its own edit state and polls the API every 30 seconds; it never talks to SQLite or yfinance directly.

## Components

### `frontend/` — UI layer

A Vite + React + TypeScript SPA, styled with Tailwind CSS and shadcn/ui (see [ADR 008](adr/008-adopt-shadcn-tailwind.md)). `App.tsx` orchestrates data fetching, polling, and dirty-state tracking; presentational components (`StatCards`, `HoldingsTable`, `HoldingRow`, `AddHoldingButton`, `AddHoldingModal`, `SaveButton`) render the design on top of shadcn primitives (`frontend/src/components/ui/`), and toasts are shown via `sonner`.

Responsibilities:
- Fetches `GET /api/holdings` on mount and every 30 seconds
- Holds two copies of the holdings list: `savedHoldings` (last server response) and `draftHoldings` (the editable working copy); edits, adds, and deletes only ever mutate the draft
- Adding a holding is a two-step client-side flow: `AddHoldingButton` opens `AddHoldingModal`, which collects and validates the new row's fields, then appends it to `draftHoldings` on submit — no dedicated backend call, it rides along with the next Save
- On each 30-second poll, if the draft differs from the last saved state, discards the draft in favor of the fresh response and shows a toast; otherwise silently refreshes displayed prices
- On **Save Changes**, posts `draftHoldings` to `POST /api/holdings` and replaces both state copies with the response

### `backend/main.py` — FastAPI app

Registers the holdings API router, configures CORS for the Vite dev server, runs `init_db()` on startup, and — when `frontend/dist/` exists (i.e. after `npm run build`) — mounts it as static files so the whole app is served from one process/port.

### `backend/api/holdings.py` — API layer

- `GET /api/holdings` — returns all holdings with stored fields plus computed fields (`current_price`, `total_cost`, `market_value`, `unrealized_pl`), plus portfolio `totals`. Prices are cached in-process for 30 seconds per ticker set.
- `POST /api/holdings` — full replace: drops rows with an empty ticker, calls `save_holdings()`, clears the price cache, and returns the same shape as GET so the frontend can render from the response without a second round trip.

Computed columns are derived here, once, in Python — the frontend only formats and displays them.

### `backend/db.py` — Persistence layer

SQLModel ORM over SQLite. Schema is version-controlled via Alembic (`backend/alembic/`).

- `init_db()` — runs `alembic upgrade head` on startup; applies any pending migrations
- `get_holdings()` — typed query returning `list[Holding]`, ordered by `id`
- `save_holdings(rows)` — full replace: deletes all rows then inserts the new list in a single session

The full-replace pattern is intentional: the portfolio is small, there are no foreign key relationships yet, and it avoids the complexity of diffing inserts/updates/deletes.

### `backend/models.py` — Data models

SQLModel class definitions. `Holding` is the single model today; future tables (options, watchlist, etc.) will be added here.

### `backend/prices.py` — Price fetching

`fetch_prices(tickers)` iterates over tickers and calls `yf.Ticker(t).fast_info.last_price` for each. Failures are caught per-ticker, logged via loguru, and fall back to `0.0` so one bad ticker doesn't block the rest.

The API layer caches price lookups per ticker set for 30 seconds, so Yahoo Finance is hit at most once per 30-second window regardless of how many requests arrive.

## Data flow

### On page load / 30-second poll

```
Frontend timer fires (every 30s, and once on mount)
  → GET /api/holdings
  → backend: get_holdings()       (SQLModel query)
  → backend: cached price lookup  (hits Yahoo Finance if TTL expired)
  → backend: compute total_cost / market_value / unrealized_pl per row + totals
  → frontend: compare response against current draft
      → if draft differs from last-saved state: discard draft, show "Refreshed — unsaved edits cleared" toast
      → else: silently update displayed prices/computed columns
```

### On Save

```
User clicks "Save Changes"
  → frontend posts draftHoldings to POST /api/holdings
  → backend: drops rows with empty ticker
  → backend: save_holdings(rows)   → DELETE + INSERT list[Holding] in portfolio.db
  → backend: clears price cache
  → backend: returns fresh GET-shaped response
  → frontend: replaces savedHoldings/draftHoldings/totals from the response, shows "Saved!" toast
```

## Auto-refresh mechanism

The frontend uses a plain `setInterval` (30,000 ms) that calls `GET /api/holdings`. This replaces `streamlit-autorefresh`'s JS-triggered rerun — see [ADR 007](adr/007-frontend-framework-revisit.md) — but preserves the same contract: the 30-second interval and "unsaved edits are cleared on refresh" behavior are unchanged from the original design (see [ADR 004](adr/004-auto-refresh-strategy.md) and [ADR 005](adr/005-save-strategy.md)).

## Desktop packaging (Electron)

Folio also ships as a packaged macOS app (see [ADR 009](adr/009-electron-desktop-packaging.md)). This is additive to the web-app architecture above — the same FastAPI backend and React frontend run unmodified; Electron only adds a process-orchestration layer around them.

- **`electron/main.js`** spawns the backend as a child process — in dev, `uv run uvicorn backend.main:app --reload` against `:8000` (loading `http://localhost:5173` in the window); in prod, a PyInstaller-frozen `folio-backend` binary (loading `http://127.0.0.1:8756`).
- It polls `GET /health` until the backend responds, then opens the `BrowserWindow`. On quit, it kills the spawned backend process — no orphaned processes survive the app closing.
- **`FOLIO_DATA_DIR`** (read once at import in `backend/db.py`) redirects `DB_PATH` to Electron's `app.getPath('userData')` (`~/Library/Application Support/Folio/`) when set by the prod-mode spawn; unset (the normal `uv run uvicorn` path), `DB_PATH` is unchanged from before. **`FOLIO_PORT`** similarly configures the port `backend/run_server.py` binds to.
- Packaging (`npm run electron:build`) chains: frontend build → PyInstaller freeze (`folio-backend.spec`, one-folder build) → `electron-builder` (`electron-builder.yml`), producing an unsigned `.dmg` for local/personal use.

## Known constraints

- **Single user**: SQLite has no concurrency protection. Running multiple browser sessions simultaneously can produce inconsistent state.
- **Unsaved edits lost on refresh**: the frontend's `draftHoldings` state is discarded and replaced with server truth whenever a 30-second poll finds it out of sync with `savedHoldings`.
- **Market hours only**: yfinance `fast_info.last_price` returns the last traded price. Outside market hours this is the prior session's close, not a real-time quote.
- **US tickers assumed**: All values are USD. No FX conversion.
