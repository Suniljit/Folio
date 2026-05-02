# ADR 002 — Data Storage

**Status:** Accepted

## Context

Portfolio data (company name, ticker, shares, average price, fees) must survive application restarts. The data set is small (tens of rows at most). There is one user; no concurrent writes are expected. Setup should require zero external infrastructure.

## Decision

**Use SQLite via Python's built-in `sqlite3` module.**

A single `portfolio.db` file at the project root stores the `holdings` table. No ORM is used — queries are plain SQL strings, keeping the dependency count low and the code transparent.

The save operation is a full replace (DELETE all + INSERT all) rather than individual UPDATE/INSERT/DELETE statements. This is safe because:
- The dataset is tiny (millisecond round-trip even for hundreds of rows)
- It avoids row-level diffing logic
- The entire operation runs in a single transaction, so a failed save leaves the DB unchanged

## Alternatives considered

**CSV or JSON file**

A flat file is even simpler to inspect by hand. Rejected because:
- No atomic writes — a crash mid-write corrupts the file
- No query capability if filtering or sorting is added later
- `sqlite3` is built into Python; there is no incremental cost

**In-memory (Streamlit session state only)**

Storing holdings in `st.session_state` requires no file I/O. Rejected because:
- Data is lost on every app restart
- Not viable for a tool meant for ongoing portfolio tracking

**PostgreSQL or another server-based database**

Adds operational overhead (running a DB server, connection strings, migrations). Rejected outright for a single-user local tool.

## Consequences

- `portfolio.db` is created automatically on first run via `CREATE TABLE IF NOT EXISTS`; no migration step is needed
- The full-replace save pattern means row IDs change on every save; IDs are not exposed in the UI and carry no semantic meaning
- SQLite has no row-level locking; opening two browser sessions simultaneously and saving from both will produce a race condition. Acceptable given the single-user scope
- The database file should be added to `.gitignore` to avoid committing personal financial data
