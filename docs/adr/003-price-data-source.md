# ADR 003 — Price Data Source

**Status:** Accepted

## Context

The app needs current stock prices for all held tickers. Requirements:
- Works for common US equities and ETFs
- No mandatory API key (lower friction to set up)
- Free tier adequate for a personal tracker refreshing every 30 seconds
- Prices should reflect the current trading session, not just end-of-day

## Decision

**Use yfinance (`yf.Ticker(t).fast_info.last_price`).**

yfinance wraps Yahoo Finance's undocumented API. No API key is required. `fast_info.last_price` returns the current last-traded price during market hours (or the prior session's close outside hours). For a personal tracker refreshing every 30 seconds, this is sufficient.

Prices are fetched per-ticker in a loop rather than using `yf.download()` (batch), because `fast_info` is lighter weight and more predictable for single-ticker lookups. Failures are caught per-ticker and fall back to `0.0`, so one bad ticker does not block the rest.

The fetch is wrapped in `@st.cache_data(ttl=30)` in `app.py`, keyed by a sorted tuple of tickers. This ensures Yahoo Finance is contacted at most once per 30-second window regardless of how many Streamlit reruns occur.

## Alternatives considered

**Finnhub (free API key)**

Provides genuine real-time quotes and a websocket stream. Free tier allows 60 calls/minute. Rejected because:
- Requires free registration and an API key (environment variable setup)
- 60 calls/minute is only relevant if polling sub-second; at 30s intervals yfinance is fine
- Additional dependency on an external account

**Twelve Data (free API key)**

800 requests/day, 8/minute on the free tier. Similar to Finnhub but with tighter rate limits. Rejected for the same reasons, with the added concern that 800 requests/day could be exhausted quickly if the app is left running.

**Polygon.io**

Genuine real-time data with WebSocket streaming. Free tier is end-of-day only; real-time requires a paid plan. Rejected as overkill for a personal portfolio tracker.

## Consequences

- yfinance depends on Yahoo Finance's undocumented internal API, which has changed without notice in the past. If Yahoo Finance changes its response format, yfinance may break until a new version is released
- Rate limiting is informal; polling too aggressively (e.g. every few seconds for many tickers) risks IP-level throttling from Yahoo Finance. The 30-second cache mitigates this
- Prices shown outside market hours are the prior session's close, not a real-time quote. The UI does not currently indicate whether the market is open
- International tickers are supported by Yahoo Finance syntax (e.g. `CBA.AX`) but prices are returned in the ticker's native currency, not USD. The app does not perform currency conversion
