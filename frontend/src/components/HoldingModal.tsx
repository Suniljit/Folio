import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import type { Holding } from "../types";

const emptyForm = { company_name: "", ticker: "", shares_owned: "", avg_price: "", fees: "" };

type HoldingFields = Pick<
  Holding,
  "company_name" | "ticker" | "shares_owned" | "avg_price" | "fees"
>;

function toForm(values: HoldingFields): typeof emptyForm {
  return {
    company_name: values.company_name,
    ticker: values.ticker,
    shares_owned: String(values.shares_owned),
    avg_price: String(values.avg_price),
    fees: String(values.fees),
  };
}

interface HoldingModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: HoldingFields;
  onClose: () => void;
  onSubmit: (row: HoldingFields) => void;
  onDelete?: () => void;
}

export function HoldingModal({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
}: HoldingModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(mode === "edit" && initialValues ? toForm(initialValues) : emptyForm);
    setError("");
    setConfirmingDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  };

  const handleClose = () => {
    setForm(emptyForm);
    setError("");
    setConfirmingDelete(false);
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

  const title = mode === "edit" ? "Edit Holding" : "Add Holding";
  const submitLabel = mode === "edit" ? "Save" : "Add Holding";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        aria-label={title}
        className="max-w-[460px] gap-[22px] rounded-[24px] border-[oklch(0.76_0.09_85_/_0.5)] bg-[oklch(0.21_0.008_90)] px-8 pt-[30px] pb-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.85),0_0_0_1px_oklch(0.76_0.09_85_/_0.12),0_0_60px_-10px_oklch(0.76_0.09_85_/_0.15)]"
      >
        {confirmingDelete ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[20px] font-[650] tracking-[-0.01em] text-[var(--color-heading)]">
                Delete Holding
              </DialogTitle>
            </DialogHeader>

            <div className="modal-fields">
              <p className="text-sm text-muted-foreground">
                Delete this holding? This can&apos;t be undone.
              </p>
            </div>

            <DialogFooter className="m-0 flex-row justify-end gap-[10px] rounded-none border-t-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[20px] font-[650] tracking-[-0.01em] text-[var(--color-heading)]">
                {title}
              </DialogTitle>
            </DialogHeader>

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

            <DialogFooter className="m-0 flex-row justify-end gap-[10px] rounded-none border-t-0 bg-transparent p-0 sm:justify-between">
              {mode === "edit" ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-[10px]">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="button" variant="gold" onClick={handleSubmit}>
                  {submitLabel}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
