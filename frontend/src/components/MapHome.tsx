import { MarketTicker, type MarketTickerItem } from "./MarketTicker";
import { IndiaMap } from "./IndiaMap";
import { PrintingPress } from "./PrintingPress";

export function MapHome({
  selectedState,
  marketItems,
  marketLoading,
  onSelectState,
  onOpenPress,
}: {
  selectedState?: string | null;
  marketItems?: MarketTickerItem[];
  marketLoading?: boolean;
  onSelectState?: (stateId: string) => void;
  onOpenPress?: () => void;
}) {
  return (
    <main className="stage-home">
      <MarketTicker items={marketItems} loading={marketLoading} />
      <header className="masthead">
        <div className="masthead-left"><span className="wordmark">SUTRADHAR</span><span className="micro">Edition 01 · live desk</span><span className="tag-demo">AWS EDITION</span></div>
        <span className="micro">An atlas of the present tense</span>
      </header>
      <section className="map-section" aria-label="India story map">
        <div className="ghost-word" aria-hidden="true">SUTRADHAR</div>
        <aside className="editorial-flank editorial-flank-left">
          <div className="flank-kicker"><i /> Front page</div>
          <p>Every state<br />keeps its own<br /><em>record.</em></p>
          <small>Pick a shape and read what it sent.</small>
          <button className="text-button" type="button" onClick={() => onSelectState?.("national")}>National desk <span>→</span></button>
        </aside>
        <IndiaMap selectedState={selectedState} onSelectState={onSelectState} />
        <aside className="editorial-flank editorial-flank-right">
          <span className="micro">In this edition</span>
          <strong>Stories, connected<br />by place.</strong>
          <small>State-wise reporting, compared across sources.</small>
        </aside>
      </section>
      <section className="press-bridge" aria-label="Printing press introduction">
        <div className="press-wire" aria-hidden="true" />
        <PrintingPress onLookInside={onOpenPress} />
        <div className="press-copy">
          <span className="micro">Sutradhar · inside the machine</span>
          <h2>Look what happens<br /><em>inside.</em></h2>
          <p>Raw reports enter the press as a stream. Sutradhar sorts, understands, clusters, and returns stories for every corner of India.</p>
          <button className="text-button" type="button" onClick={onOpenPress}>Look inside <span>→</span></button>
        </div>
      </section>
      <footer className="home-footer"><span className="micro">Hover a state to read its label · click to open dispatches</span><span className="micro">{selectedState ? "State selected" : "Live editorial desk"}</span></footer>
    </main>
  );
}
