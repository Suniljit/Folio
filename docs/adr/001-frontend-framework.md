# ADR 001 — Frontend Framework

**Status:** Superseded by [ADR 007](007-frontend-framework-revisit.md)

## Context

The app needs a UI that can:
- Display a table of holdings with editable cells
- Show read-only calculated columns alongside editable ones
- Support adding and deleting rows inline
- Auto-refresh prices without a full page navigation

The project is a single-user personal tool with no need for public hosting, user authentication, or complex UI interactions beyond table editing.

## Decision

**Use Streamlit.**

Streamlit lets you build the entire app in Python, including the interactive table (`st.data_editor`), metric cards (`st.metric`), and auto-refresh (`streamlit-autorefresh`). There is no JavaScript to write and no API layer to define.

`st.data_editor` with `num_rows="dynamic"` provides inline row add/delete and per-column editability control (`disabled=True` for calculated columns) out of the box.

## Alternatives considered

**React + FastAPI**

A React frontend with ag-Grid for the editable table and a FastAPI backend serving a REST API would give more control over layout and interactivity. Rejected because:
- Requires maintaining two separate codebases (Python backend, JS frontend)
- The REST API surface (GET/POST/PUT/DELETE on `/portfolio`) adds boilerplate with no payoff for a single-user tool
- ag-Grid table editing is more capable but the added complexity is unnecessary

**Rich / terminal table (CLI)**

A terminal UI using the `rich` library with keyboard navigation. Rejected because:
- No browser-based access
- Editing inline in a terminal table is awkward (arrow-key navigation, modal input)
- Harder to display colour-coded P/L visually

## Consequences

- The entire app is a single Python file (`app.py`) plus two utility modules
- Streamlit's execution model (full script re-run on every interaction) constrains some design choices — in particular, unsaved edits in `st.data_editor` are lost when the page reruns (see [ADR 004](004-auto-refresh-strategy.md) and [ADR 005](005-save-strategy.md))
- Upgrading Streamlit may require adjustments to `st.data_editor` column config API
