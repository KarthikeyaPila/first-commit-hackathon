import { useMemo, useState } from "react";
import { MapHome } from "./components/MapHome";
import { StateStoryPanel } from "./components/StateStoryPanel";
import { useMarket } from "./hooks/useMarket";

function App() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [pressOpen, setPressOpen] = useState(false);
  const market = useMarket();
  const marketItems = useMemo(() => market.data?.instruments.map((item) => ({
    label: item.label.toUpperCase(),
    value: item.value == null ? "—" : item.key === "usd_inr" ? `₹${item.value.toFixed(2)}` : item.key === "nifty50" || item.key === "sensex" ? item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : `₹${item.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    suffix: item.key === "gold" || item.key === "silver" ? "/ 10g" : item.key === "usd_inr" ? "" : undefined,
    change: item.change_percent == null ? undefined : `${item.change_percent >= 0 ? "▲" : "▼"} ${Math.abs(item.change_percent).toFixed(2)}%`,
    direction: item.change_percent == null ? undefined : item.change_percent >= 0 ? "up" as const : "down" as const,
  })) ?? undefined, [market.data]);

  return <div className="app-root">
    <MapHome selectedState={selectedState} marketItems={marketItems} marketLoading={market.loading} onSelectState={setSelectedState} onOpenPress={() => setPressOpen(true)} />
    <StateStoryPanel state={selectedState} onClose={() => setSelectedState(null)} />
    {pressOpen && <div className="foundation-notice" role="dialog" aria-modal="true" aria-label="Pipeline preview">
      <div className="foundation-notice-card"><span className="micro">Pipeline foundation</span><h2>The machine is next.</h2><p>The live AWS pipeline will replace this foundation preview in the next frontend milestone.</p><button type="button" className="text-button" onClick={() => setPressOpen(false)}>Return to map <span>→</span></button></div>
    </div>}
  </div>;
}

export default App;
