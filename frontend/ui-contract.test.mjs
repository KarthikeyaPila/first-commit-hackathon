import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("src/components/MapHome.tsx", "utf8");
const press = readFileSync("src/components/PrintingPress.tsx", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

assert.match(home, /className="stage"/);
assert.match(home, /className="map-wrap"/);
assert.match(home, /className="press-layout"/);
assert.match(home, /THE MACHINE BEHIND THE PAPER/);
assert.match(press, /className="print-press-dock"/);
assert.match(press, /see how raw news becomes state-wise stories/);
assert.match(app, /data-done/);

console.log("Sutradhar reference UI contract passed");
