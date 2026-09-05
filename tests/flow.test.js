import test from "node:test";
import assert from "node:assert/strict";
import { SprawlEngine } from "../src/engine/sprawl.js";
import {
  chooseHeir,
  inheritFlowSettings,
  nextSeed,
  runFlow,
} from "../src/engine/flow.js";
import {
  CHRONICLE_LIMIT,
  chronicleDocument,
  validateChronicle,
  mergeChronicle,
  readChronicle,
} from "../src/services/chronicle.js";

function fixture() {
  const engine = new SprawlEngine();
  engine.loadCorpus([
    {
      id: "N_Land",
      sentences: [
        "A strange cathedral carries circuits into the impossible future.",
        "The outside returns with silver gears and forgotten dreams.",
      ],
      pos: { nouns: ["circuit", "cathedral"] },
    },
  ]);
  return {
    engine,
    settings: {
      root: "The machine dreams of returning to the machine.",
      branches: 2,
      depth: 2,
      mutation: 0.65,
      seed: 123,
      epoch: 0,
      aspects: ["N_Land"],
      cycle: 1,
    },
    epochs: 3,
    pressure: "novelty",
    pauseMs: 0,
  };
}

test("selection pressures distinguish novelty from return and keep chance deterministic", () => {
  const nodes = [
    { id: "0", parentId: null, depth: 0, text: "machine dream return" },
    { id: "1", parentId: "0", depth: 1, text: "machine dream return machine" },
    { id: "2", parentId: "0", depth: 1, text: "silver forest cathedral" },
  ];
  assert.equal(chooseHeir(nodes, nodes[0].text, "novelty", 9).id, "2");
  assert.equal(chooseHeir(nodes, nodes[0].text, "echo", 9).id, "1");
  assert.deepEqual(
    chooseHeir(nodes, nodes[0].text, "chance", 9),
    chooseHeir(nodes, nodes[0].text, "chance", 9),
  );
});

test("automatic epochs inherit their winning text, advance seeds, and spend per epoch", async () => {
  const entries = [];
  let fuel = 100;
  const result = await runFlow({
    ...fixture(),
    takeOffering: () => {
      const before = fuel;
      fuel -= 20;
      return before;
    },
    onEpoch: (entry) => entries.push(entry),
  });
  assert.deepEqual(result, { completed: 3, reason: "completed" });
  assert.equal(fuel, 40);
  assert.equal(entries[1].settings.root, entries[0].champion.text);
  assert.equal(
    entries[1].settings.seed,
    nextSeed(entries[0].champion.text, entries[0].settings.seed),
  );
  assert.deepEqual(
    entries.map((entry) => entry.settings.mutation),
    [0.65, 0.68, 0.71],
  );
  assert.deepEqual(
    entries.map((entry) => entry.settings.entropy),
    [100, 80, 60],
  );
});

test("empty offerings stop the loop without manufacturing entropy", async () => {
  let fuel = 20;
  const result = await runFlow({
    ...fixture(),
    takeOffering: () => {
      if (fuel < 20) return false;
      const before = fuel;
      fuel -= 20;
      return before;
    },
  });
  assert.deepEqual(result, { completed: 1, reason: "depleted" });
  assert.equal(fuel, 0);
});

test("oversized heirs preserve their provenance while saving the actual replayable origin", async () => {
  const options = fixture();
  const entries = [];
  const roots = [];
  await runFlow({
    ...options,
    settings: {
      ...options.settings,
      root: "  " + "a".repeat(1200) + "  ",
      depth: 1,
      seed: 1,
    },
    pressure: "echo",
    takeOffering: () => 100,
    onEpoch: (entry, nodes) => {
      entries.push({
        ...entry,
        id: String(entries.length),
        time: "2026-09-05T18:00:00.000Z",
      });
      roots.push(nodes[0].text);
    },
  });
  assert.equal(entries[0].settings.root, "a".repeat(1200));
  assert.ok(entries.some((entry) => entry.champion.text.length > 1200));
  assert.ok(entries.every((entry) => entry.settings.root.length <= 1200));
  assert.deepEqual(entries.map((entry) => entry.settings.root), roots);
  assert.equal(
    entries[1].settings.seed,
    nextSeed(entries[0].champion.text, entries[0].settings.seed),
  );
  assert.deepEqual(
    validateChronicle(JSON.parse(JSON.stringify(chronicleDocument(entries)))),
    entries,
  );
});

test("resuming after interruption preserves uninterrupted inheritance and mutation progression", async () => {
  const options = fixture();
  const uninterrupted = [];
  let fuel = 100;
  const takeOffering = () => {
    const before = fuel;
    fuel -= 20;
    return before;
  };
  await runFlow({
    ...options,
    epochs: 4,
    takeOffering,
    onEpoch: (entry) => uninterrupted.push(entry),
  });
  fuel = 100;
  const resumed = [];
  const abort = new AbortController();
  await assert.rejects(
    runFlow({
      ...options,
      epochs: 4,
      signal: abort.signal,
      takeOffering,
      onEpoch: (entry) => {
        resumed.push(entry);
        if (resumed.length === 2) abort.abort();
      },
    }),
    { name: "AbortError" },
  );
  await runFlow({
    ...options,
    settings: inheritFlowSettings(resumed.at(-1)),
    epochs: 2,
    takeOffering,
    onEpoch: (entry) => resumed.push(entry),
  });
  assert.deepEqual(resumed, uninterrupted);
  assert.deepEqual(
    resumed.map((entry) => entry.settings.mutation),
    [0.65, 0.68, 0.71, 0.74],
  );
  assert.equal(fuel, 20);
});

test("ending possession cancels its pause and never starts the next epoch", async () => {
  const abort = new AbortController();
  let offerings = 0,
    finished = 0;
  await assert.rejects(
    runFlow({
      ...fixture(),
      pauseMs: 60000,
      signal: abort.signal,
      takeOffering: () => {
        offerings++;
        return 100;
      },
      onEpoch: () => {
        finished++;
        abort.abort();
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(offerings, 1);
  assert.equal(finished, 1);
});

test("chronicle roundtrip preserves replay settings and rejects malformed records", async () => {
  const entries = [];
  await runFlow({
    ...fixture(),
    epochs: 1,
    takeOffering: () => 100,
    onEpoch: (entry) =>
      entries.push({
        ...entry,
        id: "epoch-one",
        time: "2026-09-05T18:00:00.000Z",
      }),
  });
  const doc = chronicleDocument(entries);
  assert.deepEqual(validateChronicle(JSON.parse(JSON.stringify(doc))), entries);
  const broken = structuredClone(doc);
  broken.entries[0].settings.depth = 999;
  assert.throws(() => validateChronicle(broken), /invalid epoch/);
  assert.throws(
    () => validateChronicle({ version: 1, entries: [] }),
    /supported chronicle/,
  );
  assert.throws(
    () => validateChronicle({ ...doc, entries: [entries[0], entries[0]] }),
    /invalid epoch/,
  );
  assert.equal(
    readChronicle({ getItem: () => JSON.stringify(doc) }).entries.length,
    1,
  );
  assert.match(
    readChronicle({
      getItem: () => {
        throw new Error("denied");
      },
    }).error,
    /unavailable/,
  );
  const many = Array.from({ length: CHRONICLE_LIMIT + 3 }, (_, i) => ({
    ...entries[0],
    id: String(i),
  }));
  assert.equal(mergeChronicle([], many).length, CHRONICLE_LIMIT);
  assert.equal(mergeChronicle([], many)[0].id, "3");
  assert.equal(mergeChronicle(entries, entries).length, 1);
});
