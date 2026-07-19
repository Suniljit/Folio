import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "../api";
import { HoldingModal } from "./HoldingModal";

describe("HoldingModal", () => {
  describe("add mode", () => {
    it("renders nothing when closed", () => {
      render(<HoldingModal open={false} mode="add" onClose={vi.fn()} onSubmit={vi.fn()} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders an empty form when open", () => {
      render(<HoldingModal open mode="add" onClose={vi.fn()} onSubmit={vi.fn()} />);

      expect(screen.getByRole("dialog", { name: /add holding/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. Apple")).toHaveValue("");
      expect(screen.getByPlaceholderText("AAPL")).toHaveValue("");
      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    });

    it("shows per-field validation errors and does not submit when required fields are blank", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<HoldingModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await user.click(screen.getByRole("button", { name: "Add Holding" }));

      expect(screen.getByText("Company name is required.")).toBeInTheDocument();
      expect(screen.getByText("Ticker must be 1-5 uppercase letters.")).toBeInTheDocument();
      expect(screen.getByText("Shares owned must be greater than 0.")).toBeInTheDocument();
      expect(screen.getByText("Average price must be greater than 0.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("rejects a zero shares_owned even when other fields are valid", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<HoldingModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText("e.g. Apple"), "Apple");
      await user.type(screen.getByPlaceholderText("AAPL"), "AAPL");
      const priceInputs = screen.getAllByPlaceholderText("0.00");
      await user.type(priceInputs[0], "150");

      await user.click(screen.getByRole("button", { name: "Add Holding" }));

      expect(screen.getByText("Shares owned must be greater than 0.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("rejects a negative fees value", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<HoldingModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText("e.g. Apple"), "Apple");
      await user.type(screen.getByPlaceholderText("AAPL"), "AAPL");
      await user.type(screen.getByPlaceholderText("0"), "10");
      const priceInputs = screen.getAllByPlaceholderText("0.00");
      await user.type(priceInputs[0], "150");
      await user.type(priceInputs[1], "-1");

      await user.click(screen.getByRole("button", { name: "Add Holding" }));

      expect(screen.getByText("Fees cannot be negative.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits a fully-populated row and clears the form", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<HoldingModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

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

    it("shows server-side field errors returned from a failed submit", async () => {
      const user = userEvent.setup();
      const onSubmit = vi
        .fn()
        .mockRejectedValue(new ValidationError({ ticker: "Ticker must be 1-5 uppercase letters" }));
      render(<HoldingModal open mode="add" onClose={vi.fn()} onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText("e.g. Apple"), "Apple");
      await user.type(screen.getByPlaceholderText("AAPL"), "AAPL");
      await user.type(screen.getByPlaceholderText("0"), "10");
      const priceInputs = screen.getAllByPlaceholderText("0.00");
      await user.type(priceInputs[0], "150");

      await user.click(screen.getByRole("button", { name: "Add Holding" }));

      expect(await screen.findByText("Ticker must be 1-5 uppercase letters")).toBeInTheDocument();
    });

    it("closes without submitting when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSubmit = vi.fn();
      render(<HoldingModal open mode="add" onClose={onClose} onSubmit={onSubmit} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not close when the dialog itself is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<HoldingModal open mode="add" onClose={onClose} onSubmit={vi.fn()} />);

      await user.click(screen.getByRole("dialog"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes when Escape is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<HoldingModal open mode="add" onClose={onClose} onSubmit={vi.fn()} />);

      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("edit mode", () => {
    const initialValues = {
      company_name: "Apple",
      ticker: "AAPL",
      shares_owned: 20,
      avg_price: 200,
      fees: 1.5,
    };

    it("pre-fills the form with initial values", () => {
      render(
        <HoldingModal
          open
          mode="edit"
          initialValues={initialValues}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByRole("dialog", { name: /edit holding/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. Apple")).toHaveValue("Apple");
      expect(screen.getByPlaceholderText("AAPL")).toHaveValue("AAPL");
      expect(screen.getByPlaceholderText("0")).toHaveValue(20);
    });

    it("submits updated fields", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <HoldingModal
          open
          mode="edit"
          initialValues={initialValues}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          onDelete={vi.fn()}
        />,
      );

      const shares = screen.getByPlaceholderText("0");
      await user.clear(shares);
      await user.type(shares, "25");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).toHaveBeenCalledWith({ ...initialValues, shares_owned: 25 });
    });

    it("shows a delete confirmation step before calling onDelete", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <HoldingModal
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

    it("cancelling the delete confirmation returns to the form", async () => {
      const user = userEvent.setup();
      render(
        <HoldingModal
          open
          mode="edit"
          initialValues={initialValues}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.getByPlaceholderText("e.g. Apple")).toBeInTheDocument();
    });
  });
});
