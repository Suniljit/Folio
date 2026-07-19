import { useEffect, useState } from "react";
import { ValidationError } from "../api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import type { Holding } from "../types";

const emptyForm = { company_name: "", ticker: "", shares_owned: "", avg_price: "", fees: "" };

type HoldingFields = Pick<
  Holding,
  "company_name" | "ticker" | "shares_owned" | "avg_price" | "fees"
>;

const TICKER_PATTERN = /^[A-Z]{1,5}$/;

function toForm(values: HoldingFields): typeof emptyForm {
  return {
    company_name: values.company_name,
    ticker: values.ticker,
    shares_owned: String(values.shares_owned),
    avg_price: String(values.avg_price),
    fees: String(values.fees),
  };
}

function validate(form: typeof emptyForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.company_name.trim()) errors.company_name = "Company name is required.";

  const ticker = form.ticker.trim().toUpperCase();
  if (!TICKER_PATTERN.test(ticker)) errors.ticker = "Ticker must be 1-5 uppercase letters.";

  const shares = Number(form.shares_owned);
  if (form.shares_owned.trim() === "" || Number.isNaN(shares) || shares <= 0) {
    errors.shares_owned = "Shares owned must be greater than 0.";
  }

  const avgPrice = Number(form.avg_price);
  if (form.avg_price.trim() === "" || Number.isNaN(avgPrice) || avgPrice <= 0) {
    errors.avg_price = "Average price must be greater than 0.";
  }

  const fees = form.fees.trim() === "" ? 0 : Number(form.fees);
  if (Number.isNaN(fees) || fees < 0) errors.fees = "Fees cannot be negative.";

  return errors;
}

interface HoldingModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: HoldingFields;
  onClose: () => void;
  onSubmit: (row: HoldingFields) => Promise<void>;
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(mode === "edit" && initialValues ? toForm(initialValues) : emptyForm);
    setFieldErrors({});
    setSubmitting(false);
    setConfirmingDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((errs) => ({ ...errs, [field]: "" }));
  };

  const handleClose = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setSubmitting(false);
    setConfirmingDelete(false);
    onClose();
  };

  const handleSubmit = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        company_name: form.company_name.trim(),
        ticker: form.ticker.trim().toUpperCase(),
        shares_owned: Number(form.shares_owned),
        avg_price: Number(form.avg_price),
        fees: form.fees.trim() === "" ? 0 : Number(form.fees),
      });
      setForm(emptyForm);
      setFieldErrors({});
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.fieldErrors);
      } else {
        setFieldErrors({ _global: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "edit" ? "Edit Holding" : "Add Holding";
  const submitLabel = mode === "edit" ? "Save" : "Add Holding";
  const inputClass = (field: string) =>
    fieldErrors[field] ? "modal-input modal-input-invalid" : "modal-input";

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
                  className={inputClass("company_name")}
                  placeholder="e.g. Apple"
                  value={form.company_name}
                  onChange={(e) => setField("company_name", e.target.value)}
                />
                {fieldErrors.company_name && (
                  <div className="modal-field-error">{fieldErrors.company_name}</div>
                )}
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Ticker</label>
                  <input
                    className={`${inputClass("ticker")} modal-input-ticker`}
                    placeholder="AAPL"
                    value={form.ticker}
                    onChange={(e) => setField("ticker", e.target.value.toUpperCase())}
                  />
                  {fieldErrors.ticker && (
                    <div className="modal-field-error">{fieldErrors.ticker}</div>
                  )}
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Shares</label>
                  <input
                    type="number"
                    className={inputClass("shares_owned")}
                    placeholder="0"
                    value={form.shares_owned}
                    onChange={(e) => setField("shares_owned", e.target.value)}
                  />
                  {fieldErrors.shares_owned && (
                    <div className="modal-field-error">{fieldErrors.shares_owned}</div>
                  )}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Avg Price</label>
                  <input
                    type="number"
                    className={inputClass("avg_price")}
                    placeholder="0.00"
                    value={form.avg_price}
                    onChange={(e) => setField("avg_price", e.target.value)}
                  />
                  {fieldErrors.avg_price && (
                    <div className="modal-field-error">{fieldErrors.avg_price}</div>
                  )}
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Fees</label>
                  <input
                    type="number"
                    className={inputClass("fees")}
                    placeholder="0.00"
                    value={form.fees}
                    onChange={(e) => setField("fees", e.target.value)}
                  />
                  {fieldErrors.fees && <div className="modal-field-error">{fieldErrors.fees}</div>}
                </div>
              </div>

              {fieldErrors._global && <div className="modal-error">{fieldErrors._global}</div>}
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
                <Button type="button" variant="gold" disabled={submitting} onClick={handleSubmit}>
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
