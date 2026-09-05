import test from "node:test";
import assert from "node:assert/strict";
import {
  SprawlEngine,
  growSprawl,
  randomStream,
} from "../src/engine/sprawl.js";
import {
  ContinuityComposer,
  CONTINUITY_COMPOSER,
  LEGACY_COMPOSER,
  eligibleSentence,
  sentenceSpans,
  corpusVersions,
} from "../src/engine/continuity.js";
import { createAutomaticState, runAutomatic } from "../src/engine/automatic.js";
import {
  chronicleDocument,
  validateChronicle,
} from "../src/services/chronicle.js";

function fixture() {
  const engine = new SprawlEngine();
  engine.loadCorpus([
    {
      id: "fixture",
      sourceVersion: "ab".repeat(32),
      sentences: [
        "The machine carries a memory through every transformation.",
        "The cathedral returns to a question that remains unanswered.",
        "Probability gives every possible future a different weight.",
        "A circuit can change the conditions of its survival.",
        "This is, I think, is what.",
        "An agent was trained with the objective in [23].",
      ],
      pos: { nouns: ["machine", "memory", "circuit"] },
    },
  ]);
  return engine;
}
const setup = (engine) => ({
  engine,
  composer: CONTINUITY_COMPOSER,
  motif: "machine",
  corpusVersions: corpusVersions(engine),
  root: "The machine  remembers the room that invented it.",
  branches: 3,
  depth: 3,
  mutation: 0.65,
  seed: 137,
  wait: async () => {},
});

test("continuity preserves whole inherited passages, exact source sentences and a recurring motif", async () => {
  const engine = fixture(),
    settings = setup(engine);
  const first = await growSprawl(settings),
    second = await growSprawl(settings);
  assert.deepEqual(first, second);
  for (const node of first.slice(1)) {
    const parent = first.find((parent) => parent.id === node.parentId);
    assert.ok(parent.text.includes(node.inheritedFragment));
    assert.ok(node.text.includes(node.sourceFragment));
    assert.ok(node.carry.includes("machine"));
    assert.equal(node.motif, "machine");
    assert.equal(node.text.split(/\n\n/).length, 3);
    assert.ok(
      sentenceSpans(node.sourceTrace.original).some(
        (span) =>
          span.start === node.sourceTrace.start &&
          span.end === node.sourceTrace.end,
      ),
    );
    assert.ok(eligibleSentence(node.sourceFragment));
    const m = node.composition;
    assert.ok(m.candidates <= 24);
    assert.ok(Math.abs(m.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.equal(m.probability, m.probabilities[m.selectedIndex]);
    assert.ok(Math.abs(m.surprisal + Math.log2(m.probability)) < 1e-12);
    assert.ok(
      Math.abs(
        m.entropy +
          m.probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0),
      ) < 1e-12,
    );
  }
});

test("incomplete source units are rejected while the legacy composer stays available", async () => {
  for (const text of [
    "This is, I think, is what.",
    "The circuit opened its door and.",
    "The machine was described in [23].",
    "We can rep—oh, no, sometimes we do.",
  ])
    assert.equal(eligibleSentence(text), false);
  assert.equal(
    eligibleSentence("The circuit changes the conditions of its survival."),
    true,
  );
  const engine = new SprawlEngine();
  engine.loadCorpus([
    {
      id: "damaged",
      sentences: ["An inherited circuit was described only in [23]."],
      pos: { nouns: ["circuit"] },
    },
  ]);
  await assert.rejects(
    growSprawl({ ...setup(engine), composer: CONTINUITY_COMPOSER }),
    /No intact sentence/,
  );
  assert.ok(
    (await growSprawl({ ...setup(engine), composer: LEGACY_COMPOSER })).length >
      1,
  );
});

test("versioned archives preserve replay and reject changed corpora or fabricated probability metadata", async () => {
  const engine = fixture();
  let entry;
  await runAutomatic({
    engine,
    state: createAutomaticState(137, CONTINUITY_COMPOSER),
    aspects: ["fixture"],
    maxEpochs: 1,
    wait: async () => {},
    onEpoch: (e) => {
      entry = { ...e, id: "test", time: "2026-09-05T20:00:00Z" };
    },
  });
  const read = validateChronicle(
    JSON.parse(JSON.stringify(chronicleDocument([entry]))),
  )[0];
  assert.deepEqual(read, entry);
  const original = await growSprawl({
    ...entry.settings,
    engine,
    wait: async () => {},
  });
  const replay = await growSprawl({
    ...read.settings,
    engine,
    wait: async () => {},
  });
  assert.deepEqual(replay, original);
  assert.deepEqual(
    original.find((node) => node.id === entry.champion.id).text,
    entry.champion.text,
  );
  await assert.rejects(
    growSprawl({
      ...read.settings,
      engine,
      corpusVersions: { fixture: "cd".repeat(32) },
    }),
    /differs from this replay/,
  );
  for (const mutate of [
    (e) => (e.settings.composer = "unknown"),
    (e) => (e.champion.composition.probabilities = [0.1]),
    (e) => (e.champion.composition.entropy = 99),
    (e) => (e.champion.composition.surprisal = 99),
    (e) => (e.champion.motif = "unrelated"),
  ]) {
    const bad = structuredClone(entry);
    mutate(bad);
    assert.throws(
      () => validateChronicle(chronicleDocument([bad])),
      /composer|continuity/,
    );
  }
});

test("a continuity lineage survives interruption with the same future and stays bounded", async () => {
  const options = {
    engine: fixture(),
    state: createAutomaticState(19, CONTINUITY_COMPOSER),
    aspects: ["fixture"],
    maxEpochs: 30,
    wait: async () => {},
  };
  const expected = [];
  await runAutomatic({ ...options, onEpoch: (entry) => expected.push(entry) });
  const actual = [],
    abort = new AbortController();
  let checkpoint = options.state;
  await assert.rejects(
    runAutomatic({
      ...options,
      signal: abort.signal,
      onEpoch: (entry, nodes, next) => {
        actual.push(entry);
        checkpoint = next;
      },
      onLayer: () => {
        if (actual.length === 7) abort.abort();
      },
    }),
    { name: "AbortError" },
  );
  await runAutomatic({
    ...options,
    state: checkpoint,
    maxEpochs: 23,
    onEpoch: (entry) => actual.push(entry),
  });
  assert.deepEqual(actual, expected);
  assert.ok(
    actual.every(
      (entry) =>
        entry.population <= 85 &&
        entry.champion.text.length < 4000 &&
        entry.champion.motif === "machine",
    ),
  );
});

test("continuity reading beats scale with text but stay inside the clock budget", async () => {
  const beats = [];
  await runAutomatic({
    engine: fixture(),
    state: createAutomaticState(137, CONTINUITY_COMPOSER),
    aspects: ["fixture"],
    maxEpochs: 2,
    wait: async (ms) => beats.push(ms),
  });
  const reading = beats.filter((ms) => ms >= 8000);
  assert.equal(reading.length, 1);
  assert.ok(reading[0] >= 8000 && reading[0] <= 18000);
});

test("index preparation yields, cancels cleanly and preserves synchronous candidate ordering", async () => {
  const engine = fixture();
  engine.sources[0].records = Array.from({ length: 600 }, (_, i) => ({
    ...engine.sources[0].records[i % 4],
    unit: i,
  }));
  const synchronous = new ContinuityComposer(engine.sources);
  const abort = new AbortController();
  const preparing = engine.prepareComposer(abort.signal);
  abort.abort();
  await assert.rejects(preparing, { name: "AbortError" });
  assert.equal(engine.continuity, null);
  await engine.prepareComposer();
  const parent = { text: "The machine remembers the room that invented it." };
  assert.deepEqual(
    engine.continuity.mutate(parent, randomStream(137), 0.65),
    synchronous.mutate(parent, randomStream(137), 0.65),
  );
});
