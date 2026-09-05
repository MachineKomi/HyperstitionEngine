import React, { useState } from "react";
import useEntropyStore from "../store/entropyStore";

export function ModeSwitch() {
  const mode = useEntropyStore((state) => state.automaticMode);
  const setMode = useEntropyStore((state) => state.setAutomaticMode);
  const busy = useEntropyStore((state) => state.isGenerating);
  return (
    <div className="mode-switch" role="group" aria-label="Engine control mode">
      <button
        disabled={!mode && busy}
        aria-pressed={mode}
        onClick={() => setMode(true)}
      >
        AUTO <span aria-hidden="true">◉</span>
      </button>
      <button aria-pressed={!mode} onClick={() => setMode(false)}>
        MANUAL <span aria-hidden="true">◎</span>
      </button>
    </div>
  );
}

export default function AutomaticMode() {
  const {
    automaticMode,
    automaticSeed,
    automaticStatus,
    automaticError,
    restartAutomatic,
    isGenerating,
  } = useEntropyStore();
  const [draft, setDraft] = useState(String(automaticSeed));
  const state = !automaticMode ? "manual" : automaticStatus;
  return (
    <section
      className="automatic-panel"
      id="automatic"
      aria-label="Automatic engine"
    >
      <div className="automatic-heading">
        <div>
          <p className="eyebrow">A SEED. FIVE RULES. NO FINAL CHAMBER.</p>
          <h2>
            {automaticMode ? "Let the circuit dream." : "The circuit is yours."}
          </h2>
        </div>
        <span className="automatic-state" data-state={state} role="status">
          {state === "running"
            ? "◉ AUTO EXPLORING"
            : state === "paused"
              ? "◌ PAUSED / TAB HIDDEN"
              : state === "error"
                ? "■ AUTO STOPPED"
                : state === "manual"
                  ? "◎ MANUAL CONTROL"
                  : "◌ PREPARING THE FIRST EPOCH"}
        </span>
      </div>
      <p className="automatic-description">
        The engine charges its own field, grows a tree, chooses an heir, then
        feeds it back. The same seed and bound voices unfold the same path.
        Switch to Manual at any moment.
      </p>
      <form
        className="automatic-seed-form"
        aria-label="Set automatic exploration seed"
        onSubmit={(event) => {
          event.preventDefault();
          if (
            draft !== "" &&
            Number.isInteger(Number(draft)) &&
            Number(draft) >= 0 &&
            Number(draft) <= 4294967295
          )
            restartAutomatic(Number(draft));
        }}
      >
        <label htmlFor="automatic-seed">
          ORIGIN SEED <small>ACTIVE {automaticSeed}</small>
        </label>
        <input
          id="automatic-seed"
          type="number"
          inputMode="numeric"
          min="0"
          max="4294967295"
          step="1"
          required
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={!automaticMode && isGenerating}>
          RESTART FROM SEED ↻
        </button>
        <a href="#sprawl">WATCH IT UNFOLD ↓</a>
      </form>
      {automaticError && (
        <p className="error-banner" role="alert">
          {automaticError} Restart from a seed or switch to Manual.
        </p>
      )}
    </section>
  );
}
