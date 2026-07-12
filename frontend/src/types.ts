export interface Holding {
  id: number | null;
  clientKey: string;
  company_name: string;
  ticker: string;
  shares_owned: number;
  avg_price: number;
  fees: number;
  current_price: number;
  total_cost: number;
  market_value: number;
  unrealized_pl: number;
}

export interface Totals {
  market_value: number;
  total_cost: number;
  unrealized_pl: number;
}

export interface HoldingsResponse {
  holdings: Omit<Holding, "clientKey">[];
  totals: Totals;
}
