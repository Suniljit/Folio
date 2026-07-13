import { Card, CardContent } from "./ui/card";
import { fmtPL, fmtUSD } from "../format";
import type { Totals } from "../types";

const cardClassName =
  "gap-2 rounded-[20px] border border-[var(--color-card-border)] bg-card/70 py-5 ring-0 backdrop-blur-md";

export function StatCards({ totals }: { totals: Totals }) {
  const plClass = totals.unrealized_pl >= 0 ? "positive" : "negative";

  return (
    <div className="stat-cards">
      <Card className={cardClassName}>
        <CardContent className="flex flex-col gap-2">
          <span className="stat-card-label">Market Value</span>
          <span className="stat-card-value">{fmtUSD(totals.market_value)}</span>
        </CardContent>
      </Card>
      <Card className={cardClassName}>
        <CardContent className="flex flex-col gap-2">
          <span className="stat-card-label">Total Cost</span>
          <span className="stat-card-value">{fmtUSD(totals.total_cost)}</span>
        </CardContent>
      </Card>
      <Card className={cardClassName}>
        <CardContent className="flex flex-col gap-2">
          <span className="stat-card-label">Unrealized P/L</span>
          <span className={`stat-card-value ${plClass}`}>{fmtPL(totals.unrealized_pl)}</span>
        </CardContent>
      </Card>
    </div>
  );
}
