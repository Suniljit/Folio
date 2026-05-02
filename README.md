# Portfolio Manager

A personal stock portfolio tracker built with Streamlit and Python. Track holdings, view live prices, and monitor unrealized P&L in a single editable table.

## Features

- Live stock prices via [yfinance](https://github.com/ranaroussi/yfinance) (auto-refreshes every 30 seconds)
- Inline editing — click any cell to edit; add or delete rows directly in the table
- Calculated columns (Current Price, Total Cost, Market Value, Unrealized P&L) update automatically
- Portfolio summary: total market value, total cost, and total unrealized P&L
- Persistent storage in a local SQLite file (`portfolio.db`)

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) for dependency management

## Quickstart

```bash
# Install dependencies
uv sync

# Run the app
uv run streamlit run app.py
```

The app opens at `http://localhost:8501`.

## Project layout

```
portfolio_manager/
├── app.py           # Streamlit UI
├── db.py            # SQLite read/write
├── prices.py        # yfinance price fetching
├── pyproject.toml   # dependencies and tooling config
├── portfolio.db     # SQLite database (created on first run, git-ignored)
├── README.md        # this file
├── index.md         # navigation index for all docs
├── ADR/             # architectural decision records
└── docs/            # design and reference documentation
```

## Usage

1. Click **+ Add row** at the bottom of the table to add a holding.
2. Fill in **Company**, **Ticker**, **Shares**, **Avg Price**, and **Fees**.
3. Click **Save Changes** to persist to the database.
4. Prices refresh automatically every 30 seconds.

> Unsaved edits are cleared on auto-refresh. Save before the 30-second window elapses.

## Tooling

| Tool | Command |
|------|---------|
| Lint | `uv run ruff check .` |
| Format | `uv run ruff format .` |
| Type check | `uv run ty check` |

## Further reading

See [`index.md`](index.md) for a full map of all documentation.
