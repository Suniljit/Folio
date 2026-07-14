# User Guide

## Installing the macOS app

1. Open the built `.dmg` (see [README.md](../README.md#macos-desktop-app) for how to build it) and drag **Folio** into Applications.
2. On first launch, macOS Gatekeeper will block the app since it isn't signed (personal-use build, no Apple Developer account). Right-click **Folio** and choose **Open**, then confirm — this is only needed once.
3. Data is stored at `~/Library/Application Support/Folio/portfolio.db`, separate from the repo-root `portfolio.db` used by the `uv run uvicorn` web path. Quitting the app also stops its backend automatically — no manual server management needed.

---

## Starting the app

```bash
uv run uvicorn backend.main:app
```

Opens at `http://localhost:8000`. This serves both the API and the built frontend — you need to have run `npm run build` in `frontend/` at least once (see [README.md](../README.md) for the full setup).

For active frontend development, run two servers instead: `uv run uvicorn backend.main:app --reload --port 8000` and, in a second terminal, `npm run dev` inside `frontend/` (opens at `http://localhost:5173`, proxying API calls to the backend).

---

## Adding a holding

1. Scroll to the bottom of the table.
2. Click the **+ Add holding** button below the last row — this opens the **Add Holding** dialog.
3. Fill in **Company**, **Ticker**, **Shares**, **Avg Price**, and **Fees**. Company and Ticker are required; the dialog shows an inline error if either is left blank.
4. Click **Add Holding** in the dialog to add the row to the table (or **Cancel** / click outside the dialog to discard it).
5. Click **Save Changes** to persist the new row.

The calculated columns (**Current Price**, **Total Cost**, **Market Value**, **Unrealized P/L**) will populate after saving with fresh prices from the server.

---

## Editing a holding

1. Click any cell in the editable columns (Company, Ticker, Shares, Avg Price, Fees) — it becomes a plain text input.
2. Type the new value and click elsewhere to confirm.
3. Click **Save Changes** to persist the edit to the database.

Calculated columns are read-only and cannot be edited.

---

## Deleting a holding

1. Click the **×** button at the right of the row you want to remove.
2. Click **Save Changes** to commit the deletion.

---

## Understanding the summary cards

Three stat cards appear above the table:

| Card | Meaning |
|------|---------|
| **Market Value** | Sum of `shares × current price` across all holdings |
| **Total Cost** | Sum of `(avg price × shares) + fees` across all holdings |
| **Unrealized P/L** | Difference between Market Value and Total Cost (green = gain, red = loss) |

---

## Price refresh

Prices update automatically every **30 seconds**. A small toast notification appears bottom-right of the dashboard on each save, and also whenever an auto-refresh discards unsaved edits (see below).

You can also trigger an immediate price update by clicking **Save Changes** — the save endpoint clears the server-side price cache and returns fresh prices in its response.

---

## Known limitations

**Unsaved edits are cleared on auto-refresh.**
If you are mid-edit when the 30-second refresh fires, any changes not yet saved will be lost — a toast reading *"Refreshed — unsaved edits cleared"* confirms this happened. Save frequently, especially during active editing.

**Prices show $0.00 for invalid tickers.**
If a ticker is misspelled or not found on Yahoo Finance, `current_price` displays `$0.00` and a warning is logged server-side. Market Value and P/L for that row will also be `$0.00`.

**Outside market hours.**
`current_price` reflects the last traded price, which is the prior session's close when the market is closed. The value is real — just not intraday.

**Single currency only.**
All values are displayed in USD. International tickers (e.g. `CBA.AX`) return prices in their native currency without conversion. Mixing currencies will produce incorrect totals.

**No trade history.**
The app tracks current holdings only. There is no log of past trades or realised P/L.
