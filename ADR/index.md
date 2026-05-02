# ADR Index

Architectural Decision Records for Portfolio Manager.

| # | Title | Status | Summary |
|---|-------|--------|---------|
| [001](001-frontend-framework.md) | Frontend framework | Accepted | Streamlit chosen over React+FastAPI and CLI |
| [002](002-data-storage.md) | Data storage | Accepted | SQLite chosen over CSV/JSON and in-memory |
| [003](003-price-data-source.md) | Price data source | Accepted | yfinance chosen over Finnhub and Twelve Data |
| [004](004-auto-refresh-strategy.md) | Auto-refresh strategy | Accepted | `streamlit-autorefresh` chosen over `time.sleep` and a manual button |
| [005](005-save-strategy.md) | Save strategy | Accepted | Explicit save button chosen over auto-save on edit |

## Format

Each ADR follows the structure:

- **Status** — current state (Accepted / Superseded / Deprecated)
- **Context** — the problem and constraints at decision time
- **Decision** — what was chosen and why
- **Alternatives considered** — options that were evaluated and rejected
- **Consequences** — trade-offs and known downsides
