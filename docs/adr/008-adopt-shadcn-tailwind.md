# ADR 008 — Adopt Tailwind CSS + shadcn/ui

**Status:** Accepted
**Supersedes:** the styling clause of [ADR 007](007-frontend-framework-revisit.md) (its backend/API and SPA-vs-Streamlit decisions are unaffected)

## Context

ADR 007 deliberately rejected component frameworks (Tailwind, MUI) for the frontend, reasoning that the design's precise `oklch()` color values and `backdrop-filter` glassmorphism would "fight against a framework's own styling opinions."

That constraint held while the frontend was hand-rolled and small. Two things changed the calculus:

- **A concrete accessibility gap.** `AddHoldingModal.tsx` had no focus trap and no Escape-to-close — clicking the backdrop was the only way out besides the close button, and Tab could leave the dialog entirely. This is exactly the kind of correctness detail a hand-rolled modal is prone to missing.
- **shadcn/ui is not an opaque framework.** Its components are copied into the repo as editable source (`frontend/src/components/ui/`), built on unstyled Radix primitives. Tailwind v4's CSS-first `@theme` configuration lets the existing oklch tokens be hosted directly as the values behind shadcn's expected variable names (`--background`, `--primary`, `--card`, etc.), rather than replaced by a framework's own palette. This addresses ADR 007's specific objection — the framework's opinions become the app's own tokens, not a competing set of defaults.

## Decision

**Adopt Tailwind CSS v4 + shadcn/ui, with CSS variables mode, mapping the existing oklch palette into shadcn's theme tokens.**

Setup:
- `tailwindcss@4` + `@tailwindcss/vite`, no separate `tailwind.config.js` (v4 uses `@theme` in CSS).
- `@` → `src` path alias added to `vite.config.ts`, `tsconfig.json`, and `tsconfig.app.json` (shadcn CLI requires it).
- `frontend/src/styles/index.css` keeps the original `--color-*` oklch custom properties as the single source of truth, and maps shadcn's variable names onto them (e.g. `--primary: var(--color-gold)`, `--background: var(--color-bg)`). No `.dark` class or light theme was kept — Folio has one fixed dark theme, not a toggle.
- `backdrop-filter: blur(...)` isn't a theme token; each migrated component (`Dialog`, `Card`) reapplies it via a `backdrop-blur-md` utility class at its call site.
- A custom `gold` and `goldOutline` `Button` variant were added to the generated `button.tsx` (shadcn's default variants have no gold-accent look) to keep the existing button styling.

Components migrated, in order: `AddHoldingModal` → `Dialog` (fixes the focus-trap/Escape gap), `SaveButton`/`AddHoldingButton` → `Button`, `StatCards` → `Card`, `HoldingsTable`/`HoldingRow` → `Table` (was previously a CSS-grid layout, not a real `<table>`), `Toast` → `sonner` (shadcn's current recommendation; the old toast primitive is deprecated). Each phase kept `npm run build/lint/test` green and was checked visually against the pre-migration app.

## Alternatives considered

**Keep the custom CSS system, fix only the modal's accessibility gap**

Add a focus trap and Escape handler to the existing hand-rolled `AddHoldingModal` (or swap in only an unstyled `@radix-ui/react-dialog`, no Tailwind). Narrower change, no new styling dependency. Not chosen — the user explicitly wanted full consistency across the app, not a one-component patch, having weighed the tradeoffs of reversing ADR 007.

**Partial migration (Dialog only)**

Adopt Tailwind + shadcn but restrict it to the `Dialog`, leaving Button/Card/Table/Toast as hand-rolled CSS. Rejected for the same reason — it introduces the Tailwind dependency without getting the full-app consistency benefit the user asked for.

## Consequences

- New frontend dependencies: `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `radix-ui`, `sonner`, `tw-animate-css`.
- `frontend/src/styles/dashboard.css` shrank substantially — most layout/color rules for the modal, buttons, cards, and table are now Tailwind utility classes on shadcn components; only wrapper/panel-level rules (`.page`, `.dashboard`, `.holdings-panel`, `.modal-fields`, `.cell-input`, etc.) remain as plain CSS, since shadcn's primitives don't have an opinion on that content.
- `HoldingsTable`/`HoldingRow` changed from a CSS-grid layout to a real `<table>` (shadcn's `Table` wraps semantic table elements). Column widths are now set via an explicit `<colgroup>` instead of `grid-template-columns`.
- Toast usage changed from a controlled component (`<Toast message={toast} />` + local state) to `sonner`'s imperative `toast(...)` calls plus a single `<Toaster />` mounted once in `App.tsx`.
- Radix's `Dialog` renders into a portal (`document.body`), which changed how `AddHoldingModal.test.tsx` queries the DOM (role-based queries still work; container-scoped queries do not) and added a test for the new Escape-to-close behavior.
- ADR 002 (SQLite), ADR 003 (yfinance), ADR 005 (save strategy), ADR 006 (SQLModel/Alembic), and the SPA-vs-Streamlit decision in ADR 007 are unaffected — only the frontend's internal styling approach changed.
