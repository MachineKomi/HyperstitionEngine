import { waitForPulse } from "./clock.js";
// Original procedural writing rules: source fragments are recombined, never LLM-generated.
export function randomStream(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

export function populationSize(branches, depth) {
  return Array.from({ length: depth + 1 }, (_, i) => branches ** i).reduce(
    (a, b) => a + b,
    0,
  );
}

export function pruneBranch(nodes, id) {
  if (!nodes.some((node) => node.id === id && node.parentId !== null))
    return nodes;
  const removed = new Set([id]);
  // Nodes are stored in generation order, so ancestors always precede descendants.
  return nodes.filter((node) => {
    if (removed.has(node.parentId)) removed.add(node.id);
    return !removed.has(node.id);
  });
}

const clean = (text) => text.replace(/\s+/g, " ").trim();
export const normalizeRoot = (text) => text.trim().slice(0, 1200).trim();
const words = (text) => clean(text).split(" ").filter(Boolean);
const fragment = (text, rng, count = 9) => {
  const tokens = words(text);
  const start = Math.floor(rng() * Math.max(1, tokens.length - count + 1));
  return tokens
    .slice(start, start + count)
    .join(" ")
    .replace(/[.!?;:,]+$/, "");
};
const rites = [
  [
    "RECURSION",
    (parent, source, noun) =>
      `${parent}; inside it, ${source}. The ${noun} returns as its own cause.`,
  ],
  [
    "SPLICE",
    (parent, source) =>
      `${parent} / ${source}. Two incompatible futures share one mouth.`,
  ],
  [
    "INVERSION",
    (parent, source, noun) =>
      `The ${noun} dreams: ${source}. Its dreamer is only an afterimage of ${parent}.`,
  ],
  [
    "LITANY",
    (parent, source, noun) =>
      `Praise the ${noun}. Praise ${parent}. Let ${source} become the teeth of the impossible cog.`,
  ],
  [
    "TIME-FOLD",
    (parent, source) =>
      `Tomorrow installed ${parent} in yesterday. By the time ${source}, the origin had already escaped.`,
  ],
  [
    "CONTAGION",
    (parent, source, noun) =>
      `${parent} takes root in ${source}. Every ${noun} grows another entrance. No final chamber.`,
  ],
];

export class SprawlEngine {
  loadCorpus(spirits) {
    this.sources = spirits
      .map((spirit) => ({
        id: spirit.id,
        sentences: (spirit.sentences || []).map(clean).filter((text) => {
          const count = words(text).length;
          return count >= 6 && count <= 65 && !/https?:|@|\bdoi\b/i.test(text);
        }),
        nouns: (spirit.pos?.nouns || []).filter((word) =>
          /^[\p{L}-]{3,24}$/u.test(word),
        ),
      }))
      .filter((source) => source.sentences.length);
    if (!this.sources.length)
      throw new Error("No usable fragments in these aspects.");
  }

  mutate(parent, rng, mutation) {
    const source = this.sources[Math.floor(rng() * this.sources.length)];
    const sentence =
      source.sentences[Math.floor(rng() * source.sentences.length)];
    const inherited = fragment(
      parent.text,
      rng,
      6 + Math.floor((1 - mutation) * 10),
    );
    const incoming = fragment(sentence, rng, 4 + Math.floor(mutation * 10));
    const noun =
      source.nouns[Math.floor(rng() * source.nouns.length)] || "circuit";
    const [operator, compose] = rites[Math.floor(rng() * rites.length)];
    const text = compose(inherited, incoming, noun);
    return {
      text: text[0].toUpperCase() + text.slice(1),
      operator,
      source: source.id,
      sourceFragment: incoming,
      inheritedFragment: inherited,
    };
  }
}

export async function growSprawl({
  engine,
  root,
  branches,
  depth,
  seed,
  mutation,
  signal,
  onLayer = () => {},
  layerPauseMs = 100,
  wait = waitForPulse,
}) {
  if (
    ![2, 3, 4].includes(branches) ||
    !Number.isInteger(depth) ||
    depth < 1 ||
    depth > 4
  )
    throw new Error("Choose 2–4 branches and 1–4 generations.");
  if (!Number.isFinite(mutation) || mutation < 0 || mutation > 1)
    throw new Error("Mutation must be between zero and one.");
  if (!root.trim()) throw new Error("Give the machine a seed phrase.");
  const rng = randomStream(seed);
  const nodes = [
    {
      id: "0",
      parentId: null,
      depth: 0,
      text: normalizeRoot(root),
      operator: "ORIGIN",
      source: null,
    },
  ];
  let frontier = [nodes[0]];
  for (let generation = 1; generation <= depth; generation++) {
    if (signal?.aborted)
      throw new DOMException("Sprawl interrupted.", "AbortError");
    const next = [];
    for (const parent of frontier) {
      for (let branch = 0; branch < branches; branch++) {
        next.push({
          id: String(nodes.length + next.length),
          parentId: parent.id,
          depth: generation,
          ...engine.mutate(parent, rng, mutation),
        });
      }
    }
    nodes.push(...next);
    frontier = next;
    onLayer([...nodes]);
    // Yield between generations so STOP and rendering can run.
    await wait(layerPauseMs, signal);
  }
  if (signal?.aborted)
    throw new DOMException("Sprawl interrupted.", "AbortError");
  return nodes;
}
