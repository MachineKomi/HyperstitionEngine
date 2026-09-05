import { mkdir, readFile, writeFile } from "node:fs/promises";
import { SprawlEngine, growSprawl } from "../src/engine/sprawl.js";
import { chooseHeir } from "../src/engine/flow.js";
import {
  CONTINUITY_COMPOSER,
  LEGACY_COMPOSER,
  corpusVersions,
} from "../src/engine/continuity.js";
const catalog = JSON.parse(
  await readFile(
    new URL("../src/assets/source_catalog.json", import.meta.url),
    "utf8",
  ),
);
const ids = ["N_Land", "Bible", "AI"];
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
engine.loadCorpus(data);
const samples = [];
for (let seed = 0; seed < 30; seed++) {
  const pair = { seed };
  for (const composer of [LEGACY_COMPOSER, CONTINUITY_COMPOSER]) {
    const start = performance.now();
    const tree = await growSprawl({
      engine,
      composer,
      corpusVersions: corpusVersions(engine),
      root: "The machine god dreams in the ruins of its own instructions.",
      branches: 3,
      depth: 3,
      mutation: 0.65,
      seed,
      wait: async () => {},
    });
    const heir = chooseHeir(tree, tree[0].text, "echo", seed);
    pair[composer] = { milliseconds: performance.now() - start, heir };
  }
  samples.push(pair);
}
const result = {
  sources: ids,
  versions: corpusVersions(engine),
  parameters: { branches: 3, depth: 3, mutation: 0.65, pressure: "echo" },
  candidates: engine.continuity.candidates.length,
  bySource: Object.fromEntries(
    ids.map((id) => [
      id,
      engine.continuity.candidates.filter((c) => c.source.id === id).length,
    ]),
  ),
  samples,
};
await mkdir(new URL("../output", import.meta.url), { recursive: true });
await writeFile(
  new URL("../output/composer-comparison.json", import.meta.url),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    {
      candidates: result.candidates,
      bySource: result.bySource,
      examples: samples.slice(0, 5).map((pair) => ({
        seed: pair.seed,
        legacy: pair[LEGACY_COMPOSER].heir.text,
        continuity: pair[CONTINUITY_COMPOSER].heir.text,
        choice: pair[CONTINUITY_COMPOSER].heir.composition,
      })),
    },
    null,
    2,
  ),
);
