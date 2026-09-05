import { normalizeSpan, sourceAddress } from "../engine/sourceSpans.js";
import { CONDUCTOR_VERSION } from "../engine/conductor.js";
import {
  isContinuityComposer,
  LEGACY_COMPOSER,
  SHORTLIST_LIMIT,
} from "../engine/continuity.js";
import {
  MEMORY_LIMIT,
  validateMemory,
  usesLineageMemory,
} from "../engine/memory.js";
export const CHRONICLE_LIMIT = 108;
export const CHRONICLE_FILE_LIMIT = 16 * 1024 * 1024;
export const CHRONICLE_KEY = "hyperstition.chronicle.v1";

const number = (value, min, max) =>
  Number.isFinite(value) && value >= min && value <= max;
const text = (value, limit) =>
  typeof value === "string" && value.length <= limit;
export function validateChronicle(data) {
  if (
    data?.format !== "hyperstition-chronicle" ||
    data.version !== 1 ||
    !Array.isArray(data.entries) ||
    data.entries.length > CHRONICLE_LIMIT
  )
    throw new Error(
      "This is not a supported chronicle. Export a chronicle from this chamber.",
    );
  const ids = new Set();
  return data.entries.map((entry) => {
    const s = entry?.settings,
      c = entry?.champion;
    if (
      !text(entry?.id, 100) ||
      !entry.id ||
      ids.has(entry.id) ||
      !text(entry.time, 40) ||
      !Number.isFinite(Date.parse(entry.time)) ||
      !s ||
      !text(s.root, 1200) ||
      !s.root.trim() ||
      ![2, 3, 4].includes(s.branches) ||
      !Number.isInteger(s.depth) ||
      !number(s.depth, 1, 4) ||
      !Number.isInteger(s.seed) ||
      !number(s.seed, 0, 4294967295) ||
      !number(s.mutation, 0, 1) ||
      Math.abs(s.mutation * 100 - Math.round(s.mutation * 100)) > 1e-8 ||
      !Number.isInteger(s.epoch) ||
      !number(s.epoch, 0, 1000000) ||
      !number(s.entropy, 0, 1000) ||
      !Number.isInteger(s.cycle) ||
      !number(s.cycle, 1, 1000000) ||
      !Array.isArray(s.aspects) ||
      !s.aspects.length ||
      s.aspects.length > 32 ||
      s.aspects.some(
        (id) => typeof id !== "string" || !/^[A-Za-z0-9_]{1,50}$/.test(id),
      ) ||
      !c ||
      !text(c.text, 4000) ||
      !c.text.trim() ||
      !text(c.id, 30) ||
      !text(c.parentId, 30) ||
      !text(c.operator, 40) ||
      !text(c.source, 50) ||
      !s.aspects.includes(c.source) ||
      !text(c.sourceFragment, 2000) ||
      !text(c.inheritedFragment, 2000) ||
      !Number.isInteger(c.depth) ||
      !number(c.depth, 1, 4) ||
      c.depth !== s.depth ||
      !number(c.novelty, 0, 1) ||
      !number(c.echo, 0, 1) ||
      !number(c.score, 0, 1) ||
      !["novelty", "echo", "chance"].includes(entry.pressure) ||
      !Number.isInteger(entry.population) ||
      !number(entry.population, 3, 341) ||
      entry.population !==
        Array.from({ length: s.depth + 1 }, (_, i) => s.branches ** i).reduce(
          (sum, count) => sum + count,
          0,
        )
    )
      throw new Error(
        "The chronicle contains an invalid epoch. Your current history was kept.",
      );
    ids.add(entry.id);
    let composerSettings = {},
      compositionFields = {};
    if (s.composer !== undefined) {
      if (s.composer !== LEGACY_COMPOSER && !isContinuityComposer(s.composer))
        throw new Error("Unsupported composer version in this chronicle.");
      composerSettings = { composer: s.composer };
      if (s.composer === LEGACY_COMPOSER && c.composition !== undefined)
        throw new Error(
          "Composition statistics do not belong to this replay version.",
        );
      if (isContinuityComposer(s.composer)) {
        const m = c.composition;
        const versions = s.corpusVersions;
        if (
          !text(s.motif, 30) ||
          !/^[a-z]{3,30}$/.test(s.motif) ||
          c.motif !== s.motif ||
          !versions ||
          typeof versions !== "object" ||
          Array.isArray(versions) ||
          Object.keys(versions).length !== s.aspects.length ||
          s.aspects.some(
            (id) =>
              !(
                versions[id] === null ||
                (typeof versions[id] === "string" &&
                  /^[a-f0-9]{64}$/.test(versions[id]))
              ),
          ) ||
          !text(c.carry, 500) ||
          !c.text.includes(c.carry) ||
          !c.carry.includes(c.motif) ||
          !m ||
          m.version !== s.composer ||
          !Number.isInteger(m.candidates) ||
          !number(m.candidates, 1, SHORTLIST_LIMIT) ||
          !Array.isArray(m.probabilities) ||
          m.probabilities.length !== m.candidates ||
          m.probabilities.some((p) => !number(p, Number.MIN_VALUE, 1)) ||
          Math.abs(m.probabilities.reduce((a, b) => a + b, 0) - 1) > 1e-8 ||
          !Number.isInteger(m.selectedIndex) ||
          !number(m.selectedIndex, 0, m.candidates - 1) ||
          Math.abs(m.probabilities[m.selectedIndex] - m.probability) > 1e-8 ||
          Math.abs(
            m.entropy +
              m.probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0),
          ) > 1e-8 ||
          !number(m.probability, Number.MIN_VALUE, 1) ||
          !number(m.surprisal, 0, 64) ||
          Math.abs(m.surprisal + Math.log2(m.probability)) > 1e-8 ||
          !number(m.entropy, 0, Math.log2(m.candidates) + 1e-8) ||
          !number(m.fit, 0, 1) ||
          !number(m.temperature, 0.18, 0.78 + 1e-8) ||
          Math.abs(m.temperature - (0.18 + s.mutation * 0.6)) > 1e-8 ||
          !c.sourceTrace ||
          c.sourceTrace.version !== versions[c.source]
        ) {
          throw new Error(
            "The chronicle contains invalid continuity settings or statistics.",
          );
        }
        composerSettings = {
          composer: s.composer,
          motif: s.motif,
          corpusVersions: Object.fromEntries(
            s.aspects.map((id) => [id, versions[id]]),
          ),
        };
        compositionFields = {
          motif: c.motif,
          carry: c.carry,
          composition: {
            version: m.version,
            candidates: m.candidates,
            probability: m.probability,
            probabilities: [...m.probabilities],
            selectedIndex: m.selectedIndex,
            surprisal: m.surprisal,
            entropy: m.entropy,
            fit: m.fit,
            temperature: m.temperature,
          },
        };
        if (usesLineageMemory(s.composer)) {
          const before = validateMemory(s.memory, s.aspects, s.motif);
          const after = validateMemory(c.memory, s.aspects, s.motif);
          const last = after.at(-1);
          if (
            after.length !== Math.min(MEMORY_LIMIT, before.length + s.depth) ||
            last?.source !== c.source ||
            last?.fragment !== c.sourceFragment ||
            last?.carry !== c.carry ||
            !Number.isInteger(m.memoryAvoided) ||
            !number(m.memoryAvoided, 0, SHORTLIST_LIMIT - 1) ||
            typeof m.memoryRevisit !== "boolean" ||
            (m.memoryRevisit && m.memoryAvoided !== 0)
          )
            throw new Error(
              "Invalid lineage memory transition in this chronicle.",
            );
          composerSettings.memory = before;
          compositionFields.memory = after;
          compositionFields.composition.memoryAvoided = m.memoryAvoided;
          compositionFields.composition.memoryRevisit = m.memoryRevisit;
        } else if (s.memory !== undefined || c.memory !== undefined) {
          throw new Error("Lineage memory requires its own composer version.");
        }
      }
    } else if (c.composition !== undefined)
      throw new Error("A composed fragment must name its replay version.");
    let sourceTrace;
    if (c.sourceTrace !== undefined) {
      const t = c.sourceTrace;
      if (
        !t ||
        !(
          t.version === null ||
          (typeof t.version === "string" && /^[a-f0-9]{64}$/.test(t.version))
        ) ||
        !Number.isInteger(t.unit) ||
        !number(t.unit, 0, 1000000) ||
        !text(t.original, 8192) ||
        !Number.isInteger(t.start) ||
        !Number.isInteger(t.end) ||
        !number(t.start, 0, t.original.length) ||
        !number(t.end, t.start, t.original.length) ||
        t.id !== sourceAddress(c.source, t.version, t.unit) ||
        normalizeSpan(t.original.slice(t.start, t.end)) !== c.sourceFragment
      ) {
        throw new Error(
          "The chronicle contains an invalid source address. Your current history was kept.",
        );
      }
      sourceTrace = {
        id: t.id,
        version: t.version,
        unit: t.unit,
        original: t.original,
        start: t.start,
        end: t.end,
      };
    }
    let conductor;
    if (entry.conductor !== undefined) {
      const d = entry.conductor;
      if (
        !d ||
        d.version !== CONDUCTOR_VERSION ||
        d.epoch !== s.epoch ||
        JSON.stringify(d.aspects) !== JSON.stringify(s.aspects) ||
        d.protocol !== (s.epoch % 2 ? "grammar" : "markov") ||
        !Number.isInteger(d.oracleSeed) ||
        !number(d.oracleSeed, 0, 4294967295) ||
        !Number.isInteger(d.initialSeed) ||
        !number(d.initialSeed, 0, 4294967295) ||
        d.count !== (s.epoch % 8 === 7 ? 50 : 1) ||
        !Array.isArray(d.outputs) ||
        d.outputs.length !== d.count ||
        d.outputs.some((t) => !text(t, 1200) || !t.trim()) ||
        d.rebirth !== (s.epoch > 0 && s.epoch % 12 === 0) ||
        d.inoculate !== (s.epoch % 4 === 3) ||
        d.prune !== (s.epoch % 3 === 2) ||
        d.cycle !== s.cycle ||
        d.entropy !== s.entropy ||
        !text(d.reason, 200) ||
        !(d.pruned === null || (d.prune && /^[1-4]$/.test(d.pruned))) ||
        d.surviving !==
          entry.population -
            (d.pruned === null
              ? 0
              : (s.branches ** s.depth - 1) / (s.branches - 1))
      )
        throw new Error("Invalid conductor record in this chronicle.");
      conductor = {
        version: d.version,
        epoch: d.epoch,
        aspects: [...d.aspects],
        protocol: d.protocol,
        oracleSeed: d.oracleSeed,
        count: d.count,
        rebirth: d.rebirth,
        cycle: d.cycle,
        prune: d.prune,
        inoculate: d.inoculate,
        entropy: d.entropy,
        reason: d.reason,
        outputs: [...d.outputs],
        pruned: d.pruned,
        surviving: d.surviving,
        initialSeed: d.initialSeed,
      };
    }
    // Keep only the fields used by the app, including replay settings and source traces.
    return {
      id: entry.id,
      time: entry.time,
      pressure: entry.pressure,
      population: entry.population,
      ...(conductor ? { conductor } : {}),
      settings: {
        root: s.root,
        branches: s.branches,
        depth: s.depth,
        seed: s.seed,
        mutation: s.mutation,
        epoch: s.epoch,
        entropy: s.entropy,
        cycle: s.cycle,
        aspects: [...s.aspects],
        ...composerSettings,
      },
      champion: {
        id: c.id,
        parentId: c.parentId,
        text: c.text,
        depth: c.depth,
        operator: c.operator,
        source: c.source,
        sourceFragment: c.sourceFragment,
        inheritedFragment: c.inheritedFragment,
        novelty: c.novelty,
        echo: c.echo,
        score: c.score,
        ...(sourceTrace ? { sourceTrace } : {}),
        ...compositionFields,
      },
    };
  });
}
export function chronicleDocument(entries) {
  return { format: "hyperstition-chronicle", version: 1, entries };
}
export function mergeChronicle(current, incoming) {
  const merged = new Map(current.map((entry) => [entry.id, entry]));
  for (const entry of incoming)
    if (!merged.has(entry.id)) merged.set(entry.id, entry);
  return [...merged.values()].slice(-CHRONICLE_LIMIT);
}
export function readChronicle(storage) {
  try {
    const saved = storage.getItem(CHRONICLE_KEY);
    return {
      entries: saved ? validateChronicle(JSON.parse(saved)) : [],
      error: "",
    };
  } catch {
    return {
      entries: [],
      error: "Saved chronicle unavailable. New epochs can still be exported.",
    };
  }
}
