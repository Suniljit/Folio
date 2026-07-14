export type Tab = "dashboard" | "holdings";

interface TabDockProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "holdings", label: "Holdings" },
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
