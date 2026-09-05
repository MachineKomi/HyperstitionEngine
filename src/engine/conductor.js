import {
  createAutomaticState,
  runAutomatic,
  planAutomaticEpoch,
} from "./automatic.js";
import { CONTEXT_COMPOSER } from "./context.js";
import { nextSeed } from "./flow.js";
import { normalizeRoot, pruneBranch, randomStream } from "./sprawl.js";

export const CONDUCTOR_VERSION = "conductor-1";
export const GHOSTS = [
  "N_Land",
  "Bible",
  "AI",
  "Marcus_A",
  "M_Cicero",
  "F_Nietzsche",
  "Yokai",
  "Confucius",
  "GoBadukWeiqi",
  "N_Bostrom",
  "Y_Harari",
];
export const createConductorState = (seed) => ({
  ...createAutomaticState(seed, CONTEXT_COMPOSER),
  controller: CONDUCTOR_VERSION,
});

export function planConductor(state) {
  if (state.controller !== CONDUCTOR_VERSION)
    throw new Error("Unsupported conductor version.");
  const deck = [...GHOSTS],
    shuffle = randomStream(state.initialSeed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(shuffle() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // Sliding a seeded deck ensures every ghost is visited, without loading all at once.
  const turn = Math.floor(state.epoch / 3);
  const width = 3;
  const aspects = Array.from(
    { length: width },
    (_, i) => deck[(turn + i) % deck.length],
  );
  const rng = randomStream(nextSeed("ritual:" + state.epoch, state.seed));
  const protocol = state.epoch % 2 ? "grammar" : "markov";
  return {
    version: CONDUCTOR_VERSION,
    epoch: state.epoch,
    aspects,
    protocol,
    oracleSeed: Math.floor(rng() * 4294967296),
    count: state.epoch % 8 === 7 ? 50 : 1,
    rebirth: state.epoch > 0 && state.epoch % 12 === 0,
    cycle: 1 + Math.floor(state.epoch / 12),
    prune: state.epoch % 3 === 2,
    inoculate: state.epoch % 4 === 3,
    entropy: Math.round(180 + rng() * 520 + state.novelty * 180),
    reason:
      state.novelty > 0.72
        ? "Drift is high. The next tree will seek an echo."
        : "The surviving voice leaves room for a stranger continuation.",
  };
}

export function pruneBesideHeir(nodes, champion) {
  const protectedIds = new Set([champion.id]);
  let current = champion;
  while (current?.parentId !== null) {
    protectedIds.add(current.parentId);
    current = nodes.find((n) => n.id === current.parentId);
  }
  const candidate = nodes.find((n) => n.depth === 1 && !protectedIds.has(n.id));
  return candidate
    ? { nodes: pruneBranch(nodes, candidate.id), id: candidate.id }
    : { nodes, id: null };
}

export async function runConductor({
  state,
  bind,
  signal,
  wait,
  onAction = () => {},
  onOracle = () => {},
  onPlan,
  onLayer,
  onEpoch,
  onPhase,
  maxEpochs = Infinity,
}) {
  let current = state;
  const check = () => {
    if (signal?.aborted)
      throw new DOMException("Conductor interrupted.", "AbortError");
  };
  const action = async (kind, detail, plan, duration = 650) => {
    await wait(0, signal);
    check();
    onAction({ kind, detail, epoch: plan.epoch, plan });
    await wait(duration, signal);
    check();
  };
  for (let i = 0; i < maxEpochs; i++) {
    check();
    const plan = planConductor(current);
    if (current.epoch > 1000000)
      throw new Error("This lineage reached its horizon. Restart from a seed.");
    await action(
      "bind",
      `Evoking ${plan.aspects.join(" + ")}. The deck advances every three epochs.`,
      plan,
    );
    const engines = await bind(plan.aspects, signal);
    check();
    await engines.sprawl.prepareComposer(signal, current.composer);
    if (plan.rebirth)
      await action(
        "rebirth",
        `Cycle ${plan.cycle}: discharge the field; keep the archive.`,
        plan,
      );
    await action(
      "charge",
      `Sign the cog. Charge the field to ${plan.entropy} / 1000.`,
      plan,
    );
    await action(
      plan.protocol,
      `${plan.protocol.toUpperCase()} / seeded ritual ${plan.oracleSeed}`,
      plan,
    );
    await action(
      plan.count > 1 ? "multiply" : "invoke",
      `Invoke ${plan.count} ${plan.protocol} transmission${plan.count === 1 ? "" : "s"}.`,
      plan,
    );
    const outputs = [];
    for (let n = 0; n < plan.count; n++) {
      check();
      const seed = nextSeed("voice:" + n, plan.oracleSeed);
      const text =
        plan.protocol === "grammar"
          ? engines.grammar.generate(plan.entropy, randomStream(seed))
          : await engines.markov.generate(plan.entropy, seed);
      await wait(0, signal);
      check();
      outputs.push(text.slice(0, 1200));
      onOracle(outputs.at(-1), plan, n);
      if (plan.count > 1) await wait(45, signal);
    }
    let input = {
      ...current,
      memory: current.memory.filter((m) => plan.aspects.includes(m.source)),
    };
    if (plan.rebirth) input.memory = [];
    if (plan.inoculate) {
      await action(
        "inoculate",
        "The final oracle transmission enters the next origin and changes its seed.",
        plan,
      );
      input = {
        ...input,
        root: normalizeRoot(`${outputs.at(-1)}\n\n${current.root}`),
        seed: nextSeed(outputs.at(-1), current.seed),
      };
    }
    let completed, tree, next;
    await action("grow", "Open the circuit. Branch, measure, select.", plan);
    await runAutomatic({
      engine: engines.sprawl,
      state: input,
      aspects: plan.aspects,
      cycle: plan.cycle,
      signal,
      wait,
      maxEpochs: 1,
      onPlan,
      onLayer,
      onPhase: (phase, generation) => {
        if (phase !== "read") onPhase?.(phase, generation);
      },
      planEpoch: (s) => ({ ...planAutomaticEpoch(s), entropy: plan.entropy }),
      onEpoch: (entry, nodes, advanced, rule) => {
        completed = { entry, rule };
        tree = nodes;
        next = advanced;
      },
    });
    check();
    let pruned = null;
    if (plan.prune) {
      const result = pruneBesideHeir(tree, completed.entry.champion);
      pruned = result.id;
      tree = result.nodes;
      await action(
        "prune",
        `Sever branch ${pruned}; preserve the selected heir and its ancestors.`,
        plan,
      );
      onLayer?.(tree);
    }
    await action(
      "inherit",
      `Canonize heir ${completed.entry.champion.id}; its text and memory become the next origin.`,
      plan,
    );
    const conductor = {
      ...plan,
      outputs,
      pruned,
      surviving: tree.length,
      initialSeed: current.initialSeed,
    };
    current = next;
    onEpoch({ ...completed.entry, conductor }, tree, current, completed.rule);
    onAction({
      kind: "read",
      detail:
        "The heir survives. Read the consequence before the next intervention.",
      epoch: plan.epoch,
      plan,
    });
    onPhase?.("read", completed.entry.settings.depth);
    if (i < maxEpochs - 1)
      await wait(
        Math.max(
          8000,
          Math.min(
            18000,
            completed.entry.champion.text.split(/\s+/).length * 220,
          ),
        ),
        signal,
      );
  }
  return current;
}
