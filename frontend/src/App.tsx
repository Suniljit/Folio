import { useCallback, useEffect, useRef, useState } from "react";
import { getHoldings, saveHoldings } from "./api";
import { HoldingsTable } from "./components/HoldingsTable";
import { SaveButton } from "./components/SaveButton";
import { StatCards } from "./components/StatCards";
import { Toast } from "./components/Toast";
import type { Holding, HoldingsResponse, Totals } from "./types";

const REFRESH_INTERVAL_MS = 30_000;
const TOAST_DURATION_MS = 2200;

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
  const [toast, setToast] = useState<string | null>(null);
  const draftRef = useRef(draftHoldings);
  const savedRef = useRef(savedHoldings);
  const toastTimer = useRef<number | undefined>(undefined);
  const nextTempId = useRef(0);

  draftRef.current = draftHoldings;
  savedRef.current = savedHoldings;

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const applyResponse = useCallback((response: HoldingsResponse) => {
    const withKeys = withClientKeys(response);
    setSavedHoldings(withKeys);
    setDraftHoldings(withKeys);
    setTotals(response.totals);
  }, []);

  useEffect(() => {
    getHoldings().then(applyResponse);

    const interval = window.setInterval(() => {
      getHoldings().then((response) => {
        const dirty = isDirty(draftRef.current, savedRef.current);
        applyResponse(response);
        if (dirty) {
          showToast("Refreshed — unsaved edits cleared");
        }
      });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [applyResponse, showToast]);

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

  const handleAdd = () => {
    nextTempId.current -= 1;
    const row: Holding = {
      id: null,
      clientKey: `new-${nextTempId.current}`,
      company_name: "New Holding",
      ticker: "",
      shares_owned: 0,
      avg_price: 0,
      fees: 0,
      current_price: 0,
      total_cost: 0,
      market_value: 0,
      unrealized_pl: 0,
    };
    setDraftHoldings((rows) => [...rows, row]);
  };

  const handleSave = () => {
    saveHoldings(draftHoldings).then((response) => {
      applyResponse(response);
      showToast("Saved!");
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
            onAdd={handleAdd}
          />
          <SaveButton onSave={handleSave} disabled={!dirty} />
          <Toast message={toast} />
        </div>
      </div>
    </div>
  );
}
