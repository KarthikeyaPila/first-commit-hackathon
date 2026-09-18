export type MarketTickerItem = {
  label: string;
  value: string;
  suffix?: string;
  change?: string;
  direction?: "up" | "down";
};

const DEFAULT_ITEMS: MarketTickerItem[] = [
  { label: "GOLD 24K", value: "—", suffix: "/ 10g" },
  { label: "SILVER 999", value: "—", suffix: "/ 10g" },
  { label: "USD / INR", value: "—", suffix: "" },
  { label: "NIFTY 50", value: "—" },
  { label: "SENSEX", value: "—" },
];

export function MarketTicker({
  items = DEFAULT_ITEMS,
  loading = false,
}: { items?: MarketTickerItem[]; loading?: boolean }) {
  const repeated = [...items, ...items];
  return (
    <div className="market-ticker" aria-label="Market prices">
      <div className="ticker-label"><span aria-hidden="true" />Market desk</div>
      <div className="ticker-window">
        <div className={`ticker-track${loading ? " is-loading" : ""}`}>
          {repeated.map((item, index) => (
            <span className="ticker-item" key={`${item.label}-${index}`}>
              <b>{item.label}</b><strong>{item.value}</strong>{item.suffix && <small>{item.suffix}</small>}
              {item.change && <small className={`ticker-change ${item.direction ?? ""}`}>{item.change}</small>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
