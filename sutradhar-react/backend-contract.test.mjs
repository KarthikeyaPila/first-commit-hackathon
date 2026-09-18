import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bridge = readFileSync("src/backendApi.js", "utf8");
const runtime = readFileSync("src/legacyRuntime.js", "utf8");

assert.match(bridge, /VITE_API_BASE_URL/);
assert.match(bridge, /\/market/);
assert.match(bridge, /\/states\//);
assert.match(bridge, /\/process/);
assert.match(runtime, /hydrateBackend/);
assert.match(runtime, /startProcessing/);

console.log("Sutradhar backend contract passed");
