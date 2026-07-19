# ADR 013 — Per-Item CRUD Endpoints and Field Validation

**Status:** Accepted
**Supersedes:** [ADR 005](005-save-strategy.md) (save mechanics only; the "warn on stale refresh" intent behind ADR 004/005 is not revisited here)
**Corrects:** A claim in [ADR 007](007-frontend-framework-revisit.md)'s Consequences section — see below

## Context

Holdings and option trades were only validated for a non-empty `ticker` (and `company_name`/`origin`), both client- and server-side. Every other field (share counts, prices, dates, strike, contracts, etc.) accepted any value, including blank input, which the frontend silently coerced to `0` via `parseFloat(...) || 0`. This allowed economically meaningless rows (e.g. a holding with 0 shares, an option with no expiration date) to be saved with no feedback to the user.

Adding real validation meant deciding what happens when one row in a save fails. The existing save endpoints (`POST /api/holdings`, `POST /api/options-trades`) replace the *entire* table on every save (delete-all + insert-all, per ADR 005), because the original Streamlit `st.data_editor` returned its whole grid state on every interaction. The current React frontend no longer works that way: `App.tsx` already builds one full updated array per single add/edit/delete action and POSTs the whole thing immediately — there is no batched multi-row edit UI. Full-list replace was therefore solving a problem (diffing a multi-row editable grid) that no longer exists, while adding a real one: a validation failure on any row, even one unrelated to what the user just changed, would reject the entire list and silently discard IDs on every successful save (since delete + re-insert assigns new autoincrement IDs each time).

**Correction to ADR 007:** ADR 007's Consequences section states the frontend "tracks a `draftHoldings` (working copy) and `savedHoldings` (last server response) state pair" and discards unsaved edits with a toast on each 30s poll tick. This does not match the current `App.tsx` — there is a single `holdings`/`optionTrades` state, no draft/saved pair, and the poll simply skips entirely while a modal is open (`if (modalOpenRef.current) return`). This ADR does not attempt to reconcile that documentation; it's noted here so the discrepancy isn't mistaken for a new decision, and is left as a follow-up doc fix.

## Decision

**Replace the full-list-replace endpoints with per-item REST endpoints**, and validate every field server-side (Pydantic) and client-side (inline per-field errors), with no silent coercion of invalid/blank input.

- `POST /api/holdings`, `PUT /api/holdings/{id}`, `DELETE /api/holdings/{id}`
- `POST /api/options-trades`, `PUT /api/options-trades/{id}`, `DELETE /api/options-trades/{id}`

Row IDs are now stable identifiers across the row's lifetime, not regenerated on every save.

A save request is rejected outright (422, nothing persisted) if the single row it describes fails validation — there is no partial-batch case to design for, since each request now describes exactly one row.

Existing rows in `portfolio.db` that violate the new rules are left as-is; validation applies only to future create/edit requests. No backfill or migration of existing data was performed.

## Consequences

- The frontend no longer builds a full updated array to send on every action; each add/edit/delete becomes a single targeted request.
- ADR 005's "explicit Save button, full delete+insert" mechanics no longer apply — there is no batched editable grid to save. The underlying reason ADR 004/005 exist (warn the user before discarding unsaved work on refresh) is unaffected, since the poll already skips refresh while a modal is open.
- Error responses use FastAPI's default `422 {detail: [{loc, msg, type}]}` shape; the frontend maps `loc` to the corresponding form field to render inline errors, rather than a custom error contract.
