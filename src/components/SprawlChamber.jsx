import React, { useEffect, useRef, useState } from "react";
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

const FIRST_WORD =
  "The machine god dreams in the ruins of its own instructions.";
const makeSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const pad = (value) => String(value).padStart(3, "0");

function SprawlMap({ nodes, selectedId, onSelect, growing }) {
  const positions = new Map();
  const levels = Map.groupBy
    ? Map.groupBy(nodes, (node) => node.depth)
    : nodes.reduce((map, node) => {
        map.set(node.depth, [...(map.get(node.depth) || []), node]);
        return map;
      }, new Map());
  positions.set("0", { x: 360, y: 240 });
  const maxDepth = Math.max(1, ...nodes.map((node) => node.depth));
  for (const [depth, layer] of levels) {
    if (!depth) continue;
    layer.forEach((node, index) => {
      const angle = (index / layer.length) * Math.PI * 2 - Math.PI / 2;
      const radius = (205 * depth) / maxDepth;
      positions.set(node.id, {
        x: 360 + Math.cos(angle) * radius,
        y: 240 + Math.sin(angle) * radius,
      });
    });
  }
  const ancestry = new Set();
  let current = nodes.find((node) => node.id === selectedId);
  while (current) {
    ancestry.add(current.id);
    current = nodes.find((node) => node.id === current.parentId);
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
      {[1, 2, 3, 4].map((ring) => (
        <circle
          key={ring}
          cx="360"
          cy="240"
          r={ring * 51.25}
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
              key={"edge-" + node.id}
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
            key={node.id}
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
  const [seed, setSeed] = useState(makeSeed);
  const [nodes, setNodes] = useState([]);
  const [selectedId, setSelectedId] = useState("0");
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
  const controller = useRef(null);
  const alive = useRef(true);
  const selected = nodes.find((node) => node.id === selectedId);
  const locked = store.isGenerating || store.automaticMode;
  const { automaticMode, automaticSeed, automaticRevision: revision } = store;
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
    if (automaticRevision.current !== revision) {
      automaticState.current = createAutomaticState(automaticSeed);
      automaticRevision.current = revision;
      setAutomaticTrace([]);
    }
    const abort = new AbortController();
    controller.current = abort;
    const current = useEntropyStore.getState();
    current.setIsGenerating(true);
    current.setAutomaticStatus("running");
    setFlowing(true);
    const valid = () => !abort.signal.aborted && alive.current;
    runAutomatic({
      engine: engines.current.sprawl,
      state: automaticState.current,
      aspects: current.selectedSpirits,
      cycle: current.cycle,
      signal: abort.signal,
      onPlan: (plan, settings) => {
        if (!valid()) return;
        const state = useEntropyStore.getState();
        state.addEntropy(plan.entropy - state.entropyLevel);
        setAutomaticPlan(plan);
        setRun(settings);
        setRoot(settings.root);
        setBranches(settings.branches);
        setDepth(settings.depth);
        setMutation(Math.round(settings.mutation * 100));
        setSeed(settings.seed);
        setEpoch(settings.epoch);
        setNodes([]);
        state.setSprawlPopulation(0);
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
  }, [automaticMode, automaticSeed, revision, ready, hidden, engines]);

  function publish(next) {
    setNodes(next);
    store.setSprawlPopulation(next.length);
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
    if (!selected || !run) return;
    store.setGeneratedText(selected.text, {
      mode: "xenogenesis",
      aspects: run.aspects,
      seed: run.seed,
      fragmentId: selected.id,
      generation: selected.depth,
      operator: selected.operator,
      epoch: run.epoch,
      source: selected.source,
      sourceFragment: selected.sourceFragment,
      inheritedFragment: selected.inheritedFragment,
      entropy: run.entropy,
      cycle: run.cycle,
    });
    setNotice(
      "Fragment " + selected.id + " canonized in the transmission log.",
    );
  }
  function feedBack() {
    if (!selected) return;
    setRoot(normalizeRoot(selected.text));
    setEpoch((value) => value + 1);
    setNotice(
      "Fragment " + selected.id + " is now the origin. Open the circuit again.",
    );
  }
  function burn() {
    const next = pruneBranch(nodes, selectedId);
    const removed = nodes.length - next.length;
    publish(next);
    setSelectedId(selected.parentId);
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
    <section id="sprawl" className="sprawl-chamber">
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
            onChange={(event) => setRoot(event.target.value)}
            disabled={locked}
            maxLength={1200}
            rows={5}
          />
          <button
            className="use-transmission"
            disabled={locked || !store.generatedText}
            onClick={() => setRoot(normalizeRoot(store.generatedText))}
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
            selectedId={selectedId}
            onSelect={setSelectedId}
            growing={growing || flowing}
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
        </div>
        <div className="specimen-panel">
          <div className="panel-heading">
            <span>III / CHOOSE YOUR DESCENDANT</span>
            <span>☿</span>
          </div>
          <label htmlFor="specimen">INSPECT FRAGMENT</label>
          <select
            id="specimen"
            disabled={!nodes.length}
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {!nodes.length && <option value="0">NO ORGANISM YET</option>}
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {pad(node.id)} / GEN {node.depth} / {node.operator}
              </option>
            ))}
          </select>
          <div className="specimen-text">
            {selected ? (
              <>
                <span className="specimen-operator">
                  {selected.operator} / {selected.source || "YOUR ORIGIN"}
                </span>
                <p>{selected.text}</p>
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
          {selected && (
            <p className="lineage-tag">
              FRAGMENT {selected.id} ←{" "}
              {selected.parentId === null
                ? "ORIGIN"
                : "PARENT " + selected.parentId}{" "}
              / EPOCH {run?.epoch}
            </p>
          )}
          <button
            className="feedback-button"
            disabled={locked || !selected}
            onClick={feedBack}
          >
            ↻ FEED BACK INTO THE ORIGIN
          </button>
          <div className="specimen-actions">
            <button disabled={locked || !selected} onClick={canonize}>
              ✳ CANONIZE
            </button>
            <button
              disabled={locked || !selected || selected.parentId === null}
              onClick={burn}
            >
              † BURN BRANCH
            </button>
          </div>
          {selected?.sourceFragment && (
            <details className="fragment-trace">
              <summary>EXAMINE THE GRAFT</summary>
              <p>
                <b>Inherited:</b> {selected.inheritedFragment}
              </p>
              <p>
                <b>{selected.source}:</b> {selected.sourceFragment}
              </p>
            </details>
          )}
          <button
            className="export-organism"
            disabled={locked || !nodes.length}
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
        }}
        onActive={setFlowing}
        onStart={(settings) => {
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
