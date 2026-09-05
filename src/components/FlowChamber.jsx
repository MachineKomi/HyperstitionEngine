import React, { useEffect, useRef, useState } from "react";
import useEntropyStore from "../store/entropyStore";
import { runFlow } from "../engine/flow";
import {
  CHRONICLE_LIMIT,
  CHRONICLE_KEY,
  chronicleDocument,
  mergeChronicle,
  readChronicle,
  validateChronicle,
} from "../services/chronicle";

const pressures = [
  {
    id: "novelty",
    title: "THE OUTSIDE",
    description: "Favour words absent from the origin.",
    glyph: "↗",
  },
  {
    id: "echo",
    title: "ETERNAL RETURN",
    description: "Keep the strongest echo of the origin.",
    glyph: "↻",
  },
  {
    id: "chance",
    title: "BLIND PROVIDENCE",
    description: "Let the replay seed choose the heir.",
    glyph: "✳",
  },
];
const percent = (value) => Math.round(value * 100) + "%";

export default function FlowChamber({
  engines,
  ready,
  settings,
  controller,
  onStart,
  onLayer,
  onEpoch,
  onActive,
  onRecall,
  automaticEntry,
}) {
  const store = useEntropyStore();
  const locked = store.isGenerating || store.automaticMode;
  const [pressure, setPressure] = useState("novelty");
  const [epochs, setEpochs] = useState(9);
  const [active, setActive] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [notice, setNotice] = useState(
    "One descendant becomes the next origin. Again. Again.",
  );
  const [boot] = useState(() => {
    try {
      return readChronicle(window.localStorage);
    } catch {
      return {
        entries: [],
        error: "Browser memory unavailable. Export your chronicle to keep it.",
      };
    }
  });
  const [entries, setEntries] = useState(boot.entries);
  const [saveStatus, setSaveStatus] = useState(
    boot.error ||
      (boot.entries.length
        ? "CHRONICLE RECOVERED FROM BROWSER MEMORY"
        : "COMPLETED EPOCHS WILL BE SAVED IN THIS BROWSER"),
  );
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const fileInput = useRef(null);
  const alive = useRef(true);
  const ownController = useRef(null);
  useEffect(() => {
    if (!automaticEntry) return;
    setEntries((previous) => mergeChronicle(previous, [automaticEntry]));
    setDirty(true);
  }, [automaticEntry]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (ownController.current) {
        ownController.current.abort();
        useEntropyStore.getState().setIsGenerating(false);
      }
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    try {
      window.localStorage.setItem(
        CHRONICLE_KEY,
        JSON.stringify(chronicleDocument(entries)),
      );
      setSaveStatus(
        "CHRONICLE SAVED IN THIS BROWSER / LAST " + CHRONICLE_LIMIT + " EPOCHS",
      );
    } catch {
      setSaveStatus(
        "BROWSER MEMORY FULL OR UNAVAILABLE / EXPORT TO KEEP YOUR CHRONICLE",
      );
    }
  }, [entries, dirty]);

  async function begin() {
    const current = useEntropyStore.getState();
    if (
      !ready ||
      current.isGenerating ||
      current.automaticMode ||
      current.entropyLevel < 20 ||
      !settings.root.trim()
    )
      return;
    const abort = new AbortController();
    controller.current = abort;
    ownController.current = abort;
    setActive(true);
    onActive(true);
    store.setIsGenerating(true);
    setCompleted(0);
    setNotice("The machine has begun choosing its ancestors.");
    try {
      const result = await runFlow({
        engine: engines.current.sprawl,
        settings: {
          ...settings,
          cycle: current.cycle,
          aspects: [...current.selectedSpirits],
        },
        pressure,
        epochs,
        signal: abort.signal,
        takeOffering: () => {
          const state = useEntropyStore.getState();
          if (state.entropyLevel < 20) return false;
          state.consumeEntropy(20);
          return state.entropyLevel;
        },
        onStart: (run) => {
          if (alive.current) onStart(run);
        },
        onLayer: (nodes) => {
          if (alive.current) onLayer(nodes);
        },
        onEpoch: (entry, nodes) => {
          if (!alive.current) return;
          const saved = {
            ...entry,
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
          };
          setEntries((previous) => mergeChronicle(previous, [saved]));
          setDirty(true);
          setCompleted((value) => value + 1);
          setNotice(
            "Epoch " +
              entry.settings.epoch +
              ": fragment " +
              entry.champion.id +
              " inherits the circuit. " +
              percent(entry.champion.novelty) +
              " word novelty.",
          );
          onEpoch(entry, nodes);
        },
      });
      if (alive.current)
        setNotice(
          result.reason === "depleted"
            ? "The offering is spent. " +
                result.completed +
                " epochs survived. Charge the field to continue."
            : result.completed +
                " epochs completed. Their descendants are waiting in the chronicle.",
        );
    } catch (error) {
      if (alive.current)
        setNotice(
          error.name === "AbortError"
            ? "Possession severed. Completed epochs remain in the chronicle."
            : error.message,
        );
    } finally {
      if (alive.current) {
        setActive(false);
        onActive(false);
        store.setIsGenerating(false);
      }
      if (controller.current === abort) controller.current = null;
      ownController.current = null;
    }
  }

  function exportChronicle() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(chronicleDocument(entries), null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hyperstition-chronicle.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "The chronicle has left the machine. Import it to recover these epochs.",
    );
  }
  async function importChronicle(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || locked) return;
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Chronicles must be smaller than 2 MB.");
      const incoming = validateChronicle(JSON.parse(await file.text()));
      if (!alive.current) return;
      setEntries((previous) => mergeChronicle(previous, incoming));
      setDirty(true);
      setNotice(
        incoming.length +
          " epochs recovered. Duplicate records are kept only once.",
      );
    } catch (error) {
      if (alive.current) setNotice("Import failed: " + error.message);
    }
  }
  function recall(entry, follow) {
    try {
      onRecall(entry, follow);
      setPressure(entry.pressure);
      setNotice(
        follow
          ? "The heir is now the origin. Begin another possession."
          : "Epoch settings restored. Open the circuit to replay its tree.",
      );
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <section
      className={"flow-chamber " + (active ? "flow-active" : "")}
      id="flow"
    >
      <div className="flow-heading">
        <div>
          <p className="eyebrow">
            06 / AUTOPOIESIS — THE OUTPUT INHERITS THE INPUT
          </p>
          <h2>
            THE CIRCUIT<span>LEARNS TO RETURN.</span>
          </h2>
        </div>
        <div className="flow-beacon">
          <span>{active ? "◉" : "◎"}</span>
          <small>
            {store.automaticMode
              ? "AUTOMATIC CHRONICLE"
              : active
                ? "POSSESSION IN PROGRESS"
                : "AWAITING POSSESSION"}
          </small>
        </div>
      </div>
      <p className="flow-intro">
        Grow a world. Choose its heir. Let the heir become the next world.
        <br />
        Every epoch leaves a fossil. Nothing completed has to disappear.
      </p>
      <div className="pressure-grid" aria-label="Selection pressure">
        {pressures.map((item) => (
          <button
            key={item.id}
            disabled={locked}
            aria-pressed={pressure === item.id}
            className={
              "pressure-card " + (pressure === item.id ? "chosen" : "")
            }
            onClick={() => setPressure(item.id)}
          >
            <span className="pressure-glyph">{item.glyph}</span>
            <span>
              <b>{item.title}</b>
              <small>{item.description}</small>
            </span>
            <span>{pressure === item.id ? "●" : "○"}</span>
          </button>
        ))}
      </div>
      <div className="flow-console">
        <div className="flow-budget">
          <label htmlFor="flow-epochs">EPOCH HORIZON</label>
          <select
            id="flow-epochs"
            value={epochs}
            disabled={locked}
            onChange={(event) => {
              setEpochs(Number(event.target.value));
              setCompleted(0);
            }}
          >
            <option value="3">III / 3 EPOCHS</option>
            <option value="9">IX / 9 EPOCHS</option>
            <option value="27">XXVII / 27 EPOCHS</option>
          </select>
          <small>20 ENTROPY EACH · +3 MUTATION POINTS PER EPOCH</small>
        </div>
        <div className="flow-offering">
          <span>AVAILABLE OFFERING</span>
          <strong>
            {Math.floor(store.entropyLevel / 20)}
            <small> / {epochs} EPOCHS</small>
          </strong>
          <p>
            {store.entropyLevel < epochs * 20
              ? "The flow pauses when its offering runs out."
              : "Enough entropy for the whole horizon."}
          </p>
          <button onClick={store.signCog}>SIGN THE COG +137 ↟</button>
        </div>
        <div className="flow-actions">
          <button
            className="possession-button"
            disabled={
              locked ||
              !ready ||
              store.entropyLevel < 20 ||
              !settings.root.trim()
            }
            onClick={begin}
          >
            BEGIN POSSESSION <span>↗</span>
          </button>
          <button
            disabled={!active}
            className="end-possession"
            onClick={() => ownController.current?.abort()}
          >
            ■ END POSSESSION
          </button>
        </div>
      </div>
      <div className="flow-progress">
        <div style={{ width: (completed / epochs) * 100 + "%" }} />
      </div>
      <div className="flow-status">
        <span role="status">{notice}</span>
        <span>
          {completed} / {epochs} EPOCHS
        </span>
      </div>
      <div className="chronicle-heading">
        <div>
          <span>THE FOSSIL RECORD</span>
          <h3>{String(entries.length).padStart(3, "0")} surviving epochs.</h3>
        </div>
        <div className="chronicle-actions">
          <button disabled={locked} onClick={() => fileInput.current?.click()}>
            IMPORT CHRONICLE ↙
          </button>
          <button disabled={!entries.length} onClick={exportChronicle}>
            EXPORT CHRONICLE ↗
          </button>
          <input
            ref={fileInput}
            className="chronicle-file"
            type="file"
            accept=".json,application/json"
            aria-label="Import chronicle file"
            onChange={importChronicle}
          />
        </div>
      </div>
      {!entries.length ? (
        <div className="empty-chronicle">
          <span>∴</span>
          <p>
            The future has no fossils yet.
            <small>
              Completed epochs are remembered here, including their origin,
              heir, and replay seed.
            </small>
          </p>
        </div>
      ) : (
        <div className="chronicle-list">
          {entries
            .slice(-visibleCount)
            .reverse()
            .map((entry) => (
              <article className="epoch-fossil" key={entry.id}>
                <div className="fossil-index">
                  <span>EPOCH</span>
                  <strong>
                    {String(entry.settings.epoch).padStart(3, "0")}
                  </strong>
                  <small>{entry.pressure.toUpperCase()}</small>
                </div>
                <div className="fossil-body">
                  <div className="fossil-meta">
                    <span>
                      {entry.champion.operator} / {entry.champion.source}
                    </span>
                    <span>
                      {entry.population} FRAGMENTS ·{" "}
                      {percent(entry.champion.novelty)} NOVEL WORDS
                    </span>
                    <time dateTime={entry.time}>
                      {new Date(entry.time).toLocaleTimeString()}
                    </time>
                  </div>
                  <p>{entry.champion.text}</p>
                  <button
                    className="fossil-detail-toggle"
                    aria-expanded={expanded === entry.id}
                    onClick={() =>
                      setExpanded(expanded === entry.id ? null : entry.id)
                    }
                  >
                    {expanded === entry.id ? "− CLOSE" : "+ TRACE THE ANCESTOR"}
                  </button>
                  {expanded === entry.id && (
                    <div className="fossil-detail">
                      <p>
                        <b>ORIGIN</b> {entry.settings.root}
                      </p>
                      <span>
                        SEED {entry.settings.seed} / {entry.settings.branches}{" "}
                        BRANCHES / {entry.settings.depth} GENERATIONS /{" "}
                        {percent(entry.settings.mutation)} FOREIGN MATTER
                      </span>
                      <p>
                        <b>ASPECTS</b> {entry.settings.aspects.join(" + ")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="fossil-actions">
                  <button disabled={locked} onClick={() => recall(entry, true)}>
                    FOLLOW HEIR ↗
                  </button>
                  <button
                    disabled={locked}
                    onClick={() => recall(entry, false)}
                  >
                    REPLAY EPOCH ↻
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}
      <div className="chronicle-pagination">
        <span>
          {Math.min(visibleCount, entries.length)} / {entries.length} FOSSILS IN
          VIEW
        </span>
        <button
          disabled={visibleCount >= entries.length}
          onClick={() => setVisibleCount((count) => count + 12)}
        >
          EXHUME 12 OLDER EPOCHS ↓
        </button>
      </div>
      <div className="chronicle-storage" role="status">
        {saveStatus}
      </div>
    </section>
  );
}
