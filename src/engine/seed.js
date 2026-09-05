// Seed selection is outside the deterministic conductor. Keep the receipt
// reproducible without collecting gesture timing or other hidden input.
export const SEED_MIXER_VERSION = "seed-mixer-1";
export const SEED_DIALS = ["phase", "grain", "tension"];
export const SEED_SWITCHES = ["mirror", "feedback"];

export function randomWord() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

function avalanche(value) {
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

export function mixSeed(word, controls) {
  if (!Number.isInteger(word) || word < 0 || word > 0xffffffff)
    throw new RangeError("A seed draw must be an unsigned 32-bit integer.");
  for (const key of SEED_DIALS)
    if (!Number.isInteger(controls[key]) || controls[key] < 0 || controls[key] > 255)
      throw new RangeError(`Invalid ${key} dial.`);
  for (const key of SEED_SWITCHES)
    if (typeof controls[key] !== "boolean") throw new TypeError(`Invalid ${key} switch.`);
  const configuration = controls.phase | (controls.grain << 8) |
    (controls.tension << 16) | (Number(controls.mirror) << 24) |
    (Number(controls.feedback) << 25);
  return avalanche(word ^ avalanche(configuration ^ 0x9e3779b9));
}

export function drawSeed(controls, readWord = randomWord) {
  const snapshot = Object.fromEntries([...SEED_DIALS, ...SEED_SWITCHES].map(key => [key, controls[key]]));
  const word = readWord();
  return { version: SEED_MIXER_VERSION, word, controls: snapshot, seed: mixSeed(word, snapshot) };
}

export function createSeedSelection(readWord = randomWord) {
  const word = readWord();
  return drawSeed({
    phase: word & 255,
    grain: (word >>> 8) & 255,
    tension: (word >>> 16) & 255,
    mirror: Boolean(word & (1 << 24)),
    feedback: Boolean(word & (1 << 25)),
  }, readWord);
}
