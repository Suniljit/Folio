import { TableCell, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { fmtUSD } from "../format";
import type { OptionTrade } from "../types";

interface OptionTradeRowProps {
  trade: OptionTrade;
  onEdit: (clientKey: string) => void;
}

export function OptionTradeRow({ trade, onEdit }: OptionTradeRowProps) {
  return (
    <TableRow className="border-b-[var(--row-separator)] hover:bg-transparent">
      <TableCell className="py-2 pr-1 pl-5">{trade.origin}</TableCell>
      <TableCell className="px-1 py-2">{trade.open_date}</TableCell>
      <TableCell className="px-1 py-2">{trade.ticker}</TableCell>
      <TableCell className="px-1 py-2">{trade.strategy}</TableCell>
      <TableCell className="px-1 py-2">{trade.expiration_date}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(trade.buying_power)}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(trade.buy_price)}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(trade.fees)}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(trade.rolls_credit)}</TableCell>
      <TableCell className="px-1 py-2">{trade.last_trade_date}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(trade.strike)}</TableCell>
      <TableCell className="px-1 py-2">{fmtUSD(trade.entry_price)}</TableCell>
      <TableCell className="px-1 py-2">{trade.qty}</TableCell>
      <TableCell className="cell-computed px-1 py-2">{fmtUSD(trade.entry_value)}</TableCell>
      <TableCell className="cell-computed px-1 py-2">{trade.remaining_dte}</TableCell>
      <TableCell className="py-2 pr-5 pl-1 text-center">
        <Button type="button" variant="outline" size="xs" onClick={() => onEdit(trade.clientKey)}>
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
}
