import test from "node:test";
import assert from "node:assert/strict";
import { SprawlEngine, growSprawl } from "../src/engine/sprawl.js";
import { createAutomaticState, runAutomatic } from "../src/engine/automatic.js";
import { inheritFlowSettings } from "../src/engine/flow.js";
import { MEMORY_COMPOSER, MEMORY_LIMIT } from "../src/engine/memory.js";
import {
  chronicleDocument,
  validateChronicle,
} from "../src/services/chronicle.js";

function fixture(count = 16) {
  const names =
    "amber silver violet copper broken hollow distant hidden quiet empty frozen golden narrow dark open secret".split(
      " ",
    );
  const engine = new SprawlEngine();
  engine.loadCorpus([
    {
      id: "fixture",
      sourceVersion: "ab".repeat(32),
      sentences: names
        .slice(0, count)
        .map(
          (name) => `The machine carries a memory through the ${name} door.`,
        ),
      pos: { nouns: ["machine", "memory"] },
    },
  ]);
  return engine;
}
const options = (engine) => ({
  engine,
  state: createAutomaticState(137, MEMORY_COMPOSER),
  aspects: ["fixture"],
  maxEpochs: 30,
  wait: async () => {},
});

test("branch memory stays bounded, avoids recent choices and leaves siblings independent", async () => {
  const engine = fixture();
  const entries = [];
  await runAutomatic({
    ...options(engine),
    onEpoch: (entry, nodes) => {
      for (const node of nodes.slice(1)) {
        const parent = nodes.find((n) => n.id === node.parentId);
        assert.ok(node.memory.length <= MEMORY_LIMIT);
        assert.notEqual(node.memory, parent.memory);
        assert.deepEqual(node.memory.at(-1), {
          source: node.source,
          fragment: node.sourceFragment,
          carry: node.carry,
        });
        assert.deepEqual(
          node.memory.slice(0, -1),
          parent.memory.slice(-(MEMORY_LIMIT - 1)),
        );
        assert.equal(
          node.composition.memoryRevisit,
          parent.memory.some((m) => m.fragment === node.sourceFragment),
        );
        if (!node.composition.memoryRevisit)
          assert.ok(
            !parent.memory.some((m) => m.fragment === node.sourceFragment),
          );
        assert.ok(!parent.memory.some((m) => m.carry === node.carry));
      }
      entries.push(entry);
    },
  });
  assert.equal(entries.at(-1).champion.memory.length, MEMORY_LIMIT);
  assert.ok(entries.some((e) => e.champion.composition.memoryAvoided > 0));
  const heir = entries[0].champion;
  const inherited = inheritFlowSettings(entries[0]);
  assert.deepEqual(inherited.memory, heir.memory);
  inherited.memory[0].fragment = "changed copy";
  assert.notEqual(heir.memory[0].fragment, "changed copy");
});

test("a tiny corpus reports a revisit when no fresh shortlist alternative remains", async () => {
  const entries = [];
  await runAutomatic({
    ...options(fixture(1)),
    maxEpochs: 3,
    onEpoch: (e) => entries.push(e),
  });
  assert.ok(entries.every((e) => e.champion.composition.memoryRevisit));
  assert.ok(entries.every((e) => e.champion.composition.memoryAvoided === 0));
});

test("memory archives retain replay inputs and reject malformed or inconsistent ledgers", async () => {
  const engine = fixture();
  let entry;
  await runAutomatic({
    ...options(engine),
    maxEpochs: 5,
    onEpoch: (e) => {
      entry = { ...e, id: "memory", time: "2026-09-05T21:00:00Z" };
    },
  });
  const replay = validateChronicle(
    JSON.parse(JSON.stringify(chronicleDocument([entry]))),
  )[0];
  assert.deepEqual(replay, entry);
  const nodes = await growSprawl({
    ...replay.settings,
    engine,
    wait: async () => {},
  });
  const champion = nodes.find((n) => n.id === entry.champion.id);
  assert.equal(champion.text, entry.champion.text);
  assert.deepEqual(champion.memory, entry.champion.memory);
  for (const mutate of [
    (e) => e.settings.memory.push(...e.settings.memory),
    (e) => (e.champion.memory.at(-1).fragment = "invented"),
    (e) => (e.champion.memory[0].source = "missing"),
    (e) => (e.champion.composition.memoryAvoided = 24),
    (e) => (e.champion.composition.memoryRevisit = "true"),
    (e) => delete e.settings.memory,
  ]) {
    const bad = structuredClone(entry);
    mutate(bad);
    assert.throws(() => validateChronicle(chronicleDocument([bad])), /memory/);
  }
});

test("interruption preserves the same memory and future as an uninterrupted lineage", async () => {
  const engine = fixture(),
    expected = [],
    actual = [];
  await runAutomatic({ ...options(engine), onEpoch: (e) => expected.push(e) });
  const abort = new AbortController();
  let checkpoint = createAutomaticState(137, MEMORY_COMPOSER);
  await assert.rejects(
    runAutomatic({
      ...options(engine),
      signal: abort.signal,
      onEpoch: (e, n, next) => {
        actual.push(e);
        checkpoint = next;
      },
      onLayer: () => {
        if (actual.length === 7) abort.abort();
      },
    }),
    { name: "AbortError" },
  );
  await runAutomatic({
    ...options(engine),
    state: checkpoint,
    maxEpochs: 23,
    onEpoch: (e) => actual.push(e),
  });
  assert.deepEqual(actual, expected);
});
