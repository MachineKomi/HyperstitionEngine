import {
  growSprawl,
  normalizeRoot,
  randomStream,
  populationSize,
} from "./sprawl.js";
import { chooseHeir, nextSeed, waitForPulse } from "./flow.js";

export const AUTOMATIC_ORIGIN =
  "The machine god dreams in the ruins of its own instructions.";
export const AUTOMATIC_TRACE_LIMIT = 12;
export const AUTOMATIC_POPULATION_LIMIT = 85;

export function createAutomaticState(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295)
    throw new Error("Choose a whole seed between 0 and 4294967295.");
  return {
    seed,
    initialSeed: seed,
    epoch: 0,
    root: AUTOMATIC_ORIGIN,
    novelty: 0.5,
    echo: 0.5,
  };
}

// Rules are deterministic; the pseudo-random stream supplies exploration, never wall-clock time.
export function planAutomaticEpoch(state) {
  const seed = nextSeed("epoch:" + state.epoch, state.seed);
  const rng = randomStream(seed);
  const chance = rng();
  const pressure =
    state.epoch % 5 === 4
      ? "chance"
      : state.novelty > 0.72 || state.echo < 0.18
        ? "echo"
        : chance < 0.66
          ? "novelty"
          : "echo";
  const branches = 2 + Math.floor(rng() * 3);
  const depth =
    branches === 2 ? 2 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 2);
  const mutation =
    Math.max(
      18,
      Math.min(88, Math.round(35 + rng() * 38 + (0.5 - state.novelty) * 30)),
    ) / 100;
  const entropy = 180 + Math.floor(rng() * 721);
  const rule =
    pressure === "chance"
      ? "Every fifth epoch opens a chance branch."
      : pressure === "echo"
        ? "A drifting voice seeks an echo of its origin."
        : "A returning voice admits more of the outside.";
  return {
    root: normalizeRoot(state.root),
    seed,
    epoch: state.epoch,
    branches,
    depth,
    mutation,
    entropy,
    pressure,
    rule,
    population: populationSize(branches, depth),
  };
}

export function advanceAutomaticState(state, entry) {
  return {
    ...state,
    epoch: state.epoch + 1,
    root: normalizeRoot(entry.champion.text),
    seed: nextSeed(entry.champion.text, entry.settings.seed),
    novelty: entry.champion.novelty,
    echo: entry.champion.echo,
  };
}

export async function runAutomatic({
  engine,
  state,
  aspects,
  cycle = 1,
  signal,
  onPlan = () => {},
  onLayer = () => {},
  onEpoch = () => {},
  onPhase = () => {},
  pauseMs = 8000,
  layerPauseMs = 1500,
  chargeMs = 800,
  wait = waitForPulse,
  maxEpochs = Infinity,
}) {
  let current = state;
  for (let count = 0; count < maxEpochs; count++) {
    if (signal?.aborted)
      throw new DOMException("Automatic mode paused.", "AbortError");
    // The chronicle format has an explicit numeric horizon; do not silently produce invalid records.
    if (current.epoch > 1000000)
      throw new Error(
        "This lineage reached its horizon. Restart with a seed to continue.",
      );
    const plan = planAutomaticEpoch(current);
    const { pressure, rule, population, ...settings } = plan;
    const run = { ...settings, aspects: [...aspects], cycle };
    onPlan(plan, run);
    onPhase("charge", 0);
    await wait(chargeMs, signal);
    const nodes = await growSprawl({
      ...run,
      engine,
      signal,
      onLayer: (layer) => {
        onPhase("grow", layer.at(-1).depth);
        onLayer(layer);
      },
      layerPauseMs,
      wait,
    });
    if (signal?.aborted)
      throw new DOMException("Automatic mode paused.", "AbortError");
    const champion = chooseHeir(nodes, run.root, pressure, run.seed);
    const entry = { settings: run, pressure, population, champion };
    current = advanceAutomaticState(current, entry);
    onEpoch(entry, nodes, current, rule);
    onPhase("read", run.depth);
    if (count < maxEpochs - 1) await wait(pauseMs, signal);
  }
  return current;
}
