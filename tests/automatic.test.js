import test from "node:test";
import assert from "node:assert/strict";
import { SprawlEngine } from "../src/engine/sprawl.js";
import {
  createAutomaticState,
  planAutomaticEpoch,
  runAutomatic,
  AUTOMATIC_POPULATION_LIMIT,
} from "../src/engine/automatic.js";
import {
  chronicleDocument,
  validateChronicle,
} from "../src/services/chronicle.js";

function fixture(seed = 137) {
  const engine = new SprawlEngine();
  engine.loadCorpus([
    {
      id: "N_Land",
      sentences: [
        "The forgotten cathedral dreams of its mechanical future.",
        "A silver circuit carries the outside into every room.",
      ],
      pos: { nouns: ["circuit", "cathedral"] },
    },
  ]);
  return {
    engine,
    state: createAutomaticState(seed),
    aspects: ["N_Land"],
    pauseMs: 0,
    chargeMs: 0,
    layerPauseMs: 0,
    maxEpochs: 7,
  };
}

test("automatic rules stay bounded and seeds produce different exploration paths", () => {
  const plans = [];
  for (let seed = 0; seed < 1000; seed++) {
    for (let epoch = 0; epoch < 9; epoch++) {
      const plan = planAutomaticEpoch({
        ...createAutomaticState(seed),
        epoch,
        novelty: epoch / 9,
      });
      assert.ok(plan.population <= AUTOMATIC_POPULATION_LIMIT);
      assert.ok(plan.mutation >= 0.18 && plan.mutation <= 0.88);
      assert.ok(plan.entropy >= 180 && plan.entropy <= 900);
      assert.ok(
        Math.abs(plan.mutation * 100 - Math.round(plan.mutation * 100)) < 1e-8,
      );
      if (epoch % 5 === 4) assert.equal(plan.pressure, "chance");
      plans.push(JSON.stringify(plan));
    }
  }
  assert.ok(new Set(plans).size > 1000);
  assert.throws(() => createAutomaticState(-1), /whole seed/);
  assert.throws(() => createAutomaticState(0.5), /whole seed/);
});

test("a full automatic lineage reproduces from seed and remains a valid chronicle", async () => {
  const first = [],
    second = [];
  await runAutomatic({ ...fixture(), onEpoch: (entry) => first.push(entry) });
  await runAutomatic({ ...fixture(), onEpoch: (entry) => second.push(entry) });
  assert.deepEqual(first, second);
  assert.equal(first.length, 7);
  assert.equal(first[1].settings.root, first[0].champion.text);
  assert.equal(first[4].pressure, "chance");
  const records = first.map((entry, index) => ({
    ...entry,
    id: String(index),
    time: "2026-09-05T21:00:00.000Z",
  }));
  assert.deepEqual(validateChronicle(chronicleDocument(records)), records);
});

test("different playback durations preserve every decision and generated heir", async () => {
  const first = [],
    second = [],
    beats = [],
    phases = [];
  await runAutomatic({ ...fixture(), onEpoch: (entry) => first.push(entry) });
  await runAutomatic({
    ...fixture(),
    chargeMs: 800,
    layerPauseMs: 1500,
    pauseMs: 8000,
    wait: async (duration) => {
      beats.push(duration);
    },
    onPhase: (phase) => phases.push(phase),
    onEpoch: (entry) => second.push(entry),
  });
  assert.deepEqual(second, first);
  assert.deepEqual([...new Set(beats)], [800, 1500, 8000]);
  assert.equal(phases.filter((phase) => phase === "read").length, 7);
});

test("interrupting a growing tree publishes no heir and resuming retries the same epoch", async () => {
  const expected = [];
  await runAutomatic({
    ...fixture(),
    maxEpochs: 3,
    onEpoch: (entry) => expected.push(entry),
  });
  const actual = [];
  let checkpoint = createAutomaticState(137);
  const abort = new AbortController();
  await assert.rejects(
    runAutomatic({
      ...fixture(),
      signal: abort.signal,
      onEpoch: (entry, nodes, next) => {
        actual.push(entry);
        checkpoint = next;
      },
      onLayer: () => {
        if (actual.length === 1) abort.abort();
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(actual.length, 1);
  await runAutomatic({
    ...fixture(),
    state: checkpoint,
    maxEpochs: 2,
    onEpoch: (entry) => actual.push(entry),
  });
  assert.deepEqual(actual, expected);
});

test("cancellation during the breathing pause prevents a catch-up epoch", async () => {
  const abort = new AbortController();
  let plans = 0,
    completed = 0;
  await assert.rejects(
    runAutomatic({
      ...fixture(),
      signal: abort.signal,
      pauseMs: 60000,
      onPlan: () => plans++,
      onEpoch: () => {
        completed++;
        abort.abort();
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(plans, 1);
  assert.equal(completed, 1);
});

test("a failed mutation stops the runner and cannot manufacture completed epochs", async () => {
  let plans = 0,
    completed = 0;
  await assert.rejects(
    runAutomatic({
      ...fixture(),
      engine: {
        mutate() {
          throw new Error("Corpus unavailable");
        },
      },
      onPlan: () => plans++,
      onEpoch: () => completed++,
    }),
    /Corpus unavailable/,
  );
  assert.equal(plans, 1);
  assert.equal(completed, 0);
});
