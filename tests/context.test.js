import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { contextCues, CONTEXT_COMPOSER } from "../src/engine/context.js";
import { SprawlEngine, growSprawl } from "../src/engine/sprawl.js";
import { MEMORY_COMPOSER } from "../src/engine/memory.js";

test("context cues retain concrete referents and experimental prose caught by broader drafts", () => {
  for (const text of [
    "The authoritarian tradition of European reason tried to pull the plug on the great voyages at exactly the point they first became interesting, which is to say: atheistic, inhuman, experimental, and dangerous.",
    "Every place that the sole of your foot shall tread upon, that have I given unto you, as I said unto Moses.",
    "Remember we talked about the person trapped in this world, but a sense that there might be a better self and a better world over there?",
    "Now notice how the machine preserves its memory.",
    "The value of L(x) represents the loss for a given observation.",
    "The machine remembers the hands that built it.",
  ])
    assert.deepEqual(contextCues(text), [], text);
  for (const [text, cue] of [
    ["Now notice, of course, what this means.", "empty-direction"],
    [
      "As I mentioned, the machine requires a different account.",
      "discussion-reference",
    ],
    [
      "The w training process must seek a w vector that gives the right shape to the energy function.",
      "notation-context",
    ],
    [
      "The God beyond the God of theism, which is a deeply transgressive statement.",
      "relative-fragment",
    ],
  ])
    assert.deepEqual(contextCues(text), [cue]);
});

test("the versioned screen preserves exact source spans and leaves earlier candidate caches intact", async () => {
  const engine = new SprawlEngine();
  engine.loadCorpus(
    await Promise.all(
      ["N_Land", "Bible", "AI"].map(async (id) =>
        JSON.parse(
          await readFile(
            new URL(`../src/assets/corpus/${id}.json`, import.meta.url),
            "utf8",
          ),
        ),
      ),
    ),
  );
  await engine.prepareComposer(undefined, MEMORY_COMPOSER);
  const original = engine.continuity;
  await engine.prepareComposer(undefined, CONTEXT_COMPOSER);
  assert.equal(engine.continuity, original);
  assert.equal(original.candidates.length, 3303);
  assert.equal(engine.contextual.candidates.length, 3292);
  const excluded = original.candidates.filter(
    (c) => contextCues(c.text).length,
  );
  assert.equal(excluded.length, 11);
  assert.ok(excluded.every((c) => c.source.id === "AI"));
  for (const c of engine.contextual.candidates) {
    assert.deepEqual(contextCues(c.text), []);
    assert.equal(
      c.record.original.slice(c.start, c.end).replace(/\s+/g, " ").trim(),
      c.text,
    );
  }
});

test("an empty context pool fails explicitly, and cancellation or rebinding cannot publish a stale index", async () => {
  const engine = new SprawlEngine();
  const source = {
    id: "fixture",
    sentences: [
      "The God beyond the God of theism, which is a deeply transgressive statement.",
    ],
  };
  engine.loadCorpus([source]);
  const settings = {
    engine,
    root: "The machine remembers the door.",
    branches: 2,
    depth: 1,
    mutation: 0.5,
    seed: 1,
    wait: async () => {},
  };
  await assert.rejects(
    growSprawl({ ...settings, composer: CONTEXT_COMPOSER }),
    /No intact sentence/,
  );
  assert.equal(
    (await growSprawl({ ...settings, composer: MEMORY_COMPOSER })).length,
    3,
  );
  engine.loadCorpus([
    {
      ...source,
      sentences: Array(600).fill(
        "The machine carries a memory through every transformation.",
      ),
    },
  ]);
  const abort = new AbortController();
  const pending = engine.prepareComposer(abort.signal, CONTEXT_COMPOSER);
  abort.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(engine.contextual, null);
  const stale = engine.prepareComposer(undefined, CONTEXT_COMPOSER);
  engine.loadCorpus([source]);
  await assert.rejects(stale, { name: "AbortError" });
  assert.equal(engine.contextual, null);
});
