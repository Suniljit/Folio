import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getHoldings, saveHoldings } from "./api";
import { AddHoldingModal } from "./components/AddHoldingModal";
import { HoldingsTable } from "./components/HoldingsTable";
import { SaveButton } from "./components/SaveButton";
import { StatCards } from "./components/StatCards";
import { Toaster } from "./components/ui/sonner";
import type { Holding, HoldingsResponse, Totals } from "./types";

const REFRESH_INTERVAL_MS = 30_000;

function withClientKeys(response: HoldingsResponse): Holding[] {
  return response.holdings.map((h) => ({ ...h, clientKey: String(h.id) }));
}

function isDirty(draft: Holding[], saved: Holding[]): boolean {
  const strip = (rows: Holding[]) => rows.map(({ clientKey: _clientKey, ...rest }) => rest);
  return JSON.stringify(strip(draft)) !== JSON.stringify(strip(saved));
}

export default function App() {
  const [savedHoldings, setSavedHoldings] = useState<Holding[]>([]);
  const [draftHoldings, setDraftHoldings] = useState<Holding[]>([]);
  const [totals, setTotals] = useState<Totals>({
    market_value: 0,
    total_cost: 0,
    unrealized_pl: 0,
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const draftRef = useRef(draftHoldings);
  const savedRef = useRef(savedHoldings);
  const addModalOpenRef = useRef(addModalOpen);
  const nextTempId = useRef(0);

  draftRef.current = draftHoldings;
  savedRef.current = savedHoldings;
  addModalOpenRef.current = addModalOpen;

  const applyResponse = useCallback((response: HoldingsResponse) => {
    const withKeys = withClientKeys(response);
    setSavedHoldings(withKeys);
    setDraftHoldings(withKeys);
    setTotals(response.totals);
  }, []);

  useEffect(() => {
    getHoldings().then(applyResponse);

    const interval = window.setInterval(() => {
      if (addModalOpenRef.current) return;
      getHoldings().then((response) => {
        const dirty = isDirty(draftRef.current, savedRef.current);
        applyResponse(response);
        if (dirty) {
          toast("Refreshed — unsaved edits cleared");
        }
      });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [applyResponse]);

  const handleChange = (clientKey: string, field: keyof Holding, value: string) => {
    setDraftHoldings((rows) =>
      rows.map((row) => {
        if (row.clientKey !== clientKey) return row;
        const numeric = field === "shares_owned" || field === "avg_price" || field === "fees";
        return { ...row, [field]: numeric ? parseFloat(value) || 0 : value };
      }),
    );
  };

  const handleDelete = (clientKey: string) => {
    setDraftHoldings((rows) => rows.filter((row) => row.clientKey !== clientKey));
  };

  const handleAddSubmit = (
    fields: Pick<Holding, "company_name" | "ticker" | "shares_owned" | "avg_price" | "fees">,
  ) => {
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
    const updated = [...draftHoldings, row];
    setDraftHoldings(updated);
    setAddModalOpen(false);
    saveHoldings(updated).then((response) => {
      applyResponse(response);
      toast("Holding added!");
    });
  };

  const handleSave = () => {
    saveHoldings(draftHoldings).then((response) => {
      applyResponse(response);
      toast("Saved!");
    });
  };

  const dirty = isDirty(draftHoldings, savedHoldings);

  return (
    <div className="page">
      <div className="dashboard">
        <div className="dashboard-body">
          <h1 className="dashboard-title">Folio</h1>
          <StatCards totals={totals} />
          <div className="refresh-caption">
            Prices refresh every 30s. Unsaved edits are cleared on refresh — save first.
          </div>
          <HoldingsTable
            holdings={draftHoldings}
            onChange={handleChange}
            onDelete={handleDelete}
            onAddOpen={() => setAddModalOpen(true)}
          />
          <SaveButton onSave={handleSave} disabled={!dirty} />
        </div>
      </div>
      <AddHoldingModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}
