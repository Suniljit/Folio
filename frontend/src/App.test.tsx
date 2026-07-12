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
    mockedGetHoldings.mockResolvedValue(response());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("loads and displays holdings on mount", async () => {
    render(<App />);

    expect(await screen.findByDisplayValue("Apple")).toBeInTheDocument();
    // Market value appears twice: once in the stat card, once in the row.
    expect(screen.getAllByText("$6,306.40")).toHaveLength(2);
    expect(mockedGetHoldings).toHaveBeenCalledTimes(1);
  });

  it("disables Save Changes until an edit is made, then enables it", async () => {
    const user = userEvent.setup();
    render(<App />);

    const saveButton = await screen.findByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();

    const tickerInput = screen.getByDisplayValue("AAPL");
    await user.type(tickerInput, "X");

    expect(saveButton).toBeEnabled();
  });

  it("adding then deleting the same row returns to a clean (non-dirty) state", async () => {
    const user = userEvent.setup();
    render(<App />);

    const saveButton = await screen.findByRole("button", { name: /save changes/i });
    await user.click(screen.getByRole("button", { name: /add holding/i }));
    expect(saveButton).toBeEnabled();

    const deleteButtons = screen.getAllByRole("button", { name: /delete holding/i });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(saveButton).toBeDisabled();
  });

  it("saves the draft and shows a Saved! toast", async () => {
    const user = userEvent.setup();
    mockedSaveHoldings.mockResolvedValue(response({ fees: 9.9 }));
    render(<App />);

    const tickerInput = await screen.findByDisplayValue("AAPL");
    await user.type(tickerInput, "X");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockedSaveHoldings).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Saved!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("discards unsaved edits and shows a toast when a poll tick finds the draft dirty", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    render(<App />);

    const tickerInput = await screen.findByDisplayValue("AAPL");
    await user.type(tickerInput, "X");
    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();

    mockedGetHoldings.mockResolvedValue(response());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(await screen.findByText("Refreshed — unsaved edits cleared")).toBeInTheDocument();
    expect(screen.getByDisplayValue("AAPL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("silently refreshes computed columns on a poll tick when there are no unsaved edits", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);

    await screen.findByDisplayValue("AAPL");

    mockedGetHoldings.mockResolvedValue(response({ current_price: 400 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(await screen.findByText("$400.00")).toBeInTheDocument();
    expect(screen.queryByText("Refreshed — unsaved edits cleared")).not.toBeInTheDocument();
  });
});
