import test from "node:test";
import assert from "node:assert/strict";
import {
  SprawlEngine,
  growSprawl,
  populationSize,
  pruneBranch,
} from "../src/engine/sprawl.js";

function engine() {
  const result = new SprawlEngine();
  result.loadCorpus([
    {
      id: "test",
      sentences: [
        "The silver circuit gathers dreams beneath the silent cathedral.",
        "Every impossible machine returns through a door inside tomorrow.",
      ],
      pos: { nouns: ["circuit", "cathedral", "machine"] },
    },
  ]);
  return result;
}
const settings = () => ({
  engine: engine(),
  root: "A mechanical seed invents its own future.",
  branches: 4,
  depth: 4,
  mutation: 0.65,
  seed: 42,
});

test("combinatorial growth is deterministic, bounded, and preserves parent/source traces", async () => {
  const first = await growSprawl(settings());
  const second = await growSprawl(settings());
  assert.equal(populationSize(4, 4), 341);
  assert.equal(first.length, 341);
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((node) => node.id)).size, 341);
  for (const node of first.slice(1)) {
    const parent = first.find((candidate) => candidate.id === node.parentId);
    assert.equal(node.depth, parent.depth + 1);
    assert.ok(parent.text.includes(node.inheritedFragment));
    assert.equal(node.source, "test");
    assert.ok(node.sourceFragment.length > 0);
  }
});

test("burning a subtree preserves siblings and never removes the root", async () => {
  const tree = await growSprawl({ ...settings(), branches: 2, depth: 3 });
  const pruned = pruneBranch(tree, "1");
  assert.equal(tree.length, 15);
  assert.equal(pruned.length, 8);
  assert.ok(pruned.some((node) => node.id === "2"));
  assert.deepEqual(pruneBranch(tree, "0"), tree);
  for (const node of pruned.slice(1))
    assert.ok(pruned.some((parent) => parent.id === node.parentId));
});

test("severing preserves completed generations and prevents further growth", async () => {
  const control = new AbortController();
  let latest = [];
  await assert.rejects(
    growSprawl({
      ...settings(),
      signal: control.signal,
      onLayer: (layer) => {
        latest = layer;
        control.abort();
      },
    }),
    { name: "AbortError" },
  );
  assert.equal(latest.length, 5);
});

test("feedback uses the selected descendant as the next literal origin", async () => {
  const first = await growSprawl({ ...settings(), depth: 1 });
  const next = await growSprawl({
    ...settings(),
    depth: 1,
    root: first[2].text,
  });
  assert.equal(next[0].text, first[2].text);
  assert.notEqual(next[1].text, first[1].text);
});

test("invalid dimensions cannot create an unbounded sprawl", async () => {
  await assert.rejects(
    growSprawl({ ...settings(), depth: 100 }),
    /2–4 branches/,
  );
  await assert.rejects(growSprawl({ ...settings(), root: " " }), /seed phrase/);
});
