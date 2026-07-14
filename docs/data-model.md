# Data Model

## Schema

File: `portfolio.db` (created at the project root on first run via `alembic upgrade head`).

The schema is declared in `backend/models.py` as a SQLModel class:

```python
class Holding(SQLModel, table=True):
    __tablename__ = "holdings"

    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str = Field(default="")
    ticker: str
    shares_owned: float = Field(default=0.0)
    avg_price: float = Field(default=0.0)
    fees: float = Field(default=0.0)
```

Schema changes are managed by Alembic. Add a migration with:
```bash
cd backend && alembic revision --autogenerate -m "description"
alembic upgrade head
```

Only the five user-supplied fields are persisted. All other columns shown in the UI are computed server-side in `backend/api/holdings.py` and returned in the `GET`/`POST /api/holdings` response — the frontend only formats and displays them.

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

`save_holdings(rows)` performs a full replace inside a single SQLModel session:

```python
session.exec(delete(Holding))
for h in rows:
    h.id = None  # let DB assign new IDs
    session.add(h)
session.commit()
```

This means:
- IDs are reassigned on every save (auto-increment restarts from the highest existing value — but since we delete all rows, it increments from the last used value in the session).
- Row order in the table is preserved by insertion order.
- There is no soft-delete or history; overwritten data is gone.

## Data types

All monetary values (`avg_price`, `fees`, `current_price`, etc.) are stored and computed as Python `float` / SQLite `REAL`. No rounding is applied during storage; the UI formats values to two decimal places for display only.

`shares_owned` is also `REAL` to support fractional share ownership.

## Options Trades Schema

File: same `portfolio.db`, table `option_trades`.

```python
class OptionTrade(SQLModel, table=True):
    __tablename__ = "option_trades"

    id: Optional[int] = Field(default=None, primary_key=True)
    origin: str = Field(default="")
    open_date: str = Field(default="")
    ticker: str
    strategy: str = Field(default="")
    expiration_date: str = Field(default="")
    buying_power: float = Field(default=0.0)
    buy_price: float = Field(default=0.0)
    fees: float = Field(default=0.0)
    rolls_credit: float = Field(default=0.0)
    last_trade_date: str = Field(default="")
    strike: float = Field(default=0.0)
    entry_price: float = Field(default=0.0)
    qty: float = Field(default=0.0)
```

All fields are manual entry — there's no options-chain data source in this codebase, so unlike `current_price` on `Holding`, nothing here is fetched from an external API. Dates are stored as plain ISO `YYYY-MM-DD` strings, matching the rest of the model's all-primitives style.

### Stored vs. calculated columns

| Column | Stored in DB | Editable in UI | Source |
|--------|:---:|:---:|--------|
| `origin` | Yes | Yes | User input |
| `open_date` | Yes | Yes | User input |
| `ticker` | Yes | Yes | User input; normalised to uppercase on save |
| `strategy` | Yes | Yes | User input |
| `expiration_date` | Yes | Yes | User input |
| `buying_power` | Yes | Yes | User input |
| `buy_price` | Yes | Yes | User input (debit) |
| `fees` | Yes | Yes | User input |
| `rolls_credit` | Yes | Yes | User input |
| `last_trade_date` | Yes | Yes | User input |
| `strike` | Yes | Yes | User input |
| `entry_price` | Yes | Yes | User input |
| `qty` | Yes | Yes | User input; signed (negative for short positions) |
| `entry_value` | **No** | No | `qty × entry_price` |
| `remaining_dte` | **No** | No | `expiration_date − today` (days) |

### Formulas

```
entry_value    = qty × entry_price
remaining_dte  = (expiration_date − today).days
```

**Intentionally deferred**: mark-to-market fields (P/L Open, Rolls P/L) and everything that mathematically depends on them (% P/L, Total P/L, ROI) are not tracked yet, since there's no options-pricing data source to compute a live P/L against. These can be added once live options pricing is available.

### Save behaviour

Same full-replace pattern as holdings: `save_option_trades(rows)` deletes all rows and re-inserts the new list in one session. IDs are reassigned on every save.
