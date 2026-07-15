import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getHoldings, getOptionTrades, saveHoldings, saveOptionTrades } from "./api";
import { DashboardView } from "./components/DashboardView";
import { HoldingModal } from "./components/HoldingModal";
import { HoldingsTable } from "./components/HoldingsTable";
import { OptionTradeModal } from "./components/OptionTradeModal";
import { OptionTradesTable } from "./components/OptionTradesTable";
import { StatCards } from "./components/StatCards";
import { TabDock, type Tab } from "./components/TabDock";
import { Toaster } from "./components/ui/sonner";
import type { Holding, HoldingsResponse, OptionTrade, OptionTradesResponse, Totals } from "./types";

const REFRESH_INTERVAL_MS = 30_000;

type ModalState =
  | { mode: "add"; kind: "holding" }
  | { mode: "edit"; kind: "holding"; holding: Holding }
  | { mode: "add"; kind: "trade" }
  | { mode: "edit"; kind: "trade"; trade: OptionTrade }
  | null;

function withClientKeys(response: HoldingsResponse): Holding[] {
  return response.holdings.map((h) => ({ ...h, clientKey: String(h.id) }));
}

function withOptionTradeClientKeys(response: OptionTradesResponse): OptionTrade[] {
  return response.option_trades.map((t) => ({ ...t, clientKey: String(t.id) }));
}

export default function App() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totals, setTotals] = useState<Totals>({
    market_value: 0,
    total_cost: 0,
    unrealized_pl: 0,
  });
  const [optionTrades, setOptionTrades] = useState<OptionTrade[]>([]);
  const [ibkrConnected, setIbkrConnected] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const modalOpenRef = useRef(modal !== null);
  const nextTempId = useRef(0);
  const nextTradeTempId = useRef(0);

  modalOpenRef.current = modal !== null;

  const applyResponse = useCallback((response: HoldingsResponse) => {
    setHoldings(withClientKeys(response));
    setTotals(response.totals);
  }, []);

  const applyOptionTradesResponse = useCallback((response: OptionTradesResponse) => {
    setOptionTrades(withOptionTradeClientKeys(response));
    setIbkrConnected(response.ibkr_connected);
  }, []);

  useEffect(() => {
    getHoldings().then(applyResponse);
    getOptionTrades().then(applyOptionTradesResponse);

    const interval = window.setInterval(() => {
      if (modalOpenRef.current) return;
      getHoldings().then(applyResponse);
      getOptionTrades().then(applyOptionTradesResponse);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [applyResponse, applyOptionTradesResponse]);

  type HoldingFields = Pick<
    Holding,
    "company_name" | "ticker" | "shares_owned" | "avg_price" | "fees"
  >;

  const handleAddSubmit = (fields: HoldingFields) => {
    nextTempId.current -= 1;
    const row: Holding = {
      id: null,
      clientKey: `new-${nextTempId.current}`,
      ...fields,
      current_price: 0,
      total_cost: 0,
      market_value: 0,
      unrealized_pl: 0,
    };
    const updated = [...holdings, row];
    setModal(null);
    saveHoldings(updated).then((response) => {
      applyResponse(response);
      toast("Holding added!");
    });
  };

  const handleEditSubmit = (fields: HoldingFields) => {
    if (modal?.mode !== "edit" || modal.kind !== "holding") return;
    const updated = holdings.map((row) =>
      row.clientKey === modal.holding.clientKey ? { ...row, ...fields } : row,
    );
    setModal(null);
    saveHoldings(updated).then((response) => {
      applyResponse(response);
      toast("Holding updated!");
    });
  };

  const handleDeleteHolding = () => {
    if (modal?.mode !== "edit" || modal.kind !== "holding") return;
    const updated = holdings.filter((row) => row.clientKey !== modal.holding.clientKey);
    setModal(null);
    saveHoldings(updated).then((response) => {
      applyResponse(response);
      toast("Holding deleted!");
    });
  };

  type OptionTradeFields = Pick<
    OptionTrade,
    | "origin"
    | "open_date"
    | "ticker"
    | "strategy"
    | "option_type"
    | "expiration_date"
    | "buying_power"
    | "buy_price"
    | "fees"
    | "rolls_credit"
    | "last_trade_date"
    | "strike"
    | "entry_price"
    | "contracts"
  >;

  const handleAddTradeSubmit = (fields: OptionTradeFields) => {
    nextTradeTempId.current -= 1;
    const row: OptionTrade = {
      id: null,
      clientKey: `new-${nextTradeTempId.current}`,
      ...fields,
      entry_value: 0,
      remaining_dte: 0,
      current_price: 0,
      pl_open: 0,
      pct_pl: 0,
      total_pl: 0,
      roi: 0,
    };
    const updated = [...optionTrades, row];
    setModal(null);
    saveOptionTrades(updated).then((response) => {
      applyOptionTradesResponse(response);
      toast("Trade added!");
    });
  };

  const handleEditTradeSubmit = (fields: OptionTradeFields) => {
    if (modal?.mode !== "edit" || modal.kind !== "trade") return;
    const updated = optionTrades.map((row) =>
      row.clientKey === modal.trade.clientKey ? { ...row, ...fields } : row,
    );
    setModal(null);
    saveOptionTrades(updated).then((response) => {
      applyOptionTradesResponse(response);
      toast("Trade updated!");
    });
  };

  const handleDeleteTrade = () => {
    if (modal?.mode !== "edit" || modal.kind !== "trade") return;
    const updated = optionTrades.filter((row) => row.clientKey !== modal.trade.clientKey);
    setModal(null);
    saveOptionTrades(updated).then((response) => {
      applyOptionTradesResponse(response);
      toast("Trade deleted!");
    });
  };

  return (
    <div className="page">
      <div className="dashboard">
        {tab === "dashboard" ? (
          <div className="dashboard-body dashboard-body-with-dock">
            <DashboardView totals={totals} holdings={holdings} />
          </div>
        ) : tab === "holdings" ? (
          <div className="dashboard-body dashboard-body-with-dock">
            <h1 className="dashboard-title">Folio</h1>
            <StatCards totals={totals} />
            <div className="refresh-caption">Prices refresh every 30s.</div>
            <HoldingsTable
              holdings={holdings}
              onEdit={(clientKey) => {
                const holding = holdings.find((h) => h.clientKey === clientKey);
                if (holding) setModal({ mode: "edit", kind: "holding", holding });
              }}
              onAddOpen={() => setModal({ mode: "add", kind: "holding" })}
            />
          </div>
        ) : (
          <div className="dashboard-body dashboard-body-with-dock">
            <h1 className="dashboard-title">Folio</h1>
            <OptionTradesTable
              optionTrades={optionTrades}
              ibkrConnected={ibkrConnected}
              onEdit={(clientKey) => {
                const trade = optionTrades.find((t) => t.clientKey === clientKey);
                if (trade) setModal({ mode: "edit", kind: "trade", trade });
              }}
              onAddOpen={() => setModal({ mode: "add", kind: "trade" })}
            />
          </div>
        )}
        <TabDock active={tab} onChange={setTab} />
      </div>
      <HoldingModal
        open={modal?.kind === "holding"}
        mode={modal?.mode ?? "add"}
        initialValues={
          modal?.mode === "edit" && modal.kind === "holding" ? modal.holding : undefined
        }
        onClose={() => setModal(null)}
        onSubmit={modal?.mode === "edit" ? handleEditSubmit : handleAddSubmit}
        onDelete={
          modal?.mode === "edit" && modal.kind === "holding" ? handleDeleteHolding : undefined
        }
      />
      <OptionTradeModal
        open={modal?.kind === "trade"}
        mode={modal?.mode ?? "add"}
        initialValues={modal?.mode === "edit" && modal.kind === "trade" ? modal.trade : undefined}
        onClose={() => setModal(null)}
        onSubmit={modal?.mode === "edit" ? handleEditTradeSubmit : handleAddTradeSubmit}
        onDelete={modal?.mode === "edit" && modal.kind === "trade" ? handleDeleteTrade : undefined}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}
