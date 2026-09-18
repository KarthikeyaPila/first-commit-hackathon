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
    <main className="stage" id="stage">
      <MarketTicker items={marketItems} loading={marketLoading} />
      <header className="masthead">
        <div className="mh-l"><span className="wordmark">SUTRADHAR</span><span className="micro">Edition 01 · September 2026</span><span className="tag-demo">DEMO CONTENT</span></div>
        <span className="mh-r micro">An atlas of the present tense</span>
      </header>
      <section className="map-wrap" aria-label="India story map">
        <div className="ghost" aria-hidden="true">SUTRADHAR</div>
        <aside className="flank flank-l">
          <div className="fl-kick"><span className="bar" /><span className="micro">Front page</span></div>
          <p>Every state<br />keeps its own<br /><em>record.</em></p>
          <p className="sub">Thirty-three desks across one country. Pick a shape and read what it sent.</p>
          <button className="national-btn" type="button" onClick={() => onSelectState?.("national")}><span className="national-btn-kick">National desk</span><span className="national-btn-title">National News</span><span className="national-btn-arrow">→</span></button>
        </aside>
        <IndiaMap selectedState={selectedState} onSelectState={onSelectState} />
        <aside className="flank flank-r">
          <span className="micro">In this edition</span>
          <div className="edition-list"><div className="idx-item"><span>01</span>Stories, connected</div><div className="idx-item"><span>02</span>by place.</div></div>
          <p className="sub">Every state keeps a desk. All thirty-three filed this week.</p>
        </aside>
      </section>
      <section className="press-section" aria-label="Printing press introduction">
        <div className="press-connector" aria-hidden="true"><svg viewBox="0 0 1000 190" preserveAspectRatio="none"><path className="press-wire" d="M150 0 C155 55 265 72 300 175" /><path className="press-wire" d="M500 0 C500 60 500 105 500 178" /><path className="press-wire" d="M850 0 C845 55 735 72 700 175" /><path className="press-wire press-wire-faint" d="M300 0 C315 42 360 64 390 174" /><path className="press-wire press-wire-faint" d="M700 0 C685 42 640 64 610 174" /><circle className="press-wire-dot" cx="150" cy="0" r="3" /><circle className="press-wire-dot" cx="500" cy="0" r="3" /><circle className="press-wire-dot" cx="850" cy="0" r="3" /></svg></div>
        <div className="press-intro"><span className="press-section-kicker">THE MACHINE BEHIND THE PAPER</span><span className="press-section-rule" /><span className="press-section-copy">From the map · into the machinery</span></div>
        <div className="press-layout">
        <PrintingPress onLookInside={onOpenPress} />
        <div className="press-story">
          <div className="press-story-rule" /><div className="press-story-kicker">SUTRADHAR · INSIDE THE MACHINE</div>
          <h2>Look what happens<br /><em>inside.</em></h2>
          <p>Raw news enters the press as a stream of reports. Inside, it is sorted, understood, clustered and turned into stories for every corner of India.</p>
          <div className="press-story-action"><span className="press-story-dot" /><span>Click the press to enter the processing system</span><b>→</b></div>
          <div className="press-story-meta">FRONTEND VISUAL SIMULATION · FOLLOW THE SIGNAL</div>
        </div>
        </div>
      </section>
      <footer className="footbar"><span className="micro">Hover a state to read its label · click to open dispatches</span><span className="foot-live"><span className="pip" /> <span className="micro">{selectedState ? "STATE SELECTED" : "LIVE EDITORIAL DESK"}</span></span><span className="micro">INDIA · 28 STATES · 8 TERRITORIES</span></footer>
    </main>
  );
}
