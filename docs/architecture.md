# Architecture

## Overview

Folio is a single-user, locally-hosted web app. There is no server-side backend beyond what Streamlit provides — the Python script IS the server. Data lives in a local SQLite file; prices are fetched on-demand from Yahoo Finance via yfinance.

```
Browser (localhost:8501)
        │
        │  WebSocket (Streamlit protocol)
        ▼
┌───────────────────────────────────────┐
│              app.py                   │
│  ┌─────────────┐   ┌───────────────┐  │
│  │   db.py     │   │  prices.py    │  │
│  │  (SQLite)   │   │  (yfinance)   │  │
│  └──────┬──────┘   └──────┬────────┘  │
│         │                 │           │
└─────────┼─────────────────┼───────────┘
          │                 │
    portfolio.db      api.finance.yahoo.com
    (local file)      (HTTP, ~30s cached)
```

## Components

### `app.py` — UI layer

The Streamlit entry point. Runs top-to-bottom on every page render (initial load, auto-refresh, user interaction, explicit save).

Responsibilities:
- Calls `init_db()` to ensure the schema exists
- Loads holdings from SQLite via `get_holdings()`
- Fetches current prices via the cached `_fetch_prices()` wrapper
- Derives calculated columns in a pandas DataFrame
- Renders summary metric cards and the editable `st.data_editor` table
- On save: validates, writes to SQLite, clears price cache, reruns

### `db.py` — Persistence layer

SQLModel ORM over SQLite. Schema is version-controlled via Alembic.

- `init_db()` — runs `alembic upgrade head` on startup; applies any pending migrations
- `get_holdings()` — typed query returning `list[Holding]`, ordered by `id`
- `save_holdings(rows)` — full replace: deletes all rows then inserts the new list in a single session

The full-replace pattern is intentional: the portfolio is small, there are no foreign key relationships yet, and it avoids the complexity of diffing inserts/updates/deletes.

### `models.py` — Data models

SQLModel class definitions. `Holding` is the single model today; future tables (options, watchlist, etc.) will be added here.

Each class declared with `table=True` maps directly to a SQLite table and doubles as a typed Python dataclass.

### `prices.py` — Price fetching

`fetch_prices(tickers)` iterates over tickers and calls `yf.Ticker(t).fast_info.last_price` for each. Failures are caught per-ticker, logged via loguru, and fall back to `0.0` so one bad ticker doesn't block the rest.

Price fetching is wrapped in `app.py` with `@st.cache_data(ttl=30)`, so Yahoo Finance is hit at most once per 30-second window regardless of how many reruns occur.

## Data flow

### On page load / auto-refresh

```
st_autorefresh fires (every 30s)
  → Streamlit reruns app.py
  → init_db()          (alembic upgrade head — no-op if already at head)
  → get_holdings()     (returns list[Holding] from portfolio.db)
  → _fetch_prices()    (cached; hits Yahoo Finance if TTL expired)
  → build DataFrame    (stored fields + calculated fields)
  → render metrics + st.data_editor
```

### On Save

```
User clicks "Save Changes"
  → app.py reads edited_df from st.data_editor
  → filters rows with empty ticker
  → save_holdings(rows)   → DELETE + INSERT list[Holding] in portfolio.db
  → _fetch_prices.clear() → invalidate price cache
  → st.rerun()            → triggers immediate page reload
```

## Auto-refresh mechanism

`streamlit-autorefresh` injects a small JavaScript component that calls `window.setTimeout` in the browser. After 30 000 ms it posts a message that triggers a Streamlit rerun. This keeps the server-side thread free during the interval — unlike `time.sleep()`, which would block the script thread and make the UI unresponsive to interactions during the wait.

The 30-second JS interval and the 30-second `@st.cache_data(ttl=30)` are aligned: each auto-refresh rerun hits the cache boundary and fetches fresh prices.

## Known constraints

- **Single user**: SQLite has no concurrency protection. Running multiple browser sessions simultaneously can produce inconsistent state.
- **Unsaved edits lost on refresh**: `st.data_editor` re-initializes from fresh DB data on every rerun. Any edits not yet saved will be cleared by the 30-second auto-refresh.
- **Market hours only**: yfinance `fast_info.last_price` returns the last traded price. Outside market hours this is the prior session's close, not a real-time quote.
- **US tickers assumed**: All values are USD. No FX conversion.
