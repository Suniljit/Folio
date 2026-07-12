import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddHoldingModal } from "./AddHoldingModal";

describe("AddHoldingModal", () => {
  it("renders nothing when closed", () => {
    render(<AddHoldingModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the form when open", () => {
    render(<AddHoldingModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: /add holding/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Apple")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("AAPL")).toBeInTheDocument();
  });

  it("shows a validation error and does not submit when company or ticker is blank", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddHoldingModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Add Holding" }));

    expect(screen.getByText("Company and ticker are required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a fully-populated row and clears the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddHoldingModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Apple"), "Apple");
    await user.type(screen.getByPlaceholderText("AAPL"), "aapl");
    await user.type(screen.getByPlaceholderText("0"), "10");
    const priceInputs = screen.getAllByPlaceholderText("0.00");
    await user.type(priceInputs[0], "150");
    await user.type(priceInputs[1], "1.5");

    await user.click(screen.getByRole("button", { name: "Add Holding" }));

    expect(onSubmit).toHaveBeenCalledWith({
      company_name: "Apple",
      ticker: "AAPL",
      shares_owned: 10,
      avg_price: 150,
      fees: 1.5,
    });
  });

  it("closes without submitting when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(<AddHoldingModal open onClose={onClose} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("closes when the backdrop is clicked but not when the dialog itself is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddHoldingModal open onClose={onClose} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
