# ADR 009 — Electron for macOS packaging over Tauri or native Swift

**Status:** Accepted

## Context

Folio ran as a manually-launched local server (`uv run uvicorn backend.main:app`), opened in a browser tab. The user wanted a real double-clickable macOS app instead.

Three options were considered for the native shell: Electron, Tauri, and a native Swift/SwiftUI rewrite.

## Decision

**Electron**, wrapping the existing FastAPI backend and React/Vite frontend unchanged, with the backend spawned as a child process.

- **Swift/SwiftUI** was rejected outright — it would mean rewriting the frontend (and likely reimplementing API logic in Swift too), discarding the entire React/Tailwind/shadcn frontend (see [ADR 007](007-frontend-framework-revisit.md), [ADR 008](008-adopt-shadcn-tailwind.md)) and the FastAPI backend for no functional gain. This is a full-app rewrite, not a packaging change.
- **Tauri** would require the same "spawn Python as a sidecar process" approach as Electron, but with a less mature ecosystem around managing long-running Python sidecars from Rust. Electron's `child_process` + Node.js tooling for this pattern is significantly more established. Given the user wants to keep 100% of the existing stack, Electron's maturity here outweighs Tauri's smaller binary size.

## Implementation

- **`backend/run_server.py`** — new thin entry point (`uvicorn.run(app, ...)`, reading `FOLIO_PORT` from env) used as the PyInstaller target. `backend/main.py` itself gained no `uvicorn.run()` call, so `uv run uvicorn backend.main:app` (the existing dev/prod command) is untouched.
- **`backend/db.py`** — `DB_PATH` now reads `FOLIO_DATA_DIR` from the environment if set (pointing at Electron's `app.getPath('userData')`, i.e. `~/Library/Application Support/Folio/`), else falls back to the original repo-root-relative path. Default behavior when the env var is unset is unchanged.
- **PyInstaller, one-folder (`--onedir`) build**, not `--onefile`. One-folder starts faster (no self-extraction to a temp dir on every launch) and lets `backend/alembic/` + `backend/alembic.ini` ship as real files via `datas=[...]` in `folio-backend.spec`, which `Path(__file__)`-relative lookups in `db.py`/`main.py` resolve against correctly inside the frozen bundle — confirmed empirically; no `hiddenimports` were needed.
- **`electron/main.js`** — spawns the backend (dev: `uv run uvicorn --reload`; prod: the frozen `folio-backend` binary bundled via electron-builder's `extraResources`), polls a new `GET /health` route until ready, then opens a `BrowserWindow`. Kills the backend child process on quit.
- **Root `package.json`** sets `"productName": "Folio"` — this is what Electron's `app.getPath('userData')` actually keys off (not electron-builder.yml's `productName`), so it must be set at the package.json top level or the app data lands under the package `name` (`folio-electron`) instead.

## Consequences

- No signing or notarization: this is a personal-use app, confirmed with the user, so `electron-builder` produces an unsigned `.dmg`. First launch requires the standard Gatekeeper right-click → Open workaround (or `xattr -d com.apple.quarantine`). Revisit if the app is ever distributed to other machines — that requires a paid Apple Developer Program membership.
- The web-only path (`uv run uvicorn backend.main:app` + browser, or the two-terminal dev workflow) is fully preserved — the Electron shell is additive, spawning the same backend rather than replacing how it runs.
- Portfolio data now lives at `~/Library/Application Support/Folio/portfolio.db` when running as the packaged app, vs. the repo-root `portfolio.db` when running via `uv run uvicorn` directly — two independent databases depending on launch method. This is intentional (a packaged `.app` has no writable "repo root"), but worth knowing if switching between the two launch methods during development.
