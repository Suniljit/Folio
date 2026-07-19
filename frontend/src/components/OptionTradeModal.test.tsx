import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "../api";
import { OptionTradeModal } from "./OptionTradeModal";

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("e.g. Sunil"), "Sunil");
  await user.type(screen.getByPlaceholderText("AAPL"), "nvda");
  await user.type(screen.getByPlaceholderText("e.g. CSP"), "CSP");
  await user.type(screen.getByPlaceholderText("0"), "100");
  await user.selectOptions(screen.getAllByRole("combobox")[0], "put");
  await user.selectOptions(screen.getAllByRole("combobox")[1], "short");
  const priceInputs = screen.getAllByPlaceholderText("0.00");
  await user.type(priceInputs[0], "195");
  await user.type(priceInputs[1], "6.25");
  await user.type(priceInputs[2], "6.25");
  await user.type(priceInputs[3], "10000");
  await user.type(priceInputs[4], "1");
  await user.type(priceInputs[5], "2");

  const dateInputs = document.body.querySelectorAll('input[type="date"]');
  fireEvent.change(dateInputs[0], { target: { value: "2026-06-23" } });
  fireEvent.change(dateInputs[1], { target: { value: "2026-07-31" } });
}

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

    it("shows per-field validation errors and does not submit when required fields are blank", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await user.click(screen.getByRole("button", { name: "Add Trade" }));

      expect(screen.getByText("Origin is required.")).toBeInTheDocument();
      expect(screen.getByText("Strategy is required.")).toBeInTheDocument();
      expect(screen.getByText("Ticker must be 1-5 uppercase letters.")).toBeInTheDocument();
      expect(screen.getByText("Option type is required.")).toBeInTheDocument();
      expect(screen.getByText("Direction is required.")).toBeInTheDocument();
      expect(screen.getByText("Open date is required.")).toBeInTheDocument();
      expect(screen.getByText("Expiration date is required.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("rejects an expiration date before the open date", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await fillRequiredFields(user);
      const dateInputs = document.body.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: "2026-07-31" } });
      fireEvent.change(dateInputs[1], { target: { value: "2026-06-23" } });

      await user.click(screen.getByRole("button", { name: "Add Trade" }));

      expect(screen.getByText("Expiration date must not be before open date.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("rejects fractional contracts", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await fillRequiredFields(user);
      const contracts = screen.getByPlaceholderText("0");
      await user.clear(contracts);
      await user.type(contracts, "1.5");

      await user.click(screen.getByRole("button", { name: "Add Trade" }));

      expect(screen.getByText("Contracts must be a whole number.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits a fully-populated row and clears the form", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await fillRequiredFields(user);

      await user.click(screen.getByRole("button", { name: "Add Trade" }));

      expect(onSubmit).toHaveBeenCalledWith({
        origin: "Sunil",
        ticker: "NVDA",
        strategy: "CSP",
        option_type: "put",
        direction: "short",
        open_date: "2026-06-23",
        expiration_date: "2026-07-31",
        last_trade_date: "",
        strike: 195,
        entry_price: 6.25,
        buy_price: 6.25,
        buying_power: 10000,
        fees: 1,
        rolls_credit: 2,
        contracts: 100,
      });
    });

    it("shows server-side field errors returned from a failed submit", async () => {
      const user = userEvent.setup();
      const onSubmit = vi
        .fn()
        .mockRejectedValue(new ValidationError({ strike: "Strike must be greater than 0" }));
      render(<OptionTradeModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await fillRequiredFields(user);
      await user.click(screen.getByRole("button", { name: "Add Trade" }));

      expect(await screen.findByText("Strike must be greater than 0")).toBeInTheDocument();
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
      contracts: 100,
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
      const onSubmit = vi.fn().mockResolvedValue(undefined);
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

      const contracts = screen.getByPlaceholderText("0");
      await user.clear(contracts);
      await user.type(contracts, "200");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, contracts: 200 });
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
