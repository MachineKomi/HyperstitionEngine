import { performance } from "node:perf_hooks";
import { atlasGraph, projectVector } from "../src/engine/atlas.js";

// Synthetic maximum-window fixture: compute cost, not a literary evaluation.
const records = Array.from({ length: 96 }, (_, epoch) => ({
  epoch, originSeed: 137, novelty: (epoch * 17 % 101) / 100,
  echo: (epoch * 23 % 101) / 100, population: 7 + epoch % 79,
  surviving: 7, entropy: epoch * 41 % 1000, mutation: (epoch % 9) / 10,
}));
const times = [], projection = [];
let graph;
for (let i = 0; i < 120; i++) {
  let start = performance.now(); graph = atlasGraph(records, 6);
  const graphMs = performance.now() - start;
  start = performance.now();
  for (const vector of [...graph.nodes.map((n) => n.vector), ...graph.cage.vertices])
    projectVector(vector, 6, { yaw: i * 0.1, pitch: 0.35, fold: 0.65 });
  if (i >= 20) { times.push(graphMs); projection.push(performance.now() - start); }
}
const summarize = (values) => {
  values.sort((a, b) => a - b);
  return { medianMs: values[50], p95Ms: values[95] };
};
console.log(JSON.stringify({ nodes: graph.nodes.length, succession: graph.succession.length,
  proximity: graph.neighbors.length, cageEdges: graph.cage.edges.length,
  samples: 100, graph: summarize(times), projection: summarize(projection),
  note: "Synthetic 96-state Node benchmark after 20 warmups. Excludes canvas drawing, React, source loading and device GPU behavior."
}, null, 2));
