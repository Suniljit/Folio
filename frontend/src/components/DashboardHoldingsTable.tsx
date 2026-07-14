import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { fmtPL, fmtUSD } from "../format";
import type { Holding } from "../types";

interface DashboardHoldingsTableProps {
  holdings: Holding[];
}

const columnWidths = ["2.2fr", "1fr", "1fr", "1fr", "1fr"];

const headerClass =
  "h-auto whitespace-normal px-1 py-3.5 text-[11px] tracking-[0.04em] uppercase text-muted-foreground first:pl-5 last:pr-5";

export function DashboardHoldingsTable({ holdings }: DashboardHoldingsTableProps) {
  return (
    <div className="holdings-panel">
      <Table style={{ tableLayout: "fixed" }}>
        <colgroup>
          {columnWidths.map((width, i) => (
            <col key={i} style={{ width }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="border-b-[var(--color-table-header-border)] hover:bg-transparent">
            <TableHead className={headerClass}>Holding</TableHead>
            <TableHead className={headerClass}>Shares</TableHead>
            <TableHead className={headerClass}>Price</TableHead>
            <TableHead className={headerClass}>Value</TableHead>
            <TableHead className={headerClass}>Unreal. P/L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => {
            const plClass = h.unrealized_pl >= 0 ? "positive" : "negative";
            return (
              <TableRow key={h.clientKey} className="border-b-[var(--row-separator)] hover:bg-transparent">
                <TableCell className="py-2 pr-1 pl-5">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-gold)]">{h.ticker}</span>
                    <span className="text-[var(--color-text-dim)]">{h.company_name}</span>
                  </span>
                </TableCell>
                <TableCell className="cell-computed px-1 py-2">{h.shares_owned}</TableCell>
                <TableCell className="cell-computed px-1 py-2">{fmtUSD(h.current_price)}</TableCell>
                <TableCell className="cell-computed px-1 py-2">{fmtUSD(h.market_value)}</TableCell>
                <TableCell className={`cell-computed px-1 py-2 ${plClass}`}>
                  {fmtPL(h.unrealized_pl)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
