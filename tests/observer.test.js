import test from "node:test";
import assert from "node:assert/strict";
import { createObserver, observeEpoch, sourceStatistics, textFeatures } from "../src/engine/observer.js";

const epoch = (novelty, text = "The machine remembers its own transformations.") => ({
  champion: { novelty, text, echo: 0.3 }, settings: { epoch: 0, mutation: 0.4 }, population: 31,
});

test("observer is deterministic and input state is immutable", () => {
  const initial = createObserver(17), original = structuredClone(initial);
  const run = () => Array.from({ length: 80 }, (_, i) => epoch((i % 7) / 7))
    .reduce(observeEpoch, createObserver(17));
  assert.deepEqual(run(), run());
  observeEpoch(initial, epoch(0.7));
  assert.deepEqual(initial, original);
  assert.notDeepEqual(createObserver(18).inputWeights, initial.inputWeights);
});

test("forecasts are scored before target learning and current text cannot change past error", () => {
  const first = observeEpoch(createObserver(), epoch(0.2));
  assert.equal(first.samples, 0);
  assert.equal(first.history.length, 0);
  const a = observeEpoch(first, epoch(0.9, "a")), b = observeEpoch(first, epoch(0.9, "different"));
  assert.equal(a.last.forecast, first.forecast);
  assert.equal(a.last.baseline, 0.2);
  assert.equal(a.errorSum, Math.abs(0.9 - first.forecast));
  assert.equal(a.baselineErrorSum, 0.7);
  assert.deepEqual(a.weights, b.weights);
  assert.equal(a.errorSum, b.errorSum);
  assert.notDeepEqual(a.units, b.units);
});

test("reservoir, text work and history remain bounded through long streams", () => {
  let state = createObserver();
  for (let i = 0; i < 3000; i++) state = observeEpoch(state, epoch(i % 2, "𐀀ＦＦ ﬃ ".repeat(300)));
  assert.equal(state.samples, 2999);
  assert.equal(state.history.length, 48);
  assert.equal(state.units.length, 24);
  assert.equal(state.weights.length, 25);
  assert.ok(state.units.every((value) => Number.isFinite(value) && Math.abs(value) <= 1));
  assert.ok(state.weights.every((value) => Number.isFinite(value) && Math.abs(value) <= 2));
  assert.ok(state.connections.every((edges) => edges.reduce((sum, edge) => sum + Math.abs(edge.weight), 0) < 1));
  assert.deepEqual(textFeatures("a".repeat(1200)), textFeatures("a".repeat(100000)));
  assert.equal(textFeatures("").length, 16);
  assert.ok(Math.abs(Math.hypot(...textFeatures("abcde")) - 1) < 1e-12);
  assert.throws(() => observeEpoch({ ...state, version: "unknown" }, epoch(0.2)), /Unsupported/);
});

test("online learning reduces error on a stationary target", () => {
  let state = createObserver();
  for (let i = 0; i < 100; i++) state = observeEpoch(state, epoch(0.8));
  assert.ok(Math.abs(state.forecast - 0.8) < 0.01);
});

test("source entropy and pruning use exact measured counts", () => {
  const rows = ["a", "b", "a", "b"].map((source) => ({ source, population: 10, surviving: 7 }));
  const result = sourceStatistics(rows);
  assert.equal(result.entropy, 1);
  assert.equal(result.effective, 2);
  assert.ok(Math.abs(result.removed - 0.3) < 1e-12);
  assert.equal(sourceStatistics([]).effective, 0);
  assert.equal(sourceStatistics(rows.slice(0, 1)).entropy, 0);
});
