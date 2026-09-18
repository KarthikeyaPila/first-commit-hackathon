# Sutradhar Frontend Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the approved `final.html` visual concept into a maintainable React/TypeScript/Vite frontend that uses real Sutradhar APIs, the uploaded `printer.png`, and live AWS processing telemetry.

**Architecture:** Create a separate `frontend/` Vite application so `final.html` remains an untouched visual reference. Rebuild the visual language as focused React components, use an API client for the deployed backend, and drive the processing view from persisted run telemetry rather than simulated timers. Use CSS/SVG for the map, wires, particles, and transitions; use `printer.png` for the press artwork.

**Tech Stack:** React, TypeScript, Vite, CSS Modules/plain CSS, Framer Motion for transitions, inline SVG for map and infrastructure visualization, native `fetch` for the existing API.

**Spec:** The approved frontend conversion design discussed in chat and the visual reference in `final.html`.

## Global Constraints

- Preserve `final.html` and all existing user-owned HTML mockups; do not modify or stage them.
- Use real backend data; do not retain fake story content, fake market values, or fake processing metrics in the production frontend path.
- Keep the existing backend unchanged unless an API response is genuinely missing a required frontend field.
- Display article cards with original headline, publisher/source, short RSS description when provided, timestamp, and direct original link.
- Keep AWS labels truthful: API Gateway, Lambda, DynamoDB, EventBridge, and SQS only where they correspond to the deployed architecture.
- Preserve the Sutradhar editorial visual language: dark ink, ivory paper, brass/red accents, Fraunces, Inter, and IBM Plex Mono.
- Support loading, empty, API failure, keyboard access, responsive layout, and `prefers-reduced-motion`.
- Never add credentials, tokens, or private AWS configuration to frontend files.
- Run frontend build checks plus the existing 31-test Python suite before each meaningful commit.

---

### Task 1: Create the frontend shell

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/global.css`
- Copy: `printer.png` to `frontend/public/printer.png`
- Modify: `.gitignore` to ignore `frontend/node_modules/` and `frontend/dist/`

**Interfaces:**
- `App` renders the homepage shell and receives no backend data directly.
- CSS tokens expose the reference palette, typography, spacing, and motion curves.

- [ ] **Step 1: Write the Vite package and TypeScript configuration.**

Use React 18+, TypeScript, Vite, and Framer Motion. Define scripts `dev`, `build`, and `preview`.

- [ ] **Step 2: Create the root app and global visual tokens.**

Port the reference variables for ink, ivory, paper, brass/red accent, display/sans/mono font stacks, focus rings, and reduced-motion behavior.

- [ ] **Step 3: Copy the press asset without editing the source.**

The frontend must reference `/printer.png`; the repository-root `printer.png` remains the source asset.

- [ ] **Step 4: Run the first frontend build.**

Run: `cd frontend && npm install && npm run build`
Expected: Vite produces `frontend/dist/` without TypeScript errors.

- [ ] **Step 5: Commit the shell.**

```bash
git add frontend .gitignore
git commit -m "feat: scaffold Sutradhar frontend"
```

### Task 2: Rebuild the editorial homepage and map shell

**Files:**
- Create: `frontend/src/components/MarketTicker.tsx`
- Create: `frontend/src/components/IndiaMap.tsx`
- Create: `frontend/src/components/EditorialFlanks.tsx`
- Create: `frontend/src/components/MapHome.tsx`
- Create: `frontend/src/data/states.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles/global.css`

**Interfaces:**
- `IndiaMap({ selectedState, onSelectState, highlightedStates })` renders accessible state paths and invokes `onSelectState(stateId)`.
- `MarketTicker({ items, loading })` renders market values supplied by the parent.
- `MapHome({ onSelectState, onOpenPress })` composes the ticker, masthead, map, editorial flanks, and press section trigger.

- [ ] **Step 1: Extract state identifiers and display metadata from the reference map model.**

Preserve state labels, accent colors, and state IDs; do not copy hardcoded story bodies. Mark unsupported or unavailable states as empty rather than inventing stories.

- [ ] **Step 2: Render the map as an inline SVG component.**

Port the existing map geometry/data into a typed module or preserve it as a static SVG asset. Add keyboard-focusable state regions, visible hover/focus states, and selected-state styling.

- [ ] **Step 3: Recreate the ticker, masthead, ghost wordmark, and flanking editorial copy.**

Use the reference layout and typography but remove hardcoded market values.

- [ ] **Step 4: Add responsive and reduced-motion behavior.**

The map must remain usable on narrow screens; decorative animations must stop under `prefers-reduced-motion`.

- [ ] **Step 5: Build and visually inspect the homepage.**

Run `npm run build`, open the Vite preview, and compare the map composition against `final.html`.

- [ ] **Step 6: Commit the homepage slice.**

```bash
git add frontend
git commit -m "feat: recreate Sutradhar editorial map"
```

### Task 3: Add the real API client and story/article views

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/hooks/useMarket.ts`
- Create: `frontend/src/hooks/useStateStories.ts`
- Create: `frontend/src/components/StateStoryPanel.tsx`
- Create: `frontend/src/components/StoryCard.tsx`
- Create: `frontend/src/components/ArticleComparison.tsx`
- Create: `frontend/src/components/ArticleReader.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- `apiGet<T>(path: string): Promise<T>` uses `VITE_API_BASE_URL` and throws a user-readable error for non-2xx responses.
- `getMarket(): Promise<MarketResponse>` calls `/market`.
- `getStateStories(state: string): Promise<StateStoriesResponse>` calls the deployed state stories endpoint.
- `getStory(storyId: string): Promise<StoryResponse>` and `getStoryComparisons(storyId: string): Promise<ComparisonResponse>` call the story endpoints.
- Article cards render `{ headline, source, description?, published_at?, url }`.

- [ ] **Step 1: Define TypeScript response types from the existing Lambda/API payloads.**

Model loading/error states explicitly; do not use `any` for API responses.

- [ ] **Step 2: Implement the API client and hooks.**

Use abortable requests and expose `{ data, loading, error, reload }`. Do not place AWS credentials in the browser.

- [ ] **Step 3: Replace hardcoded story data with state story responses.**

Selecting a state opens the story panel; a state with no grouped stories gets a clear empty state and does not display fabricated content.

- [ ] **Step 4: Build story and article comparison cards.**

Show original headline, publisher/source, short RSS description when present, publication time, and a direct external link. Preserve source attribution.

- [ ] **Step 5: Add API loading and failure UI.**

Use finite states such as `Loading stories`, `No grouped stories yet`, and `Unable to load stories`. Never leave an indefinite spinner.

- [ ] **Step 6: Build and test the API-connected UI with a configured API base.**

Run `VITE_API_BASE_URL=https://nechnrnjk0.execute-api.ap-south-1.amazonaws.com npm run build`.

- [ ] **Step 7: Commit the data-connected story view.**

```bash
git add frontend
git commit -m "feat: connect Sutradhar stories to AWS API"
```

### Task 4: Rebuild the printing press interaction

**Files:**
- Create: `frontend/src/components/PrintingPress.tsx`
- Create: `frontend/src/components/PressTransition.tsx`
- Modify: `frontend/src/components/MapHome.tsx`
- Modify: `frontend/src/styles/global.css`

**Interfaces:**
- `PrintingPress({ onLookInside, processing })` renders `/printer.png`, hover/focus copy, and a click target.
- `PressTransition({ open, onClose, children })` controls the transition into the internal pipeline view.

- [ ] **Step 1: Place `printer.png` in the press section.**

Preserve the reference press section’s bridge wires and “LOOK INSIDE” interaction, replacing the old embedded image with the uploaded asset.

- [ ] **Step 2: Add keyboard and touch interaction.**

The press must be reachable by keyboard and usable without hover on touch devices.

- [ ] **Step 3: Add a reduced-motion transition.**

Use a simple opacity/position transition when reduced motion is enabled.

- [ ] **Step 4: Commit the press slice.**

```bash
git add frontend
git commit -m "feat: add Sutradhar printing press interaction"
```

### Task 5: Connect real processing telemetry to the pipeline

**Files:**
- Create: `frontend/src/hooks/useRunStatus.ts`
- Create: `frontend/src/components/ProcessingPipeline.tsx`
- Create: `frontend/src/components/AwsInfrastructure.tsx`
- Create: `frontend/src/components/PipelineOutput.tsx`
- Modify: `frontend/src/components/PressTransition.tsx`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- `startProcessing(): Promise<{ run_id: string }>` calls the deployed processing trigger.
- `getRunStatus(runId: string): Promise<RunStatusResponse>` calls `/runs/{run_id}`.
- `useRunStatus(runId)` polls only while the run is active and stops on terminal status.
- `ProcessingPipeline({ stages, onComplete })` renders the twelve real stages.
- `AwsInfrastructure({ activeStage })` renders truthful API Gateway, Lambda, DynamoDB, EventBridge, and SQS relationships.

- [ ] **Step 1: Model the twelve backend stages and status values.**

Use `QUEUED`, `RUNNING`, `COMPLETE`, `FAILED`, and `SKIPPED`; map stage metrics directly from the API.

- [ ] **Step 2: Implement manual processing and bounded polling.**

Start a run from the frontend, poll with a finite interval, stop on completion/failure, and show the last known status if polling fails.

- [ ] **Step 3: Render product pipeline nodes and SVG wires.**

Use real stage metrics and animate only the active wire/particle. Do not generate fake durations or fake counts.

- [ ] **Step 4: Render the AWS infrastructure lane.**

Show API Gateway -> API Lambda -> Processing Lambda -> DynamoDB, with EventBridge as a disabled scheduled trigger and SQS as the failure path. Label the schedule as disabled.

- [ ] **Step 5: Flow completed output back into the map.**

Use returned state projections to highlight only states with actual output. Selecting a highlighted state opens its real stories.

- [ ] **Step 6: Add failure, empty, and retry presentation.**

Show the failing stage and persisted error information when available; provide a retry action that starts a new run.

- [ ] **Step 7: Commit the telemetry pipeline.**

```bash
git add frontend
git commit -m "feat: visualize live AWS processing pipeline"
```

### Task 6: Verification, polish, and hosting preparation

**Files:**
- Modify: `frontend/src/**` as needed for verified issues only
- Create: `frontend/.env.example`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- `.env.example` documents only `VITE_API_BASE_URL`; no credentials.
- README documents local frontend development and API configuration.

- [ ] **Step 1: Verify the frontend build and backend suite.**

Run:

```bash
cd frontend && npm run build
cd .. && if [ -x .venv/bin/pytest ]; then .venv/bin/pytest -q; else python3 -m pytest -q; fi
python3 -m compileall -q src
git diff --check
```

Expected: frontend build succeeds and all 31 Python tests pass.

- [ ] **Step 2: Exercise the API-connected paths.**

Verify market loading, state selection, story loading, story comparison, processing start, run polling, terminal failure, and no-story states.

- [ ] **Step 3: Check responsive and accessibility behavior.**

Verify keyboard map selection, press activation, modal close, reduced motion, narrow viewport layout, and readable focus indicators.

- [ ] **Step 4: Update the handoff docs.**

Record frontend commands, component boundaries, environment configuration, and the current deployment status.

- [ ] **Step 5: Commit and push the completed frontend milestone.**

```bash
git add frontend README.md AGENTS.md
git commit -m "feat: add Sutradhar frontend experience"
git push origin main
```
