# ADR 011 — IBKR as Options Pricing Source

**Status:** Accepted

## Context

[ADR 010](010-options-pricing-source.md) chose yfinance's `option_chain()` for options mark prices, prioritizing zero setup friction over data quality. In practice, `lastPrice` (last-traded, not bid/ask) is frequently stale for options — many contracts trade infrequently, so the "current" price shown can lag the real market by hours.

The user has an Interactive Brokers (IBKR) account, runs TWS locally on their Mac, and already holds a real-time OPRA (US options) market-data subscription. IBKR's API, accessed locally via `ib_async`, can supply a live bid/ask for any held contract — a materially better mark price than yfinance's last trade.

Requirements:
- Live bid/ask-quality pricing for open options positions only (stock holdings prices are unaffected and stay on yfinance — not the reported problem)
- Must not crash or block the UI when TWS isn't running; fail soft like the existing yfinance path
- Must surface *when* pricing is degraded (IBKR unreachable), rather than silently showing the same `0.0` used for "no data found"

## Decision

**Use `ib_async` to connect to a locally-running TWS instance over a socket (`127.0.0.1:7496` by default, for TWS live trading), and use the live bid/ask midpoint as the mark price.**

`backend/ibkr_client.py` owns a single, process-lifetime `IB()` connection (TWS allows one connection per host/port/clientId; reconnecting per-request would add latency and risk races). `ensure_connected()` connects lazily on first use and is safe to call repeatedly. `fetch_option_mark()` builds an `Option` contract from the stored `ticker`/`expiration_date`/`strike`/`option_type`, qualifies it, requests a market-data snapshot via `reqTickersAsync`, and resolves a price: bid/ask midpoint if both are valid, else last trade, else previous close. It returns `None` (not `0.0`) on any failure — connection down, contract not found, no market data — which lets the caller distinguish "no data" from "genuinely zero."

`backend/api/options_trades.py`'s routes became `async def` so `ib_async`'s asyncio-native API (`connectAsync`, `qualifyContractsAsync`, `reqTickersAsync`) runs directly on FastAPI's event loop. This avoids a real pitfall: FastAPI executes sync (`def`) routes in a worker threadpool, and a persistent asyncio-based client accessed from arbitrary threadpool threads would fight over which event loop owns its connection.

`OptionTradesResponse` gained a top-level `ibkr_connected: bool` field (one flag for the whole payload, not per-row — the connection is a single shared resource). The frontend renders a small status banner above the Options Trades table when it's `false`; individual rows still show `0.0` for `current_price` in that case, matching the pre-existing fail-soft behavior for "no data."

The existing 30-second price cache (`backend/api/options_trades.py::_cached_option_price`) is kept, with one addition: a failed/`None` lookup is cached for only 5 seconds, so a TWS restart is picked up quickly without hammering the connection on every request while it's down.

Setup instructions for the TWS side (enabling API access, ports, market-data subscription, auto-logoff behavior) are documented separately in [`docs/ibkr-tws-setup.md`](../ibkr-tws-setup.md) since they're operational, not architectural.

## Alternatives considered

**Per-request connect/disconnect**

Rejected — TWS's connection handshake adds latency on every cache-miss fetch, and concurrent requests (e.g. two browser tabs) racing to connect/disconnect risks transient "already connected" errors. A single long-lived connection, guarded by a lock during the initial connect, avoids both.

**Falling back to yfinance when IBKR is unreachable**

Considered, but rejected per explicit user preference: the user wants a clear signal that IBKR is down (via `ibkr_connected: false`) rather than a silent, unannounced switch to a different, less-trusted data source.

**A dedicated options-data vendor (Tradier, Polygon, etc.)**

Already rejected in ADR 010 for registration/API-key friction; still holds. IBKR access via `ib_async` requires no new external account since the user is already an IBKR client.

## Consequences

- Options pricing now depends on TWS (or IB Gateway) being open and logged in on the same machine as the Folio backend. This is a new operational dependency that yfinance never had — see [`docs/ibkr-tws-setup.md`](../ibkr-tws-setup.md) for what the user needs to keep running.
- TWS auto-logs-off periodically (daily, by default); Folio will report `ibkr_connected: false` and show `0.0` prices until the user reopens/re-logs-in to TWS. This is a real, expected gap in coverage, not a bug.
- Stock holdings pricing (`backend/prices.py`) is untouched and remains on yfinance — this ADR only concerns `backend/api/options_trades.py`.
- For the packaged Electron app, TWS remains an entirely separate, user-launched application; Electron does not manage its lifecycle, matching the existing pattern where `FOLIO_DATA_DIR`/`FOLIO_PORT` are the only env vars Electron threads through to the backend (now joined by `FOLIO_IBKR_HOST`/`FOLIO_IBKR_PORT`/`FOLIO_IBKR_CLIENT_ID`).
- The bid/ask-midpoint choice is a simplification of what TWS itself sometimes computes as "mark" (which can blend in a theoretical/model price for illiquid contracts); this is a documented, intentional trade-off for simplicity, not a limitation to fix later.
