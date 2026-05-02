# User Guide

## Starting the app

```bash
uv run streamlit run app.py
```

Opens at `http://localhost:8501`.

---

## Adding a holding

1. Scroll to the bottom of the table.
2. Click the **+ Add row** button that appears below the last row.
3. Fill in the editable columns: **Company**, **Ticker**, **Shares**, **Avg Price**, **Fees**.
4. Click **Save Changes**.

The calculated columns (**Current Price**, **Total Cost**, **Market Value**, **Unrealized P/L**) will populate after saving and the page reruns with fresh prices.

---

## Editing a holding

1. Click any cell in the editable columns (Company, Ticker, Shares, Avg Price, Fees).
2. Type the new value and press **Enter** or click away to confirm.
3. Click **Save Changes** to persist the edit to the database.

Calculated columns are read-only and cannot be edited.

---

## Deleting a holding

1. Hover over the row you want to remove.
2. Click the **trash icon** that appears on the left side of the row.
3. Click **Save Changes** to commit the deletion.

---

## Understanding the summary cards

Three metric cards appear above the table:

| Card | Meaning |
|------|---------|
| **Market Value** | Sum of `shares × current price` across all holdings |
| **Total Cost** | Sum of `(avg price × shares) + fees` across all holdings |
| **Unrealized P/L** | Difference between Market Value and Total Cost (green = gain, red = loss) |

---

## Price refresh

Prices update automatically every **30 seconds**. A countdown is not shown, but the `st_autorefresh` component runs silently in the background.

You can also trigger an immediate price update by clicking **Save Changes** — the save flow clears the price cache and forces a fresh fetch on the subsequent rerun.

---

## Known limitations

**Unsaved edits are cleared on auto-refresh.**
If you are mid-edit when the 30-second refresh fires, any changes not yet saved will be lost. Save frequently, especially during active editing.

**Prices show $0.00 for invalid tickers.**
If a ticker is misspelled or not found on Yahoo Finance, `current_price` displays `$0.00` and a warning is logged to the terminal. Market Value and P/L for that row will also be `$0.00`.

**Outside market hours.**
`current_price` reflects the last traded price, which is the prior session's close when the market is closed. The value is real — just not intraday.

**Single currency only.**
All values are displayed in USD. International tickers (e.g. `CBA.AX`) return prices in their native currency without conversion. Mixing currencies will produce incorrect totals.

**No trade history.**
The app tracks current holdings only. There is no log of past trades or realised P/L.
