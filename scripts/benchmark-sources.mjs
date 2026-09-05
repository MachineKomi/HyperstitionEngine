import { readFile } from "node:fs/promises";
import { SprawlEngine } from "../src/engine/sprawl.js";
import { createAutomaticState, runAutomatic } from "../src/engine/automatic.js";
import {
  chronicleDocument,
  validateChronicle,
} from "../src/services/chronicle.js";
import {
  CONTINUITY_COMPOSER,
  LEGACY_COMPOSER,
  MEMORY_COMPOSER,
  CONTEXT_COMPOSER,
} from "../src/engine/continuity.js";
const composer = process.argv.includes("--context")
  ? CONTEXT_COMPOSER
  : process.argv.includes("--memory")
    ? MEMORY_COMPOSER
    : process.argv.includes("--continuity")
      ? CONTINUITY_COMPOSER
      : LEGACY_COMPOSER;
const ids = ["N_Land", "Bible", "AI"];
const catalog = JSON.parse(
  await readFile(
    new URL("../src/assets/source_catalog.json", import.meta.url),
    "utf8",
  ),
);
const data = await Promise.all(
  ids.map(async (id) => ({
    ...JSON.parse(
      await readFile(
        new URL(`../src/assets/corpus/${id}.json`, import.meta.url),
        "utf8",
      ),
    ),
    sourceVersion: catalog.sources[id].version,
  })),
);
const engine = new SprawlEngine();
let start = performance.now();
engine.loadCorpus(data);
const preparationMs = performance.now() - start;
const times = [],
  entries = [];
let maxPopulation = 0;
await runAutomatic({
  engine,
  state: createAutomaticState(137, composer),
  aspects: ids,
  maxEpochs: 250,
  wait: async () => {},
  onPlan: () => {
    start = performance.now();
  },
  onEpoch: (entry) => {
    times.push(performance.now() - start);
    maxPopulation = Math.max(maxPopulation, entry.population);
    entries.push({
      ...entry,
      id: String(times.length),
      time: "2026-09-05T20:00:00.000Z",
    });
    if (entries.length > 108) entries.shift();
  },
});
validateChronicle(chronicleDocument(entries));
const firstEpochMs = times[0];
const warm = times.slice(1).sort((a, b) => a - b);
times.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      environment: `Node ${process.version} / ${process.platform} ${process.arch}`,
      scope:
        "Local engine only; corpus already read; theatrical waits disabled; no browser rendering or network",
      composer,
      seed: 137,
      aspects: ids,
      epochs: 250,
      preparationMs,
      firstEpochMs,
      warmMedianMs: warm[124],
      warmP95Ms: warm[236],
      medianEpochMs: times[124],
      p95EpochMs: times[237],
      maxEpochMs: times.at(-1),
      maxPopulation,
      retainedEpochs: entries.length,
      archiveBytes: Buffer.byteLength(
        JSON.stringify(chronicleDocument(entries), null, 2),
      ),
    },
    null,
    2,
  ),
);
