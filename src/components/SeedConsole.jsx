import React from "react";
import useEntropyStore from "../store/entropyStore";
import { SEED_DIALS, SEED_SWITCHES } from "../engine/seed.js";

export default function SeedConsole({ onGenerate, disabled }) {
  const controls = useEntropyStore(state => state.seedControls);
  const setControls = useEntropyStore(state => state.setSeedControls);
  const receipt = useEntropyStore(state => state.seedReceipt);
  const pending = receipt && [...SEED_DIALS, ...SEED_SWITCHES].some(key => controls[key] !== receipt.controls[key]);
  return (
    <div className="seed-console" role="group" aria-label="Seed foundry">
      <div className="seed-foundry-heading">
        <span className="eyebrow">SEED FOUNDRY / YOUR HAND IN THE CIRCUIT</span>
        <span className="seed-foundry-state">{pending ? "NEXT DRAW MODIFIED" : "READY TO DRAW"}</span>
      </div>
      <p className="seed-help">Turn the dials. Throw the switches. Fresh randomness meets your settings in the next seed. The current run stays intact until you restart.</p>
      <div className="seed-instruments">
        <div className="seed-dials">
          {SEED_DIALS.map((key, index) => (
            <label className="seed-dial" key={key} htmlFor={`seed-${key}`}>
              <span className="seed-dial-title">{key.toUpperCase()}</span>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="44" className="dial-rim" />
                {Array.from({ length: 25 }, (_, i) => <path key={i} d={i % 4 ? "M50 9V13" : "M50 9V18"} transform={`rotate(${-135 + i * 11.25} 50 50)`} className="dial-tick" />)}
                <circle cx="50" cy="50" r="30" className="seed-knob" />
                <g transform={`rotate(${-135 + controls[key] * 270 / 255} 50 50)`}>
                  <path d="M50 40V25" className="dial-needle" />
                </g>
                <text x="50" y="55" textAnchor="middle">{String(index + 1).padStart(2, "0")}</text>
              </svg>
              <input id={`seed-${key}`} type="range" min="0" max="255" step="1" value={controls[key]}
                aria-label={`Seed ${key}`} onChange={event => setControls({ ...controls, [key]: Number(event.target.value) })} />
              <output htmlFor={`seed-${key}`}>{String(controls[key]).padStart(3, "0")} / 255</output>
            </label>
          ))}
        </div>
        <div className="seed-draw-controls">
          <div className="seed-switches">
            {SEED_SWITCHES.map(key => <button type="button" role="switch" aria-checked={controls[key]} aria-label={`Seed ${key}`} key={key}
              onClick={() => setControls({ ...controls, [key]: !controls[key] })}>
              <span className="seed-switch-track" aria-hidden="true"><i /></span>
              <span>{key.toUpperCase()}</span><small>{controls[key] ? "ON" : "OFF"}</small>
            </button>)}
          </div>
          <button type="button" className="seed-generate" disabled={disabled} onClick={onGenerate}>
            <span aria-hidden="true">✳</span> NEW SEED & RESTART
          </button>
          <p className="seed-receipt" role="status">
            {receipt ? <>DRAW {receipt.word.toString(16).toUpperCase().padStart(8, "0")} → <strong>{receipt.seed}</strong></> : "EXACT SEED / MANUAL ENTRY"}
          </p>
        </div>
      </div>
      <p className="seed-help seed-footnote">All five controls mix the seed; their names describe the instrument, not writing parameters. Copy the origin seed to repeat its path.</p>
    </div>
  );
}
