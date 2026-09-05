import test from "node:test";
import assert from "node:assert/strict";
import { createSeedSelection, drawSeed, mixSeed, randomWord, SEED_DIALS, SEED_SWITCHES } from "../src/engine/seed.js";
import useEntropyStore from "../src/store/entropyStore.js";
import { createObserver } from "../src/engine/observer.js";

const controls = { phase: 12, grain: 128, tension: 255, mirror: false, feedback: true };

test("startup draws control states and seed from separate random words", () => {
  const words = [0x03123456, 0xabcdef01];
  const receipt = createSeedSelection(() => words.shift());
  assert.equal(words.length, 0);
  assert.deepEqual(receipt.controls, { phase: 86, grain: 52, tension: 18, mirror: true, feedback: true });
  assert.equal(receipt.word, 0xabcdef01);
  assert.equal(receipt.seed, mixSeed(receipt.word, receipt.controls));
  assert.equal(receipt.version, "seed-mixer-1");
  assert.deepEqual(createSeedSelection(() => 0).controls, { phase: 0, grain: 0, tension: 0, mirror: false, feedback: false });
  assert.deepEqual(createSeedSelection(() => 0xffffffff).controls, { phase: 255, grain: 255, tension: 255, mirror: true, feedback: true });
});

test("every dial position and switch participates in the seed mapping", () => {
  for (const key of SEED_DIALS) {
    const seeds = new Set(Array.from({ length: 256 }, (_, value) => mixSeed(137, { ...controls, [key]: value })));
    assert.equal(seeds.size, 256);
  }
  for (const key of SEED_SWITCHES)
    assert.notEqual(mixSeed(137, controls), mixSeed(137, { ...controls, [key]: !controls[key] }));
  assert.notEqual(mixSeed(0, controls), mixSeed(0xffffffff, controls));
});

test("receipts snapshot controls and reproduce unsigned seeds without new randomness", () => {
  const input = { ...controls };
  const receipt = drawSeed(input, () => 0xffffffff);
  input.phase = 0;
  assert.deepEqual(receipt.controls, controls);
  assert.equal(receipt.seed, mixSeed(receipt.word, receipt.controls));
  assert.ok(receipt.seed >= 0 && receipt.seed <= 0xffffffff);
  assert.throws(() => mixSeed(-1, controls), RangeError);
  assert.throws(() => mixSeed(1.5, controls), RangeError);
  assert.throws(() => mixSeed(1, { ...controls, phase: 256 }), RangeError);
  assert.throws(() => mixSeed(1, { ...controls, mirror: 1 }), TypeError);
  assert.ok(Number.isInteger(randomWord()));
});

test("control edits and mode changes preserve the seed; draws restart once and exact seed zero survives", () => {
  const initial = useEntropyStore.getState();
  try {
    assert.equal(initial.automaticSeed, initial.seedReceipt.seed);
    assert.deepEqual(initial.machineObserver, createObserver(initial.automaticSeed));
    initial.setSeedControls(controls);
    initial.setAutomaticMode(false);
    initial.setAutomaticMode(true);
    assert.equal(useEntropyStore.getState().automaticSeed, initial.automaticSeed);
    assert.equal(useEntropyStore.getState().automaticRevision, initial.automaticRevision);
    const seed = initial.randomizeAutomaticSeed();
    const drawn = useEntropyStore.getState();
    assert.equal(drawn.automaticSeed, seed);
    assert.equal(drawn.automaticRevision, initial.automaticRevision + 1);
    assert.deepEqual(drawn.seedReceipt.controls, controls);
    assert.equal(seed, mixSeed(drawn.seedReceipt.word, controls));
    drawn.restartAutomatic(0);
    assert.equal(useEntropyStore.getState().automaticSeed, 0);
    assert.equal(useEntropyStore.getState().seedReceipt, null);
    assert.deepEqual(useEntropyStore.getState().seedControls, controls);
  } finally {
    useEntropyStore.setState(initial, true);
  }
});
