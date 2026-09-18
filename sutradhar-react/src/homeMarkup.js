export const HOME_MARKUP = String.raw`

<div class="grain" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>

<!-- ============================================================
     OVERTURE
     ============================================================ -->
<div class="overture" id="overture" aria-hidden="true">
  <div class="ov-mark">SUTRADHAR</div>
  <div class="ov-sub micro">Drawing India, state by state</div>
  <div class="ov-track"><i></i></div>
</div>

<!-- ============================================================
     STAGE — THE MAP IS THE NAVIGATION
     ============================================================ -->
<main class="stage" id="stage">

  <!-- MARKET TICKER -->
  <div class="market-ticker" aria-label="Market prices">
    <div class="ticker-label">Market desk</div>
    <div class="ticker-window"><div class="ticker-track">
      <div class="ticker-set">
        <span class="ticker-item"><b>GOLD 24K</b><span class="ticker-price">₹1,53,710</span><span>/ 10g</span><span class="ticker-change up">▲ 0.72%</span></span>
        <span class="ticker-item"><b>SILVER 999</b><span class="ticker-price">₹2,38,070</span><span>/ kg</span><span class="ticker-change up">▲</span></span>
        <span class="ticker-item"><b>USD / INR</b><span class="ticker-price">₹95.91</span><span class="ticker-change down">▼ 0.03%</span></span>
        <span class="ticker-item"><b>NIFTY 50</b><span class="ticker-price">23,346.40</span><span class="ticker-change up">▲ 0.33%</span></span>
        <span class="ticker-item"><b>SENSEX</b><span class="ticker-price">74,294.96</span><span class="ticker-change down">▼ 0.03%</span></span>
      </div>
      <div class="ticker-set" aria-hidden="true">
        <span class="ticker-item"><b>GOLD 24K</b><span class="ticker-price">₹1,53,710</span><span>/ 10g</span><span class="ticker-change up">▲ 0.72%</span></span>
        <span class="ticker-item"><b>SILVER 999</b><span class="ticker-price">₹2,38,070</span><span>/ kg</span><span class="ticker-change up">▲</span></span>
        <span class="ticker-item"><b>USD / INR</b><span class="ticker-price">₹95.91</span><span class="ticker-change down">▼ 0.03%</span></span>
        <span class="ticker-item"><b>NIFTY 50</b><span class="ticker-price">23,346.40</span><span class="ticker-change up">▲ 0.33%</span></span>
        <span class="ticker-item"><b>SENSEX</b><span class="ticker-price">74,294.96</span><span class="ticker-change down">▼ 0.03%</span></span>
      </div>
    </div></div>
  </div>

  <!-- HEADER -->
  <header class="masthead">
    <div class="mh-l">
      <span class="wordmark">SUTRADHAR</span>
      <span class="micro">Edition 01 · September 2026</span>
      <span class="tag-demo">LIVE STATE DESKS</span>
    </div>
    <div class="mh-r micro">An atlas of the present tense</div>
  </header>

  <!-- INDIA MAP -->
  <div class="map-wrap" id="mapWrap">
    <div class="ghost" aria-hidden="true">SUTRADHAR</div>
    <!-- SVG map is generated in the DATA + MAP sections of the script -->

    <div class="flank flank-l">
      <div class="fl-kick"><span class="bar"></span><span class="micro">Front page</span></div>
      <p class="lede">Every state<br>keeps its own<br><em>record.</em></p>
      <p class="sub">Every state and territory keeps a desk. Pick a shape and read what it sent.</p>

      <div class="national-cta">
        <button class="national-btn" id="nationalBtn" type="button">
          <span class="national-btn-kick">National desk</span>
          <span class="national-btn-title">National News</span>
          <span class="national-btn-arrow">→</span>
        </button>
      </div>
    </div>

    <div class="flank flank-r">
      <span class="micro">In this edition</span>
      <div id="featured"></div>
      <p class="sub">Every state and territory keeps a desk. Live coverage appears as it is filed.</p>
    </div>

  </div>

  <!-- PRINTING PRESS / VISUAL BRIDGE
       Deliberately below the initial map viewport. This is a frontend-only
       visual simulation; it does not connect to or depend on backend telemetry. -->
  <section class="press-section" id="pressSection" aria-label="Printing press and internal processing">
    <div class="press-intro">
      <span class="press-section-kicker">THE MACHINE BEHIND THE PAPER</span>
      <span class="press-section-rule"></span>
      <span class="press-section-copy">From the map · into the machinery</span>
    </div>
    <div class="press-layout">
      <button class="print-press-dock" id="printPress" type="button" aria-label="Look inside the printing press">
      <span class="print-press-frame">
        <img class="print-press-img" alt="Illustrated newspaper printing press" src="/press.png" />
        <span class="press-look"><strong>LOOK INSIDE</strong><span>see how raw news becomes state-wise stories →</span></span>
        <span class="print-press-caption"><span><span class="print-press-kicker">The machine behind the paper</span><span class="print-press-title">Printing Press</span></span><span class="print-press-arrow">→</span></span>
      </span>
      </button>
      <div class="press-story">
        <div class="press-story-rule"></div>
        <div class="press-story-kicker">SUTRADHAR · INSIDE THE MACHINE</div>
        <h2>Look what happens<br><em>inside.</em></h2>
        <p>Raw news enters the press as a stream of reports. Inside, it is sorted, understood, clustered and turned into stories for every corner of India.</p>
        <button class="press-story-action" id="pressStoryAction" type="button"><span class="press-story-dot"></span><span>Click the press to enter the processing system</span><b>→</b></button>
        <div class="press-story-meta">LIVE PROCESSING SYSTEM · FOLLOW THE SIGNAL</div>
      </div>
    </div>
  </section>

  <!-- AWS INFRASTRUCTURE — BELOW THE PRESS, OUTSIDE THE LOOK-INSIDE RUN -->
  <section class="aws-architecture aws-architecture-page" aria-label="AWS architecture">
    <div class="aws-architecture-head"><div><span class="pipeline-kicker">SUTRADHAR · THE NEWSROOM ENGINE</span><h2 class="aws-architecture-title">The machinery behind the morning paper</h2></div><span class="aws-architecture-note">AWS services carrying every story from source to state desk</span></div>
    <div class="aws-architecture-flow">
      <div class="aws-column"><div class="aws-column-label">DELIVERY</div><div class="aws-node aws-node-main"><small>STATIC WEBSITE HOSTING</small><strong>S3</strong><span>Frontend assets · live HTTP endpoint</span></div><div class="aws-node aws-node-event"><small>OBJECT STORAGE</small><strong>S3 bucket</strong><span>Compiled app files</span></div></div>
      <i class="aws-wire">→</i>
      <div class="aws-column"><div class="aws-column-label">ENTRY</div><div class="aws-node"><small>HTTP API</small><strong>API Gateway</strong><span>Browser requests</span></div><div class="aws-node aws-node-event"><small>SCHEDULE</small><strong>EventBridge</strong><span>Hourly trigger · disabled</span></div></div>
      <i class="aws-wire">→</i>
      <div class="aws-column aws-column-lambda"><div class="aws-column-label">COMPUTE · LAMBDA</div><div class="aws-node"><small>AWS::SERVERLESS::FUNCTION</small><strong>ApiFunction</strong><span class="aws-handler">first_commit.lambda_handlers.api_handler</span></div><div class="aws-node aws-node-main"><small>AWS::SERVERLESS::FUNCTION</small><strong>ProcessingFunction</strong><span class="aws-handler">first_commit.lambda_handlers.processing_handler</span></div></div>
      <i class="aws-wire">→</i>
      <div class="aws-column"><div class="aws-column-label">PERSISTENCE</div><div class="aws-node"><small>STORAGE</small><strong>DynamoDB</strong><span>Runs + articles</span></div><div class="aws-node aws-node-event"><small>FAILURE CAPTURE</small><strong>SQS</strong><span>ProcessingFailureQueue</span></div></div>
    </div>
    <div class="aws-architecture-support"><span><b>Frontend</b> → S3 static website hosting</span><span><b>EventBridge Schedule</b> → ProcessingFunction · currently disabled</span><span><b>SQS ProcessingFailureQueue</b> · retry capture</span></div>
  </section>

  <!-- FOOTER CHROME -->
  <div class="footbar">
    <div class="micro" id="hint">Hover a state to read its label · click to open its dispatches</div>
    <div class="foot-live">
      <span class="pip" aria-hidden="true"></span>
      <span class="micro" id="tally">—</span>
    </div>
    <div class="micro" id="coord">—</div>
  </div>

</main>

<!-- cursor readout -->
<div class="readout" id="readout" aria-hidden="true">
  <div class="ro-ep" id="roEp"></div>
  <div class="ro-name" id="roName"></div>
  <div class="ro-meta">
    <div class="ro-idx" id="roMeta"></div>
  </div>
</div>

<!-- ============================================================
     STATE PAGE
     ============================================================ -->
<section class="state-page" id="statePage" aria-hidden="true">
  <div class="sp-chrome">
    <button class="back" id="backBtn"><i>←</i> Home</button>
    <nav class="crumb" aria-label="Breadcrumb">
      India <s>/</s> <b id="bcState">—</b> <s>/</s> Dispatches
    </nav>
    <div class="mini" id="mini" aria-hidden="true"></div>
    <button class="switcher-btn" id="switchBtn">Switch state</button>
  </div>

  <div class="sp-scroll" id="spScroll">
    <!-- HERO -->
    <header class="sp-hero">
      <div class="sp-hero-type">
        <div class="sp-kick rv" style="--rd:.30s"><span class="bar"></span><span class="micro" id="spIndex"></span></div>
        <h1 class="sp-name rv" id="spName" style="--rd:.36s"></h1>
        <div class="sp-ep rv" id="spEp" style="--rd:.46s"></div>
        <p class="sp-stand rv" id="spStand" style="--rd:.54s"></p>
        <dl class="sp-facts rv" id="spFacts" style="--rd:.62s"></dl>
      </div>
      <div class="sp-art" id="spArt"></div>
    </header>

    <!-- NEWS -->
    <div class="sp-section-head">
      <h3>Dispatches</h3>
      <span class="micro" id="spCount"></span>
    </div>
    <div class="stories" id="spStories"></div>

    <footer class="sp-foot">
      <span class="micro">Original publisher headlines · grouped coverage · latest state reports</span>
      <button class="next-state" id="nextState">Next state <i>→</i></button>
    </footer>
  </div>
</section>

<!-- ============================================================
     READER
     ============================================================ -->
<div class="scrim" id="scrim"></div>
<article class="reader" id="reader" aria-hidden="true">
  <div class="reader-top">
    <span class="micro" id="rdKicker"></span>
    <button class="close-x" id="rdClose">Close <span aria-hidden="true">✕</span></button>
  </div>
  <div class="reader-body" id="rdBody"></div>
</article>

<!-- ============================================================
     COMING SOON
     ============================================================ -->
<div class="soon" id="soon" role="dialog" aria-modal="true" aria-labelledby="soonName">
  <div class="soon-card">
    <div class="soon-shape" id="soonShape" aria-hidden="true"></div>
    <div>
      <div class="micro" id="soonIdx"></div>
      <h3 id="soonName"></h3>
      <p id="soonCopy"></p>
      <div class="soon-actions">
        <button class="btn-line solid" id="soonUP">Read Uttar Pradesh</button>
        <button class="btn-line" id="soonMH">Read Maharashtra</button>
        <button class="btn-line" id="soonClose">Back to the map</button>
      </div>
    </div>
  </div>
</div>

<!-- ============================================================
     NATIONAL NEWS
     ============================================================ -->
<div class="national-news legacy-national-modal" id="nationalNews" role="dialog" aria-modal="true" aria-labelledby="nationalNewsTitle" aria-hidden="true">
  <div class="national-news-card">
    <div class="national-news-top">
      <div>
        <span class="micro">National desk · today</span>
        <h2 id="nationalNewsTitle">National News</h2>
      </div>
      <button class="close-x" id="nationalClose" type="button">Close <span aria-hidden="true">✕</span></button>
    </div>
    <div class="national-stories">
      <article class="national-story">
        <span class="national-story-cat">Economy</span>
        <h3>Reserve Bank holds rates, signals a longer pause</h3>
        <p>Markets watch the central bank's next signals as policymakers balance inflation and growth.</p>
      </article>
      <article class="national-story">
        <span class="national-story-cat">Climate</span>
        <h3>Early monsoon retreat leaves reservoirs uneven</h3>
        <p>Water levels remain varied across regions as the season moves into its final stretch.</p>
      </article>
      <article class="national-story">
        <span class="national-story-cat">Policy</span>
        <h3>New data rules take effect nationwide</h3>
        <p>Organisations begin adjusting their systems and reporting practices to the new framework.</p>
      </article>
    </div>
    <p class="national-note">Fictional demo content for SUTRADHAR.</p>
  </div>
</div>

<!-- ============================================================
     SWITCHER
     ============================================================ -->
<div class="switcher" id="switcher" role="dialog" aria-modal="true" aria-label="Choose a state">
  <div class="sw-top">
    <h3>Choose a state</h3>
    <button class="btn-line" id="swClose">Close</button>
  </div>
  <div class="sw-grid" id="swGrid"></div>
</div>


<!-- ============================================================
     INTERNAL PROCESSING — LIVE AWS RUN TELEMETRY
     ============================================================ -->
<section class="pipeline-view" id="pipelineView" aria-hidden="true">
  <header class="pipeline-head">
    <div class="pipeline-head-left">
      <span class="pipeline-signal" aria-hidden="true"></span>
      <div><div class="pipeline-kicker">SUTRADHAR · Internal Processing</div><h2 class="pipeline-title">Processing Pipeline</h2></div>
    </div>
    <button class="pipeline-run" id="pipelineRun" type="button"><span>RUN PIPELINE</span><b>→</b></button>
    <div class="pipeline-meta">Live system view · AWS run telemetry<br>Backend stages and metrics</div>
    <button class="pipeline-close" id="pipelineClose" type="button" aria-label="Return to press">←</button>
  </header>
  <div class="pipeline-shell">
    <div class="pipeline-legend"><span class="legend-item"><i class="legend-dot"></i> queued</span><span class="legend-item"><i class="legend-dot run"></i> running</span><span class="legend-item"><i class="legend-dot done"></i> complete</span><span class="legend-item">data packets / directional flow</span></div>
    <div class="pipeline-board" id="pipelineBoard">
      <svg class="pipeline-wire-svg" id="pipelineWires" aria-hidden="true"></svg>
      <div class="pipeline-grid" id="pipelineGrid"></div>
    </div>
    <div class="pipeline-output" id="pipelineOutput">
      <div><div class="output-title">State-wise feeds</div><div class="output-copy">Processed signals returning to India</div></div>
      <div class="output-rail" id="outputRail" aria-hidden="true"><span></span><span></span><span></span><span></span><b>→ INDIA</b></div>
      <div class="output-india" id="outputIndia" aria-hidden="true"></div>
      <div class="output-state-feed" id="outputFeeds"></div>
    </div>
    <button class="pipeline-exit" id="pipelineExit" type="button"><span>EXIT PIPELINE</span><b>↘</b></button>
  </div>
  <div class="pipeline-sim-note">LIVE TELEMETRY · STATUS AND COUNTERS FROM THE PROCESSING RUN</div>
</section>

<div class="curtain" id="curtain" aria-hidden="true"></div>

`;
