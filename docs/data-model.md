# Data Model

## Schema

File: `portfolio.db` (created at the project root on first run via `alembic upgrade head`).

The schema is declared in `models.py` as a SQLModel class:

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
alembic revision --autogenerate -m "description"
alembic upgrade head
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
