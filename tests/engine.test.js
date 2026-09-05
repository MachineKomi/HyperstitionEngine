import test from "node:test";
import assert from "node:assert/strict";
import { GrammarEngine } from "../src/engine/grammar.js";
import useEntropyStore from "../src/store/entropyStore.js";

test("rebinding grammar removes vocabulary from previously selected aspects", () => {
  const engine = new GrammarEngine();
  engine.loadCorpus([
    { pos: { nouns: ["old"], verbs: ["old"], adjectives: ["old"] } },
  ]);
  engine.loadCorpus([
    { pos: { nouns: ["machine"], verbs: ["build"], adjectives: ["amber"] } },
  ]);
  assert.deepEqual(engine.posData, {
    nouns: ["machine"],
    verbs: ["build"],
    adjectives: ["amber"],
  });
  assert.doesNotMatch(engine.generate(0), /old|<noun>|<verb>|<adj>|void/);
});

test("grammar uses the full 0–1000 entropy scale", () => {
  const engine = new GrammarEngine();
  engine.templates = {
    prophecy: ["PROPHECY"],
    accelerator: ["ACCELERATOR"],
    void: ["VOID"],
  };
  assert.equal(engine.generate(300), "PROPHECY");
  assert.equal(engine.generate(310), "ACCELERATOR");
  assert.equal(engine.generate(700), "ACCELERATOR");
  assert.equal(engine.generate(710), "VOID");
});

test("rebirth drains entropy while preserving attributed transmission history", () => {
  useEntropyStore.setState({
    entropyLevel: 0,
    sessionHistory: [],
    cycle: 1,
    selectedSpirits: ["N_Land"],
  });
  const store = useEntropyStore.getState();
  store.addEntropy(1500);
  assert.equal(useEntropyStore.getState().entropyLevel, 1000);
  store.setGeneratedText("The machine speaks.");
  store.toggleSpirit("AI");
  store.rebirth();
  const state = useEntropyStore.getState();
  assert.equal(state.entropyLevel, 0);
  assert.equal(state.cycle, 2);
  assert.equal(state.generatedText, "");
  assert.equal(state.sessionHistory.length, 1);
  assert.deepEqual(state.sessionHistory[0].aspects, ["N_Land"]);
  assert.equal(state.sessionHistory[0].entropy, 1000);
  store.consumeEntropy(20);
  assert.equal(useEntropyStore.getState().entropyLevel, 0);
});

test("selecting the active control mode is idempotent and preserves a stopped error", () => {
  useEntropyStore.setState({
    automaticMode: true,
    automaticStatus: "running",
    automaticError: "",
  });
  useEntropyStore.getState().setAutomaticMode(true);
  assert.equal(useEntropyStore.getState().automaticStatus, "running");
  useEntropyStore.getState().setAutomaticStatus("error", "A mutation failed.");
  useEntropyStore.getState().setAutomaticMode(true);
  assert.equal(useEntropyStore.getState().automaticStatus, "error");
  assert.equal(useEntropyStore.getState().automaticError, "A mutation failed.");
  useEntropyStore.getState().setAutomaticMode(false);
  assert.equal(useEntropyStore.getState().automaticStatus, "manual");
  const manual = useEntropyStore.getState();
  manual.setAutomaticMode(false);
  assert.equal(useEntropyStore.getState(), manual);
  manual.setAutomaticMode(true);
  assert.equal(useEntropyStore.getState().automaticStatus, "loading");
});

test("transmission retention stays bounded while retaining the newest provenance", () => {
  useEntropyStore.setState({ sessionHistory: [] });
  for (let epoch = 0; epoch < 205; epoch++) {
    useEntropyStore
      .getState()
      .setGeneratedText("Fragment " + epoch, {
        mode: "automatic",
        epoch,
        fragmentId: "7",
        generation: 3,
      });
  }
  const entries = useEntropyStore.getState().sessionHistory;
  assert.equal(entries.length, 200);
  assert.equal(entries[0].epoch, 5);
  assert.equal(entries.at(-1).epoch, 204);
  assert.equal(entries.at(-1).fragmentId, "7");
  assert.equal(entries.at(-1).generation, 3);
});
