import test from "node:test";
import assert from "node:assert/strict";
import MarkovModule from "markov-strings";
const Markov = MarkovModule.default || MarkovModule;
import { SprawlEngine, growSprawl, pruneBranch } from "../src/engine/sprawl.js";
import { GrammarEngine } from "../src/engine/grammar.js";
import { generateMarkov } from "../src/engine/markovGeneration.js";
import {
  createConductorState,
  runConductor,
  planConductor,
  GHOSTS,
} from "../src/engine/conductor.js";
import {
  chronicleDocument,
  validateChronicle,
} from "../src/services/chronicle.js";

function binder() {
  let key, engines;
  return async (aspects) => {
    if (key === aspects.join(",")) return engines;
    const data = aspects.map((id) => ({
      id,
      sourceVersion: "ab".repeat(32),
      sentences: [
        "The machine carries a memory through every transformation of the distant world.",
        "The cathedral remembers the question that gave its first dream a shape.",
        "A circuit can change the conditions that once made its survival possible.",
      ],
      pos: {
        nouns: ["machine", "door", "memory"],
        verbs: ["remember", "open"],
        adjectives: ["distant", "golden"],
      },
    }));
    const grammar = new GrammarEngine(),
      sprawl = new SprawlEngine(),
      chain = new Markov({ stateSize: 2 });
    grammar.loadCorpus(data);
    sprawl.loadCorpus(data);
    await chain.addData(data.flatMap((s) => s.sentences));
    key = aspects.join(",");
    engines = {
      grammar,
      sprawl,
      markov: {
        generate: (entropy, seed) => generateMarkov(chain, entropy, seed),
      },
    };
    return engines;
  };
}
const options = () => ({
  state: createConductorState(137),
  bind: binder(),
  wait: async () => {},
  maxEpochs: 33,
});
test("conductor drives every creative operation, visits every ghost and reproduces complete seeded records", async () => {
  const first = [],
    second = [],
    actions = [];
  await runConductor({
    ...options(),
    onAction: (a) => actions.push(a),
    onEpoch: (e) => first.push(e),
  });
  await runConductor({ ...options(), onEpoch: (e) => second.push(e) });
  assert.deepEqual(first, second);
  assert.deepEqual(
    new Set(first.flatMap((e) => e.settings.aspects)),
    new Set(GHOSTS),
  );
  for (const kind of [
    "bind",
    "charge",
    "markov",
    "grammar",
    "invoke",
    "multiply",
    "inoculate",
    "grow",
    "prune",
    "inherit",
    "rebirth",
    "read",
  ])
    assert.ok(
      actions.some((a) => a.kind === kind),
      kind,
    );
  for (const e of first) {
    assert.ok(e.population <= 85);
    assert.ok(e.conductor.surviving <= e.population);
    assert.ok(
      e.settings.memory.every((m) => e.settings.aspects.includes(m.source)),
    );
    assert.equal(e.conductor.outputs.length, e.conductor.count);
    if (e.conductor.rebirth) assert.deepEqual(e.settings.memory, []);
    if (e.conductor.inoculate)
      assert.ok(e.settings.root.startsWith(e.conductor.outputs.at(-1).trim()));
  }
  const entries = first.map((e, i) => ({
    ...e,
    id: String(i),
    time: "2026-09-05T22:00:00Z",
  }));
  assert.deepEqual(validateChronicle(chronicleDocument(entries)), entries);
});
test("interruption during a ritual or pruning retains the completed checkpoint and exactly the same future", async () => {
  const expected = [];
  await runConductor({
    ...options(),
    maxEpochs: 14,
    onEpoch: (e) => expected.push(e),
  });
  for (const kind of ["multiply", "prune", "rebirth"]) {
    const actual = [],
      abort = new AbortController();
    let checkpoint = createConductorState(137);
    await assert.rejects(
      runConductor({
        ...options(),
        signal: abort.signal,
        onAction: (a) => {
          if (a.kind === kind) abort.abort();
        },
        onEpoch: (e, n, next) => {
          actual.push(e);
          checkpoint = next;
        },
      }),
      { name: "AbortError" },
    );
    await runConductor({
      ...options(),
      state: checkpoint,
      maxEpochs: 14 - actual.length,
      onEpoch: (e) => actual.push(e),
    });
    assert.deepEqual(actual, expected);
  }
});
test("recorded pruning leaves the heir reachable and replayable; malformed conductor archives are rejected", async () => {
  const bind = binder();
  let entry, tree;
  await runConductor({
    ...options(),
    bind,
    maxEpochs: 3,
    onEpoch: (e, n) => {
      entry = { ...e, id: "pruned", time: "2026-09-05T22:00:00Z" };
      tree = n;
    },
  });
  const engines = await bind(entry.settings.aspects);
  const replay = await growSprawl({
    ...entry.settings,
    engine: engines.sprawl,
    wait: async () => {},
  });
  assert.deepEqual(pruneBranch(replay, entry.conductor.pruned), tree);
  assert.equal(
    tree.find((n) => n.id === entry.champion.id).text,
    entry.champion.text,
  );
  assert.ok(
    tree.every(
      (n) => n.parentId === null || tree.some((p) => p.id === n.parentId),
    ),
  );
  for (const mutate of [
    (d) => (d.version = "future"),
    (d) => (d.outputs = []),
    (d) => (d.aspects = []),
    (d) => (d.surviving = 0),
    (d) => (d.pruned = "99"),
    (d) => (d.oracleSeed = -1),
  ]) {
    const bad = structuredClone(entry);
    mutate(bad.conductor);
    assert.throws(
      () => validateChronicle(chronicleDocument([bad])),
      /conductor/,
    );
  }
});
test("changing the origin seed changes the ghost deck and ritual seeds", () => {
  assert.notDeepEqual(
    planConductor(createConductorState(137)),
    planConductor(createConductorState(138)),
  );
});
