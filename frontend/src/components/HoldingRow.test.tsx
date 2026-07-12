import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HoldingRow } from "./HoldingRow";
import { makeHolding } from "../test/fixtures";

describe("HoldingRow", () => {
  it("renders editable fields and computed, read-only fields", () => {
    render(<HoldingRow holding={makeHolding()} onChange={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByDisplayValue("Apple")).toBeInTheDocument();
    expect(screen.getByDisplayValue("AAPL")).toBeInTheDocument();
    expect(screen.getByText("$315.32")).toBeInTheDocument();
    expect(screen.getByText("$4,001.50")).toBeInTheDocument();
    expect(screen.getByText("$6,306.40")).toBeInTheDocument();
    expect(screen.getByText("+$2,304.90")).toBeInTheDocument();
  });

  it("shows a negative unrealized P/L in the negative style", () => {
    render(
      <HoldingRow
        holding={makeHolding({ unrealized_pl: -100 })}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const plCell = screen.getByText("-$100.00");
    expect(plCell.className).toContain("negative");
  });

  it("calls onChange with the field name and new value when a cell is edited", () => {
    const onChange = vi.fn();
    render(<HoldingRow holding={makeHolding()} onChange={onChange} onDelete={vi.fn()} />);

    const companyInput = screen.getByDisplayValue("Apple");
    fireEvent.change(companyInput, { target: { value: "Apple Inc." } });

    expect(onChange).toHaveBeenCalledWith("1", "company_name", "Apple Inc.");
  });

  it("uppercases ticker input as the user types", () => {
    const onChange = vi.fn();
    render(<HoldingRow holding={makeHolding()} onChange={onChange} onDelete={vi.fn()} />);

    const tickerInput = screen.getByDisplayValue("AAPL");
    fireEvent.change(tickerInput, { target: { value: "msft" } });

    expect(onChange).toHaveBeenCalledWith("1", "ticker", "MSFT");
  });

  it("calls onDelete with the row's clientKey when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<HoldingRow holding={makeHolding()} onChange={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: /delete holding/i }));

    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
