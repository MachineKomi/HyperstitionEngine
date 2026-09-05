import test from "node:test";
import assert from "node:assert/strict";
import { atlasGraph, epochVector, hypercube, nearestProjected, projectVector, rotatePlane } from "../src/engine/atlas.js";

const record = (epoch) => ({ epoch, originSeed: 137, seed: epoch + 20, novelty: (epoch % 11) / 11,
  echo: (epoch % 7) / 7, population: 31, entropy: epoch * 13 % 1000, surviving: 24, mutation: 0.4 });
const camera = { yaw: 0, pitch: 0, fold: 0 };

test("hypercube vertices and edges have exact dimensional incidence", () => {
  for (const n of [2, 3, 6]) {
    const cage = hypercube(n), degree = Array(2 ** n).fill(0);
    assert.equal(cage.vertices.length, 2 ** n);
    assert.equal(cage.edges.length, n * 2 ** (n - 1));
    for (const [a, b] of cage.edges) {
      degree[a]++; degree[b]++;
      assert.equal(cage.vertices[a].filter((v, i) => v !== cage.vertices[b][i]).length, 1);
    }
    assert.ok(degree.every((value) => value === n));
  }
  assert.throws(() => hypercube(30), /supports/);
});

test("plane rotation preserves distances and inverse recovers original coordinates", () => {
  const a = [1, -0.3, 0.7, -1, 0.2, 0.9], b = [0, 0.2, -0.1, 1, 0.3, -0.2];
  const distance = (u, v) => Math.hypot(...u.map((n, i) => n - v[i]));
  const ra = rotatePlane(a, 0, 3, 1.2), rb = rotatePlane(b, 0, 3, 1.2);
  assert.ok(Math.abs(distance(a, b) - distance(ra, rb)) < 1e-12);
  assert.ok(distance(a, rotatePlane(ra, 0, 3, -1.2)) < 1e-12);
  assert.deepEqual(a, [1, -0.3, 0.7, -1, 0.2, 0.9]);
});

test("a discarded dimension can overlap until a fold reveals it", () => {
  const a = [0, 0, 0, -1, 0, 0], b = [0, 0, 0, 1, 0, 0];
  assert.deepEqual(projectVector(a, 6, camera), projectVector(b, 6, camera));
  assert.notDeepEqual(projectVector(a, 6, { ...camera, fold: 1 }), projectVector(b, 6, { ...camera, fold: 1 }));
  for (const n of [2, 3, 6]) {
    for (const vertex of hypercube(n).vertices) {
      const projected = projectVector(vertex, n, { yaw: 1.2, pitch: 0.8, fold: 1 });
      assert.ok(projected.every(Number.isFinite));
      assert.ok(Math.hypot(...projected) <= 1 + 1e-12);
    }
  }
});

test("fixed measurement scales do not move older states when a new heir arrives", () => {
  const epochs = Array.from({ length: 12 }, (_, i) => record(i));
  const before = atlasGraph(epochs, 6), after = atlasGraph([...epochs, record(12)], 6);
  assert.deepEqual(before.nodes.map((n) => n.vector), after.nodes.slice(0, 12).map((n) => n.vector));
  const normalized = epochVector({ ...record(0), novelty: NaN, echo: -1, population: 0, entropy: Infinity });
  assert.ok(normalized.every((n) => Number.isFinite(n) && n >= -1 && n <= 1));
});

test("graph edges are bounded, deterministic and distinguish succession from proximity", () => {
  const epochs = Array.from({ length: 140 }, (_, i) => record(i));
  const graph = atlasGraph(epochs, 6);
  assert.deepEqual(graph, atlasGraph(epochs, 6));
  assert.equal(graph.nodes.length, 96);
  assert.equal(graph.nodes[0].record.epoch, 44);
  assert.equal(graph.succession.length, 95);
  assert.ok(graph.neighbors.length <= 192);
  assert.equal(new Set(graph.neighbors.map((edge) => edge.join(":"))).size, graph.neighbors.length);
  assert.ok(graph.neighbors.every(([a, b]) => a < b && b < 96));
  assert.equal(atlasGraph([record(1), record(3), { ...record(4), originSeed: 2 }], 3).succession.length, 0);
  assert.equal(atlasGraph([], 6).neighbors.length, 0);
  assert.equal(atlasGraph([record(0)], 3).neighbors.length, 0);
});

test("picking chooses the nearest point within the touch target", () => {
  assert.equal(nearestProjected([[10, 10], [20, 20]], 19, 19), 1);
  assert.equal(nearestProjected([[10, 10]], 100, 100), -1);
});
