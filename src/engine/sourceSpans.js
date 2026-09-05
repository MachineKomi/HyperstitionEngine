export const normalizeSpan = (text) => text.replace(/\s+/g, " ");

// UTF-16 offsets address the bundled extraction, not pages in the original work.
// Keep the same random draw and token window as the legacy composer.
export function windowSpan(original, rng, count = 9) {
  const tokens = [...original.matchAll(/\S+/g)];
  const first = Math.floor(rng() * Math.max(1, tokens.length - count + 1));
  const selected = tokens.slice(first, first + count);
  if (!selected.length) return { text: "", start: 0, end: 0 };
  const text = selected
    .map((token) => token[0])
    .join(" ")
    .replace(/[.!?;:,]+$/, "");
  const start = selected[0].index;
  const last = selected.at(-1);
  const removed =
    selected.map((token) => token[0]).join(" ").length - text.length;
  return { text, start, end: last.index + last[0].length - removed };
}

export function sourceAddress(source, version, unit) {
  return `${source}@${version || "unversioned"}:${unit}`;
}

// These are inspectable warnings, not an authorship or grammatical classifier.
export function extractionFlags(original) {
  const flags = [];
  if (/https?:|\bdoi\b|\[\d+\]|\bISBN\b|\bBibliography\b/i.test(original))
    flags.push("reference material");
  if (/\(cid:|[\p{L}]{32,}|\p{L}-\s*\n\s*\p{L}/u.test(original))
    flags.push("possible extraction damage");
  if (/edited by|all rights reserved|first published|copyright/i.test(original))
    flags.push("possible editorial matter");
  if (/[“”"]/.test(original)) flags.push("quotation marks; speaker unverified");
  if (/\n/.test(original)) flags.push("line breaks preserved");
  return flags;
}

// Conservative punctuation units for inspection and the next composition experiment.
// No comma splitting, token truncation, language model or claim of complete syntax.
export function punctuationUnits(original) {
  const units = [];
  const boundary = /[!?;]+(?=\s|$)|\.(?=\s+[A-Z“"]|$)/g;
  let start = 0;
  for (const match of original.matchAll(boundary)) {
    const prefix = original.slice(start, match.index + match[0].length);
    if (/\b(?:Mr|Mrs|Ms|Dr|Prof|St|vs|etc|[A-Z])\.$/.test(prefix)) continue;
    const end = match.index + match[0].length;
    if (original.slice(start, end).trim())
      units.push({ start, end, text: original.slice(start, end) });
    start = end;
  }
  if (original.slice(start).trim())
    units.push({ start, end: original.length, text: original.slice(start) });
  return units;
}
