export const ATLAS_LIMIT = 96;
export const ATLAS_AXES = ["Novelty", "Echo", "Population", "Entropy", "Survival", "Mutation"];
const unit = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const checkDimensions = (n) => {
  if (![2, 3, 6].includes(n)) throw new RangeError("Atlas supports 2, 3 or 6 measured dimensions");
};

export function epochVector(epoch) {
  return [unit(epoch.novelty), unit(epoch.echo), unit(epoch.population / 85),
    unit(epoch.entropy / 1000), unit(epoch.population ? epoch.surviving / epoch.population : 0),
    unit(epoch.mutation)].map((n) => n * 2 - 1);
}

export function rotatePlane(vector, a, b, angle) {
  const next = [...vector], c = Math.cos(angle), s = Math.sin(angle);
  next[a] = vector[a] * c - vector[b] * s;
  next[b] = vector[a] * s + vector[b] * c;
  return next;
}

export function projectVector(vector, dimensions, camera) {
  checkDimensions(dimensions);
  let p = vector.slice(0, dimensions);
  if (dimensions === 6) {
    p = rotatePlane(p, 0, 3, camera.fold);
    p = rotatePlane(p, 1, 4, camera.fold * 0.73);
    p = rotatePlane(p, 2, 5, camera.fold * 1.17);
  }
  if (dimensions === 2) p = rotatePlane(p, 0, 1, camera.yaw);
  else {
    p = rotatePlane(p, 0, 2, camera.yaw);
    p = rotatePlane(p, 1, 2, camera.pitch);
  }
  // Orthographic projection: discarded coordinates never alter scale or meaning.
  const scale = 1 / Math.sqrt(dimensions);
  return [p[0] * scale, -p[1] * scale, (p[2] || 0) * scale];
}

export function hypercube(dimensions) {
  checkDimensions(dimensions);
  const vertices = Array.from({ length: 2 ** dimensions }, (_, index) =>
    Array.from({ length: dimensions }, (_, axis) => index & (1 << axis) ? 1 : -1));
  const edges = [];
  vertices.forEach((_, i) => {
    for (let axis = 0; axis < dimensions; axis++) {
      const j = i ^ (1 << axis);
      if (i < j) edges.push([i, j]);
    }
  });
  return { vertices, edges };
}

export function atlasGraph(epochs, dimensions) {
  checkDimensions(dimensions);
  const records = epochs.slice(-ATLAS_LIMIT);
  const nodes = records.map((record) => ({ record, vector: epochVector(record) }));
  const succession = [];
  nodes.forEach(({ record }, i) => {
    if (i && record.epoch === nodes[i - 1].record.epoch + 1 && record.originSeed === nodes[i - 1].record.originSeed)
      succession.push([i - 1, i]);
  });
  const seen = new Set(), neighbors = [];
  nodes.forEach((node, i) => {
    const closest = nodes.map((other, j) => ({ j, distance: node.vector.slice(0, dimensions)
      .reduce((sum, v, axis) => sum + (v - other.vector[axis]) ** 2, 0) }))
      .filter(({ j }) => j !== i).sort((a, b) => a.distance - b.distance || a.j - b.j).slice(0, 2);
    for (const { j } of closest) {
      const edge = [Math.min(i, j), Math.max(i, j)], key = edge.join(":");
      if (!seen.has(key)) { seen.add(key); neighbors.push(edge); }
    }
  });
  return { nodes, succession, neighbors, cage: hypercube(dimensions) };
}

export function nearestProjected(points, x, y, radius = 18) {
  let nearest = -1, distance = radius ** 2;
  points.forEach((p, i) => {
    const d = (p[0] - x) ** 2 + (p[1] - y) ** 2;
    if (d <= distance) { nearest = i; distance = d; }
  });
  return nearest;
}
