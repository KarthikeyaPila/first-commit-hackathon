import { useEffect, useState } from "react";
import { getStateStories } from "../lib/api";
import type { StateStoriesResponse } from "../lib/types";
import { STATES } from "../data/states";

export function useStateStories(state: string | null) {
  const [data, setData] = useState<StateStoriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!state || state === "national") { setData(null); setError(null); return; }
    const controller = new AbortController(); setLoading(true); setError(null);
    const stateName = STATES[state]?.plain ?? STATES[state]?.name ?? state;
    getStateStories(stateName, controller.signal).then(async (result) => {
      if (result.stories.length > 0 || stateName === state) return result;
      return getStateStories(state, controller.signal);
    }).then(setData).catch((reason: unknown) => { if ((reason as Error).name !== "AbortError") setError((reason as Error).message); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [state]);
  return { data, loading, error };
}
