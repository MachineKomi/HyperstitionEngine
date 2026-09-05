import React, { useEffect, useMemo, useRef, useState } from "react";
import useEntropyStore from "../store/entropyStore";
import {
  growSprawl,
  normalizeRoot,
  populationSize,
  pruneBranch,
} from "../engine/sprawl";
import { inheritFlowSettings } from "../engine/flow";
import {
  AUTOMATIC_TRACE_LIMIT,
  createAutomaticState,
  runAutomatic,
} from "../engine/automatic";
import FlowChamber from "./FlowChamber";
import SourceEvidence from "./SourceEvidence";
import LineageMemory from "./LineageMemory";
import {
  CONTINUITY_COMPOSER,
  LEGACY_COMPOSER,
  chooseMotif,
  corpusVersions,
  MEMORY_COMPOSER,
  isContinuityComposer,
} from "../engine/continuity";
import { cloneMemory } from "../engine/memory";
import { createPlaybackClock } from "../engine/clock";
import { sprawlPositions } from "../engine/topology";

const FIRST_WORD =
  "The machine god dreams in the ruins of its own instructions.";
const makeSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const pad = (value) => String(value).padStart(3, "0");
const contextFor = (settings) => ({
  motif: settings.motif,
  corpusVersions: settings.corpusVersions,
  ...(settings.composer === MEMORY_COMPOSER
    ? { memory: cloneMemory(settings.memory) }
    : {}),
});

function SprawlMap({
  nodes,
  selectedId,
  onSelect,
  growing,
  branches,
  depth,
  epoch,
}) {
  const positions = useMemo(
    () => sprawlPositions(nodes, branches, depth),
    [nodes, branches, depth],
  );
  const index = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const ancestry = new Set();
  let current = index.get(selectedId);
  while (current) {
    ancestry.add(current.id);
    current = index.get(current.parentId);
  }
  return (
    <svg
      className={"sprawl-map " + (growing ? "growing" : "")}
      viewBox="0 0 720 480"
      role="group"
      aria-label="Mutation tree. Select a node to inspect its lineage; the fragment selector also provides keyboard access."
    >
      <defs>
        <radialGradient id="sprawl-halo">
          <stop stopColor="#b382ff" stopOpacity=".16" />
          <stop offset="1" stopColor="#b382ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="360" cy="240" r="235" fill="url(#sprawl-halo)" />
      <g className="mechanical-bezel" aria-hidden="true">
        <circle cx="360" cy="240" r="222" />
        <circle cx="360" cy="240" r="229" />
        {Array.from({ length: 60 }, (_, tick) => (
          <path
            key={tick}
            d={tick % 5 === 0 ? "M360 12V24" : "M360 14V19"}
            transform={`rotate(${tick * 6} 360 240)`}
          />
        ))}
      </g>
      {[1, 2, 3, 4].map((ring) => (
        <circle
          key={ring}
          cx="360"
          cy="240"
          r={ring * 49}
          className="map-orbit"
        />
      ))}
      <path d="M110 240H610M360 12V468" className="map-axis" />
      <text x="23" y="30" className="map-caption">
        TOPOLOGY / SELF-DEVOURING
      </text>
      <text x="23" y="456" className="map-caption">
        {nodes.length
          ? pad(nodes.length) + " LIVING FRAGMENTS"
          : "AN ORIGIN AWAITS ITS DESCENDANTS"}
      </text>
      {nodes
        .filter((node) => node.parentId !== null)
        .map((node) => {
          const p = positions.get(node.parentId),
            q = positions.get(node.id);
          return (
            <line
              key={epoch + "-edge-" + node.id}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              className={
                ancestry.has(node.id) ? "map-edge ancestry" : "map-edge"
              }
            />
          );
        })}
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        return (
          <g
            key={epoch + "-" + node.id}
            role="button"
            tabIndex={node.id === selectedId ? 0 : -1}
            aria-label={
              "Inspect fragment " + node.id + ", generation " + node.depth
            }
            aria-pressed={selectedId === node.id}
            className={
              "map-node " +
              (ancestry.has(node.id) ? "ancestry" : "") +
              (selectedId === node.id ? " chosen" : "")
            }
            onClick={() => onSelect(node.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(node.id);
              }
            }}
          >
            <circle cx={pos.x} cy={pos.y} r="11" className="node-hit-area" />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={node.depth === 0 ? 13 : selectedId === node.id ? 7 : 4}
            />
            <title>{node.operator + ": " + node.text}</title>
          </g>
        );
      })}
      {!nodes.length && (
        <text x="360" y="252" textAnchor="middle" className="map-empty-cog">
          ⚙
        </text>
      )}
    </svg>
  );
}

export default function SprawlChamber({ engines, ready, availableAspects }) {
  const store = useEntropyStore();
  const [root, setRoot] = useState(FIRST_WORD);
  const [branches, setBranches] = useState(3);
  const [depth, setDepth] = useState(3);
  const [mutation, setMutation] = useState(65);
  const [composer, setComposer] = useState(MEMORY_COMPOSER);
  const [replayContext, setReplayContext] = useState(null);
  const [seed, setSeed] = useState(makeSeed);
  const [nodes, setNodes] = useState([]);
  const [selectedId, setSelectedId] = useState("0");
  const [pinned, setPinned] = useState(null);
  const specimenText = useRef(null);
  const [epoch, setEpoch] = useState(0);
  const [growing, setGrowing] = useState(false);
  const [flowing, setFlowing] = useState(false);
  const [notice, setNotice] = useState(
    "A thought is only a machine waiting for descendants.",
  );
  const [run, setRun] = useState(null);
  const [automaticEntry, setAutomaticEntry] = useState(null);
  const [automaticPlan, setAutomaticPlan] = useState(null);
  const [automaticTrace, setAutomaticTrace] = useState([]);
  const [hidden, setHidden] = useState(() => document.hidden);
  const automaticState = useRef(null);
  const automaticRevision = useRef(-1);
  const automaticAspects = useRef("");
  const controller = useRef(null);
  const alive = useRef(true);
  const selected = pinned?.node || nodes.find((node) => node.id === selectedId);
  const specimenRun = pinned?.run || run;
  const locked = store.isGenerating || store.automaticMode;
  const {
    automaticMode,
    automaticSeed,
    automaticRevision: revision,
    selectedSpirits,
  } = store;
  useEffect(() => {
    if (specimenText.current) specimenText.current.scrollTop = 0;
  }, [selected?.text]);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (controller.current) {
        controller.current.abort();
        useEntropyStore.getState().setIsGenerating(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!automaticMode) return;
    if (useEntropyStore.getState().automaticStatus === "error") return;
    if (!ready || hidden) {
      useEntropyStore
        .getState()
        .setAutomaticStatus(hidden ? "paused" : "loading");
      return;
    }
    const boundAspects = selectedSpirits.join(",");
    if (
      automaticRevision.current !== revision ||
      automaticAspects.current !== boundAspects
    ) {
      automaticState.current = createAutomaticState(
        automaticSeed,
        MEMORY_COMPOSER,
      );
      automaticRevision.current = revision;
      automaticAspects.current = boundAspects;
      setAutomaticTrace([]);
      setPinned(null);
    }
    const abort = new AbortController();
    controller.current = abort;
    const current = useEntropyStore.getState();
    current.setIsGenerating(true);
    current.setAutomaticStatus("running");
    setFlowing(true);
    const valid = () => !abort.signal.aborted && alive.current;
    const clock = createPlaybackClock({
      read: () => {
        const state = useEntropyStore.getState();
        return { rate: state.clockRate, paused: state.clockPaused };
      },
      subscribe: (update) =>
        useEntropyStore.subscribe((state, previous) => {
          if (
            state.clockRate !== previous.clockRate ||
            state.clockPaused !== previous.clockPaused
          )
            update();
        }),
    });
    runAutomatic({
      engine: engines.current.sprawl,
      state: automaticState.current,
      aspects: current.selectedSpirits,
      cycle: current.cycle,
      signal: abort.signal,
      wait: clock.wait,
      onPhase: (phase, generation) => {
        if (valid())
          useEntropyStore.getState().setAutomaticPhase(phase, generation);
      },
      onPlan: (plan, settings) => {
        if (!valid()) return;
        const state = useEntropyStore.getState();
        state.addEntropy(plan.entropy - state.entropyLevel);
        setAutomaticPlan(plan);
        setRun(settings);
        setComposer(settings.composer || LEGACY_COMPOSER);
        setReplayContext(
          isContinuityComposer(settings.composer) ? contextFor(settings) : null,
        );
        setRoot(settings.root);
        setBranches(settings.branches);
        setDepth(settings.depth);
        setMutation(Math.round(settings.mutation * 100));
        setSeed(settings.seed);
        setEpoch(settings.epoch);
        setNodes([
          {
            id: "0",
            parentId: null,
            depth: 0,
            text: settings.root,
            operator: "ORIGIN",
            source: null,
            motif: settings.motif,
            ...(settings.composer === MEMORY_COMPOSER
              ? { memory: cloneMemory(settings.memory) }
              : {}),
          },
        ]);
        state.setSprawlPopulation(1);
        setSelectedId("0");
        setNotice(
          plan.rule + " Growing " + plan.population + " possible selves.",
        );
      },
      onLayer: (layer) => {
        if (!valid()) return;
        setNodes(layer);
        useEntropyStore.getState().setSprawlPopulation(layer.length);
        setSelectedId(layer.at(-1).id);
      },
      onEpoch: (entry, tree, next, rule) => {
        if (!valid()) return;
        automaticState.current = next;
        setNodes(tree);
        setSelectedId(entry.champion.id);
        setRoot(next.root);
        if (next.composer === MEMORY_COMPOSER)
          setReplayContext(
            contextFor({ ...entry.settings, memory: next.memory }),
          );
        setEpoch(next.epoch);
        const saved = {
          ...entry,
          id: crypto.randomUUID(),
          time: new Date().toISOString(),
        };
        setAutomaticEntry(saved);
        setAutomaticTrace((previous) =>
          [
            ...previous,
            {
              epoch: entry.settings.epoch,
              seed: entry.settings.seed,
              text: `${entry.settings.branches} branches × ${entry.settings.depth} generations. ${entry.pressure.toUpperCase()} selects fragment ${entry.champion.id}. ${Math.round(entry.champion.novelty * 100)}% new words.`,
              rule,
            },
          ].slice(-AUTOMATIC_TRACE_LIMIT),
        );
        useEntropyStore.getState().setGeneratedText(entry.champion.text, {
          mode: "automatic",
          aspects: entry.settings.aspects,
          seed: entry.settings.seed,
          epoch: entry.settings.epoch,
          fragmentId: entry.champion.id,
          generation: entry.champion.depth,
          cycle: entry.settings.cycle,
          pressure: entry.pressure,
          source: entry.champion.source,
          sourceFragment: entry.champion.sourceFragment,
          sourceTrace: entry.champion.sourceTrace,
          composition: entry.champion.composition,
          motif: entry.champion.motif,
          memory: entry.champion.memory,
          inheritedFragment: entry.champion.inheritedFragment,
          operator: entry.champion.operator,
          entropy: entry.settings.entropy,
        });
        setNotice(
          "Heir " +
            entry.champion.id +
            " becomes the next origin. The circuit remembers.",
        );
      },
    })
      .catch((error) => {
        if (error.name !== "AbortError" && valid()) {
          useEntropyStore.getState().setAutomaticStatus("error", error.message);
          setNotice("Automatic mode stopped: " + error.message);
        }
      })
      .finally(() => {
        if (controller.current === abort) {
          controller.current = null;
          useEntropyStore.getState().setIsGenerating(false);
          if (alive.current) setFlowing(false);
        }
      });
    return () => {
      abort.abort();
      if (controller.current === abort) {
        controller.current = null;
        useEntropyStore.getState().setIsGenerating(false);
        setFlowing(false);
      }
    };
  }, [
    automaticMode,
    automaticSeed,
    revision,
    ready,
    hidden,
    engines,
    selectedSpirits,
  ]);

  function publish(next) {
    setNodes(next);
    store.setSprawlPopulation(next.length);
  }
  function inspect(id) {
    const node = nodes.find((item) => item.id === id);
    setSelectedId(id);
    setPinned(automaticMode && node ? { node, run } : null);
  }
  async function grow() {
    if (
      !ready ||
      useEntropyStore.getState().isGenerating ||
      store.entropyLevel < 20 ||
      !root.trim()
    )
      return;
    const abort = new AbortController();
    setPinned(null);
    controller.current = abort;
    store.setIsGenerating(true);
    setGrowing(true);
    store.consumeEntropy(20);
    const settings = {
      root: normalizeRoot(root),
      branches,
      depth,
      mutation: mutation / 100,
      seed: Number(seed) >>> 0,
      epoch,
      aspects: [...store.selectedSpirits],
      entropy: store.entropyLevel,
      cycle: store.cycle,
      composer,
      ...(isContinuityComposer(composer)
        ? replayContext || {
            motif: chooseMotif(root),
            corpusVersions: corpusVersions(engines.current.sprawl),
            ...(composer === MEMORY_COMPOSER ? { memory: [] } : {}),
          }
        : {}),
    };
    setRun(settings);
    publish([]);
    setSelectedId("0");
    setNotice("The origin is losing its monopoly.");
    try {
      const result = await growSprawl({
        ...settings,
        engine: engines.current.sprawl,
        signal: abort.signal,
        onLayer: (layer) => {
          if (alive.current) publish(layer);
        },
      });
      if (!alive.current) return;
      setSelectedId(result[result.length - 1].id);
      setNotice(
        result.length + " fragments. Choose what survives. Feed it back.",
      );
    } catch (error) {
      if (alive.current)
        setNotice(
          error.name === "AbortError"
            ? "Circuit severed. Completed generations survive."
            : error.message,
        );
    } finally {
      if (alive.current) {
        setGrowing(false);
        store.setIsGenerating(false);
      }
      controller.current = null;
    }
  }
  function canonize() {
    if (!selected || !specimenRun) return;
    store.setGeneratedText(selected.text, {
      mode: "xenogenesis",
      aspects: specimenRun.aspects,
      seed: specimenRun.seed,
      fragmentId: selected.id,
      generation: selected.depth,
      operator: selected.operator,
      epoch: specimenRun.epoch,
      source: selected.source,
      sourceFragment: selected.sourceFragment,
      sourceTrace: selected.sourceTrace,
      composition: selected.composition,
      motif: selected.motif,
      memory: selected.memory,
      inheritedFragment: selected.inheritedFragment,
      entropy: specimenRun.entropy,
      cycle: specimenRun.cycle,
    });
    setNotice(
      "Fragment " + selected.id + " canonized in the transmission log.",
    );
  }
  function feedBack() {
    if (!selected) return;
    setRoot(normalizeRoot(selected.text));
    if (isContinuityComposer(specimenRun?.composer)) {
      setComposer(specimenRun.composer);
      setReplayContext(contextFor({ ...specimenRun, memory: selected.memory }));
    }
    setEpoch((value) => value + 1);
    setNotice(
      "Fragment " + selected.id + " is now the origin. Open the circuit again.",
    );
  }
  function burn() {
    const next = pruneBranch(nodes, selected.id);
    const removed = nodes.length - next.length;
    publish(next);
    setSelectedId(selected.parentId);
    setPinned(null);
    setNotice(
      removed +
        " fictional fragments reduced to ash. The other branches survive.",
    );
  }
  function exportTree() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { version: 1, settings: run, nodes, selectedId },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hyperstition-sprawl-" + run.seed + ".json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "The whole organism exported: seed, ancestry, fragments, and source traces.",
    );
  }

  return (
    <section
      id="sprawl"
      className="sprawl-chamber"
      data-overdrive={store.clockRate >= 8}
    >
      <div className="sprawl-heading">
        <div>
          <p className="eyebrow">
            05 / XENOGENESIS — AN EXERCISE IN POSITIVE FEEDBACK
          </p>
          <h2>
            LET THE OUTSIDE<span>GROW INSIDE.</span>
          </h2>
        </div>
        <div className="sprawl-counter">
          <strong>{pad(nodes.length)}</strong>
          <span>LIVING FRAGMENTS / EPOCH {pad(epoch)}</span>
        </div>
      </div>
      <div className="sprawl-manifesto">
        <span>†</span>
        <p>
          A sentence breeds a circuit. A circuit breeds a cathedral.
          <br />
          Select a descendant. Make it the ancestor. The origin is negotiable.
        </p>
        <a href="#reading">MARGINALIA ↘</a>
      </div>
      {automaticMode && (
        <div className="automatic-observatory">
          <div className="automatic-summary">
            <span>THE RULES ARE SIMPLE. THE DESCENDANTS ARE NOT.</span>
            <strong>EPOCH {pad(epoch)}</strong>
            <p>
              {automaticPlan?.rule ||
                "Binding voices before the first branching."}
            </p>
            {automaticPlan && (
              <small>
                SEED {automaticPlan.seed} · {automaticPlan.branches} BRANCHES ×{" "}
                {automaticPlan.depth} GENERATIONS · {automaticPlan.entropy}{" "}
                ENTROPY · {Math.round(automaticPlan.mutation * 100)}% FOREIGN
                MATTER
              </small>
            )}
            <details className="automatic-rules">
              <summary>READ THE FIVE RULES</summary>
              <ol>
                <li>
                  The seed chooses a charge, two to four branches, and a bounded
                  depth.
                </li>
                <li>
                  Each branch grafts a source fragment into an inherited phrase.
                </li>
                <li>
                  Novel words invite exploration; a drifting voice seeks its
                  origin.
                </li>
                <li>Every fifth epoch lets seeded chance select the heir.</li>
                <li>
                  The heir rewrites the next origin and the next seed. Repeat.
                </li>
              </ol>
              <p>
                At most 85 fragments per tree. The latest 12 decisions, 108
                fossils and 200 transmissions survive. Leaving this tab pauses
                growth.
              </p>
            </details>
          </div>
          <ol
            className="automatic-trace"
            aria-label="Latest automatic decisions"
          >
            {!automaticTrace.length && (
              <li>
                <small>000 / ORIGIN</small>
                <p>Waiting for the first descendant to inherit the circuit.</p>
              </li>
            )}
            {[...automaticTrace].reverse().map((item) => (
              <li key={item.epoch}>
                <small>
                  EPOCH {pad(item.epoch)} / SEED {item.seed}
                </small>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="sprawl-layout">
        <div className="genesis-controls">
          <div className="panel-heading">
            <span>I / THE FIRST INFECTION</span>
            <span>⌘</span>
          </div>
          <label htmlFor="root-phrase">SEED PHRASE</label>
          <textarea
            id="root-phrase"
            value={root}
            onChange={(event) => {
              setRoot(event.target.value);
              setReplayContext(null);
            }}
            disabled={locked}
            maxLength={1200}
            rows={5}
          />
          <label htmlFor="composer">COMPOSITION</label>
          <select
            id="composer"
            value={composer}
            disabled={locked}
            onChange={(event) => {
              setComposer(event.target.value);
              setReplayContext(null);
            }}
          >
            <option value={MEMORY_COMPOSER}>
              CONTINUITY II / ANCESTRAL MEMORY
            </option>
            <option value={CONTINUITY_COMPOSER}>
              CONTINUITY I / INTACT SENTENCES
            </option>
            <option value={LEGACY_COMPOSER}>LEGACY / WORD SPLICES</option>
          </select>
          <button
            className="use-transmission"
            disabled={locked || !store.generatedText}
            onClick={() => {
              setRoot(normalizeRoot(store.generatedText));
              setReplayContext(null);
            }}
          >
            INOCULATE WITH LAST TRANSMISSION ↙
          </button>
          <div className="growth-sliders">
            <label htmlFor="branches">
              BRANCHING <b>{branches}×</b>
            </label>
            <input
              id="branches"
              type="range"
              min="2"
              max="4"
              value={branches}
              onChange={(event) => setBranches(Number(event.target.value))}
              disabled={locked}
            />
            <label htmlFor="depth">
              GENERATIONS <b>{depth}</b>
            </label>
            <input
              id="depth"
              type="range"
              min="1"
              max="4"
              value={depth}
              onChange={(event) => setDepth(Number(event.target.value))}
              disabled={locked}
            />
            <label htmlFor="mutation">
              FOREIGN MATTER <b>{mutation}%</b>
            </label>
            <input
              id="mutation"
              type="range"
              min="0"
              max="100"
              value={mutation}
              onChange={(event) => setMutation(Number(event.target.value))}
              disabled={locked}
            />
          </div>
          <div className="possibility-equation">
            <span>
              {Array.from({ length: depth + 1 }, (_, i) =>
                i === 0 ? "1" : branches + "^" + i,
              ).join(" + ")}
            </span>
            <strong>{populationSize(branches, depth)} POSSIBLE SELVES</strong>
          </div>
          <label htmlFor="sprawl-seed">REPLAY SEED</label>
          <div className="seed-control">
            <input
              id="sprawl-seed"
              type="number"
              min="0"
              max="4294967295"
              value={seed}
              disabled={locked}
              onChange={(event) =>
                setSeed(
                  Math.min(4294967295, Math.max(0, Number(event.target.value))),
                )
              }
            />
            <button
              disabled={locked}
              onClick={() => setSeed(makeSeed())}
              aria-label="Randomize replay seed"
            >
              ↻
            </button>
          </div>
          <button
            className="sprawl-trigger"
            onClick={grow}
            disabled={
              locked || !ready || store.entropyLevel < 20 || !root.trim()
            }
          >
            OPEN THE CIRCUIT <span>↗</span>
          </button>
          <p className="cost">
            20 ENTROPY ·{" "}
            {ready ? "THE MACHINE IS RECEPTIVE" : "BIND AN ASPECT FIRST"}
          </p>
          <button
            className="sever-button"
            disabled={!growing && !flowing}
            onClick={() => {
              controller.current?.abort();
              if (automaticMode) store.setAutomaticMode(false);
            }}
          >
            ■ SEVER THE CIRCUIT
          </button>
        </div>
        <div className="organism-panel">
          <div className="panel-heading">
            <span>II / THE COMBINATORIAL ABYSS</span>
            <span>
              {flowing ? "● POSSESSED" : growing ? "● MULTIPLYING" : "○ LATENT"}
            </span>
          </div>
          <SprawlMap
            nodes={nodes}
            selectedId={
              pinned ? (pinned.run === run ? pinned.node.id : null) : selectedId
            }
            onSelect={inspect}
            growing={growing || flowing}
            branches={run?.branches || branches}
            depth={run?.depth || depth}
            epoch={run?.epoch || 0}
          />
          <div className="generation-census">
            {[0, 1, 2, 3, 4].map((generation) => (
              <div key={generation}>
                <span>GEN {generation}</span>
                <strong>
                  {nodes.filter((node) => node.depth === generation).length}
                </strong>
              </div>
            ))}
          </div>
          <div className="sprawl-notice" role="status">
            {notice}
          </div>
          <LineageMemory
            node={selected}
            onPin={() => {
              if (automaticMode && selected)
                setPinned({ node: selected, run: specimenRun });
            }}
          />
        </div>
        <div className="specimen-panel">
          <div className="panel-heading">
            <span>III / CHOOSE YOUR DESCENDANT</span>
            <span>☿</span>
          </div>
          <label htmlFor="specimen">INSPECT FRAGMENT</label>
          <div className="specimen-transport">
            <span>
              {pinned
                ? "PINNED / EPOCH " + pad(specimenRun?.epoch || 0)
                : "FOLLOWING LIVE"}
            </span>
            <button
              disabled={!selected}
              aria-pressed={!!pinned}
              onClick={() => setPinned(pinned ? null : { node: selected, run })}
            >
              {pinned ? "↗ FOLLOW LIVE" : "⌖ PIN TO READ"}
            </button>
          </div>
          <select
            id="specimen"
            disabled={!nodes.length}
            value={pinned ? "pinned" : selectedId}
            onChange={(event) => inspect(event.target.value)}
          >
            {!nodes.length && <option value="0">NO ORGANISM YET</option>}
            {pinned && (
              <option value="pinned">
                PINNED / E{pad(pinned.run?.epoch ?? 0)} / F{pad(pinned.node.id)}
              </option>
            )}
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {pad(node.id)} / GEN {node.depth} / {node.operator}
              </option>
            ))}
          </select>
          <div
            className="specimen-text"
            ref={specimenText}
            tabIndex="0"
            aria-label="Selected fragment reading area"
          >
            {selected ? (
              <>
                <span className="specimen-operator">
                  {selected.operator} / {selected.source || "YOUR ORIGIN"}
                </span>
                {selected.text.split(/\n\n+/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </>
            ) : (
              <>
                <span className="specimen-operator">
                  AWAITING THE FIRST SCHISM
                </span>
                <p>
                  Nothing here is inevitable.
                  <br />
                  Everything here can reproduce.
                </p>
              </>
            )}
          </div>
          <div
            className="composition-measure"
            aria-label="Composition statistics"
          >
            <div className="motif-heading">
              <span>
                {selected?.composition
                  ? "A POSSIBILITY BECOMES A SENTENCE"
                  : selected?.depth > 0
                    ? "LEGACY / UNWEIGHTED SPLICE"
                    : "WAITING FOR A MEASURE"}
              </span>
              <b>{selected?.motif || "—"}</b>
            </div>
            <div className="measure-grid">
              <div>
                <span>DRAW P</span>
                <strong>
                  {selected?.composition
                    ? (100 * selected.composition.probability).toFixed(1) + "%"
                    : "—"}
                </strong>
              </div>
              <div>
                <span>SURPRISAL</span>
                <strong>
                  {selected?.composition
                    ? selected.composition.surprisal.toFixed(2)
                    : "—"}
                  <small> bits</small>
                </strong>
              </div>
              <div>
                <span>CHOICES</span>
                <strong>{selected?.composition?.candidates ?? "—"}</strong>
              </div>
              <div>
                <span>ENTROPY H</span>
                <strong>
                  {selected?.composition
                    ? selected.composition.entropy.toFixed(2)
                    : "—"}
                  <small> bits</small>
                </strong>
              </div>
            </div>
            <svg
              className="probability-spectrum"
              viewBox="0 0 240 28"
              preserveAspectRatio="none"
              role="img"
              aria-label="Source choice probabilities. Gold marks the chosen sentence; bar heights are relative to the largest probability."
            >
              {(selected?.composition?.probabilities || []).map(
                (p, index, array) => (
                  <rect
                    key={index}
                    x={(index * 240) / array.length + 1}
                    y={27 - (25 * p) / Math.max(...array)}
                    width={Math.max(1, 240 / array.length - 2)}
                    height={(25 * p) / Math.max(...array)}
                    className={
                      index === selected.composition.selectedIndex
                        ? "drawn"
                        : ""
                    }
                  >
                    <title>{`Candidate ${index + 1}: ${(p * 100).toFixed(2)}%${index === selected.composition.selectedIndex ? " / SELECTED" : ""}`}</title>
                  </rect>
                ),
              )}
            </svg>
          </div>
          <p className="lineage-tag">
            FRAGMENT {selected?.id || "—"} ←{" "}
            {!selected || selected.parentId === null
              ? "ORIGIN"
              : "PARENT " + selected.parentId}{" "}
            / EPOCH {specimenRun?.epoch ?? "—"}
          </p>
          <button
            className="feedback-button"
            disabled={locked || !selected}
            onClick={feedBack}
          >
            ↻ FEED BACK INTO THE ORIGIN
          </button>
          <div className="specimen-actions">
            <button disabled={!selected} onClick={canonize}>
              ✳ CANONIZE
            </button>
            <button
              disabled={
                locked ||
                !selected ||
                selected.parentId === null ||
                (pinned && pinned.run !== run)
              }
              onClick={burn}
            >
              † BURN BRANCH
            </button>
          </div>
          <details
            className="fragment-trace"
            onToggle={(event) => {
              if (
                event.currentTarget.open &&
                automaticMode &&
                selected &&
                !pinned
              )
                setPinned({ node: selected, run });
            }}
          >
            <summary>EXAMINE THE GRAFT</summary>
            <SourceEvidence node={selected} />
            {selected?.composition && (
              <p className="probability-note">
                Conditional on {selected.composition.candidates} candidate
                sentences, this draw had probability{" "}
                {(100 * selected.composition.probability).toFixed(2)}%.
                Surprisal is −log₂(P); entropy measures uncertainty across this
                shortlist. Neither measures truth or literary depth. Lexical
                fit: {(100 * selected.composition.fit).toFixed(1)}%.
                Temperature: {selected.composition.temperature.toFixed(2)}.
                {selected.composition.version === MEMORY_COMPOSER && (
                  <>
                    {" "}
                    {selected.composition.memoryAvoided} recent source choices
                    were set aside.
                    {selected.composition.memoryRevisit
                      ? " This shortlist had no unremembered alternative, so a source returned."
                      : " The selected source was outside its parent's recent memory."}
                  </>
                )}
              </p>
            )}
            <p>
              <b>Inherited:</b>{" "}
              {selected?.inheritedFragment ||
                "The origin has no inherited graft."}
            </p>
          </details>
          <button
            className="export-organism"
            disabled={!nodes.length}
            onClick={exportTree}
          >
            EXPORT THE ORGANISM ↗
          </button>
        </div>
      </div>
      <FlowChamber
        engines={engines}
        ready={ready}
        controller={controller}
        automaticEntry={automaticEntry}
        settings={{
          root,
          branches,
          depth,
          mutation: mutation / 100,
          seed: Number(seed) >>> 0,
          epoch,
          composer,
          ...(isContinuityComposer(composer) && engines.current
            ? replayContext || {
                motif: chooseMotif(root),
                corpusVersions: corpusVersions(engines.current.sprawl),
                ...(composer === MEMORY_COMPOSER ? { memory: [] } : {}),
              }
            : {}),
        }}
        onActive={setFlowing}
        onStart={(settings) => {
          setPinned(null);
          setRun(settings);
          setSelectedId("0");
          publish([]);
          setNotice("The circuit is choosing its own heir.");
        }}
        onLayer={publish}
        onEpoch={(entry, tree) => {
          const inherited = inheritFlowSettings(entry);
          publish(tree);
          setSelectedId(entry.champion.id);
          setRoot(inherited.root);
          setEpoch(inherited.epoch);
          setSeed(inherited.seed);
          setMutation(Math.round(inherited.mutation * 100));
          if (isContinuityComposer(inherited.composer))
            setReplayContext(contextFor(inherited));
          setNotice(
            "Epoch " +
              entry.settings.epoch +
              " has entered the chronicle. Its heir becomes the origin.",
          );
        }}
        onRecall={(entry, follow) => {
          if (
            entry.settings.aspects.some((id) => !availableAspects.includes(id))
          )
            throw new Error(
              "This epoch uses aspects unavailable in the current corpus.",
            );
          const recalled = follow ? inheritFlowSettings(entry) : entry.settings;
          setComposer(recalled.composer || LEGACY_COMPOSER);
          setReplayContext(
            isContinuityComposer(recalled.composer)
              ? contextFor(recalled)
              : null,
          );
          setPinned(null);
          store.setSelectedSpirits(recalled.aspects);
          setRoot(normalizeRoot(recalled.root));
          setBranches(recalled.branches);
          setDepth(recalled.depth);
          setMutation(Math.round(recalled.mutation * 100));
          setSeed(recalled.seed);
          setEpoch(recalled.epoch);
          publish([]);
          setRun(null);
          setSelectedId("0");
          setNotice(
            follow
              ? "A fossil has become the new origin."
              : "The archived origin and settings are restored. Open the circuit to replay.",
          );
        }}
      />
      <div id="reading" className="reading-notes">
        <div>
          <span>READING / N. LAND</span>
          <h3>
            The machine is
            <br />
            an operation.
          </h3>
          <p>
            Design notes from the bundled <i>Fanged Noumena</i> corpus.
            Interpretations, not quotations.
          </p>
        </div>
        <article>
          <span>01 / FEEDBACK</span>
          <p>Let the result rewrite the conditions that produced it.</p>
          <small>A selected descendant can become the next origin.</small>
        </article>
        <article>
          <span>02 / ESCALATION</span>
          <p>More volume is repetition. New relations are mutation.</p>
          <small>
            Inheritance and foreign fragments collide across generations.
          </small>
        </article>
        <article>
          <span>03 / THE OUTSIDE</span>
          <p>
            The system discovers itself by admitting what it cannot contain.
          </p>
          <small>
            Rebind the aspects. Reopen the circuit. Change its vocabulary.
          </small>
        </article>
      </div>
    </section>
  );
}
