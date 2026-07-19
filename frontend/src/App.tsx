import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createHolding,
  createOptionTrade,
  deleteHolding,
  deleteOptionTrade,
  getHoldings,
  getOptionTrades,
  updateHolding,
  updateOptionTrade,
} from "./api";
import { DashboardView } from "./components/DashboardView";
import { HoldingModal } from "./components/HoldingModal";
import { HoldingsTable } from "./components/HoldingsTable";
import { OptionTradeModal } from "./components/OptionTradeModal";
import { OptionTradesTable } from "./components/OptionTradesTable";
import { PageHeader } from "./components/PageHeader";
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

function computeTotals(holdings: Holding[]): Totals {
  const market_value = holdings.reduce((sum, h) => sum + h.market_value, 0);
  const total_cost = holdings.reduce((sum, h) => sum + h.total_cost, 0);
  return { market_value, total_cost, unrealized_pl: market_value - total_cost };
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

  const handleAddSubmit = async (fields: HoldingFields) => {
    const created = await createHolding(fields);
    setHoldings((prev) => {
      const updated = [...prev, { ...created, clientKey: String(created.id) }];
      setTotals(computeTotals(updated));
      return updated;
    });
    setModal(null);
    toast("Holding added!");
  };

  const handleEditSubmit = async (fields: HoldingFields) => {
    if (modal?.mode !== "edit" || modal.kind !== "holding" || modal.holding.id === null) return;
    const updated = await updateHolding(modal.holding.id, fields);
    setHoldings((prev) => {
      const next = prev.map((row) =>
        row.clientKey === modal.holding.clientKey
          ? { ...updated, clientKey: String(updated.id) }
          : row,
      );
      setTotals(computeTotals(next));
      return next;
    });
    setModal(null);
    toast("Holding updated!");
  };

  const handleDeleteHolding = async () => {
    if (modal?.mode !== "edit" || modal.kind !== "holding" || modal.holding.id === null) return;
    await deleteHolding(modal.holding.id);
    setHoldings((prev) => {
      const next = prev.filter((row) => row.clientKey !== modal.holding.clientKey);
      setTotals(computeTotals(next));
      return next;
    });
    setModal(null);
    toast("Holding deleted!");
  };

  type OptionTradeFields = Pick<
    OptionTrade,
    | "origin"
    | "open_date"
    | "ticker"
    | "strategy"
    | "option_type"
    | "direction"
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

  const handleAddTradeSubmit = async (fields: OptionTradeFields) => {
    const created = await createOptionTrade(fields);
    setOptionTrades((prev) => [...prev, { ...created, clientKey: String(created.id) }]);
    setModal(null);
    toast("Trade added!");
  };

  const handleEditTradeSubmit = async (fields: OptionTradeFields) => {
    if (modal?.mode !== "edit" || modal.kind !== "trade" || modal.trade.id === null) return;
    const updated = await updateOptionTrade(modal.trade.id, fields);
    setOptionTrades((prev) =>
      prev.map((row) =>
        row.clientKey === modal.trade.clientKey
          ? { ...updated, clientKey: String(updated.id) }
          : row,
      ),
    );
    setModal(null);
    toast("Trade updated!");
  };

  const handleDeleteTrade = async () => {
    if (modal?.mode !== "edit" || modal.kind !== "trade" || modal.trade.id === null) return;
    await deleteOptionTrade(modal.trade.id);
    setOptionTrades((prev) => prev.filter((row) => row.clientKey !== modal.trade.clientKey));
    setModal(null);
    toast("Trade deleted!");
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
            <PageHeader />
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
            <PageHeader />
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
