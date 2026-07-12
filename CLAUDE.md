# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
uv run uvicorn backend.main:app                      # run the app (serves API + built frontend at http://localhost:8000)
uv run uvicorn backend.main:app --reload --port 8000  # backend dev server (with frontend dev server, see below)
npm --prefix frontend run dev                          # frontend dev server (http://localhost:5173, proxies /api to :8000)
npm --prefix frontend run build                         # build frontend into frontend/dist (required for the single-command run above)
uv run pytest                                          # backend API tests
uv run ruff check .                                    # lint
uv run ruff format .                                   # format
uv run ty check                                        # type check
```

## Architecture

FastAPI backend + React/Vite SPA frontend:

- **`backend/main.py`** — FastAPI app. Registers the holdings router, runs `init_db()` on startup, mounts `frontend/dist/` as static files when present (for the single-command prod path).
- **`backend/api/holdings.py`** — `GET`/`POST /api/holdings`. Computes derived columns (total cost, market value, unrealized P&L) server-side and returns them alongside stored fields. Caches price lookups per ticker set for 30s, cleared on save.
- **`backend/db.py`** — SQLite persistence via `portfolio.db` (repo root). `save_holdings` is a full replace (DELETE + INSERT), not an upsert — row IDs are not stable across saves.
- **`backend/prices.py`** — yfinance price fetching, one ticker at a time. Returns `0.0` on failure (logged as warning).
- **`frontend/src/App.tsx`** — orchestrates fetching, a 30s poll (`setInterval`) against `GET /api/holdings`, dirty-state tracking between a `draftHoldings` (editable) and `savedHoldings` (last server response) pair, and save.

Calculated columns (`total_cost`, `market_value`, `unrealized_pl`) are derived in `backend/api/holdings.py` and never stored in the database or recomputed client-side.

If the frontend's local edits (`draftHoldings`) differ from the last-fetched server state when a 30s poll tick lands, the poll discards the local edits in favor of fresh server data and shows a toast ("Refreshed — unsaved edits cleared") — this replicates the original Streamlit rerun behavior; see [docs/adr/007-frontend-framework-revisit.md](docs/adr/007-frontend-framework-revisit.md).
