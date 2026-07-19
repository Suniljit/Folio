import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as api from "./api";
import type { Holding, HoldingsResponse, OptionTrade, OptionTradesResponse } from "./types";

vi.mock("./api");

const mockedGetHoldings = vi.mocked(api.getHoldings);
const mockedCreateHolding = vi.mocked(api.createHolding);
const mockedUpdateHolding = vi.mocked(api.updateHolding);
const mockedDeleteHolding = vi.mocked(api.deleteHolding);
const mockedGetOptionTrades = vi.mocked(api.getOptionTrades);
const mockedCreateOptionTrade = vi.mocked(api.createOptionTrade);
const mockedDeleteOptionTrade = vi.mocked(api.deleteOptionTrade);

function holdingRow(
  overrides: Partial<Omit<Holding, "clientKey">> = {},
): Omit<Holding, "clientKey"> {
  return {
    id: 1,
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

function response(overrides: Partial<Omit<Holding, "clientKey">> = {}): HoldingsResponse {
  const holding = holdingRow(overrides);
  return {
    holdings: [holding],
    totals: {
      market_value: holding.market_value,
      total_cost: holding.total_cost,
      unrealized_pl: holding.unrealized_pl,
    },
  };
}

function tradeRow(
  overrides: Partial<Omit<OptionTrade, "clientKey">> = {},
): Omit<OptionTrade, "clientKey"> {
  return {
    id: 1,
    origin: "Sunil",
    open_date: "2026-06-23",
    ticker: "NVDA",
    strategy: "CSP",
    option_type: "put",
    direction: "short",
    expiration_date: "2026-07-31",
    buying_power: 2832,
    buy_price: 625,
    fees: 0.7,
    rolls_credit: 0,
    last_trade_date: "2026-07-31",
    strike: 195,
    entry_price: 6.25,
    contracts: 1,
    entry_value: 625,
    remaining_dte: 17,
    current_price: 5.5,
    pl_open: 75,
    pct_pl: 0.12,
    total_pl: 74.3,
    roi: 0.026,
    ...overrides,
  };
}

function tradeResponse(
  overrides: Partial<Omit<OptionTrade, "clientKey">> = {},
): OptionTradesResponse {
  return { option_trades: [tradeRow(overrides)], ibkr_connected: true };
}

async function fillRequiredTradeFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("e.g. CSP"), "CSP");
  await user.type(screen.getByPlaceholderText("0"), "1");
  await user.selectOptions(screen.getAllByRole("combobox")[0], "put");
  const priceInputs = screen.getAllByPlaceholderText("0.00");
  await user.type(priceInputs[0], "195");
  await user.type(priceInputs[1], "6.25");
  await user.type(priceInputs[2], "6.25");
  await user.type(priceInputs[3], "10000");
  const dateInputs = document.body.querySelectorAll('input[type="date"]');
  fireEvent.change(dateInputs[0], { target: { value: "2026-06-23" } });
  fireEvent.change(dateInputs[1], { target: { value: "2026-07-31" } });
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetHoldings.mockResolvedValue(response());
    mockedGetOptionTrades.mockResolvedValue(tradeResponse());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("loads and displays holdings on mount", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Holdings" }));

    expect(await screen.findByText("Apple")).toBeInTheDocument();
    // Market value appears twice: once in the stat card, once in the row.
    expect(screen.getAllByText("$6,306.40")).toHaveLength(2);
    expect(mockedGetHoldings).toHaveBeenCalledTimes(1);
  });

  it("adds a holding via the Add Holding modal and saves immediately", async () => {
    const user = userEvent.setup();
    mockedCreateHolding.mockResolvedValue(
      holdingRow({ id: 2, company_name: "Microsoft", ticker: "MSFT" }),
    );
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Holdings" }));
    await screen.findByText("Apple");
    await user.click(screen.getByRole("button", { name: /\+ add holding/i }));
    await user.type(screen.getByPlaceholderText("e.g. Apple"), "Microsoft");
    await user.type(screen.getByPlaceholderText("AAPL"), "msft");
    await user.type(screen.getByPlaceholderText("0"), "10");
    const priceInputs = screen.getAllByPlaceholderText("0.00");
    await user.type(priceInputs[0], "150");
    await user.click(screen.getByRole("button", { name: "Add Holding" }));

    await waitFor(() => expect(mockedCreateHolding).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Holding added!")).toBeInTheDocument();
    expect(await screen.findByText("Microsoft")).toBeInTheDocument();
  });

  it("edits a holding via the Edit modal, pre-filled with its current values", async () => {
    const user = userEvent.setup();
    mockedUpdateHolding.mockResolvedValue(holdingRow({ fees: 9.9 }));
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Holdings" }));
    await screen.findByText("Apple");
    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByRole("dialog", { name: /edit holding/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Apple")).toHaveValue("Apple");

    const fees = screen.getAllByPlaceholderText("0.00")[1];
    await user.clear(fees);
    await user.type(fees, "9.9");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockedUpdateHolding).toHaveBeenCalledTimes(1));
    expect(mockedUpdateHolding).toHaveBeenCalledWith(1, expect.objectContaining({ fees: 9.9 }));
    expect(await screen.findByText("Holding updated!")).toBeInTheDocument();
  });

  it("deletes a holding from the Edit modal after confirmation", async () => {
    const user = userEvent.setup();
    mockedDeleteHolding.mockResolvedValue(undefined);
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Holdings" }));
    await screen.findByText("Apple");
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockedDeleteHolding).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Holding deleted!")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("does not render a Save Changes button", async () => {
    render(<App />);

    await screen.findByText("Apple");
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
  });

  it("skips the poll tick while a modal is open", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Holdings" }));
    await screen.findByText("Apple");
    await user.click(screen.getByRole("button", { name: /\+ add holding/i }));

    mockedGetHoldings.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(mockedGetHoldings).not.toHaveBeenCalled();
  });

  it("silently refreshes computed columns on a poll tick", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);

    await screen.findByText("AAPL");

    mockedGetHoldings.mockResolvedValue(response({ current_price: 400 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(await screen.findByText("$400.00")).toBeInTheDocument();
  });

  it("loads and displays option trades on the Trades tab", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Trades" }));

    expect(await screen.findByText("NVDA")).toBeInTheDocument();
    expect(mockedGetOptionTrades).toHaveBeenCalledTimes(1);
  });

  it("adds a trade via the Add Trade modal and saves immediately", async () => {
    const user = userEvent.setup();
    mockedCreateOptionTrade.mockResolvedValue(tradeRow({ id: 2, origin: "Adam", ticker: "MSFT" }));
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Trades" }));
    await screen.findByText("NVDA");
    await user.click(screen.getByRole("button", { name: /\+ add trade/i }));
    await user.type(screen.getByPlaceholderText("e.g. Sunil"), "Adam");
    await user.type(screen.getByPlaceholderText("AAPL"), "msft");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "short");
    await fillRequiredTradeFields(user);
    await user.click(screen.getByRole("button", { name: "Add Trade" }));

    await waitFor(() => expect(mockedCreateOptionTrade).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Trade added!")).toBeInTheDocument();
    expect(await screen.findByText("MSFT")).toBeInTheDocument();
  });

  it("deletes a trade from the Edit modal after confirmation", async () => {
    const user = userEvent.setup();
    mockedDeleteOptionTrade.mockResolvedValue(undefined);
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Trades" }));
    await screen.findByText("NVDA");
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockedDeleteOptionTrade).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Trade deleted!")).toBeInTheDocument();
    expect(screen.queryByText("NVDA")).not.toBeInTheDocument();
  });

  it("skips the poll tick for both holdings and trades while a trade modal is open", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await screen.findByText("AAPL");
    await user.click(screen.getByRole("button", { name: "Trades" }));
    await screen.findByText("NVDA");
    await user.click(screen.getByRole("button", { name: /\+ add trade/i }));

    mockedGetHoldings.mockClear();
    mockedGetOptionTrades.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(mockedGetHoldings).not.toHaveBeenCalled();
    expect(mockedGetOptionTrades).not.toHaveBeenCalled();
  });
});
