# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
uv run streamlit run app.py        # run the app (opens at http://localhost:8501)
uv run ruff check .                # lint
uv run ruff format .               # format
uv run ty check                    # type check
```

## Architecture

Three modules, no framework beyond Streamlit:

- **`app.py`** — Streamlit UI. Reads holdings from DB, fetches prices, computes derived columns (total cost, market value, unrealized P&L) in-memory, and renders an editable table. Orchestrates all other modules.
- **`db.py`** — SQLite persistence via `portfolio.db`. `save_holdings` is a full replace (DELETE + INSERT), not an upsert — row IDs are not stable across saves.
- **`prices.py`** — yfinance price fetching, one ticker at a time. Returns `0.0` on failure (logged as warning).

Calculated columns (`total_cost`, `market_value`, `unrealized_pl`) are derived at render time in `app.py` and never stored in the database.

Prices are cached at two levels: `@st.cache_data(ttl=30)` in `app.py` and `st_autorefresh` every 30 seconds. The cache is explicitly cleared on save so new tickers get prices immediately.
