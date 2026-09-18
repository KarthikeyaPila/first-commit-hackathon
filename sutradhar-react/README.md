# SUTRADHAR — React version

This is a Vite + React conversion of the existing SUTRADHAR frontend.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The existing India map, state navigation, newspaper pages, reader, national-news flow, printing-press interaction and pipeline choreography are preserved. The React shell now consumes the Sutradhar backend when available:

- \`GET /market\` refreshes the market ticker.
- \`GET /states/{state}/stories\` refreshes a state desk when opened.
- \`GET /stories/{run_id}/{story_id}\` fills the article comparison reader.
- \`POST /process\` and \`GET /runs/{run_id}\` connect the press pipeline to live AWS processing telemetry.

Set \`VITE_API_BASE_URL\` to point at another API deployment. If the API is unavailable, the reference experience keeps its local fallback content and animation.
