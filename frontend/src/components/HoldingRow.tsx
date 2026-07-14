import { TableCell, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { fmtPL, fmtUSD } from "../format";
import type { Holding } from "../types";

interface HoldingRowProps {
  holding: Holding;
  onEdit: (clientKey: string) => void;
}

export function HoldingRow({ holding, onEdit }: HoldingRowProps) {
  const plClass = holding.unrealized_pl >= 0 ? "positive" : "negative";

  return (
    <TableRow className="border-b-[var(--row-separator)] hover:bg-transparent">
      <TableCell className="py-2 pr-1 pl-5">{holding.company_name}</TableCell>
      <TableCell className="px-1 py-2">{holding.ticker}</TableCell>
      <TableCell className="px-1 py-2">{holding.shares_owned}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(holding.avg_price)}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(holding.fees)}</TableCell>
      <TableCell className="cell-computed px-1 py-2">{fmtUSD(holding.current_price)}</TableCell>
      <TableCell className="cell-computed px-1 py-2">{fmtUSD(holding.total_cost)}</TableCell>
      <TableCell className="cell-computed px-1 py-2">{fmtUSD(holding.market_value)}</TableCell>
      <TableCell className={`cell-computed px-1 py-2 ${plClass}`}>
        {fmtPL(holding.unrealized_pl)}
      </TableCell>
      <TableCell className="py-2 pr-5 pl-1 text-center">
        <Button type="button" variant="outline" size="xs" onClick={() => onEdit(holding.clientKey)}>
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
}
