export function PrintingPress({ onLookInside }: { onLookInside?: () => void }) {
  return <button className="printing-press" type="button" onClick={onLookInside} aria-label="Look inside the Sutradhar printing press">
    <span className="printing-press-frame">
      <img src="/printer.png" alt="Sutradhar newspaper printing press" />
      <span className="press-look"><strong>LOOK INSIDE</strong><small>See how raw news becomes state-wise stories →</small></span>
      <span className="press-caption"><span className="micro">The machine behind the paper</span><b>Printing press →</b></span>
    </span>
  </button>;
}
