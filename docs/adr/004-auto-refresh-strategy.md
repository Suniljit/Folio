# ADR 004 — Auto-Refresh Strategy

**Status:** Accepted

## Context

Stock prices should update periodically without the user having to manually trigger a refresh. The refresh interval is 30 seconds (aligned with the `@st.cache_data(ttl=30)` price cache). The refresh must not make the page unresponsive while waiting.

## Decision

**Use `streamlit-autorefresh` (`st_autorefresh(interval=30_000)`).**

`streamlit-autorefresh` injects a JavaScript component into the page that uses `window.setTimeout` to post a rerun message to the Streamlit server after the configured interval. The Streamlit script thread is idle between reruns, so the UI remains fully interactive.

On each rerun, `app.py` re-reads holdings from SQLite and calls `_fetch_prices()`. Because `_fetch_prices` is decorated with `@st.cache_data(ttl=30)`, the two 30-second clocks are aligned: the auto-refresh fires approximately when the price cache expires, so each refresh cycle fetches genuinely fresh prices.

## Alternatives considered

**`time.sleep(30)` followed by `st.rerun()`**

Placing `time.sleep(30); st.rerun()` at the end of `app.py` would also trigger a rerun every 30 seconds. Rejected because:
- During the sleep, Streamlit's script thread is blocked. In Streamlit's threading model, a blocked script thread means the session cannot process new user interactions (button clicks, cell edits) until the sleep ends
- This produces a 30-second window during which the page appears rendered but is actually frozen

**Manual "Refresh Prices" button**

A button the user clicks to fetch the latest prices. Rejected as the primary mechanism because:
- Requires active user attention; prices go stale if the user forgets to refresh
- The user asked explicitly for automatic refresh

A manual refresh is implicitly available via **Save Changes** (which clears the price cache and triggers `st.rerun()`), but is not the primary refresh path.

## Consequences

- `streamlit-autorefresh` is a third-party dependency, though small and stable
- The JS-triggered rerun re-executes the entire Streamlit script, which re-reads SQLite and rebuilds the DataFrame. This means **unsaved edits in `st.data_editor` are cleared on every auto-refresh** (see [ADR 005](005-save-strategy.md))
- The refresh interval and cache TTL are both 30 seconds. If the JS timer drifts slightly, a rerun may hit the cache before it expires and show prices from the previous cycle. This is acceptable drift for a personal tracker
