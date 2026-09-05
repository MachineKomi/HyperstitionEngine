import { readFile, writeFile, mkdir } from "node:fs/promises";
import { SprawlEngine } from "../src/engine/sprawl.js";
import { contextCues } from "../src/engine/context.js";
const engine = new SprawlEngine();
const catalog = JSON.parse(
  await readFile(
    new URL("../src/assets/source_catalog.json", import.meta.url),
    "utf8",
  ),
);
engine.loadCorpus(
  await Promise.all(
    ["N_Land", "Bible", "AI"].map(async (id) => ({
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
await engine.prepareComposer();
const excluded = engine.continuity.candidates
  .map((c) => ({
    source: c.source.id,
    version: c.source.version,
    unit: c.record.unit,
    start: c.start,
    end: c.end,
    text: c.text,
    cues: contextCues(c.text),
  }))
  .filter((c) => c.cues.length);
await mkdir(new URL("../output", import.meta.url), { recursive: true });
await writeFile(
  new URL("../output/context-candidates.json", import.meta.url),
  JSON.stringify(excluded, null, 2),
);
console.log(
  JSON.stringify(
    {
      total: engine.continuity.candidates.length,
      excluded: excluded.length,
      examples: excluded,
    },
    null,
    2,
  ),
);
