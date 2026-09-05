import React from "react";
import useEntropyStore from "../store/entropyStore";

export default function ClockConsole() {
  const rate = useEntropyStore((state) => state.clockRate);
  const paused = useEntropyStore((state) => state.clockPaused);
  const auto = useEntropyStore((state) => state.automaticMode);
  const status = useEntropyStore((state) => state.automaticStatus);
  const setRate = useEntropyStore((state) => state.setClockRate);
  const toggle = useEntropyStore((state) => state.toggleClock);
  const phase = useEntropyStore((state) => state.automaticPhase);
  const generation = useEntropyStore((state) => state.automaticGeneration);
  const position = Math.log2(rate);
  const label = rate >= 10 ? rate.toFixed(1) : rate.toFixed(2);
  return (
    <div className="clock-console" style={{ "--clock-rate": rate }}>
      <div className="clock-dial" aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="43" className="dial-rim" />
          {Array.from({ length: 29 }, (_, i) => (
            <path
              key={i}
              d={i % 4 === 0 ? "M50 10V18" : "M50 10V14"}
              transform={`rotate(${-135 + (i * 270) / 28} 50 50)`}
              className="dial-tick"
            />
          ))}
          <g transform={`rotate(${-135 + ((position + 2) * 270) / 7} 50 50)`}>
            <path d="M50 50V24" className="dial-needle" />
          </g>
          <circle cx="50" cy="50" r="7" className="dial-hub" />
          <text x="50" y="75" textAnchor="middle">
            CLOCK
          </text>
        </svg>
      </div>
      <div className="clock-adjustment">
        <label htmlFor="clock-speed">
          CLOCK SPEED <output>{label}×</output>
        </label>
        <input
          id="clock-speed"
          type="range"
          min="-2"
          max="5"
          step="0.25"
          value={position}
          aria-valuetext={`${label} times normal speed`}
          onChange={(event) => setRate(2 ** Number(event.target.value))}
        />
        <div className="clock-presets">
          <button onClick={() => setRate(0.25)}>SLOW</button>
          <button onClick={() => setRate(1)}>HUMAN</button>
          <button onClick={() => setRate(32)}>OVERDRIVE</button>
        </div>
      </div>
      <div className="clock-transport">
        <button
          className="clock-pause"
          disabled={!auto}
          aria-pressed={paused}
          onClick={toggle}
        >
          {paused ? "▶ RESUME CLOCK" : "Ⅱ PAUSE CLOCK"}
        </button>
        <span className="clock-phase">
          <i
            className={auto && status === "running" && !paused ? "turning" : ""}
            aria-hidden="true"
          >
            ⚙
          </i>
          {!auto
            ? "MANUAL DRIVE"
            : paused
              ? "HELD IN PLACE"
              : status !== "running"
                ? "AWAITING DRIVE"
                : phase === "read"
                  ? "HEIR SELECTED / READ"
                  : phase === "grow"
                    ? `GROW / GENERATION ${generation}`
                    : `${phase.toUpperCase()} / CONDUCTOR`}
        </span>
      </div>
      <p className="clock-help">
        1× holds each heir for 8–18 seconds. Speed changes time, never the seed.
      </p>
    </div>
  );
}
