import type { Holding, OptionTrade } from "../types";

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

export function makeOptionTrade(overrides: Partial<OptionTrade> = {}): OptionTrade {
  return {
    id: 1,
    clientKey: "1",
    origin: "Sunil",
    open_date: "2026-06-23",
    ticker: "NVDA",
    strategy: "CSP",
    expiration_date: "2026-07-31",
    buying_power: 2832,
    buy_price: 625,
    fees: 0.7,
    rolls_credit: 0,
    last_trade_date: "2026-07-31",
    strike: 195,
    entry_price: 6.25,
    qty: -100,
    entry_value: -625,
    remaining_dte: 17,
    ...overrides,
  };
}
