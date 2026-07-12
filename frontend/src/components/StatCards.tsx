import { fmtPL, fmtUSD } from "../format";
import type { Totals } from "../types";

export function StatCards({ totals }: { totals: Totals }) {
  const plClass = totals.unrealized_pl >= 0 ? "positive" : "negative";

  return (
    <div className="stat-cards">
      <div className="stat-card">
        <span className="stat-card-label">Market Value</span>
        <span className="stat-card-value">{fmtUSD(totals.market_value)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">Total Cost</span>
        <span className="stat-card-value">{fmtUSD(totals.total_cost)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">Unrealized P/L</span>
        <span className={`stat-card-value ${plClass}`}>{fmtPL(totals.unrealized_pl)}</span>
      </div>
    </div>
  );
}
