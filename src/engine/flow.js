import { growSprawl, normalizeRoot, randomStream } from "./sprawl.js";
import { usesLineageMemory, cloneMemory } from "./memory.js";

const vocabulary = (text) =>
  new Set(text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);
export function nextSeed(text, seed) {
  let hash = seed >>> 0;
  for (const character of text)
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
  return hash >>> 0;
}

export function inheritFlowSettings({ settings, champion }) {
  return {
    ...settings,
    root: normalizeRoot(champion.text),
    // Hash the complete heir so truncating the working origin never changes its lineage seed.
    seed: nextSeed(champion.text, settings.seed),
    epoch: settings.epoch + 1,
    mutation: Math.min(100, Math.round(settings.mutation * 100) + 3) / 100,
    ...(usesLineageMemory(settings.composer)
      ? { memory: cloneMemory(champion.memory) }
      : {}),
  };
}

export function chooseHeir(nodes, root, pressure, seed) {
  if (!["novelty", "echo", "chance"].includes(pressure))
    throw new Error("Unknown selection pressure.");
  const depth = Math.max(...nodes.map((node) => node.depth));
  const leaves = nodes.filter(
    (node) => node.depth === depth && node.parentId !== null,
  );
  if (!leaves.length) throw new Error("No descendants to select.");
  const origin = vocabulary(root);
  const rng = randomStream(seed);
  const ranked = leaves.map((node) => {
    const tokens = vocabulary(node.text);
    const common = [...tokens].filter((token) => origin.has(token)).length;
    const novelty = tokens.size ? 1 - common / tokens.size : 0;
    const echo = origin.size ? common / origin.size : 0;
    const chance = rng();
    return {
      ...node,
      novelty,
      echo,
      score:
        pressure === "novelty" ? novelty : pressure === "echo" ? echo : chance,
      tie: chance,
    };
  });
  ranked.sort((a, b) => b.score - a.score || b.tie - a.tie);
  const heir = { ...ranked[0] };
  delete heir.tie;
  return heir;
}

export function waitForPulse(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", stop);
      reject(new DOMException("Flow severed.", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", stop);
      resolve();
    }, milliseconds);
    if (signal?.aborted) stop();
    else signal?.addEventListener("abort", stop, { once: true });
  });
}

export async function runFlow({
  engine,
  settings,
  epochs,
  pressure,
  signal,
  takeOffering,
  onStart = () => {},
  onLayer = () => {},
  onEpoch = () => {},
  pauseMs = 1600,
}) {
  if (!Number.isInteger(epochs) || epochs < 1 || epochs > 27)
    throw new Error("Choose 1–27 epochs.");
  if (!["novelty", "echo", "chance"].includes(pressure))
    throw new Error("Unknown selection pressure.");
  let inherited = {
    ...settings,
    root: normalizeRoot(settings.root),
    seed: settings.seed >>> 0,
    mutation: Math.round(settings.mutation * 100) / 100,
  };
  let completed = 0;
  for (let index = 0; index < epochs; index++) {
    if (signal?.aborted) throw new DOMException("Flow severed.", "AbortError");
    const entropy = takeOffering();
    if (entropy === false) return { completed, reason: "depleted" };
    const run = {
      ...inherited,
      entropy,
    };
    onStart(run);
    const nodes = await growSprawl({ ...run, engine, signal, onLayer });
    const champion = chooseHeir(nodes, run.root, pressure, run.seed);
    const entry = {
      settings: run,
      champion,
      pressure,
      population: nodes.length,
    };
    onEpoch(entry, nodes);
    completed++;
    inherited = inheritFlowSettings(entry);
    if (index < epochs - 1) await waitForPulse(pauseMs, signal);
  }
  return { completed, reason: "completed" };
}
