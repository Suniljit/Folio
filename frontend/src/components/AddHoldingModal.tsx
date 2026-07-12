import { useState } from "react";
import type { Holding } from "../types";

const emptyForm = { company_name: "", ticker: "", shares_owned: "", avg_price: "", fees: "" };

type NewHolding = Pick<Holding, "company_name" | "ticker" | "shares_owned" | "avg_price" | "fees">;

interface AddHoldingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (row: NewHolding) => void;
}

export function AddHoldingModal({ open, onClose, onSubmit }: AddHoldingModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  if (!open) return null;

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  };

  const handleClose = () => {
    setForm(emptyForm);
    setError("");
    onClose();
  };

  const handleSubmit = () => {
    const company_name = form.company_name.trim();
    const ticker = form.ticker.trim();
    if (!company_name || !ticker) {
      setError("Company and ticker are required.");
      return;
    }
    onSubmit({
      company_name,
      ticker: ticker.toUpperCase(),
      shares_owned: parseFloat(form.shares_owned) || 0,
      avg_price: parseFloat(form.avg_price) || 0,
      fees: parseFloat(form.fees) || 0,
    });
    setForm(emptyForm);
    setError("");
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} role="presentation">
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Add Holding"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Add Holding</h2>
          <button
            type="button"
            className="modal-close-button"
            aria-label="Close"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div className="modal-fields">
          <div className="modal-field">
            <label className="modal-field-label">Company</label>
            <input
              autoFocus
              className="modal-input"
              placeholder="e.g. Apple"
              value={form.company_name}
              onChange={(e) => setField("company_name", e.target.value)}
            />
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
              <label className="modal-field-label">Ticker</label>
              <input
                className="modal-input modal-input-ticker"
                placeholder="AAPL"
                value={form.ticker}
                onChange={(e) => setField("ticker", e.target.value.toUpperCase())}
              />
            </div>
            <div className="modal-field">
              <label className="modal-field-label">Shares</label>
              <input
                type="number"
                className="modal-input"
                placeholder="0"
                value={form.shares_owned}
                onChange={(e) => setField("shares_owned", e.target.value)}
              />
            </div>
          </div>

          <div className="modal-field-row">
            <div className="modal-field">
              <label className="modal-field-label">Avg Price</label>
              <input
                type="number"
                className="modal-input"
                placeholder="0.00"
                value={form.avg_price}
                onChange={(e) => setField("avg_price", e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-field-label">Fees</label>
              <input
                type="number"
                className="modal-input"
                placeholder="0.00"
                value={form.fees}
                onChange={(e) => setField("fees", e.target.value)}
              />
            </div>
          </div>

          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-cancel-button" onClick={handleClose}>
            Cancel
          </button>
          <button type="button" className="modal-submit-button" onClick={handleSubmit}>
            Add Holding
          </button>
        </div>
      </div>
    </div>
  );
}
