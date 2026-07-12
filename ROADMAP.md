# Folio — Feature Roadmap

**App name:** Folio  
**Currency:** USD throughout  
**Stack:** FastAPI · React/Vite · SQLModel · SQLite · yfinance

---

## Navigation Structure

```
[ Dashboard ]  [ Stocks ]  [ Options ]  [ Watchlist ]  [ History ]  [ Settings ]
```

| Tab | Purpose |
|-----|---------|
| Dashboard | Summary metrics, SGT + NYSE clocks, portfolio overview |
| Stocks | Active stock holdings, live prices, P&L |
| Options | Active option trades, live greeks, alerts |
| Watchlist | Stocks being monitored (no open position) |
| History | Closed stocks + closed options (two sub-tabs) |
| Settings | Configurable alert thresholds |

---

## Database Schema (target state)

### `holdings` — active stock positions
| Column | Type | Notes |
|--------|------|-------|
| id | int PK | |
| company_name | str | |
| ticker | str | locked after creation |
| shares_owned | float | |
| avg_price | float | per share |
| fees | float | total buy-side fees |
| sector | str | GICS sector dropdown |
| intrinsic_value | float | manual entry (your DCF estimate) |
| target_allocation_pct | float | your target weight in portfolio |
| dividend_received | float | cumulative dividends received (running total) |
| remarks | str | free text notes |

**Calculated at render time** (never stored): `current_price`, `total_cost`, `market_value`, `unrealized_pl`, `actual_allocation_pct`, `margin_of_safety_pct`

### `closed_holdings` — closed stock positions
All columns from `holdings`, plus:
| Column | Type | Notes |
|--------|------|-------|
| sell_price | float | |
| sell_date | date | |
| sell_fees | float | |
| realized_pl | float | calculated: (sell_price − avg_price) × shares − fees − sell_fees |

### `options` — active option trades
| Column | Type | Notes |
|--------|------|-------|
| id | int PK | |
| ticker | str | underlying stock |
| open_date | date | |
| strategy | str | dropdown: Cash-Secured Put · Naked Put · Put Credit Spread |
| expiration_date | date | |
| strike | float | |
| contracts | int | number of contracts |
| entry_price | float | premium received per share when opened |
| fees | float | total fees |
| buying_power_blocked | float | capital reserved by broker |
| rolling_credits | float | cumulative net credits from all rolls |

**Auto-fetched via yfinance** (on refresh): `current_option_price`, `delta`, `theta`, `extrinsic_value`

**Calculated at render time**: `dte` (expiration − today), `days_in_trade` (today − open_date), `total_credit_received` (entry_price × 100 × contracts + rolling_credits), `current_pl`, `pct_profit` ((entry_price − current_option_price) / entry_price × 100), `current_roi` (current_pl / buying_power_blocked)

### `option_rolls` — roll history per trade
| Column | Type | Notes |
|--------|------|-------|
| id | int PK | |
| option_id | int FK | references options.id |
| roll_date | date | |
| close_price | float | price paid to close old leg |
| new_entry_price | float | premium received on new leg |
| net_credit | float | new_entry_price − close_price (per share) |
| new_strike | float | |
| new_expiration_date | date | |

### `closed_options` — closed option trades
All columns from `options`, plus:
| Column | Type | Notes |
|--------|------|-------|
| close_date | date | |
| close_price | float | |
| realized_pl | float | total_credit_received − close_price × 100 × contracts − fees |

### `watchlist` — stocks being monitored
Same metadata fields as `holdings` (company_name, ticker, sector, intrinsic_value, target_allocation_pct, remarks) plus `current_price` (live from yfinance). No position fields.

---

## GICS Sectors (dropdown values)

Communication Services · Consumer Discretionary · Consumer Staples · Energy · Financials · Health Care · Industrials · Information Technology · Materials · Real Estate · Utilities

---

## Alerts

| Alert | Trigger | Display |
|-------|---------|---------|
| Large price move | Stock or watchlist ≥ 5% move (up or down) | Row highlighted + top banner |
| Low DTE | Option with DTE ≤ configurable threshold (default 7) | Row highlighted orange |
| Take profit | Option with % profit ≥ configurable threshold (default 85%) | Row highlighted green |

Thresholds are configurable from the Settings tab.

---

## Phase 1 — Core Foundation

> Builds the production-ready stock tracking experience.

- [x] SQLite DB with holdings table
- [x] yfinance price fetching with 30s auto-refresh
- [x] Editable table (company, ticker, shares, avg price, fees) — originally Streamlit's `st.data_editor`, migrated to a React SPA + FastAPI API (see [ADR 007](docs/adr/007-frontend-framework-revisit.md))
- [x] Summary metrics: Market Value, Total Cost, Unrealized P&L
- [x] Save button with cache-clear on save
- [x] Rename app to **Folio**
- [x] Migrate `db.py` to **SQLModel** (before any new features)
- [ ] Add/Edit stock via **popup form** (not inline table editing); ticker locked after creation
- [ ] New stock fields: `sector` (GICS dropdown), `intrinsic_value`, `target_allocation_pct`, `dividend_received`, `remarks`
- [ ] Calculated stock columns: `weightage` (actual %), `margin_of_safety_pct`, `margin_of_safety_badge` (green/yellow/red)
- [ ] **Close position flow**: popup with sell price + sell date + sell fees → calculates realized P&L → moves row to `closed_holdings`
- [ ] **History tab** (sub-tab: Closed Stocks)
- [ ] **Dashboard**: SGT and NYSE current date/time display

---

## Phase 2 — Options Trading

> Adds full put options tracking, rolling, and alerts.

- [ ] `options` table and SQLModel model
- [ ] **Options tab**: entry form popup, display table with live greeks (delta, theta, extrinsic value) fetched from yfinance
- [ ] Calculated columns: DTE, days in trade, total credit received, current P&L, % profit, current ROI
- [ ] **Option alerts**: low DTE row highlight + take profit row highlight
- [ ] **Rolling flow**: close current leg + open new leg → inserts into `option_rolls`, updates `options` record; cumulative rolling credits reflected in P&L
- [ ] **Close option flow**: popup with close price + close date → calculates realized P&L → moves to `closed_options`
- [ ] **History tab** (sub-tab: Closed Options)
- [ ] **Settings tab**: configurable thresholds (DTE alert, profit % alert, stock move % alert)

---

## Phase 3 — Portfolio Intelligence

> Adds analytics, bulk operations, import/export, and watchlist.

- [ ] **Summary/Dashboard page**: total portfolio stats, stock P&L overview, options P&L overview, total realized + unrealized P&L
- [ ] **Sector pie chart**: distribution of portfolio market value by GICS sector
- [ ] **Target vs actual allocation**: per-stock table showing gap between target and current weight
- [ ] **Watchlist tab**: full metadata fields + live prices + 5% move alert
- [ ] **Bulk intrinsic value update**: upload a 2-column Excel (ticker, intrinsic_value) to update all at once
- [ ] **Excel import**: upload trade history Excel (open + closed rows, routed by status column) to populate DB
- [ ] **Excel export** (manual trigger): exports all four tables as separate sheets in one `.xlsx` file

---

## Phase 4 — AI Features

> Intelligent assistant features powered by Claude API.

- [ ] **Portfolio chatbot**: conversational interface connected to live DB — ask questions about your holdings and trades
- [ ] **Company research tool**: agentic workflow to generate a research report on any ticker
- [ ] **News scanner**: on-demand explainer for large stock movements — light research + summary of why a stock moved

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| App name | Folio | Short, memorable, implies personal ownership |
| Currency | USD only | All trades priced in USD; avoids FX complexity |
| ORM | SQLModel | Typed models, cleaner than raw sqlite3; migrate before any new features |
| Greeks source | yfinance auto-fetch | Requires exact contract (ticker + strike + expiry + type) |
| Options strategy | Fixed dropdown | Keeps data clean and filterable |
| Intrinsic value | Manual entry | It's a personal valuation judgment, not a market fact |
| Sector taxonomy | GICS (11 sectors) | Industry standard, matches broker classifications |
| Sector/industry input | Manual dropdown | User wants full control; dropdown keeps data clean |
| Dividend tracking | Cumulative total received | Track actual cash received, not yield % |
| Closed positions | Separate tables | Active tables stay clean for real-time polling; history tab shows closed |
| Rolling model | One continuous trade + rolls sub-table | Cumulative P&L across all legs; current leg always visible |
| Close stock fields | Sell price + sell date + sell fees | Enough to calculate exact realized P&L |
| Ticker editability | Locked after creation | Prevents accidental overwrite; delete + add for ticker changes |
| Alerts | In-app only (highlight + banner) | No background process needed; renders as part of the existing poll-driven UI |
| Alert thresholds | User-configurable (Settings tab) | 7 DTE and 85% profit as defaults |
| Watchlist fields | Same metadata as holdings | Full parity: sector, intrinsic value, remarks, target allocation |
| Excel export | All 4 tables, separate sheets | Complete backup in one file |
| Excel import | Both open + closed trades | One import populates entire DB state |
| AI features | Phase 4 (deferred) | Core data features first; cleaner codebase before adding AI |
| New: margin of safety badge | Approved | Green/yellow/red based on intrinsic value vs current price |
| New: target allocation | Approved | Per-stock target weight; actual vs target gap displayed |
