import { Card, CardContent } from "./ui/card";
import { DashboardHoldingsTable } from "./DashboardHoldingsTable";
import { nyseOpen, useClockTick, zoneTime } from "../hooks/useClock";
import { fmtPL, fmtUSD } from "../format";
import type { Holding, Totals } from "../types";

const cardClassName =
  "gap-2 rounded-[20px] border border-[var(--color-card-border)] bg-card/70 py-5 ring-0 backdrop-blur-md";

// Placeholder data — no options backend exists yet.
const mockOptions = {
  optionsValue: 18240.5,
  optionsPl: 1120.35,
  openPositions: 6,
  expiringNote: "2 contracts expire within 5 days",
};

interface DashboardViewProps {
  totals: Totals;
  holdings: Holding[];
}

export function DashboardView({ totals, holdings }: DashboardViewProps) {
  const now = useClockTick();
  const isOpen = nyseOpen(now);
  const portfolioPlClass = totals.unrealized_pl >= 0 ? "positive" : "negative";
  const optionsPlClass = mockOptions.optionsPl >= 0 ? "positive" : "negative";

  return (
    <>
      <div className="dashboard-header-row">
        <h1 className="dashboard-title">Folio</h1>
        <div className="clock-chips">
          <div className="clock-chip">
            <span className="clock-chip-label">Singapore</span>
            <span className="clock-chip-time">{zoneTime(now, "Asia/Singapore")}</span>
          </div>
          <div className="clock-chip">
            <span className="clock-chip-label">NYSE</span>
            <span className="clock-chip-time">{zoneTime(now, "America/New_York")}</span>
            <span className={`market-status ${isOpen ? "open" : "closed"}`}>
              <span className="market-status-dot" />
              {isOpen ? "Market Open" : "Market Closed"}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <span className="dashboard-section-label">Portfolio</span>
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
              <span className="stat-card-label">Unreal. P/L</span>
              <span className={`stat-card-value ${portfolioPlClass}`}>
                {fmtPL(totals.unrealized_pl)}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="dashboard-section">
        <span className="dashboard-section-label">Options</span>
        <div className="stat-cards">
          <Card className={cardClassName}>
            <CardContent className="flex flex-col gap-2">
              <span className="stat-card-label">Options Value</span>
              <span className="stat-card-value">{fmtUSD(mockOptions.optionsValue)}</span>
              <span className={`options-pl ${optionsPlClass}`}>{fmtPL(mockOptions.optionsPl)}</span>
            </CardContent>
          </Card>
          <Card className={cardClassName}>
            <CardContent className="flex flex-col gap-2">
              <span className="stat-card-label">Open Positions</span>
              <span className="stat-card-value">{mockOptions.openPositions}</span>
            </CardContent>
          </Card>
          <Card className="gap-2 rounded-[20px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] py-5 ring-0">
            <CardContent className="flex flex-col gap-2">
              <span className="warning-card-label">Expiring Soon</span>
              <span className="warning-card-value">{mockOptions.expiringNote}</span>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="dashboard-section">
        <span className="dashboard-section-label">Top Holdings</span>
        <DashboardHoldingsTable holdings={holdings} />
      </div>
    </>
  );
}
