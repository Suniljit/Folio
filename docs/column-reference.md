# Column Reference

All nine columns displayed in the portfolio table.

---

## Company

| | |
|---|---|
| **Internal name** | `company_name` |
| **Stored** | Yes |
| **Editable** | Yes |
| **Type** | Text |

The full company name. Purely informational — not used in any calculation. Can be left blank; ticker is the required identifier.

---

## Ticker

| | |
|---|---|
| **Internal name** | `ticker` |
| **Stored** | Yes |
| **Editable** | Yes |
| **Type** | Text (normalised to uppercase on save) |

The exchange ticker symbol (e.g. `AAPL`, `TSLA`, `MSFT`). Used to look up the current price from Yahoo Finance. Must match Yahoo Finance's symbol exactly. International tickers use Yahoo Finance suffix notation (e.g. `CBA.AX` for ASX-listed Commonwealth Bank) — but note that multi-currency display is not supported; all values are treated as USD.

Rows with an empty ticker are silently dropped on save.

---

## Shares

| | |
|---|---|
| **Internal name** | `shares_owned` |
| **Stored** | Yes |
| **Editable** | Yes |
| **Type** | Float (supports fractional shares) |
| **Min** | 0 |

The number of shares held. Fractional shares are supported (e.g. `1.5`).

---

## Avg Price

| | |
|---|---|
| **Internal name** | `avg_price` |
| **Stored** | Yes |
| **Editable** | Yes |
| **Type** | Float, displayed as `$X.XX` |
| **Min** | 0 |

The average price paid per share across all purchases of this holding. For a single purchase this is simply the purchase price. For multiple purchases, compute the weighted average manually and enter the result.

---

## Fees

| | |
|---|---|
| **Internal name** | `fees` |
| **Stored** | Yes |
| **Editable** | Yes |
| **Type** | Float, displayed as `$X.XX` |
| **Min** | 0 |

Total brokerage or transaction fees paid to open this position (across all purchases). Included in `Total Cost` so that P&L reflects actual capital deployed.

---

## Current Price

| | |
|---|---|
| **Internal name** | `current_price` |
| **Stored** | No |
| **Editable** | No (read-only) |
| **Type** | Float, displayed as `$X.XX` |
| **Source** | `yfinance` — `Ticker.fast_info.last_price` |

The last traded price from Yahoo Finance. Cached for 30 seconds; refreshed automatically via the auto-refresh cycle. Displays `$0.00` if the ticker is invalid or the fetch fails.

---

## Total Cost

| | |
|---|---|
| **Internal name** | `total_cost` |
| **Stored** | No |
| **Editable** | No (read-only) |
| **Formula** | `(avg_price × shares_owned) + fees` |
| **Type** | Float, displayed as `$X.XX` |

The total amount of capital deployed into this position, including brokerage fees.

---

## Market Value

| | |
|---|---|
| **Internal name** | `market_value` |
| **Stored** | No |
| **Editable** | No (read-only) |
| **Formula** | `shares_owned × current_price` |
| **Type** | Float, displayed as `$X.XX` |

The current market value of the position at the live price.

---

## Unrealized P/L

| | |
|---|---|
| **Internal name** | `unrealized_pl` |
| **Stored** | No |
| **Editable** | No (read-only) |
| **Formula** | `market_value − total_cost` |
| **Type** | Float, displayed as `$X.XX` (sign shown) |

Profit or loss if the position were closed at the current price. Positive = gain, negative = loss. Called "unrealized" because the position has not been sold.
