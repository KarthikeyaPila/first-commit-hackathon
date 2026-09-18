export function PrintingPress({ onLookInside }: { onLookInside?: () => void }) {
  return <button className="print-press-dock" type="button" onClick={onLookInside} aria-label="Look inside the Sutradhar printing press">
    <span className="print-press-frame">
      <img className="print-press-img" src="/printer.png" alt="Sutradhar newspaper printing press" />
      <span className="press-look"><strong>LOOK INSIDE</strong><span>see how raw news becomes state-wise stories →</span></span>
      <span className="print-press-caption"><span><span className="print-press-kicker">The machine behind the paper</span><span className="print-press-title">Printing Press</span></span><span className="print-press-arrow">→</span></span>
    </span>
  </button>;
}
