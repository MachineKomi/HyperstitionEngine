import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { extractionFlags } from "../src/engine/sourceSpans.js";

const base = new URL("../src/assets/corpus/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("corpus_manifest.json", base), "utf8"),
);
const sources = {};
for (const id of manifest.spirits) {
  const bytes = await readFile(new URL(`${id}.json`, base));
  const data = JSON.parse(bytes);
  const flags = {};
  let eligible = 0,
    largest = 0;
  for (const original of data.sentences) {
    const count = original.trim().split(/\s+/).length;
    if (count < 6 || count > 65 || /https?:|@|\bdoi\b/i.test(original))
      continue;
    eligible++;
    largest = Math.max(largest, original.length);
    for (const flag of extractionFlags(original))
      flags[flag] = (flags[flag] || 0) + 1;
  }
  if (largest > 8192)
    throw new Error(`${id} exceeds the 8192-character source context budget.`);
  sources[id] = {
    version: createHash("sha256").update(JSON.stringify(data)).digest("hex"),
    files: manifest.processed_files[id] || [],
    units: data.sentences.length,
    eligible,
    largest,
    flags,
  };
}
const output =
  JSON.stringify(
    { format: "hyperstition-source-catalog", version: 1, sources },
    null,
    2,
  ) + "\n";
const target = new URL("../src/assets/source_catalog.json", import.meta.url);
if (process.argv.includes("--check")) {
  if ((await readFile(target, "utf8")).replace(/\r\n/g, "\n") !== output)
    throw new Error(
      "Source catalog is stale. Run npm run sources:catalog and review it.",
    );
  console.log(`Source catalog matches all ${Object.keys(sources).length} bundled corpus files.`);
} else {
  await writeFile(target, output);
  console.log(output);
}
