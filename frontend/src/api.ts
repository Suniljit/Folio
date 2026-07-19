import type { Holding, HoldingsResponse, OptionTrade, OptionTradesResponse } from "./types";

export class ValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super("Validation failed");
    this.fieldErrors = fieldErrors;
  }
}

async function parseValidationError(res: Response): Promise<never> {
  if (res.status === 422) {
    const body = await res.json();
    const fieldErrors: Record<string, string> = {};
    for (const err of body.detail ?? []) {
      const field = err.loc?.[err.loc.length - 1];
      if (typeof field === "string") fieldErrors[field] = err.msg;
    }
    throw new ValidationError(fieldErrors);
  }
  throw new Error(`Request failed: ${res.status}`);
}

type HoldingFields = Pick<
  Holding,
  "company_name" | "ticker" | "shares_owned" | "avg_price" | "fees"
>;

type OptionTradeFields = Pick<
  OptionTrade,
  | "origin"
  | "open_date"
  | "ticker"
  | "strategy"
  | "option_type"
  | "direction"
  | "expiration_date"
  | "buying_power"
  | "buy_price"
  | "fees"
  | "rolls_credit"
  | "last_trade_date"
  | "strike"
  | "entry_price"
  | "contracts"
>;

export async function getHoldings(): Promise<HoldingsResponse> {
  const res = await fetch("/api/holdings");
  if (!res.ok) throw new Error(`GET /api/holdings failed: ${res.status}`);
  return res.json();
}

export async function createHolding(fields: HoldingFields): Promise<Omit<Holding, "clientKey">> {
  const res = await fetch("/api/holdings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) return parseValidationError(res);
  return res.json();
}

export async function updateHolding(
  id: number,
  fields: HoldingFields,
): Promise<Omit<Holding, "clientKey">> {
  const res = await fetch(`/api/holdings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) return parseValidationError(res);
  return res.json();
}

export async function deleteHolding(id: number): Promise<void> {
  const res = await fetch(`/api/holdings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /api/holdings/${id} failed: ${res.status}`);
}

export async function getOptionTrades(): Promise<OptionTradesResponse> {
  const res = await fetch("/api/options-trades");
  if (!res.ok) throw new Error(`GET /api/options-trades failed: ${res.status}`);
  return res.json();
}

export async function createOptionTrade(
  fields: OptionTradeFields,
): Promise<Omit<OptionTrade, "clientKey">> {
  const res = await fetch("/api/options-trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) return parseValidationError(res);
  return res.json();
}

export async function updateOptionTrade(
  id: number,
  fields: OptionTradeFields,
): Promise<Omit<OptionTrade, "clientKey">> {
  const res = await fetch(`/api/options-trades/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) return parseValidationError(res);
  return res.json();
}

export async function deleteOptionTrade(id: number): Promise<void> {
  const res = await fetch(`/api/options-trades/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /api/options-trades/${id} failed: ${res.status}`);
}
