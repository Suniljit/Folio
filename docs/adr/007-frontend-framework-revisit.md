# ADR 007 — Frontend Framework Revisit

**Status:** Accepted
**Supersedes:** [ADR 001](001-frontend-framework.md)

## Context

A new visual design for Folio (a dark, glassmorphic dashboard with gold hairline borders, blurred translucent stat cards, and a plain-text-until-focused editable table) needed to be implemented pixel-accurately.

Streamlit's `st.data_editor` — the component ADR-001 relied on for inline table editing — renders its grid via `glide-data-grid`, a canvas-based component. Canvas rendering cannot be styled per-cell with CSS: fonts, colors, borders, and hover states per column are fixed by the component, not overridable from application code. The new design specifically requires transparent inline inputs, gold ticker text, tabular-nums figures, and custom row separators — none of which are achievable on top of `st.data_editor`.

Rather than ship a rough approximation, the decision was made to migrate off Streamlit entirely.

## Decision

**Use a FastAPI JSON API backend with a React + Vite (TypeScript) single-page frontend.**

The backend (`backend/`) wraps the existing SQLModel/Alembic persistence layer (unchanged — see [ADR 002](002-data-storage.md) and [ADR 006](006-orm.md)) and the existing yfinance price-fetching logic (unchanged — see [ADR 003](003-price-data-source.md)) behind two endpoints: `GET /api/holdings` and `POST /api/holdings`. Computed columns (`current_price`, `total_cost`, `market_value`, `unrealized_pl`, and portfolio totals) are computed server-side in the API layer, matching the formulas previously computed in `app.py`.

The frontend (`frontend/`) is a plain-CSS React SPA — no component framework (Tailwind, MUI, etc.), since the design's precise oklch color values and backdrop-filter blur effects are fully custom and would fight against a framework's own styling opinions. It fetches `GET /api/holdings` on load and every 30 seconds, tracks local edit state independently of the last-fetched server state, and calls `POST /api/holdings` on explicit save.

For day-to-day use, FastAPI serves the built frontend (`frontend/dist/`) as static files, so `uv run uvicorn backend.main:app` remains a single command that runs the whole app — preserving the one-command convenience `streamlit run app.py` had.

## Alternatives considered

**Stay on Streamlit, style what's stylable**

Restyle the page background, metric cards, and buttons via CSS injection, and accept `st.data_editor`'s native grid appearance for the table. Rejected because the table is the visual and functional centerpiece of the new design, and its styling (transparent inputs, gold ticker text) is exactly what canvas rendering blocks. The result would not match the approved design.

**FastAPI + Jinja2 + HTMX**

Server-rendered HTML with HTMX handling inline edits/add/delete/save via partial-page swaps. Would have achieved the same pixel-accurate CSS control with a smaller dependency footprint (no Node build step, no JS framework) and would have kept the project single-language. Not chosen — the user explicitly preferred a conventional SPA setup (FastAPI API + React/Vite) to leave room for future frontend growth.

## Consequences

- The project now has two toolchains (`uv`/Python for the backend, `npm`/Node for the frontend) instead of one. Day-to-day running is still one command; active frontend development requires two (`uv run uvicorn backend.main:app --reload` and `npm run dev` in `frontend/`, proxied via Vite's dev server config).
- **Auto-refresh mechanism changed but its semantics are preserved.** `streamlit-autorefresh` (ADR 004) is replaced by a `setInterval` in the React frontend that polls `GET /api/holdings` every 30 seconds. The 30-second interval and the "unsaved edits are cleared on refresh" behavior (ADR 005) are unchanged — the frontend tracks a `draftHoldings` (working copy) and `savedHoldings` (last server response) state pair, and on each poll tick, if they differ, the draft is discarded in favor of the fresh server response and a toast is shown ("Refreshed — unsaved edits cleared"). This is a client-side reimplementation of the same discard-on-refresh contract, not a new decision — ADR 004 and ADR 005 remain the record of *why* that contract exists.
- `pandas` is no longer a dependency — it was only used in `app.py` to build the `st.data_editor` DataFrame; the API layer computes and serializes rows directly as Pydantic models.
- ADR-002 (SQLite), ADR-003 (yfinance), ADR-005 (save strategy), and ADR-006 (SQLModel/Alembic) are unaffected by this change — only the frontend/API boundary changed.
