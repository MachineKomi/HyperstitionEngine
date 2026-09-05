import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createObserver, observeEpoch } from "../src/engine/observer.js";

const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/evaluate-observer.mjs path/to/chronicle.json");
const { entries } = JSON.parse(readFileSync(file, "utf8"));
let state = createObserver(entries[0]?.conductor?.initialSeed ?? 137);
const times = [];
for (const entry of entries) {
  const start = performance.now();
  state = observeEpoch(state, entry);
  times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
console.log(JSON.stringify({ version: state.version, epochs: state.count, scored: state.samples,
  networkMAE: state.errorSum / state.samples, baselineMAE: state.baselineErrorSum / state.samples,
  updateMedianMs: times[Math.floor(times.length / 2)], updateMaxMs: times.at(-1),
  serializedStateBytes: Buffer.byteLength(JSON.stringify(state)),
  note: "One supplied chronological stream. Prequential errors; no held-out literary judgments. Timing is this Node process, not mobile hardware."
}, null, 2));
