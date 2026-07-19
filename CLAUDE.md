# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
uv run uvicorn backend.main:app                      # run the app (serves API + built frontend at http://localhost:8000)
uv run uvicorn backend.main:app --reload --port 8000  # backend dev server (with frontend dev server, see below)
npm --prefix frontend run dev                          # frontend dev server (http://localhost:5173, proxies /api to :8000)
npm --prefix frontend run build                         # build frontend into frontend/dist (required for the single-command run above)
uv run pytest                                          # backend API tests
uv run ruff check .                                    # backend lint
uv run ruff format .                                   # backend format
uv run ty check                                        # backend type check
npm --prefix frontend run test                         # frontend tests (vitest)
npm --prefix frontend run lint                          # frontend lint (oxlint)
npm --prefix frontend run format                         # frontend format (prettier --write)
npm --prefix frontend run format:check                    # frontend format check (prettier --check)
npm run electron:dev                                    # macOS Electron app in dev mode (spawns backend + frontend dev servers)
npm run electron:build                                   # build a distributable .dmg (frontend build + backend freeze + package)
```

## Architecture

FastAPI backend + React/Vite SPA frontend:

- **`backend/main.py`** — FastAPI app. Registers the holdings and options-trades routers, runs `init_db()` on startup, mounts `frontend/dist/` as static files when present (for the single-command prod path).
- **`backend/api/holdings.py`** / **`backend/api/options_trades.py`** — `GET`, `POST`, `PUT /{id}`, `DELETE /{id}` per-item REST endpoints (row IDs are stable). Computes derived columns (total cost, market value, unrealized P&L for holdings; entry value, remaining DTE, P/L, ROI for option trades) server-side and returns them alongside stored fields. Caches price lookups for 30s, cleared on any write. Request bodies are validated by Pydantic models in `backend/schemas.py` (required fields, positivity, ticker format, date ordering, etc.) — invalid input is rejected with a `422` before it reaches the database; see [ADR 013](docs/adr/013-per-item-crud-and-field-validation.md).
- **`backend/db.py`** — SQLite persistence via `portfolio.db` (repo root). Per-item `create_*`/`update_*`/`delete_*` functions for holdings and option trades — not a full-list replace.
- **`backend/prices.py`** — yfinance price fetching, one ticker at a time. Returns `0.0` on failure (logged as warning).
- **`frontend/src/App.tsx`** — orchestrates fetching, a 30s poll (`setInterval`) against `GET /api/holdings` and `GET /api/options-trades`, and per-item add/edit/delete calls to the REST endpoints above. Holds a single `holdings`/`optionTrades` array (no separate draft/saved pair); the poll simply skips entirely while a modal is open, so an in-progress edit is never clobbered by a refresh.

Calculated columns (`total_cost`, `market_value`, `unrealized_pl`, etc.) are derived server-side in `backend/api/holdings.py` / `backend/api/options_trades.py` and never stored in the database or recomputed client-side.

- **`electron/main.js`** — spawns the backend as a child process (dev: `uv run uvicorn --reload`; prod: a PyInstaller-frozen binary via `backend/run_server.py`), polls `GET /health` until ready, then opens a `BrowserWindow`. Kills the backend on quit. `FOLIO_DATA_DIR`/`FOLIO_PORT` env vars (read in `backend/db.py`/`backend/run_server.py`) redirect the DB and port for the packaged app; see [docs/adr/009-electron-desktop-packaging.md](docs/adr/009-electron-desktop-packaging.md).
