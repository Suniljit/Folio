import { nyseOpen, useClockTick, zoneDate, zoneTime } from "../hooks/useClock";

export function PageHeader() {
  const now = useClockTick();
  const isOpen = nyseOpen(now);

  return (
    <div className="dashboard-header-row">
      <h1 className="dashboard-title">Folio</h1>
      <div className="clock-chips">
        <div className="clock-chip">
          <span className="clock-chip-label">Singapore</span>
          <div className="clock-chip-values">
            <span className="clock-chip-time">{zoneTime(now, "Asia/Singapore")}</span>
            <span className="clock-chip-date">{zoneDate(now, "Asia/Singapore")}</span>
          </div>
        </div>
        <div className="clock-chip">
          <span className="clock-chip-label">NYSE</span>
          <div className="clock-chip-values">
            <span className="clock-chip-time">{zoneTime(now, "America/New_York")}</span>
            <span className="clock-chip-date">{zoneDate(now, "America/New_York")}</span>
          </div>
          <span className={`market-status ${isOpen ? "open" : "closed"}`}>
            <span className="market-status-dot" />
            {isOpen ? "Market Open" : "Market Closed"}
          </span>
        </div>
      </div>
    </div>
  );
}
