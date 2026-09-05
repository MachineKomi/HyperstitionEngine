// Breadth-first IDs give each node an immutable angular slot. Reserve every
// generation's orbit from the start, including after a branch is pruned.
export function sprawlPositions(nodes, branches = 3, depth = 3) {
  const positions = new Map([["0", { x: 360, y: 240 }]]);
  for (const node of nodes) {
    if (!node.depth) continue;
    const count = branches ** node.depth;
    const firstId = (count - 1) / (branches - 1);
    const slot = Number(node.id) - firstId;
    const angle = ((slot + 0.5) / count) * Math.PI * 2 - Math.PI / 2;
    const radius = (196 * node.depth) / Math.max(1, depth);
    positions.set(node.id, {
      x: 360 + Math.cos(angle) * radius,
      y: 240 + Math.sin(angle) * radius,
    });
  }
  return positions;
}
