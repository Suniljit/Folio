import { AddHoldingButton } from "./AddHoldingButton";
import { HoldingRow } from "./HoldingRow";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "./ui/table";
import type { Holding } from "../types";

interface HoldingsTableProps {
  holdings: Holding[];
  onChange: (clientKey: string, field: keyof Holding, value: string) => void;
  onDelete: (clientKey: string) => void;
  onAddOpen: () => void;
}

const columnWidths = ["18%", "9%", "9%", "10%", "9%", "11%", "11%", "11%", "12%", "40px"];

const headerClass =
  "h-auto whitespace-normal px-1 py-3.5 text-[11px] tracking-[0.04em] uppercase text-muted-foreground first:pl-5 last:pr-5";

export function HoldingsTable({ holdings, onChange, onDelete, onAddOpen }: HoldingsTableProps) {
  return (
    <div className="holdings-panel">
      <Table className="table-fixed">
        <colgroup>
          {columnWidths.map((width, i) => (
            <col key={i} style={{ width }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="border-b-[var(--color-table-header-border)] hover:bg-transparent">
            <TableHead className={headerClass}>Company</TableHead>
            <TableHead className={headerClass}>Ticker</TableHead>
            <TableHead className={headerClass}>Shares</TableHead>
            <TableHead className={headerClass}>Avg Price</TableHead>
            <TableHead className={headerClass}>Fees</TableHead>
            <TableHead className={headerClass}>Current</TableHead>
            <TableHead className={headerClass}>Total Cost</TableHead>
            <TableHead className={headerClass}>Mkt Value</TableHead>
            <TableHead className={headerClass}>Unreal. P/L</TableHead>
            <TableHead className={headerClass} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => (
            <HoldingRow key={h.clientKey} holding={h} onChange={onChange} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
      <AddHoldingButton onOpen={onAddOpen} />
    </div>
  );
}
