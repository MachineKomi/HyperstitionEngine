import { waitForPulse } from "./clock.js";
import { windowSpan, sourceAddress } from "./sourceSpans.js";
import {
  ContinuityComposer,
  LEGACY_COMPOSER,
  chooseMotif,
  corpusVersions,
  CONTEXT_COMPOSER,
  CONTINUITY_COMPOSER,
  isContinuityComposer,
} from "./continuity.js";
import { validateMemory, usesLineageMemory } from "./memory.js";
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
  return windowSpan(text, rng, count).text;
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
    this.boundVersions = Object.fromEntries(
      spirits.map((source) => [source.id, source.sourceVersion || null]),
    );
    this.continuity = null;
    this.contextual = null;
    this.sources = spirits
      .map((spirit) => {
        const records = (spirit.sentences || [])
          .map((original, unit) => ({ original, unit, text: clean(original) }))
          .filter(({ text }) => {
            const count = words(text).length;
            return (
              count >= 6 && count <= 65 && !/https?:|@|\bdoi\b/i.test(text)
            );
          });
        return {
          id: spirit.id,
          version: spirit.sourceVersion || null,
          records,
          sentences: records.map((record) => record.text),
          nouns: (spirit.pos?.nouns || []).filter((word) =>
            /^[\p{L}-]{3,24}$/u.test(word),
          ),
        };
      })
      .filter((source) => source.sentences.length);
    if (!this.sources.length)
      throw new Error("No usable fragments in these aspects.");
  }

  async prepareComposer(signal, composer = CONTINUITY_COMPOSER) {
    const key = composer === CONTEXT_COMPOSER ? "contextual" : "continuity";
    if (this[key]) return;
    const sources = this.sources;
    const prepared = await ContinuityComposer.prepare(
      sources,
      signal,
      composer,
    );
    if (signal?.aborted || sources !== this.sources)
      throw new DOMException("Sprawl interrupted.", "AbortError");
    this[key] = prepared;
  }

  mutate(parent, rng, mutation, composer = LEGACY_COMPOSER) {
    if (isContinuityComposer(composer)) {
      const key = composer === CONTEXT_COMPOSER ? "contextual" : "continuity";
      this[key] ||= new ContinuityComposer(this.sources, false, composer);
      return this[key].mutate(parent, rng, mutation, composer);
    }
    const source = this.sources[Math.floor(rng() * this.sources.length)];
    const record = source.records[Math.floor(rng() * source.records.length)];
    const inherited = fragment(
      parent.text,
      rng,
      6 + Math.floor((1 - mutation) * 10),
    );
    const incomingSpan = windowSpan(
      record.original,
      rng,
      4 + Math.floor(mutation * 10),
    );
    const incoming = incomingSpan.text;
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
      sourceTrace: {
        id: sourceAddress(source.id, source.version, record.unit),
        version: source.version,
        unit: record.unit,
        original: record.original,
        start: incomingSpan.start,
        end: incomingSpan.end,
      },
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
  composer = LEGACY_COMPOSER,
  motif,
  memory = [],
  corpusVersions: versions,
  signal,
  onLayer = () => {},
  layerPauseMs = 100,
  wait = waitForPulse,
}) {
  if (composer !== LEGACY_COMPOSER && !isContinuityComposer(composer))
    throw new Error("Unknown composer version.");
  if (versions) {
    const actual = corpusVersions(engine);
    if (
      Object.keys(actual).length !== Object.keys(versions).length ||
      Object.keys(versions).some((id) => actual[id] !== versions[id])
    )
      throw new Error(
        "The bound corpus differs from this replay. Restore its sources or choose a composer again to start a new path.",
      );
  }
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
  const lineageMemory = usesLineageMemory(composer)
    ? validateMemory(
        memory,
        Object.keys(corpusVersions(engine)),
        motif || chooseMotif(root),
      )
    : null;
  if (isContinuityComposer(composer))
    await engine.prepareComposer(signal, composer);
  const rng = randomStream(seed);
  const nodes = [
    {
      id: "0",
      parentId: null,
      depth: 0,
      text: normalizeRoot(root),
      operator: "ORIGIN",
      source: null,
      ...(isContinuityComposer(composer)
        ? { motif: motif || chooseMotif(root) }
        : {}),
      ...(lineageMemory ? { memory: lineageMemory } : {}),
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
          ...engine.mutate(parent, rng, mutation, composer),
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
