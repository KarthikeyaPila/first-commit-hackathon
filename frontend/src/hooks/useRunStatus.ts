import { useEffect, useState } from "react";
import { getRunStatus, startProcessing } from "../lib/api";
import type { RunStatusResponse } from "../lib/types";

const TERMINAL = new Set(["complete", "completed", "failed", "error"]);

export function useRunStatus() {
  const [run, setRun] = useState<RunStatusResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const start = async () => {
    setStarting(true); setError(null);
    try { const result = await startProcessing(); setRunId(result.run_id); setRun({ run_id: result.run_id, status: result.status }); }
    catch (reason: unknown) { setError((reason as Error).message); }
    finally { setStarting(false); }
  };
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const poll = async () => {
      try { const next = await getRunStatus(runId); if (!cancelled) { setRun(next); if (!TERMINAL.has(next.status.toLowerCase())) window.setTimeout(poll, 1800); } }
      catch (reason: unknown) { if (!cancelled) { setError((reason as Error).message); window.setTimeout(poll, 3000); } }
    };
    poll();
    return () => { cancelled = true; };
  }, [runId]);
  return { run, starting, error, start };
}
