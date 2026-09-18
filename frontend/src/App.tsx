import { useEffect, useMemo, useState } from "react";
import { MapHome } from "./components/MapHome";
import { StateStoryPanel } from "./components/StateStoryPanel";
import { PipelineView } from "./components/PipelineView";
import { useMarket } from "./hooks/useMarket";

function App() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [pressOpen, setPressOpen] = useState(false);
  const [overture, setOverture] = useState(true);
  const [stateCurtain, setStateCurtain] = useState(false);
  const market = useMarket();
  useEffect(() => { const timer = window.setTimeout(() => setOverture(false), 1550); return () => window.clearTimeout(timer); }, []);
  const marketItems = useMemo(() => market.data?.instruments.map((item) => ({
    label: item.label.toUpperCase(),
    value: item.value == null ? "—" : item.key === "usd_inr" ? `₹${item.value.toFixed(2)}` : item.key === "nifty50" || item.key === "sensex" ? item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : `₹${item.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    suffix: item.key === "gold" || item.key === "silver" ? "/ 10g" : item.key === "usd_inr" ? "" : undefined,
    change: item.change_percent == null ? undefined : `${item.change_percent >= 0 ? "▲" : "▼"} ${Math.abs(item.change_percent).toFixed(2)}%`,
    direction: item.change_percent == null ? undefined : item.change_percent >= 0 ? "up" as const : "down" as const,
  })) ?? undefined, [market.data]);
  const selectState = (state: string) => {
    if (state === "national") return;
    setStateCurtain(true);
    window.setTimeout(() => setSelectedState(state), 360);
    window.setTimeout(() => setStateCurtain(false), 620);
  };
  return <div className="app-root">
    <div className={`overture${overture ? " is-visible" : ""}`} aria-hidden={!overture}><div className="overture-mark">SUTRADHAR</div><div className="overture-sub">India · state by state · story by story</div><div className="overture-track"><i /></div></div>
    <MapHome selectedState={selectedState} marketItems={marketItems} marketLoading={market.loading} onSelectState={selectState} onOpenPress={() => setPressOpen(true)} />
    <div className={`state-curtain${stateCurtain ? " is-active" : ""}`} aria-hidden="true" />
    <StateStoryPanel state={selectedState} onClose={() => setSelectedState(null)} />
    {pressOpen && <PipelineView onClose={() => setPressOpen(false)} />}
  </div>;
}

export default App;
