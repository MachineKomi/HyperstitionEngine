export const MEMORY_COMPOSER = "continuity-2";
export const MEMORY_LIMIT = 12;

export const cloneMemory = (memory = []) =>
  memory.map(({ source, fragment, carry }) => ({ source, fragment, carry }));
export const remember = (memory, item) => [
  ...cloneMemory(memory).slice(-(MEMORY_LIMIT - 1)),
  ...cloneMemory([item]),
];

export function validateMemory(memory, aspects, motif) {
  if (
    !Array.isArray(memory) ||
    memory.length > MEMORY_LIMIT ||
    memory.some(
      (item) =>
        !item ||
        !aspects.includes(item.source) ||
        typeof item.fragment !== "string" ||
        !item.fragment.trim() ||
        item.fragment.length > 320 ||
        typeof item.carry !== "string" ||
        !item.carry.includes(motif) ||
        item.carry.length > 500,
    )
  )
    throw new Error("Invalid lineage memory in this replay.");
  return cloneMemory(memory);
}
