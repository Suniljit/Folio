# Option trade direction (long/short) and corrected P&L sign

All option P&L formulas assumed a long/debit position (`pl_open = (current_price - entry_price) * 100 * contracts`), which is wrong for short/credit positions (e.g. a sold put) — profit should accrue as price *falls*, not rises. There was no field to express direction; `docs/data-model.md` claimed `contracts` was "signed (negative for short positions)" as the intended mechanism, but that convention was never implemented in the UI and, when traced through, breaks `pct_pl` (a negative `entry_value` flips its sign incorrectly).

Decision: add an explicit `direction: "long" | "short"` field to `OptionTrade`, required on entry with no default (forces a deliberate choice each time). `contracts` becomes a plain positive magnitude; `direction` is now the sole source of sign in derived calculations. Only `pl_open`'s formula branches on direction — `entry_value`, `pct_pl`, `total_pl`, and `roi` keep their existing structure.

## Considered Options

- **Signed `contracts`** (the original documented intent) — rejected: conflates "how many contracts" with "which side of the trade," and breaks `pct_pl` as shown above.
- **"Buy/Sell" naming** — rejected in favor of "Long/Short": buy/sell describes the one-time trade action, but the field needs to describe the ongoing economic exposure of the position.

## Consequences

Existing rows in `portfolio.db` predate this field and are migrated with `direction = "short"` (the user's actual primary usage — selling puts), not `"long"`. This silently changes the *displayed* P&L for any historical row that was genuinely a long trade; there's no way to distinguish those without manual review.
