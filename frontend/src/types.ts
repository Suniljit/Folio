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

export interface OptionTrade {
  id: number | null;
  clientKey: string;
  origin: string;
  open_date: string;
  ticker: string;
  strategy: string;
  option_type: string;
  expiration_date: string;
  buying_power: number;
  buy_price: number;
  fees: number;
  rolls_credit: number;
  last_trade_date: string;
  strike: number;
  entry_price: number;
  contracts: number;
  entry_value: number;
  remaining_dte: number;
  current_price: number;
  pl_open: number;
  pct_pl: number;
  total_pl: number;
  roi: number;
}

export interface OptionTradesResponse {
  option_trades: Omit<OptionTrade, "clientKey">[];
  ibkr_connected: boolean;
}
