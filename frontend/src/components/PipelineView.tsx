import { useState } from "react";
import { useRunStatus } from "../hooks/useRunStatus";
import { AwsInfrastructure } from "./AwsInfrastructure";
import { ProcessingPipeline } from "./ProcessingPipeline";

export function PipelineView({ onClose }: { onClose: () => void }) {
  const { run, starting, error, start } = useRunStatus();
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); window.setTimeout(onClose, 620); };
  return <section className={`pipeline-view-live${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Sutradhar processing pipeline">
    <header className="pipeline-live-head"><div><span className="micro">Sutradhar · control system</span><h2>Look inside.</h2></div><button className="close-button dark" type="button" onClick={close}>Return to press ×</button></header>
    <div className="pipeline-live-scroll">
      <div className="pipeline-actions"><div><span className="micro">Real backend telemetry</span><p>{run ? `Run ${run.run_id} · ${run.status}` : "Start a real ingestion and watch the system work."}</p></div><button className="run-button" type="button" onClick={start} disabled={starting || ["running", "queued"].includes(run?.status?.toLowerCase() ?? "")}>{starting ? "Starting…" : run?.status?.toLowerCase() === "running" ? "Processing…" : "Process latest news"}</button></div>
      {error && <p className="pipeline-error">{error}</p>}
      <ProcessingPipeline stages={run?.stage_progress} status={run?.status} />
      <AwsInfrastructure activeStage={run?.current_stage} running={run?.status?.toLowerCase() === "running"} />
      <div className="pipeline-return"><span className="micro">Completed stories return to the state desks on the India map.</span></div>
    </div>
  </section>;
}
