import { randomStream } from "./sprawl.js";

export function generateMarkov(markov, entropyLevel, seed, options = {}) {
  const minWords = 5 + Math.floor((entropyLevel || 0) / 200);
  return markov.generate({
    maxTries: 200,
    ...options,
    ...(Number.isInteger(seed) ? { prng: randomStream(seed) } : {}),
    filter: (result) => {
      const count = result.string.split(/\s+/).length;
      return count >= minWords && count <= 100;
    },
  }).string;
}
