import { mkdir, readFile, writeFile } from "node:fs/promises";
import { SprawlEngine } from "../src/engine/sprawl.js";
import { createAutomaticState, runAutomatic } from "../src/engine/automatic.js";
import {
  CONTINUITY_COMPOSER,
  MEMORY_COMPOSER,
  corpusVersions,
} from "../src/engine/continuity.js";
import {
  chronicleDocument,
  validateChronicle,
} from "../src/services/chronicle.js";
const ids = ["N_Land", "Bible", "AI"];
const catalog = JSON.parse(
  await readFile(
    new URL("../src/assets/source_catalog.json", import.meta.url),
    "utf8",
  ),
);
const engine = new SprawlEngine();
engine.loadCorpus(
  await Promise.all(
    ids.map(async (id) => ({
      ...JSON.parse(
        await readFile(
          new URL(`../src/assets/corpus/${id}.json`, import.meta.url),
          "utf8",
        ),
      ),
      sourceVersion: catalog.sources[id].version,
    })),
  ),
);
const runs = [];
for (let seed = 0; seed < 30; seed++)
  for (const composer of [CONTINUITY_COMPOSER, MEMORY_COMPOSER]) {
    const entries = [];
    await runAutomatic({
      engine,
      state: createAutomaticState(seed, composer),
      aspects: ids,
      maxEpochs: 30,
      wait: async () => {},
      onEpoch: (e) =>
        entries.push({
          ...e,
          id: `${seed}-${entries.length}`,
          time: "2026-09-05T22:00:00Z",
        }),
    });
    validateChronicle(chronicleDocument(entries));
    const recentRepeat = (field) =>
      entries.filter((entry, index) =>
        entries
          .slice(Math.max(0, index - 3), index)
          .some(
            (previous) => previous.champion[field] === entry.champion[field],
          ),
      ).length;
    runs.push({
      seed,
      composer,
      uniqueSources: new Set(entries.map((e) => e.champion.sourceFragment))
        .size,
      recentSourceRepeats: recentRepeat("sourceFragment"),
      recentEndingRepeats: recentRepeat("carry"),
      population: entries.reduce((sum, e) => sum + e.population, 0),
      heirs: entries.map((e) => ({
        text: e.champion.text,
        source: e.champion.source,
        fragment: e.champion.sourceFragment,
        carry: e.champion.carry,
        avoided: e.champion.composition.memoryAvoided ?? null,
        revisit: e.champion.composition.memoryRevisit ?? null,
      })),
    });
  }
const summary = Object.fromEntries(
  [CONTINUITY_COMPOSER, MEMORY_COMPOSER].map((composer) => {
    const selected = runs.filter((r) => r.composer === composer),
      heirs = selected.flatMap((r) => r.heirs);
    return [
      composer,
      {
        lineages: 30,
        epochs: heirs.length,
        meanUniqueSources:
          selected.reduce((sum, r) => sum + r.uniqueSources, 0) / 30,
        recentSourceRepeats: selected.reduce(
          (sum, r) => sum + r.recentSourceRepeats,
          0,
        ),
        recentEndingRepeats: selected.reduce(
          (sum, r) => sum + r.recentEndingRepeats,
          0,
        ),
        generatedNodes: selected.reduce((sum, r) => sum + r.population, 0),
        sources: Object.fromEntries(
          ids.map((id) => [id, heirs.filter((h) => h.source === id).length]),
        ),
        meanAvoided:
          composer === MEMORY_COMPOSER
            ? heirs.reduce((sum, h) => sum + h.avoided, 0) / heirs.length
            : null,
        revisits: heirs.filter((h) => h.revisit).length,
      },
    ];
  }),
);
await mkdir(new URL("../output", import.meta.url), { recursive: true });
await writeFile(
  new URL("../output/memory-comparison.json", import.meta.url),
  JSON.stringify(
    {
      versions: corpusVersions(engine),
      scope:
        "Thirty seeds, thirty automatic epochs each, default source order. Recent repeat means matching any of the preceding three winning heirs. Controller feedback can change tree dimensions between composers.",
      summary,
      runs,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(summary, null, 2));
