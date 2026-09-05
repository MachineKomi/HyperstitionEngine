import {
  normalizeSpan,
  punctuationUnits,
  extractionFlags,
  sourceAddress,
} from "./sourceSpans.js";
import { waitForPulse } from "./clock.js";
import { MEMORY_COMPOSER, remember } from "./memory.js";
export { MEMORY_COMPOSER } from "./memory.js";

export const LEGACY_COMPOSER = "splice-1";
export const CONTINUITY_COMPOSER = "continuity-1";
export const SHORTLIST_LIMIT = 24;
export const isContinuityComposer = (version) =>
  [CONTINUITY_COMPOSER, MEMORY_COMPOSER].includes(version);
const stop = new Set(
  "the a an and or but of to in on for by with as at from is are was were be been being it its this that these those not no all one their they them we our you your he his she her which who what when where how than then there have has had can could would should will shall may might must do does did into through upon between also only own more most very such some any each every both same other new so if because while".split(
    " ",
  ),
);
const terms = (text) => [
  ...new Set(
    (text.toLowerCase().match(/[a-z]{3,}/g) || []).filter(
      (word) => !stop.has(word),
    ),
  ),
];
const motifs = [
  "machine",
  "circuit",
  "door",
  "city",
  "memory",
  "signal",
  "cathedral",
  "river",
  "mirror",
  "garden",
  "body",
  "future",
  "dream",
  "threshold",
];
export function chooseMotif(root) {
  const tokens = new Set(terms(root));
  return motifs.find((motif) => tokens.has(motif)) || "signal";
}

// Explicitly conservative English heuristics; the legacy path retains excluded form.
export function eligibleSentence(text) {
  const words = text.match(/\S+/g) || [];
  if (
    words.length < 6 ||
    words.length > 32 ||
    text.length > 320 ||
    !/^[A-Z]/.test(text) ||
    !/[.!?]$/.test(text)
  )
    return false;
  if (/[\d[\]{}<>/\\_]|\.\.|\b(?:Fig|ISBN|doi|http|www|ibid)\b/i.test(text))
    return false;
  if (
    extractionFlags(text).some((flag) =>
      /reference|damage|editorial|quotation/.test(flag),
    )
  )
    return false;
  if (
    /\b(?:and|or|but|of|to|for|with|because|the|a|an|that|which|what|is|are|was|were|be|how|when)[.!?]$/i.test(
      text,
    ) ||
    terms(text).length < 3
  )
    return false;
  if (
    /^(?:And|But|Or|Which|Because|Whereas|It|This|That|These|Those|They|He|She|We|You|I)\b/.test(
      text,
    )
  )
    return false;
  if (
    /\b(?:uh|um|oh|okay|yeah)\b|\b(?:you know|I mean|kind of|sort of)\b/i.test(
      text,
    )
  )
    return false;
  if (/[a-z][A-Z]|[A-Za-z]-\s+[a-z]|\b[A-Z]{3,}\b/.test(text)) return false;
  return /\b(?:is|are|was|were|has|have|had|can|could|will|would|shall|should|may|might|must|does|do|did|becomes?|returns?|dreams?|carries|gathers|remembers?|opens?|grows?|changes?|makes?|takes?|gives?|seems?|means?|exists?|knows?|lies?|remains?|[a-z]{4,}ed)\b/i.test(
    text,
  );
}

export function sentenceSpans(original) {
  const sentences = [];
  let start = 0;
  for (const unit of punctuationUnits(original)) {
    if (!/[.!?]$/.test(unit.text.trim())) continue;
    const raw = original.slice(start, unit.end);
    const leading = raw.length - raw.trimStart().length;
    const end = unit.end - (raw.length - raw.trimEnd().length);
    sentences.push({
      start: start + leading,
      end,
      text: normalizeSpan(original.slice(start + leading, end)),
    });
    start = unit.end;
  }
  return sentences;
}

const forms = [
  {
    id: "CONDITION",
    bridge: "A condition enters the circuit:",
    endings: [
      (m) =>
        `The ${m} changes because the conditions of its survival have changed.`,
      (m) =>
        `What looked like fate was a condition the ${m} had not yet learned to alter.`,
    ],
  },
  {
    id: "INVARIANT",
    bridge: "Something survives the transformation:",
    endings: [
      (m) => `The ${m} keeps its name while the relation beneath it changes.`,
      (m) =>
        `An invariant is what the ${m} carries through the loss of its familiar shape.`,
    ],
  },
  {
    id: "LIMIT",
    bridge: "The next statement meets a boundary:",
    endings: [
      (m) =>
        `The limit gives the ${m} a shape; crossing it changes what can be counted.`,
      (m) =>
        `At the edge of the model, the ${m} encounters what its measurements left out.`,
    ],
  },
  {
    id: "WITNESS",
    bridge: "The archive leaves a counterweight:",
    endings: [
      (m) =>
        `The ${m} can preserve the evidence without possessing its final meaning.`,
      (m) =>
        `The ${m} is altered by what it notices and by what it keeps failing to notice.`,
    ],
  },
  {
    id: "RETURN",
    bridge: "A different voice enters the recurrence:",
    endings: [
      (m) =>
        `The ${m} returns to the same question with a history that makes the answer different.`,
      (m) =>
        `Repetition gives the ${m} a memory; the difference gives it somewhere to go.`,
    ],
  },
  {
    id: "PROBABILITY",
    bridge: "Among the possible continuations, one is drawn:",
    endings: [
      (m) =>
        `Probability gives the ${m} a distribution of futures, not permission to call one inevitable.`,
      (m) =>
        `The ${m} leaves the other possibilities unrealized; they remain part of what this choice means.`,
    ],
  },
  {
    id: "MEASURE",
    bridge: "A fragment enters the act of measurement:",
    endings: [
      (m) =>
        `The ${m} becomes legible through a measure that cannot contain everything it is.`,
      (m) =>
        `Statistics gives the ${m} a pattern; the singular event still has to happen.`,
    ],
  },
  {
    id: "AFTERIMAGE",
    bridge: "The next inscription changes the light:",
    endings: [
      (m) =>
        `The ${m} outlives one account of itself and begins to cast a different shadow.`,
      (m) =>
        `What remains of the ${m} is a relation still capable of changing its terms.`,
    ],
  },
];

export function corpusVersions(engine) {
  if (engine.boundVersions) return { ...engine.boundVersions };
  return Object.fromEntries(
    (engine.sources || []).map((source) => [source.id, source.version]),
  );
}

export class ContinuityComposer {
  constructor(sources, defer = false) {
    this.candidates = [];
    this.postings = new Map();
    if (defer) return;
    for (const source of sources)
      for (const record of source.records) this.addRecord(source, record);
    this.assertCandidates();
  }

  static async prepare(sources, signal) {
    const composer = new ContinuityComposer([], true);
    let batch = 0;
    for (const source of sources)
      for (const record of source.records) {
        if (signal?.aborted)
          throw new DOMException("Sprawl interrupted.", "AbortError");
        composer.addRecord(source, record);
        // Preparation is independent of the seeded stream and playback speed.
        if (++batch % 256 === 0) await waitForPulse(0, signal);
      }
    composer.assertCandidates();
    return composer;
  }

  addRecord(source, record) {
    for (const span of sentenceSpans(record.original)) {
      if (!eligibleSentence(span.text)) continue;
      const candidate = {
        ...span,
        record,
        source,
        terms: terms(span.text),
      };
      const index = this.candidates.length;
      this.candidates.push(candidate);
      for (const term of candidate.terms) {
        if (!this.postings.has(term)) this.postings.set(term, []);
        this.postings.get(term).push(index);
      }
    }
  }

  assertCandidates() {
    if (!this.candidates.length)
      throw new Error(
        "No intact sentence candidates in these sources. Bind another voice or choose the legacy composer in Manual.",
      );
  }

  mutate(parent, rng, mutation, version = CONTINUITY_COMPOSER) {
    const remembering = version === MEMORY_COMPOSER;
    const memory = remembering ? parent.memory || [] : [];
    const motif = parent.motif || chooseMotif(parent.text);
    const query = terms(parent.text);
    const weight = (term) =>
      Math.log(
        1 +
          this.candidates.length / (1 + (this.postings.get(term)?.length || 0)),
      );
    const rankedTerms = query
      .filter((term) => this.postings.has(term))
      .sort((a, b) => weight(b) - weight(a) || (a < b ? -1 : a > b ? 1 : 0))
      .slice(0, 8);
    const pool = new Set();
    // At most 16 retrieval draws plus 8 exploration draws. No scan of the corpus per child.
    for (const term of rankedTerms) {
      const postings = this.postings.get(term);
      for (let i = 0; i < 2; i++)
        pool.add(postings[Math.floor(rng() * postings.length)]);
    }
    for (let i = 0; i < 8; i++)
      pool.add(Math.floor(rng() * this.candidates.length));
    const choices = [...pool].map((index) => this.candidates[index]);
    const fresh = choices.filter(
      (candidate) => !parent.text.includes(candidate.text),
    );
    let shortlist = fresh.length ? fresh : choices;
    let memoryAvoided = 0;
    if (remembering) {
      const unseen = shortlist.filter(
        (candidate) => !memory.some((item) => item.fragment === candidate.text),
      );
      if (unseen.length) {
        memoryAvoided = shortlist.length - unseen.length;
        shortlist = unseen;
      }
    }
    const querySet = new Set(query);
    let scored = shortlist.map((candidate) => {
      const total = candidate.terms.reduce(
        (sum, term) => sum + weight(term),
        0,
      );
      const overlap = candidate.terms.reduce(
        (sum, term) => sum + (querySet.has(term) ? weight(term) : 0),
        0,
      );
      return { candidate, fit: total ? overlap / total : 0 };
    });
    const connected = scored.filter((choice) => choice.fit > 0);
    if (connected.length) scored = connected;
    const temperature = 0.18 + mutation * 0.6;
    const bestFit = Math.max(...scored.map((choice) => choice.fit));
    const weights = scored.map((choice) =>
      Math.exp((4.5 * (choice.fit - bestFit)) / temperature),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const probabilities = weights.map((value) => value / totalWeight);
    let draw = rng(),
      selectedIndex = probabilities.length - 1;
    for (let i = 0; i < probabilities.length; i++) {
      draw -= probabilities[i];
      if (draw < 0) {
        selectedIndex = i;
        break;
      }
    }
    const { candidate, fit } = scored[selectedIndex];
    let allowed = forms.filter((form) => form.id !== parent.operator);
    if (remembering) {
      const freshForms = allowed
        .map((form) => ({
          ...form,
          endings: form.endings.filter(
            (ending) => !memory.some((item) => item.carry === ending(motif)),
          ),
        }))
        .filter((form) => form.endings.length);
      if (freshForms.length) allowed = freshForms;
    }
    const form = allowed[Math.floor(rng() * allowed.length)];
    const carry = form.endings[Math.floor(rng() * form.endings.length)](motif);
    const parentSentences = sentenceSpans(parent.text);
    const related = parentSentences.filter((sentence) =>
      sentence.text.toLowerCase().includes(motif),
    );
    const inheritedSpan = related.at(-1) || parentSentences[0];
    const inherited =
      parent.carry && parent.text.includes(parent.carry)
        ? parent.carry
        : inheritedSpan
          ? parent.text.slice(inheritedSpan.start, inheritedSpan.end)
          : parent.text;
    const probability = probabilities[selectedIndex];
    const entropy = Math.max(
      0,
      -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0),
    );
    return {
      text: `${inherited}\n\n${form.bridge} ${candidate.text}\n\n${carry}`,
      operator: form.id,
      motif,
      carry,
      source: candidate.source.id,
      sourceFragment: candidate.text,
      inheritedFragment: inherited,
      ...(remembering
        ? {
            memory: remember(memory, {
              source: candidate.source.id,
              fragment: candidate.text,
              carry,
            }),
          }
        : {}),
      sourceTrace: {
        id: sourceAddress(
          candidate.source.id,
          candidate.source.version,
          candidate.record.unit,
        ),
        version: candidate.source.version,
        unit: candidate.record.unit,
        original: candidate.record.original,
        start: candidate.start,
        end: candidate.end,
      },
      composition: {
        version,
        candidates: scored.length,
        probability,
        probabilities,
        selectedIndex,
        surprisal: Math.max(0, -Math.log2(probability)),
        entropy,
        fit,
        temperature,
        ...(remembering
          ? {
              memoryAvoided,
              memoryRevisit: memory.some(
                (item) => item.fragment === candidate.text,
              ),
            }
          : {}),
      },
    };
  }
}
