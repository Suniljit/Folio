import { useEffect, useState } from "react";
import { ValidationError } from "../api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import type { OptionTrade } from "../types";

const emptyForm = {
  origin: "",
  open_date: "",
  ticker: "",
  strategy: "",
  option_type: "",
  direction: "",
  expiration_date: "",
  buying_power: "",
  buy_price: "",
  fees: "",
  rolls_credit: "",
  last_trade_date: "",
  strike: "",
  entry_price: "",
  contracts: "",
};

type OptionTradeFields = Pick<
  OptionTrade,
  | "origin"
  | "open_date"
  | "ticker"
  | "strategy"
  | "option_type"
  | "direction"
  | "expiration_date"
  | "buying_power"
  | "buy_price"
  | "fees"
  | "rolls_credit"
  | "last_trade_date"
  | "strike"
  | "entry_price"
  | "contracts"
>;

const TICKER_PATTERN = /^[A-Z]{1,5}$/;

function toForm(values: OptionTradeFields): typeof emptyForm {
  return {
    origin: values.origin,
    open_date: values.open_date,
    ticker: values.ticker,
    strategy: values.strategy,
    option_type: values.option_type,
    direction: values.direction,
    expiration_date: values.expiration_date,
    buying_power: String(values.buying_power),
    buy_price: String(values.buy_price),
    fees: String(values.fees),
    rolls_credit: String(values.rolls_credit),
    last_trade_date: values.last_trade_date,
    strike: String(values.strike),
    entry_price: String(values.entry_price),
    contracts: String(values.contracts),
  };
}

function positiveNumberError(raw: string, label: string): string | undefined {
  const n = Number(raw);
  if (raw.trim() === "" || Number.isNaN(n) || n <= 0) return `${label} must be greater than 0.`;
  return undefined;
}

function nonNegativeNumberError(raw: string, label: string): string | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return `${label} cannot be negative.`;
  return undefined;
}

function validate(form: typeof emptyForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.origin.trim()) errors.origin = "Origin is required.";
  if (!form.strategy.trim()) errors.strategy = "Strategy is required.";

  const ticker = form.ticker.trim().toUpperCase();
  if (!TICKER_PATTERN.test(ticker)) errors.ticker = "Ticker must be 1-5 uppercase letters.";

  if (!form.option_type) errors.option_type = "Option type is required.";
  if (!form.direction) errors.direction = "Direction is required.";

  if (!form.open_date) errors.open_date = "Open date is required.";
  if (!form.expiration_date) errors.expiration_date = "Expiration date is required.";
  if (form.open_date && form.expiration_date && form.expiration_date < form.open_date) {
    errors.expiration_date = "Expiration date must not be before open date.";
  }

  const strikeError = positiveNumberError(form.strike, "Strike");
  if (strikeError) errors.strike = strikeError;

  const entryPriceError = positiveNumberError(form.entry_price, "Entry price");
  if (entryPriceError) errors.entry_price = entryPriceError;

  const contracts = Number(form.contracts);
  if (form.contracts.trim() === "" || Number.isNaN(contracts) || contracts <= 0) {
    errors.contracts = "Contracts must be greater than 0.";
  } else if (contracts !== Math.trunc(contracts)) {
    errors.contracts = "Contracts must be a whole number.";
  }

  const buyingPowerError = positiveNumberError(form.buying_power, "Buying power");
  if (buyingPowerError) errors.buying_power = buyingPowerError;

  const buyPriceError = positiveNumberError(form.buy_price, "Buy price");
  if (buyPriceError) errors.buy_price = buyPriceError;

  const feesError = nonNegativeNumberError(form.fees, "Fees");
  if (feesError) errors.fees = feesError;

  const rollsCreditError = nonNegativeNumberError(form.rolls_credit, "Rolls credit");
  if (rollsCreditError) errors.rolls_credit = rollsCreditError;

  return errors;
}

interface OptionTradeModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: OptionTradeFields;
  onClose: () => void;
  onSubmit: (row: OptionTradeFields) => Promise<void>;
  onDelete?: () => void;
}

export function OptionTradeModal({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
}: OptionTradeModalProps) {
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
        origin: form.origin.trim(),
        open_date: form.open_date,
        ticker: form.ticker.trim().toUpperCase(),
        strategy: form.strategy.trim(),
        option_type: form.option_type,
        direction: form.direction,
        expiration_date: form.expiration_date,
        buying_power: Number(form.buying_power),
        buy_price: Number(form.buy_price),
        fees: form.fees.trim() === "" ? 0 : Number(form.fees),
        rolls_credit: form.rolls_credit.trim() === "" ? 0 : Number(form.rolls_credit),
        last_trade_date: form.last_trade_date,
        strike: Number(form.strike),
        entry_price: Number(form.entry_price),
        contracts: Number(form.contracts),
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

  const title = mode === "edit" ? "Edit Trade" : "Add Trade";
  const submitLabel = mode === "edit" ? "Save" : "Add Trade";
  const inputClass = (field: string) =>
    fieldErrors[field] ? "modal-input modal-input-invalid" : "modal-input";
  const fieldError = (field: string) =>
    fieldErrors[field] ? <div className="modal-field-error">{fieldErrors[field]}</div> : null;

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
                Delete Trade
              </DialogTitle>
            </DialogHeader>

            <div className="modal-fields">
              <p className="text-sm text-muted-foreground">
                Delete this trade? This can&apos;t be undone.
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

            <div className="modal-fields max-h-[60vh] overflow-y-auto pr-1">
              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Origin</label>
                  <input
                    autoFocus
                    className={inputClass("origin")}
                    placeholder="e.g. Sunil"
                    value={form.origin}
                    onChange={(e) => setField("origin", e.target.value)}
                  />
                  {fieldError("origin")}
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Ticker</label>
                  <input
                    className={`${inputClass("ticker")} modal-input-ticker`}
                    placeholder="AAPL"
                    value={form.ticker}
                    onChange={(e) => setField("ticker", e.target.value.toUpperCase())}
                  />
                  {fieldError("ticker")}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Strategy</label>
                  <input
                    className={inputClass("strategy")}
                    placeholder="e.g. CSP"
                    value={form.strategy}
                    onChange={(e) => setField("strategy", e.target.value)}
                  />
                  {fieldError("strategy")}
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Contracts</label>
                  <input
                    type="number"
                    className={inputClass("contracts")}
                    placeholder="0"
                    value={form.contracts}
                    onChange={(e) => setField("contracts", e.target.value)}
                  />
                  {fieldError("contracts")}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Option Type</label>
                  <select
                    className={inputClass("option_type")}
                    value={form.option_type}
                    onChange={(e) => setField("option_type", e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="call">Call</option>
                    <option value="put">Put</option>
                  </select>
                  {fieldError("option_type")}
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Direction</label>
                  <select
                    className={inputClass("direction")}
                    value={form.direction}
                    onChange={(e) => setField("direction", e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="long">Long (Buy)</option>
                    <option value="short">Short (Sell)</option>
                  </select>
                  {fieldError("direction")}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Open Date</label>
                  <input
                    type="date"
                    className={inputClass("open_date")}
                    value={form.open_date}
                    onChange={(e) => setField("open_date", e.target.value)}
                  />
                  {fieldError("open_date")}
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Expiration</label>
                  <input
                    type="date"
                    className={inputClass("expiration_date")}
                    value={form.expiration_date}
                    onChange={(e) => setField("expiration_date", e.target.value)}
                  />
                  {fieldError("expiration_date")}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Last Trade Date</label>
                  <input
                    type="date"
                    className={inputClass("last_trade_date")}
                    value={form.last_trade_date}
                    onChange={(e) => setField("last_trade_date", e.target.value)}
                  />
                  {fieldError("last_trade_date")}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Strike</label>
                  <input
                    type="number"
                    className={inputClass("strike")}
                    placeholder="0.00"
                    value={form.strike}
                    onChange={(e) => setField("strike", e.target.value)}
                  />
                  {fieldError("strike")}
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Entry Price</label>
                  <input
                    type="number"
                    className={inputClass("entry_price")}
                    placeholder="0.00"
                    value={form.entry_price}
                    onChange={(e) => setField("entry_price", e.target.value)}
                  />
                  {fieldError("entry_price")}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Buy Price (Debit)</label>
                  <input
                    type="number"
                    className={inputClass("buy_price")}
                    placeholder="0.00"
                    value={form.buy_price}
                    onChange={(e) => setField("buy_price", e.target.value)}
                  />
                  {fieldError("buy_price")}
                </div>
                <div />
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Buying Power</label>
                  <input
                    type="number"
                    className={inputClass("buying_power")}
                    placeholder="0.00"
                    value={form.buying_power}
                    onChange={(e) => setField("buying_power", e.target.value)}
                  />
                  {fieldError("buying_power")}
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
                  {fieldError("fees")}
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Rolls Credit</label>
                  <input
                    type="number"
                    className={inputClass("rolls_credit")}
                    placeholder="0.00"
                    value={form.rolls_credit}
                    onChange={(e) => setField("rolls_credit", e.target.value)}
                  />
                  {fieldError("rolls_credit")}
                </div>
                <div />
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
