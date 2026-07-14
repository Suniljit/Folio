import type { Holding, HoldingsResponse, OptionTrade, OptionTradesResponse } from "./types";

export async function getHoldings(): Promise<HoldingsResponse> {
  const res = await fetch("/api/holdings");
  if (!res.ok) throw new Error(`GET /api/holdings failed: ${res.status}`);
  return res.json();
}

export async function saveHoldings(holdings: Holding[]): Promise<HoldingsResponse> {
  const res = await fetch("/api/holdings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      holdings: holdings.map((h) => ({
        company_name: h.company_name,
        ticker: h.ticker,
        shares_owned: h.shares_owned,
        avg_price: h.avg_price,
        fees: h.fees,
      })),
    }),
  });
  if (!res.ok) throw new Error(`POST /api/holdings failed: ${res.status}`);
  return res.json();
}

export async function getOptionTrades(): Promise<OptionTradesResponse> {
  const res = await fetch("/api/options-trades");
  if (!res.ok) throw new Error(`GET /api/options-trades failed: ${res.status}`);
  return res.json();
}

export async function saveOptionTrades(trades: OptionTrade[]): Promise<OptionTradesResponse> {
  const res = await fetch("/api/options-trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      option_trades: trades.map((t) => ({
        origin: t.origin,
        open_date: t.open_date,
        ticker: t.ticker,
        strategy: t.strategy,
        expiration_date: t.expiration_date,
        buying_power: t.buying_power,
        buy_price: t.buy_price,
        fees: t.fees,
        rolls_credit: t.rolls_credit,
        last_trade_date: t.last_trade_date,
        strike: t.strike,
        entry_price: t.entry_price,
        qty: t.qty,
      })),
    }),
  });
  if (!res.ok) throw new Error(`POST /api/options-trades failed: ${res.status}`);
  return res.json();
}
