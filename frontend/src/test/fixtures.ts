import type { Holding } from "../types";

export function makeHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 1,
    clientKey: "1",
    company_name: "Apple",
    ticker: "AAPL",
    shares_owned: 20,
    avg_price: 200,
    fees: 1.5,
    current_price: 315.32,
    total_cost: 4001.5,
    market_value: 6306.4,
    unrealized_pl: 2304.9,
    ...overrides,
  };
}
