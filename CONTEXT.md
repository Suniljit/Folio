# Folio

A personal portfolio tracker: stock holdings and option trades, with live pricing and derived P&L.

## Language

**Direction**:
Whether an option trade was opened as the buyer (`long`) or the seller (`short`) of the contract. Determines the sign of `pl_open`: a `long` position profits as the option's price rises; a `short` position profits as it falls (the seller collects premium up front and profits as it decays or the option is bought back cheaper).
_Avoid_: Buy/sell, side, position type (buy/sell describes the one-time trade action, not the ongoing economic exposure — a trade is entered once but the position's direction persists until closed).

**Entry price**:
The premium per contract at trade entry — the price paid for a `long` position, or the price received for a `short` position. Always a positive number; `direction` carries the sign, not `entry_price`.

**Entry value**:
`contracts × entry_price × 100`. For `long`, this is the cost basis (debit paid). For `short`, this is the premium collected (credit received) — the maximum possible profit on the position.

**Contracts**:
The number of option contracts in a trade, always a positive magnitude. Direction of exposure comes from `direction`, not from the sign of `contracts`.
