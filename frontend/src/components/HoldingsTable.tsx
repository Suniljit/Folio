import { AddHoldingButton } from "./AddHoldingButton";
import { HoldingRow } from "./HoldingRow";
import type { Holding } from "../types";

interface HoldingsTableProps {
  holdings: Holding[];
  onChange: (clientKey: string, field: keyof Holding, value: string) => void;
  onDelete: (clientKey: string) => void;
  onAdd: () => void;
}

export function HoldingsTable({ holdings, onChange, onDelete, onAdd }: HoldingsTableProps) {
  return (
    <div className="holdings-panel">
      <div className="holdings-header-row">
        <span>Company</span>
        <span>Ticker</span>
        <span>Shares</span>
        <span>Avg Price</span>
        <span>Fees</span>
        <span>Current</span>
        <span>Total Cost</span>
        <span>Mkt Value</span>
        <span>Unreal. P/L</span>
        <span></span>
      </div>
      {holdings.map((h) => (
        <HoldingRow key={h.clientKey} holding={h} onChange={onChange} onDelete={onDelete} />
      ))}
      <AddHoldingButton onAdd={onAdd} />
    </div>
  );
}
