import { fmtPL, fmtUSD } from "../format";
import type { Holding } from "../types";

interface HoldingRowProps {
  holding: Holding;
  onChange: (clientKey: string, field: keyof Holding, value: string) => void;
  onDelete: (clientKey: string) => void;
}

export function HoldingRow({ holding, onChange, onDelete }: HoldingRowProps) {
  const plClass = holding.unrealized_pl >= 0 ? "positive" : "negative";

  return (
    <div className="holdings-row">
      <input
        className="cell-input"
        value={holding.company_name}
        onChange={(e) => onChange(holding.clientKey, "company_name", e.target.value)}
      />
      <input
        className="cell-input ticker-input"
        value={holding.ticker}
        onChange={(e) => onChange(holding.clientKey, "ticker", e.target.value.toUpperCase())}
      />
      <input
        type="number"
        className="cell-input"
        value={holding.shares_owned}
        onChange={(e) => onChange(holding.clientKey, "shares_owned", e.target.value)}
      />
      <input
        type="number"
        className="cell-input"
        value={holding.avg_price}
        onChange={(e) => onChange(holding.clientKey, "avg_price", e.target.value)}
      />
      <input
        type="number"
        className="cell-input"
        value={holding.fees}
        onChange={(e) => onChange(holding.clientKey, "fees", e.target.value)}
      />
      <span className="cell-computed">{fmtUSD(holding.current_price)}</span>
      <span className="cell-computed">{fmtUSD(holding.total_cost)}</span>
      <span className="cell-computed">{fmtUSD(holding.market_value)}</span>
      <span className={`cell-computed ${plClass}`}>{fmtPL(holding.unrealized_pl)}</span>
      <button
        type="button"
        className="delete-button"
        onClick={() => onDelete(holding.clientKey)}
        aria-label="Delete holding"
      >
        ×
      </button>
    </div>
  );
}
