import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getHoldings, saveHoldings } from "./api";
import { DashboardView } from "./components/DashboardView";
import { HoldingModal } from "./components/HoldingModal";
import { HoldingsTable } from "./components/HoldingsTable";
import { StatCards } from "./components/StatCards";
import { TabDock, type Tab } from "./components/TabDock";
import { Toaster } from "./components/ui/sonner";
import type { Holding, HoldingsResponse, Totals } from "./types";

const REFRESH_INTERVAL_MS = 30_000;

type ModalState = { mode: "add" } | { mode: "edit"; holding: Holding } | null;

function withClientKeys(response: HoldingsResponse): Holding[] {
  return response.holdings.map((h) => ({ ...h, clientKey: String(h.id) }));
}

export default function App() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totals, setTotals] = useState<Totals>({
    market_value: 0,
    total_cost: 0,
    unrealized_pl: 0,
  });
  const [modal, setModal] = useState<ModalState>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const modalOpenRef = useRef(modal !== null);
  const nextTempId = useRef(0);

  modalOpenRef.current = modal !== null;

  const applyResponse = useCallback((response: HoldingsResponse) => {
    setHoldings(withClientKeys(response));
    setTotals(response.totals);
  }, []);

  useEffect(() => {
    getHoldings().then(applyResponse);

    const interval = window.setInterval(() => {
      if (modalOpenRef.current) return;
      getHoldings().then(applyResponse);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [applyResponse]);

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
    if (modal?.mode !== "edit") return;
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
    if (modal?.mode !== "edit") return;
    const updated = holdings.filter((row) => row.clientKey !== modal.holding.clientKey);
    setModal(null);
    saveHoldings(updated).then((response) => {
      applyResponse(response);
      toast("Holding deleted!");
    });
  };

  return (
    <div className="page">
      <div className="dashboard">
        {tab === "dashboard" ? (
          <div className="dashboard-body dashboard-body-with-dock">
            <DashboardView totals={totals} holdings={holdings} />
          </div>
        ) : (
          <div className="dashboard-body dashboard-body-with-dock">
            <h1 className="dashboard-title">Folio</h1>
            <StatCards totals={totals} />
            <div className="refresh-caption">Prices refresh every 30s.</div>
            <HoldingsTable
              holdings={holdings}
              onEdit={(clientKey) => {
                const holding = holdings.find((h) => h.clientKey === clientKey);
                if (holding) setModal({ mode: "edit", holding });
              }}
              onAddOpen={() => setModal({ mode: "add" })}
            />
          </div>
        )}
        <TabDock active={tab} onChange={setTab} />
      </div>
      <HoldingModal
        open={modal !== null}
        mode={modal?.mode ?? "add"}
        initialValues={modal?.mode === "edit" ? modal.holding : undefined}
        onClose={() => setModal(null)}
        onSubmit={modal?.mode === "edit" ? handleEditSubmit : handleAddSubmit}
        onDelete={modal?.mode === "edit" ? handleDeleteHolding : undefined}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}
