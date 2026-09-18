const SERVICES = [
  ["API Gateway", "Receives process and read requests", "gateway"],
  ["API Lambda", "Routes API requests", "lambda"],
  ["Processing Lambda", "Runs the news intelligence pipeline", "lambda active"],
  ["DynamoDB", "Stores runs, stories, articles, and state projections", "database"],
  ["SQS failure queue", "Retains failed asynchronous runs", "queue"],
  ["EventBridge", "Hourly trigger · disabled by default", "schedule"],
] as const;
export function AwsInfrastructure({ activeStage, running }: { activeStage?: string; running?: boolean }) {
  return <section className="aws-lane" aria-label="AWS infrastructure used by Sutradhar">
    <div className="aws-lane-heading"><span className="micro">AWS runtime · Mumbai / ap-south-1</span><span className="aws-live">{running ? "LIVE PROCESSING" : "READY"}</span></div>
    <div className="aws-nodes">{SERVICES.map(([name, description, kind]) => <article className={`aws-node ${kind} ${running && (name === "Processing Lambda" || name === "DynamoDB" && activeStage === "persist_outputs") ? "is-active" : ""}`} key={name}><span className="aws-badge">AWS</span><h3>{name}</h3><p>{description}</p></article>)}</div>
    <div className="aws-flow" aria-hidden="true">API Gateway <b>→</b> API Lambda <b>→</b> Processing Lambda <b>→</b> DynamoDB <span>↘ SQS on failure</span></div>
  </section>;
}
