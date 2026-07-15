# ADR 010 — Options Pricing Data Source

**Status:** Accepted

## Context

The Options Trades tab needed a live mark price per open position to compute P/L Open, % P/L, Total P/L, and ROI (previously deferred — see `docs/data-model.md`). Requirements mirror ADR 003's stock-price requirements:
- No mandatory API key
- Free tier adequate for a personal tracker refreshing every 30 seconds
- Look up a price by ticker + expiration date + strike + option type (call/put)

## Decision

**Use yfinance's `Ticker(ticker).option_chain(expiration_date)`.**

This returns a namedtuple of `calls`/`puts` DataFrames for a given expiration, each row keyed by `strike` with a `lastPrice` column. `backend/option_prices.py` looks up the row matching the stored `strike` in the `calls` or `puts` frame (based on the stored `option_type`) and returns `lastPrice`, falling back to `0.0` on any failure (unknown ticker, no matching expiration/strike, network error) — the same fail-soft behavior as `fetch_prices()` in `backend/prices.py`.

Results are cached in-process for 30 seconds, keyed by `(ticker, expiration_date, strike, option_type)`, following the exact pattern of `_cached_prices` in `backend/api/holdings.py`. The cache is cleared on every `POST /api/options-trades` save.

## Alternatives considered

**Parsing option type from the free-text `strategy` field**

Rejected — `strategy` is an unconstrained string (e.g. "CSP", "Covered Call") with no guaranteed vocabulary, so reliably inferring call vs. put from it would be fragile. A dedicated `option_type` field was added to the schema instead.

**A dedicated options-data provider (e.g. Tradier, CBOE DataShop, Polygon options endpoints)**

Rejected for the same reasons as ADR 003 rejected paid stock-price providers: registration friction, API keys, and rate limits that aren't justified for a personal tracker polling every 30 seconds. Since yfinance is already a dependency for stock prices, reusing it for options avoids a second data source entirely.

## Consequences

- `option_chain()` only returns data for currently-listed expirations. This is fine for open positions (which by definition have a not-yet-passed expiration) but means the mark price silently becomes unavailable (`0.0`) the moment a contract expires or is delisted from the chain.
- `lastPrice` reflects the last trade, which can be stale for illiquid contracts with wide bid/ask spreads — there is no bid/ask midpoint fallback in this implementation.
- Each unique `(ticker, expiration_date)` pair requires a separate network call beyond the existing stock-price fetch, so a portfolio with many distinct expirations makes more yfinance calls per refresh cycle than the stock holdings tab does. The 30-second cache bounds this the same way it bounds stock price polling.
- Inherits the same undocumented-API fragility as ADR 003: yfinance wraps Yahoo Finance's internal endpoints, which can change without notice.
