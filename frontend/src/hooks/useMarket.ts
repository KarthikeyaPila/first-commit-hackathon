import { useEffect, useState } from "react";
import { getMarket } from "../lib/api";
import type { MarketResponse } from "../lib/types";

export function useMarket() {
  const [data, setData] = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = () => {
    const controller = new AbortController(); setLoading(true); setError(null);
    getMarket(controller.signal).then(setData).catch((reason: unknown) => { if ((reason as Error).name !== "AbortError") setError((reason as Error).message); }).finally(() => setLoading(false));
    return () => controller.abort();
  };
  useEffect(() => reload(), []);
  return { data, loading, error, reload };
}
