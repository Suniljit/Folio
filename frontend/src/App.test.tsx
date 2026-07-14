import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as api from "./api";
import type { HoldingsResponse } from "./types";

vi.mock("./api");

const mockedGetHoldings = vi.mocked(api.getHoldings);
const mockedSaveHoldings = vi.mocked(api.saveHoldings);

function response(overrides: Partial<HoldingsResponse["holdings"][number]> = {}): HoldingsResponse {
  const holding = {
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
  return {
    holdings: [holding],
    totals: {
      market_value: holding.market_value,
      total_cost: holding.total_cost,
      unrealized_pl: holding.unrealized_pl,
    },
  };
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetHoldings.mockResolvedValue(response());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("loads and displays holdings on mount", async () => {
    render(<App />);

    expect(await screen.findByText("Apple")).toBeInTheDocument();
    // Market value appears twice: once in the stat card, once in the row.
    expect(screen.getAllByText("$6,306.40")).toHaveLength(2);
    expect(mockedGetHoldings).toHaveBeenCalledTimes(1);
  });

  it("adds a holding via the Add Holding modal and saves immediately", async () => {
    const user = userEvent.setup();
    mockedSaveHoldings.mockResolvedValue(
      response({ id: 2, company_name: "Microsoft", ticker: "MSFT" }),
    );
    render(<App />);

    await screen.findByText("Apple");
    await user.click(screen.getByRole("button", { name: /\+ add holding/i }));
    await user.type(screen.getByPlaceholderText("e.g. Apple"), "Microsoft");
    await user.type(screen.getByPlaceholderText("AAPL"), "msft");
    await user.click(screen.getByRole("button", { name: "Add Holding" }));

    await waitFor(() => expect(mockedSaveHoldings).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Holding added!")).toBeInTheDocument();
    expect(await screen.findByText("Microsoft")).toBeInTheDocument();
  });

  it("edits a holding via the Edit modal, pre-filled with its current values", async () => {
    const user = userEvent.setup();
    mockedSaveHoldings.mockResolvedValue(response({ fees: 9.9 }));
    render(<App />);

    await screen.findByText("Apple");
    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByRole("dialog", { name: /edit holding/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Apple")).toHaveValue("Apple");

    const fees = screen.getAllByPlaceholderText("0.00")[1];
    await user.clear(fees);
    await user.type(fees, "9.9");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockedSaveHoldings).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Holding updated!")).toBeInTheDocument();
  });

  it("deletes a holding from the Edit modal after confirmation", async () => {
    const user = userEvent.setup();
    mockedSaveHoldings.mockResolvedValue({
      holdings: [],
      totals: { market_value: 0, total_cost: 0, unrealized_pl: 0 },
    });
    render(<App />);

    await screen.findByText("Apple");
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockedSaveHoldings).toHaveBeenCalledTimes(1));
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
});
