export const CHRONICLE_LIMIT = 108;
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
    // Keep only the fields used by the app, including replay settings and source traces.
    return {
      id: entry.id,
      time: entry.time,
      pressure: entry.pressure,
      population: entry.population,
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
