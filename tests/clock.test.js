import test from "node:test";
import assert from "node:assert/strict";
import { createPlaybackClock, clampClockRate } from "../src/engine/clock.js";
import { sprawlPositions } from "../src/engine/topology.js";
import { growSprawl, pruneBranch } from "../src/engine/sprawl.js";

function harness() {
  let time = 0,
    settings = { rate: 1, paused: false },
    serial = 0;
  const timers = new Map(),
    listeners = new Set();
  const clock = createPlaybackClock({
    read: () => settings,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    now: () => time,
    setTimer: (callback, delay) => {
      const id = ++serial;
      timers.set(id, { callback, at: time + delay });
      return id;
    },
    clearTimer: (id) => timers.delete(id),
  });
  return {
    clock,
    timers,
    listeners,
    change: (patch) => {
      settings = { ...settings, ...patch };
      [...listeners].forEach((listener) => listener());
    },
    advance: (duration) => {
      const end = time + duration;
      while (timers.size) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        time = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      time = end;
    },
  };
}

test("changing speed mid-beat preserves elapsed time and cleans up after completion", async () => {
  const h = harness();
  let finished = false;
  const pending = h.clock.wait(1000).then(() => {
    finished = true;
  });
  h.advance(400);
  h.change({ rate: 2 });
  h.advance(299);
  await Promise.resolve();
  assert.equal(finished, false);
  h.advance(1);
  await pending;
  assert.equal(finished, true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test("pause retains the unfinished beat without timers or catch-up work", async () => {
  const h = harness();
  let finished = false;
  const pending = h.clock.wait(1000).then(() => {
    finished = true;
  });
  h.advance(250);
  h.change({ paused: true });
  assert.equal(h.timers.size, 0);
  h.advance(60000);
  h.change({ rate: 0.25 });
  h.advance(60000);
  await Promise.resolve();
  assert.equal(finished, false);
  h.change({ paused: false });
  h.advance(2999);
  await Promise.resolve();
  assert.equal(finished, false);
  h.advance(1);
  await pending;
  assert.equal(h.listeners.size, 0);
});

test("aborting a held or already-aborted clock removes subscriptions immediately", async () => {
  for (const already of [false, true]) {
    const h = harness(),
      controller = new AbortController();
    h.change({ paused: true });
    if (already) controller.abort();
    const pending = h.clock.wait(1000, controller.signal);
    if (!already) controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(h.listeners.size, 0);
    assert.equal(h.timers.size, 0);
  }
  assert.equal(clampClockRate(NaN), 1);
  assert.equal(clampClockRate(Infinity), 1);
  assert.equal(clampClockRate(-10), 0.25);
  assert.equal(clampClockRate(100), 32);
});

test("existing graph nodes stay in place through growth and branch pruning", async () => {
  for (const branches of [2, 3, 4]) {
    const layers = [];
    const tree = await growSprawl({
      engine: { mutate: () => ({ text: "A mechanical descendant." }) },
      root: "The origin.",
      branches,
      depth: 4,
      seed: 137,
      mutation: 0.5,
      wait: async () => {},
      onLayer: (nodes) => layers.push(nodes),
    });
    const full = sprawlPositions(tree, branches, 4);
    for (const nodes of [...layers, pruneBranch(tree, "1")]) {
      for (const [id, point] of sprawlPositions(nodes, branches, 4)) {
        assert.deepEqual(point, full.get(id));
        assert.ok(point.x >= 164 && point.x <= 556);
        assert.ok(point.y >= 44 && point.y <= 436);
      }
    }
  }
});
