import type { RunStage } from "../lib/types";

const FALLBACK_STAGES = [
  ["fetch_sources", "Fetch RSS sources"], ["parse_articles", "Parse article entries"], ["normalize_articles", "Normalize article metadata"], ["deduplicate_articles", "Deduplicate articles"], ["classify_states", "Classify state relevance"], ["tfidf_vectorization", "Build TF-IDF features"], ["neighbor_retrieval", "Retrieve sparse headline neighbors"], ["weighted_tfidf_scoring", "Score weighted TF-IDF candidates"], ["keyword_entity_signals", "Evaluate keyword/entity/time signals"], ["graph_clustering", "Build story graph clusters"], ["rank_stories", "Rank and name stories"], ["persist_outputs", "Persist results to DynamoDB"],
] as const;
function metric(stage: RunStage | undefined) { const values = Object.entries(stage?.metrics ?? {}); return values.length ? values.slice(0, 2).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ") : "Awaiting telemetry"; }
export function ProcessingPipeline({ stages = [], status }: { stages?: RunStage[]; status?: string }) {
  const byId = new Map(stages.map((stage) => [stage.stage_id, stage]));
  return <section className="processing-pipeline" aria-label="Live Sutradhar processing pipeline">
    <div className="pipeline-heading"><div><span className="micro">Sutradhar · internal processing</span><h2>From reports<br /><em>to stories.</em></h2></div><span className="pipeline-run-status">{status ?? "READY"}</span></div>
    <div className="pipeline-legend"><span><i className="queued" /> Queued</span><span><i className="running" /> Running</span><span><i className="complete" /> Complete</span><span><i className="failed" /> Failed</span></div>
    <div className="pipeline-grid">{FALLBACK_STAGES.map(([id, label], index) => { const stage = byId.get(id); const stageStatus = stage?.status ?? "QUEUED"; return <article className={`pipeline-node status-${stageStatus.toLowerCase()}`} key={id}>
      <span className="pipeline-node-number">NODE {String(index + 1).padStart(2, "0")} / 12</span><h3>{label}</h3><p>{metric(stage)}</p><strong>{stageStatus}</strong>{index < FALLBACK_STAGES.length - 1 && <span className="pipeline-arrow" aria-hidden="true">→</span>}
    </article>; })}</div>
  </section>;
}
