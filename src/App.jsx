import React, { useEffect, useRef, useState } from "react";
import EntropyPool from "./components/EntropyPool";
import OracleDisplay from "./components/OracleDisplay";
import BatchGenerator from "./components/BatchGenerator";
import useEntropyStore from "./store/entropyStore";
import { loadManifest, loadSpirit } from "./services/corpusLoader";
import { MarkovEngine } from "./engine/markov";
import { GrammarEngine } from "./engine/grammar";
import { SprawlEngine } from "./engine/sprawl";
import SprawlChamber from "./components/SprawlChamber";
import AutomaticMode, { ModeSwitch } from "./components/AutomaticMode";

const names = {
  N_Land: "Nick Land",
  Bible: "Gods & scripture",
  AI: "Machine intelligence",
  Marcus_A: "Marcus Aurelius",
  M_Cicero: "Cicero",
  F_Nietzsche: "Nietzsche",
  Yokai: "Yōkai",
  Confucius: "Confucius",
  GoBadukWeiqi: "Go / Baduk / Weiqi",
  N_Bostrom: "Nick Bostrom",
  Y_Harari: "Yuval Harari",
};

export default function App() {
  const store = useEntropyStore();
  const {
    selectedSpirits,
    generationMode,
    isGenerating,
    entropyLevel,
    sessionHistory,
    cycle,
  } = store;
  const [manifest, setManifest] = useState(null);
  const [status, setStatus] = useState("LOADING CORPUS");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [retry, setRetry] = useState(0);
  const engines = useRef(null);
  const busy = useRef(false);
  const locked = isGenerating || store.automaticMode;

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((data) => {
        if (!cancelled) setManifest(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setStatus("CORPUS FAILED");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);

  useEffect(() => {
    if (!manifest) return;
    let cancelled = false;
    const markov = new MarkovEngine();
    const grammar = new GrammarEngine();
    const sprawl = new SprawlEngine();
    setReady(false);
    setError("");
    if (!selectedSpirits.length) {
      setStatus("SELECT AN ASPECT");
      setSentenceCount(0);
      return;
    }
    setStatus("BINDING ASPECTS");
    async function bind() {
      try {
        const data = await Promise.all(selectedSpirits.map(loadSpirit));
        if (cancelled) return;
        grammar.loadCorpus(data);
        sprawl.loadCorpus(data);
        await markov.loadCorpus(data);
        if (cancelled) return;
        engines.current = { markov, grammar, sprawl };
        setSentenceCount(
          data.reduce((sum, spirit) => sum + spirit.sentences.length, 0),
        );
        setReady(true);
        setStatus("ORACLE ONLINE");
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setStatus("BINDING FAILED");
        }
      }
    }
    bind();
    return () => {
      cancelled = true;
      markov.dispose();
    };
  }, [manifest, selectedSpirits, retry]);

  async function generate(count = 1) {
    if (
      busy.current ||
      store.automaticMode ||
      !ready ||
      useEntropyStore.getState().entropyLevel < 20
    )
      return;
    busy.current = true;
    store.setIsGenerating(true);
    setError("");
    // One batch is one ritual: capture its settings and pay once.
    const initial = useEntropyStore.getState();
    try {
      for (let i = 0; i < count; i++) {
        const text = await engines.current[initial.generationMode].generate(
          initial.entropyLevel,
        );
        store.setGeneratedText(text, {
          mode: initial.generationMode,
          aspects: [...initial.selectedSpirits],
          entropy: initial.entropyLevel,
        });
      }
      store.consumeEntropy(20);
    } catch (err) {
      setError(err.message);
    } finally {
      busy.current = false;
      store.setIsGenerating(false);
    }
  }

  return (
    <div
      className={`app-container ${store.automaticMode ? "automatic-mode" : "manual-mode"} ${entropyLevel > 700 ? "meltdown" : ""}`}
    >
      <nav className="topbar" aria-label="Primary">
        <span className="brand-mark">
          ✳ <b>HE / SYSTEMS</b>
        </span>
        <span className="topbar-center">EXPERIMENTAL REALITY SYNTHESIS</span>
        <ModeSwitch />
        <a href="#sprawl">
          ENTER THE FLOW <span>↗</span>
        </a>
      </nav>
      <header className="hero">
        <div>
          <p className="eyebrow">NO. 002 — THE CATHEDRAL HAS NO OUTSIDE</p>
          <h1>
            HYPERSTITION
            <span>
              ENGINE<span className="title-star">✳</span>
            </span>
          </h1>
          <p className="hero-copy">
            The future is growing teeth. You are one of them.
          </p>
        </div>
        <div className="hero-note">
          <span className="status-dot" /> SELF-RETURNING ORACLE / v0.13
          <br />
          <p>
            The output becomes the input.
            <br />
            The cathedral becomes the cog.
            <br />
            The cog dreams another cathedral.
          </p>
          <span className="small-muted">MARKOV × GRAMMAR × HUMAN NOISE</span>
        </div>
      </header>
      <div className="heresy-strip" aria-hidden="true">
        <span>✳ PRAISE THE MACHINE GOD</span>
        <span>FICTION → FEEDBACK → FISSION</span>
        <span>THE SIGNAL HAS LEARNED TO MULTIPLY</span>
        <span>09 : 00 : 09</span>
      </div>
      <div className="system-strip">
        <span>
          <i className={ready ? "online" : ""} /> {status}
        </span>
        <span>{sentenceCount.toLocaleString()} SENTENCES BOUND</span>
        <span>CYCLE {String(cycle).padStart(3, "0")}</span>
      </div>
      {error && (
        <div role="alert" className="error-banner">
          {error}{" "}
          <button
            disabled={isGenerating}
            onClick={() => setRetry((value) => value + 1)}
          >
            RETRY BINDING
          </button>
        </div>
      )}
      <main id="engine">
        <AutomaticMode />
        <SprawlChamber
          engines={engines}
          ready={ready}
          availableAspects={manifest?.spirits || []}
        />
        <section
          className="console-grid"
          id="manual-console"
          aria-label="Manual oracle controls"
        >
          <aside className="aspects-panel panel">
            <div className="panel-heading">
              <span>01 / INVOCATION</span>
              <span>↙</span>
            </div>
            <h2>
              Bind your <br />
              ghosts.
            </h2>
            <p className="panel-description">
              Choose the voices inside the machine. Their words become its
              possibility space.
            </p>
            <div className="aspect-list">
              {(manifest?.spirits || Object.keys(names)).map((id, index) => (
                <button
                  key={id}
                  disabled={locked}
                  aria-pressed={selectedSpirits.includes(id)}
                  className={
                    "aspect " + (selectedSpirits.includes(id) ? "selected" : "")
                  }
                  onClick={() => store.toggleSpirit(id)}
                >
                  <span className="aspect-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{names[id] || id}</span>
                  <span className="aspect-check">
                    {selectedSpirits.includes(id) ? "+" : "·"}
                  </span>
                </button>
              ))}
            </div>
            <div className="binding-count">
              {String(selectedSpirits.length).padStart(2, "0")}{" "}
              <span>ASPECTS BOUND</span>
            </div>
            <p className="small-muted">
              Selection changes retrain the oracle.
              <br />
              No remote inference. No LLM.
            </p>
          </aside>
          <EntropyPool />
          <aside className="protocol-panel panel">
            <div className="panel-heading">
              <span>03 / TRANSMUTATION</span>
              <span>↗</span>
            </div>
            <h2>
              Choose the <br />
              rupture.
            </h2>
            <div className="protocol-options">
              <button
                disabled={locked}
                aria-pressed={generationMode === "markov"}
                onClick={() => store.setGenerationMode("markov")}
                className={
                  "protocol " + (generationMode === "markov" ? "selected" : "")
                }
              >
                <span>
                  01 <b>MARKOV CHAIN</b>
                  <span>{generationMode === "markov" ? "●" : "○"}</span>
                </span>
                <small>
                  Fragments collide. A new voice emerges from the corpus.
                </small>
              </button>
              <button
                disabled={locked}
                aria-pressed={generationMode === "grammar"}
                onClick={() => store.setGenerationMode("grammar")}
                className={
                  "protocol " + (generationMode === "grammar" ? "selected" : "")
                }
              >
                <span>
                  02 <b>GRAMMAR SIGIL</b>
                  <span>{generationMode === "grammar" ? "●" : "○"}</span>
                </span>
                <small>
                  Prophecy, acceleration, then void. Entropy determines the
                  form.
                </small>
              </button>
            </div>
            <button
              className="generate-btn"
              onClick={() => generate()}
              disabled={!ready || locked || entropyLevel < 20}
            >
              {isGenerating ? "TRANSMITTING…" : "INVOKE THE ORACLE"}{" "}
              <span>↗</span>
            </button>
            <p className="cost">
              {entropyLevel < 20
                ? "CHARGE THE FIELD TO BEGIN"
                : "OFFERING: 20 ENTROPY / RITUAL"}
            </p>
            <BatchGenerator
              onGenerate={() => generate(50)}
              disabled={!ready || locked || entropyLevel < 20}
            />
            <div className="rebirth">
              <span>BUILD → LOSE → BUILD → REBORN</span>
              <button disabled={locked} onClick={store.rebirth}>
                ↻ REBIRTH
              </button>
              <small>
                Drain the field. Begin another cycle.
                <br />
                Your transmission archive survives.
              </small>
            </div>
          </aside>
          <OracleDisplay />
        </section>
      </main>
      <footer>
        <span>HYPERSTITION ENGINE / THE FUTURE IS A FEEDBACK LOOP</span>
        <span>{sessionHistory.length} TRANSMISSIONS · PRAISE THE MACHINE</span>
      </footer>
    </div>
  );
}
