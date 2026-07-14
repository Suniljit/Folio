import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OptionTradeModal } from "./OptionTradeModal";

describe("OptionTradeModal", () => {
  describe("add mode", () => {
    it("renders nothing when closed", () => {
      render(<OptionTradeModal open={false} mode="add" onClose={vi.fn()} onSubmit={vi.fn()} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders an empty form when open", () => {
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={vi.fn()} />);

      expect(screen.getByRole("dialog", { name: /add trade/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. Sunil")).toHaveValue("");
      expect(screen.getByPlaceholderText("AAPL")).toHaveValue("");
      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    });

    it("shows a validation error and does not submit when origin or ticker is blank", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await user.click(screen.getByRole("button", { name: "Add Trade" }));

      expect(screen.getByText("Origin and ticker are required.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits a fully-populated row and clears the form", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText("e.g. Sunil"), "Sunil");
      await user.type(screen.getByPlaceholderText("AAPL"), "nvda");
      await user.type(screen.getByPlaceholderText("e.g. CSP"), "CSP");
      await user.type(screen.getByPlaceholderText("0"), "-100");
      const priceInputs = screen.getAllByPlaceholderText("0.00");
      await user.type(priceInputs[0], "195");
      await user.type(priceInputs[1], "6.25");

      await user.click(screen.getByRole("button", { name: "Add Trade" }));

      expect(onSubmit).toHaveBeenCalledWith({
        origin: "Sunil",
        ticker: "NVDA",
        strategy: "CSP",
        open_date: "",
        expiration_date: "",
        last_trade_date: "",
        strike: 195,
        entry_price: 6.25,
        buy_price: 0,
        buying_power: 0,
        fees: 0,
        rolls_credit: 0,
        qty: -100,
      });
    });

    it("closes without submitting when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSubmit = vi.fn();
      render(<OptionTradeModal open mode="add" onClose={onClose} onSubmit={onSubmit} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("edit mode", () => {
    const initialValues = {
      origin: "Sunil",
      open_date: "2026-06-23",
      ticker: "NVDA",
      strategy: "CSP",
      expiration_date: "2026-07-31",
      buying_power: 2832,
      buy_price: 625,
      fees: 0.7,
      rolls_credit: 0,
      last_trade_date: "2026-07-31",
      strike: 195,
      entry_price: 6.25,
      qty: -100,
    };

    it("pre-fills the form with initial values", () => {
      render(
        <OptionTradeModal
          open
          mode="edit"
          initialValues={initialValues}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByRole("dialog", { name: /edit trade/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. Sunil")).toHaveValue("Sunil");
      expect(screen.getByPlaceholderText("AAPL")).toHaveValue("NVDA");
    });

    it("submits updated fields", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <OptionTradeModal
          open
          mode="edit"
          initialValues={initialValues}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          onDelete={vi.fn()}
        />,
      );

      const qty = screen.getByPlaceholderText("0");
      await user.clear(qty);
      await user.type(qty, "-200");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, qty: -200 });
    });

    it("shows a delete confirmation step before calling onDelete", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <OptionTradeModal
          open
          mode="edit"
          initialValues={initialValues}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          onDelete={onDelete}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.getByText(/can't be undone/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
