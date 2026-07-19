import { useEffect, useState } from "react";
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

interface OptionTradeModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: OptionTradeFields;
  onClose: () => void;
  onSubmit: (row: OptionTradeFields) => void;
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
    const origin = form.origin.trim();
    const ticker = form.ticker.trim();
    if (!origin || !ticker) {
      setError("Origin and ticker are required.");
      return;
    }
    if (!form.direction) {
      setError("Direction is required.");
      return;
    }
    onSubmit({
      origin,
      open_date: form.open_date,
      ticker: ticker.toUpperCase(),
      strategy: form.strategy.trim(),
      option_type: form.option_type,
      direction: form.direction,
      expiration_date: form.expiration_date,
      buying_power: parseFloat(form.buying_power) || 0,
      buy_price: parseFloat(form.buy_price) || 0,
      fees: parseFloat(form.fees) || 0,
      rolls_credit: parseFloat(form.rolls_credit) || 0,
      last_trade_date: form.last_trade_date,
      strike: parseFloat(form.strike) || 0,
      entry_price: parseFloat(form.entry_price) || 0,
      contracts: Math.abs(parseFloat(form.contracts) || 0),
    });
    setForm(emptyForm);
    setError("");
  };

  const title = mode === "edit" ? "Edit Trade" : "Add Trade";
  const submitLabel = mode === "edit" ? "Save" : "Add Trade";

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
                    className="modal-input"
                    placeholder="e.g. Sunil"
                    value={form.origin}
                    onChange={(e) => setField("origin", e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Ticker</label>
                  <input
                    className="modal-input modal-input-ticker"
                    placeholder="AAPL"
                    value={form.ticker}
                    onChange={(e) => setField("ticker", e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Strategy</label>
                  <input
                    className="modal-input"
                    placeholder="e.g. CSP"
                    value={form.strategy}
                    onChange={(e) => setField("strategy", e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Contracts</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="0"
                    value={form.contracts}
                    onChange={(e) => setField("contracts", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Option Type</label>
                  <select
                    className="modal-input"
                    value={form.option_type}
                    onChange={(e) => setField("option_type", e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="call">Call</option>
                    <option value="put">Put</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Direction</label>
                  <select
                    className="modal-input"
                    value={form.direction}
                    onChange={(e) => setField("direction", e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="long">Long (Buy)</option>
                    <option value="short">Short (Sell)</option>
                  </select>
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Open Date</label>
                  <input
                    type="date"
                    className="modal-input"
                    value={form.open_date}
                    onChange={(e) => setField("open_date", e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Expiration</label>
                  <input
                    type="date"
                    className="modal-input"
                    value={form.expiration_date}
                    onChange={(e) => setField("expiration_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Last Trade Date</label>
                  <input
                    type="date"
                    className="modal-input"
                    value={form.last_trade_date}
                    onChange={(e) => setField("last_trade_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Strike</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="0.00"
                    value={form.strike}
                    onChange={(e) => setField("strike", e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-field-label">Entry Price</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="0.00"
                    value={form.entry_price}
                    onChange={(e) => setField("entry_price", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Buy Price (Debit)</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="0.00"
                    value={form.buy_price}
                    onChange={(e) => setField("buy_price", e.target.value)}
                  />
                </div>
                <div />
              </div>

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Buying Power</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="0.00"
                    value={form.buying_power}
                    onChange={(e) => setField("buying_power", e.target.value)}
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

              <div className="modal-field-row">
                <div className="modal-field">
                  <label className="modal-field-label">Rolls Credit</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="0.00"
                    value={form.rolls_credit}
                    onChange={(e) => setField("rolls_credit", e.target.value)}
                  />
                </div>
                <div />
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
