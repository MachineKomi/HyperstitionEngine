// A diagnostic only: this random stream never enters the composer or conductor.
export const OBSERVER_VERSION = "reservoir-1";
export const UNITS = 24;
const BINS = 16;
const INPUTS = BINS + 4;
const clamp = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

export function textFeatures(text) {
  // Bound work before normalization as well as after it. Signed character hashing
  // measures surface form, not meaning; collisions are intentional.
  const chars = String(text || "").slice(0, 1200).normalize("NFKC").toLowerCase().slice(0, 1200);
  const bins = Array(BINS).fill(0);
  for (let i = 0; i + 2 < chars.length; i++) {
    let hash = 2166136261;
    for (let j = 0; j < 3; j++) hash = Math.imul(hash ^ chars.charCodeAt(i + j), 16777619) >>> 0;
    bins[hash % BINS] += hash & 256 ? 1 : -1;
  }
  const norm = Math.hypot(...bins) || 1;
  return bins.map((n) => n / norm);
}

export function createObserver(seed = 137) {
  let word = Number(seed) >>> 0;
  const random = () => {
    word = (Math.imul(word, 1664525) + 1013904223) >>> 0;
    return word / 4294967296;
  };
  const inputWeights = Array.from({ length: UNITS }, () =>
    Array.from({ length: INPUTS }, () => (random() - 0.5) * 0.8));
  const connections = Array.from({ length: UNITS }, (_, target) =>
    [1, 5, 11, 17].map((offset) => ({
      from: (target + offset) % UNITS,
      weight: (random() < 0.5 ? -1 : 1) * 0.15,
    })));
  return {
    version: OBSERVER_VERSION, seed: Number(seed) >>> 0,
    inputWeights, connections, units: Array(UNITS).fill(0), inputs: Array(INPUTS).fill(0),
    weights: [0.5, ...Array(UNITS).fill(0)], pending: null,
    count: 0, samples: 0, errorSum: 0, baselineErrorSum: 0,
    forecast: null, baseline: null, last: null, history: [],
  };
}

export function observeEpoch(state, entry) {
  if (state.version !== OBSERVER_VERSION) throw new Error("Unsupported observer version");
  const actual = clamp(entry.champion.novelty);
  const weights = [...state.weights];
  let { samples, errorSum, baselineErrorSum, last } = state;
  // Test the previous forecast before learning the newly revealed target.
  if (state.pending) {
    const error = actual - state.forecast;
    last = { epoch: entry.settings.epoch, actual, forecast: state.forecast, baseline: state.baseline };
    samples++;
    errorSum += Math.abs(error);
    baselineErrorSum += Math.abs(actual - state.baseline);
    const norm = state.pending.reduce((sum, value) => sum + value * value, 0) + 0.01;
    for (let i = 0; i < weights.length; i++) {
      weights[i] = Math.max(-2, Math.min(2, weights[i] + 0.2 * error * state.pending[i] / norm));
    }
  }
  const inputs = [...textFeatures(entry.champion.text), actual,
    clamp(entry.champion.echo), clamp(entry.settings.mutation), clamp(entry.population / 85)];
  const units = state.units.map((previous, i) => {
    const drive = state.inputWeights[i].reduce((sum, weight, j) => sum + weight * inputs[j], 0);
    const feedback = state.connections[i].reduce((sum, edge) => sum + edge.weight * state.units[edge.from], 0);
    return previous * 0.65 + Math.tanh(drive + feedback) * 0.35;
  });
  const pending = [1, ...units];
  const forecast = clamp(weights.reduce((sum, weight, i) => sum + weight * pending[i], 0));
  return {
    ...state, weights, units, inputs, pending, forecast,
    baseline: state.baseline === null ? actual : state.baseline * 0.8 + actual * 0.2,
    count: state.count + 1, samples, errorSum, baselineErrorSum, last,
    history: last ? [...state.history, last].slice(-48) : state.history,
  };
}

export function sourceStatistics(epochs) {
  const counts = new Map();
  let born = 0, kept = 0;
  for (const epoch of epochs) {
    counts.set(epoch.source, (counts.get(epoch.source) || 0) + 1);
    born += epoch.population;
    kept += epoch.surviving;
  }
  const shares = [...counts].map(([source, count]) => ({ source, count, p: count / epochs.length }));
  const entropy = shares.reduce((sum, { p }) => sum - p * Math.log2(p), 0);
  return { shares, entropy, effective: epochs.length ? 2 ** entropy : 0,
    removed: born ? 1 - kept / born : 0, born, kept };
}
