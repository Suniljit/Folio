import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OptionTradeRow } from "./OptionTradeRow";
import { makeOptionTrade } from "../test/fixtures";

describe("OptionTradeRow", () => {
  it("renders trade fields and computed fields as read-only text", () => {
    render(<OptionTradeRow trade={makeOptionTrade()} onEdit={vi.fn()} />);

    expect(screen.getByText("Sunil")).toBeInTheDocument();
    expect(screen.getByText("NVDA")).toBeInTheDocument();
    expect(screen.getByText("CSP")).toBeInTheDocument();
    expect(screen.getByText("$2,832.00")).toBeInTheDocument();
    expect(screen.getAllByText("$625.00")).toHaveLength(2); // buy_price and entry_value
    expect(screen.getByText("17")).toBeInTheDocument();
  });

  it("calls onEdit with the row's clientKey when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<OptionTradeRow trade={makeOptionTrade()} onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledWith("1");
  });
});
