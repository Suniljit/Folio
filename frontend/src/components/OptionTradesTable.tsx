import { AddOptionTradeButton } from "./AddOptionTradeButton";
import { OptionTradeRow } from "./OptionTradeRow";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "./ui/table";
import type { OptionTrade } from "../types";

interface OptionTradesTableProps {
  optionTrades: OptionTrade[];
  onEdit: (clientKey: string) => void;
  onAddOpen: () => void;
}

const columnWidths = [
  "90px",
  "100px",
  "80px",
  "110px",
  "100px",
  "110px",
  "100px",
  "80px",
  "100px",
  "110px",
  "80px",
  "100px",
  "70px",
  "100px",
  "90px",
  "70px",
];

const headerClass =
  "h-auto whitespace-normal px-1 py-3.5 text-[11px] tracking-[0.04em] uppercase text-muted-foreground first:pl-5 last:pr-5";

export function OptionTradesTable({ optionTrades, onEdit, onAddOpen }: OptionTradesTableProps) {
  return (
    <div className="trades-panel">
      <Table className="table-fixed">
        <colgroup>
          {columnWidths.map((width, i) => (
            <col key={i} style={{ width }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="border-b-[var(--color-table-header-border)] hover:bg-transparent">
            <TableHead className={headerClass}>Origin</TableHead>
            <TableHead className={headerClass}>Open Date</TableHead>
            <TableHead className={headerClass}>Ticker</TableHead>
            <TableHead className={headerClass}>Strategy</TableHead>
            <TableHead className={headerClass}>Expiration</TableHead>
            <TableHead className={headerClass}>Buying Power</TableHead>
            <TableHead className={headerClass}>Buy Price</TableHead>
            <TableHead className={headerClass}>Fees</TableHead>
            <TableHead className={headerClass}>Rolls Credit</TableHead>
            <TableHead className={headerClass}>Last Trade</TableHead>
            <TableHead className={headerClass}>Strike</TableHead>
            <TableHead className={headerClass}>Entry Price</TableHead>
            <TableHead className={headerClass}>Qty</TableHead>
            <TableHead className={headerClass}>Entry Value</TableHead>
            <TableHead className={headerClass}>Rem. DTE</TableHead>
            <TableHead className={headerClass} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {optionTrades.map((t) => (
            <OptionTradeRow key={t.clientKey} trade={t} onEdit={onEdit} />
          ))}
        </TableBody>
      </Table>
      <AddOptionTradeButton onOpen={onAddOpen} />
    </div>
  );
}
