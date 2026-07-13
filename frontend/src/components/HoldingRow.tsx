import { TableCell, TableRow } from "./ui/table";
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
    <TableRow className="border-b-[var(--row-separator)] hover:bg-transparent">
      <TableCell className="py-2 pr-1 pl-5">
        <input
          className="cell-input"
          value={holding.company_name}
          onChange={(e) => onChange(holding.clientKey, "company_name", e.target.value)}
        />
      </TableCell>
      <TableCell className="px-1 py-2">
        <input
          className="cell-input ticker-input"
          value={holding.ticker}
          onChange={(e) => onChange(holding.clientKey, "ticker", e.target.value.toUpperCase())}
        />
      </TableCell>
      <TableCell className="px-1 py-2">
        <input
          type="number"
          className="cell-input"
          value={holding.shares_owned}
          onChange={(e) => onChange(holding.clientKey, "shares_owned", e.target.value)}
        />
      </TableCell>
      <TableCell className="px-1 py-2">
        <input
          type="number"
          className="cell-input"
          value={holding.avg_price}
          onChange={(e) => onChange(holding.clientKey, "avg_price", e.target.value)}
        />
      </TableCell>
      <TableCell className="px-1 py-2">
        <input
          type="number"
          className="cell-input"
          value={holding.fees}
          onChange={(e) => onChange(holding.clientKey, "fees", e.target.value)}
        />
      </TableCell>
      <TableCell className="cell-computed px-1 py-2">{fmtUSD(holding.current_price)}</TableCell>
      <TableCell className="cell-computed px-1 py-2">{fmtUSD(holding.total_cost)}</TableCell>
      <TableCell className="cell-computed px-1 py-2">{fmtUSD(holding.market_value)}</TableCell>
      <TableCell className={`cell-computed px-1 py-2 ${plClass}`}>
        {fmtPL(holding.unrealized_pl)}
      </TableCell>
      <TableCell className="py-2 pr-5 pl-1 text-center">
        <button
          type="button"
          className="delete-button"
          onClick={() => onDelete(holding.clientKey)}
          aria-label="Delete holding"
        >
          ×
        </button>
      </TableCell>
    </TableRow>
  );
}
