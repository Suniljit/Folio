export type Tab = "dashboard" | "holdings" | "trades";

interface TabDockProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "holdings", label: "Holdings" },
  { id: "trades", label: "Trades" },
];

export function TabDock({ active, onChange }: TabDockProps) {
  return (
    <div className="tab-dock">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-dock-item ${tab.id === active ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
