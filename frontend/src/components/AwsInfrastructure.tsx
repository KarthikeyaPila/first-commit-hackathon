const SERVICES = [
  ["API Gateway", "Browser and scheduler entry", "gateway"],
  ["API Lambda", "Read routes and run trigger", "lambda"],
  ["Processing Lambda", "RSS + grouping pipeline", "lambda"],
  ["DynamoDB", "Runs · stories · articles · states", "database"],
] as const;
export function AwsInfrastructure({ activeStage, running }: { activeStage?: string; running?: boolean }) {
  return <section className="aws-lane" aria-label="AWS infrastructure used by Sutradhar">
    <div className="aws-lane-heading"><div><span className="micro">AWS runtime · Mumbai / ap-south-1</span><h2>The infrastructure behind the intelligence.</h2></div><span className="aws-live">{running ? "LIVE PROCESSING" : "READY"}</span></div>
    <div className="aws-main-flow">{SERVICES.map(([name, description, kind], index) => <div className="aws-flow-unit" key={name}><article className={`aws-node ${kind} ${running && (name === "Processing Lambda" || name === "DynamoDB" && activeStage === "persist_outputs") ? "is-active" : ""}`}><span className="aws-badge">AWS</span><h3>{name}</h3><p>{description}</p></article>{index < SERVICES.length - 1 && <span className="aws-connector" aria-hidden="true">→</span>}</div>)}</div>
    <div className="aws-side-paths"><article><span className="aws-side-icon">↻</span><div><b>EventBridge Scheduler</b><small>Hourly trigger · currently disabled</small></div></article><span className="side-wire" aria-hidden="true">↘</span><article><span className="aws-side-icon">!</span><div><b>SQS failure queue</b><small>Retains failed async runs for inspection</small></div></article></div>
    <div className="aws-honesty"><span>LIVE</span> API Gateway · Lambda · DynamoDB &nbsp;|&nbsp; <span className="concept">CONFIGURED</span> EventBridge schedule · SQS failure path</div>
  </section>;
}
