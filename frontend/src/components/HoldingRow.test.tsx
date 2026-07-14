import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HoldingRow } from "./HoldingRow";
import { makeHolding } from "../test/fixtures";

describe("HoldingRow", () => {
  it("renders holding fields and computed fields as read-only text", () => {
    render(<HoldingRow holding={makeHolding()} onEdit={vi.fn()} />);

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("$315.32")).toBeInTheDocument();
    expect(screen.getByText("$4,001.50")).toBeInTheDocument();
    expect(screen.getByText("$6,306.40")).toBeInTheDocument();
    expect(screen.getByText("+$2,304.90")).toBeInTheDocument();
  });

  it("shows a negative unrealized P/L in the negative style", () => {
    render(<HoldingRow holding={makeHolding({ unrealized_pl: -100 })} onEdit={vi.fn()} />);

    const plCell = screen.getByText("-$100.00");
    expect(plCell.className).toContain("negative");
  });

  it("calls onEdit with the row's clientKey when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<HoldingRow holding={makeHolding()} onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledWith("1");
  });
});
