import type { Holding, HoldingsResponse } from "./types";

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
