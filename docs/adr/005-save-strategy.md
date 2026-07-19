# ADR 005 — Save Strategy

**Status:** Superseded by [ADR 013](013-per-item-crud-and-field-validation.md) (save mechanics only)

## Context

The app uses `st.data_editor` for inline table editing. Streamlit's execution model runs the entire script on every interaction, which means any change that triggers a rerun could overwrite unsaved edits if the table is re-initialised from the database. A save strategy must balance data safety against friction.

## Decision

**Use an explicit "Save Changes" button.**

The user makes edits to the table and then clicks **Save Changes** to persist them. No write to SQLite happens until the button is pressed.

On button press, `app.py`:
1. Reads the current state of `edited_df` returned by `st.data_editor`
2. Filters out rows with an empty ticker
3. Calls `save_holdings(rows)` — full DELETE + INSERT in a single transaction
4. Clears the price cache (`_fetch_prices.clear()`)
5. Calls `st.rerun()` to reload from the now-updated database

## Alternatives considered

**Auto-save on every cell edit**

Writing to SQLite immediately on any change to `edited_df`. Rejected because:
- `st.data_editor` returns its full state on every rerun, not just on explicit edits. Distinguishing a deliberate user change from a rerun-triggered state snapshot requires diffing, adding complexity
- A typo mid-edit would be immediately persisted with no opportunity to undo
- Calling `st.rerun()` after every write would interfere with the user's active edit session

**Auto-save on blur (when the user clicks away from a cell)**

Streamlit does not expose a cell-blur event. Not implementable without custom JavaScript.

## Consequences

- The user must remember to click **Save Changes** before the 30-second auto-refresh fires. If they do not, unsaved edits are cleared because the rerun re-reads from SQLite (which still holds the old data)
- A caption in the UI warns: *"Prices refresh every 30s. Unsaved edits are cleared on refresh — save first."*
- The explicit save creates a clear, predictable moment when data is committed; there is no ambiguity about whether an edit has been persisted
- Deleting a row also requires a Save to take effect, which acts as an accidental-deletion guard
