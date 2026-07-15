# IBKR TWS Setup for Options Pricing

Folio fetches live options mark prices from Interactive Brokers via a local socket connection to Trader Workstation (TWS). TWS must be running and logged in on the same Mac as the Folio backend whenever you want fresh options prices. This doc covers the one-time setup and what to expect day to day. The architectural rationale is in [ADR 011](adr/011-ibkr-options-pricing.md).

## One-time setup

1. **Install and log in to TWS** on your Mac (native Apple Silicon/Intel build), using either your live or paper trading account.

2. **Enable API access.** In TWS: `Global Configuration → API → Settings`
   - Check **"Enable ActiveX and Socket Clients"**.
   - Leave **"Read-Only API"** checked — Folio only reads market data and never places trades.
   - If prompted for a trusted IP list, add `127.0.0.1`.

3. **Confirm the port.** TWS listens on different ports depending on account type:

   | Client | Live | Paper |
   |---|---|---|
   | TWS | 7496 | 7497 |
   | IB Gateway | 4001 | 4002 |

   Folio defaults to port `7496` (TWS live). If you trade paper or use IB Gateway instead, set `FOLIO_IBKR_PORT` to match (see Configuration below).

4. **Confirm your options market-data subscription.** Real-time OPRA (US options) quotes require:
   - A market-data subscription on your account (`Account Management → Market Data Subscriptions`).
   - The **Market Data API Acknowledgement** form signed (also under Account Management) — without it, API requests for options quotes fail even if you're subscribed in the TWS UI.

## Configuration

Folio reads these environment variables (all optional, with sensible defaults for a local live-trading TWS setup). Copy [`.env.example`](../.env.example) to `.env` and adjust as needed, then export the values into your shell before running the backend — the app does not load `.env` files automatically.

| Variable | Default | Purpose |
|---|---|---|
| `FOLIO_IBKR_HOST` | `127.0.0.1` | Host TWS/Gateway is listening on |
| `FOLIO_IBKR_PORT` | `7496` | Port — see table above |
| `FOLIO_IBKR_CLIENT_ID` | `17` | Unique client ID; change this if you run other scripts/apps against the same TWS instance at the same time, since each API client needs a distinct ID |

## Day-to-day behavior

- TWS **auto-logs-off periodically** (by default, around 11:45pm ET daily, and after a period of client inactivity depending on your settings). While TWS is closed or logged out, Folio's Options Trades tab will show an "IBKR not connected" banner and options prices will read `0.0` until TWS is reopened and logged back in — this is expected, not a bug.
- Prices are cached for 30 seconds per contract, so reopening the app or switching tabs won't trigger a fresh IBKR round-trip on every render.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "IBKR not connected" banner, always shown | TWS isn't running, "Enable ActiveX and Socket Clients" isn't checked, or `FOLIO_IBKR_PORT` doesn't match TWS's actual port (check live vs. paper) |
| Connects, but prices are always `0.0` | Contract couldn't be qualified — check that ticker/strike/expiration/option type exactly match a listed contract |
| Connects, but errors mention market data permissions | OPRA options subscription not active, or the Market Data API Acknowledgement form hasn't been signed in Account Management |
| Works, then stops later in the day | TWS auto-logged off — reopen and log back in |
| TWS pops up "An API client is attempting to send a request that needs API write access" | Expected on first connect if you've previously clicked through it — Folio connects read-only (it never places or manages orders) and should not need write access. If this recurs, confirm you're on an up-to-date `ib_async` version and that no other write-requiring API client shares your `FOLIO_IBKR_CLIENT_ID` |
