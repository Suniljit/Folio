# Data Model

## SQLite schema

File: `portfolio.db` (created at the project root on first run).

```sql
CREATE TABLE IF NOT EXISTS holdings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name  TEXT    NOT NULL DEFAULT '',
    ticker        TEXT    NOT NULL,
    shares_owned  REAL    NOT NULL DEFAULT 0,
    avg_price     REAL    NOT NULL DEFAULT 0,
    fees          REAL    NOT NULL DEFAULT 0
);
```

Only the five user-supplied fields are persisted. All other columns shown in the UI are computed at render time.

## Stored vs. calculated columns

| Column | Stored in DB | Editable in UI | Source |
|--------|:---:|:---:|--------|
| `company_name` | Yes | Yes | User input |
| `ticker` | Yes | Yes | User input; normalised to uppercase on save |
| `shares_owned` | Yes | Yes | User input |
| `avg_price` | Yes | Yes | User input |
| `fees` | Yes | Yes | User input |
| `current_price` | **No** | No | yfinance `fast_info.last_price`, cached 30s |
| `total_cost` | **No** | No | `(avg_price × shares_owned) + fees` |
| `market_value` | **No** | No | `shares_owned × current_price` |
| `unrealized_pl` | **No** | No | `market_value − total_cost` |

## Formulas

```
total_cost     = (avg_price × shares_owned) + fees
market_value   = shares_owned × current_price
unrealized_pl  = market_value − total_cost
```

Fees are included in `total_cost` because they represent real capital deployed to enter the position; excluding them would overstate P&L.

## Summary metrics

Aggregated across all holdings at the top of the UI:

```
Total Market Value   = Σ market_value
Total Cost           = Σ total_cost
Total Unrealized P/L = Σ unrealized_pl
```

## Save behaviour

`save_holdings(rows)` performs a full replace inside a single transaction:

```python
conn.execute("DELETE FROM holdings")
conn.executemany("INSERT INTO holdings (...) VALUES (...)", rows)
```

This means:
- IDs are reassigned on every save (auto-increment restarts from the highest existing value — but since we delete all rows, it increments from the last used value in the session).
- Row order in the table is preserved by insertion order.
- There is no soft-delete or history; overwritten data is gone.

## Data types

All monetary values (`avg_price`, `fees`, `current_price`, etc.) are stored and computed as Python `float` / SQLite `REAL`. No rounding is applied during storage; the UI formats values to two decimal places for display only.

`shares_owned` is also `REAL` to support fractional share ownership.
