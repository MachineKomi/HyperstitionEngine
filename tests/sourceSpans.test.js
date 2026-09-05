import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { SprawlEngine, growSprawl } from "../src/engine/sprawl.js";
import {
  windowSpan,
  normalizeSpan,
  punctuationUnits,
  extractionFlags,
} from "../src/engine/sourceSpans.js";
import { createAutomaticState, runAutomatic } from "../src/engine/automatic.js";
import {
  chronicleDocument,
  validateChronicle,
} from "../src/services/chronicle.js";

function engine() {
  const engine = new SprawlEngine();
  engine.loadCorpus([
    {
      id: "fixture",
      sentences: [
        "A silver circuit carries the outside into every room.",
        "The forgotten cathedral dreams of its mechanical future.",
      ],
      pos: { nouns: ["circuit", "cathedral"] },
    },
  ]);
  return engine;
}

test("source addressing leaves 30 legacy seeded trees byte-for-byte unchanged", async () => {
  const all = [];
  for (let seed = 0; seed < 30; seed++) {
    const tree = await growSprawl({
      engine: engine(),
      root: "The future remembers the room that invented it.",
      branches: 3,
      depth: 3,
      mutation: 0.65,
      seed,
      wait: async () => {},
    });
    all.push(
      tree.map((node) => {
        const copy = { ...node };
        delete copy.sourceTrace;
        return copy;
      }),
    );
  }
  assert.equal(
    createHash("sha256").update(JSON.stringify(all)).digest("hex"),
    "84052ff3ce0da1b4b716457c8c749fe37601fcf60a954589fd6c917747e4285d",
  );
});

test("every eligible bundled extraction preserves exact graft offsets at both boundaries", async () => {
  const base = new URL("../src/assets/corpus/", import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("corpus_manifest.json", base), "utf8"),
  );
  let checked = 0;
  for (const id of manifest.spirits) {
    const data = JSON.parse(
      await readFile(new URL(id + ".json", base), "utf8"),
    );
    const e = new SprawlEngine();
    e.loadCorpus([data]);
    for (const record of e.sources[0].records) {
      assert.ok(record.original.length <= 8192);
      for (const random of [0, 0.999999])
        for (const count of [4, 17]) {
          const span = windowSpan(record.original, () => random, count);
          assert.equal(
            normalizeSpan(record.original.slice(span.start, span.end)),
            span.text,
          );
        }
      checked++;
    }
  }
  assert.equal(checked, 51919);
});

test("original whitespace, surrogate pairs and punctuation survive source addressing", () => {
  for (const text of [
    "  A 🜏 circuit\n\nremembers\tits own    origin!",
    "one two three ;",
    "... ... ... ...",
  ]) {
    for (const random of [0, 0.999]) {
      const span = windowSpan(text, () => random, 4);
      assert.equal(normalizeSpan(text.slice(span.start, span.end)), span.text);
    }
  }
  const original =
    "Dr. Land observes the circuit. It returns; the door remains open!";
  const units = punctuationUnits(original);
  assert.equal(units.length, 3);
  assert.equal(units.map((unit) => unit.text).join(""), original);
  for (const unit of units)
    assert.equal(original.slice(unit.start, unit.end), unit.text);
});

test("extraction flags expose editorial, quotation, OCR and experimental-line uncertainty", () => {
  assert.deepEqual(
    extractionFlags("A circuit remembers its own beginning."),
    [],
  );
  assert.ok(
    extractionFlags("Edited by an anonymous archivist.").includes(
      "possible editorial matter",
    ),
  );
  assert.ok(
    extractionFlags("He said “the circuit remembers”.").includes(
      "quotation marks; speaker unverified",
    ),
  );
  assert.ok(
    extractionFlags("A thought enters the trans-\nmission.").includes(
      "possible extraction damage",
    ),
  );
  assert.ok(
    extractionFlags("zero\nreturns\nzero").includes("line breaks preserved"),
  );
  assert.ok(
    extractionFlags("See the argument in [12].").includes("reference material"),
  );
});

test("new archives retain source context, old archives remain readable, invalid addresses fail closed", async () => {
  let entry;
  await runAutomatic({
    engine: engine(),
    state: createAutomaticState(137),
    aspects: ["fixture"],
    maxEpochs: 1,
    wait: async () => {},
    onEpoch: (e) => {
      entry = { ...e, id: "fixture-epoch", time: "2026-09-05T20:00:00.000Z" };
    },
  });
  assert.deepEqual(validateChronicle(chronicleDocument([entry])), [entry]);
  const legacy = structuredClone(entry);
  delete legacy.champion.sourceTrace;
  assert.deepEqual(validateChronicle(chronicleDocument([legacy])), [legacy]);
  for (const patch of [
    { start: -1 },
    { unit: 1.5 },
    { end: 999999 },
    { original: "invented context" },
    { version: "wrong" },
    { id: "wrong" },
  ]) {
    const bad = structuredClone(entry);
    Object.assign(bad.champion.sourceTrace, patch);
    assert.throws(
      () => validateChronicle(chronicleDocument([bad])),
      /invalid source address/,
    );
  }
});
