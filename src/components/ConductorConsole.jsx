import React from "react";
import useEntropyStore from "../store/entropyStore";
import { GHOSTS } from "../engine/conductor";

const operations = [
  ["bind", "EVOKE"],
  ["charge", "CHARGE"],
  ["markov", "MARKOV"],
  ["grammar", "GRAMMAR"],
  ["invoke", "INVOKE"],
  ["multiply", "×50"],
  ["inoculate", "INOCULATE"],
  ["grow", "GROW"],
  ["prune", "SEVER"],
  ["inherit", "INHERIT"],
  ["rebirth", "REBIRTH"],
  ["read", "READ"],
];
const line = (rows, field, maximum) =>
  rows
    .map((r, i) => `${10 + (i * 580) / 23},${126 - (r[field] / maximum) * 106}`)
    .join(" ");
export default function ConductorConsole({ names }) {
  const {
    automaticMode,
    machineAction: action,
    machineActions: actions,
    machineEpochs: epochs,
    selectedSpirits,
    automaticOracle,
    automaticOracleProgress,
    clockPaused,
  } = useEntropyStore();
  const last = epochs.at(-1);
  const plotted = epochs.slice(-24);
  return (
    <section
      className="conductor-console"
      aria-label="Automatic conductor"
      data-held={clockPaused}
    >
      <header>
        <div>
          <p className="eyebrow">
            THE INVISIBLE HAND ACQUIRES A BODY / CONDUCTOR I
          </p>
          <h2>The instrument plays itself.</h2>
        </div>
        <span>
          {automaticMode
            ? clockPaused
              ? "Ⅱ HELD"
              : "◉ MACHINE AT THE CONTROLS"
            : "◎ HUMAN AT THE CONTROLS"}
        </span>
      </header>
      <div
        className="conductor-operations"
        role="group"
        aria-label="Automatic control activity"
      >
        {operations.map(([kind, label], i) => (
          <div
            key={kind}
            className={automaticMode && action?.kind === kind ? "actuated" : ""}
            aria-current={
              automaticMode && action?.kind === kind ? "step" : undefined
            }
          >
            <small>{String(i + 1).padStart(2, "0")}</small>
            <b>{label}</b>
            <i aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="conductor-body">
        <div className="ghost-switchboard">
          <div className="conductor-caption">
            <b>THE EVOKED GHOSTS</b>
            <span>{selectedSpirits.length} CIRCUITS CLOSED</span>
          </div>
          <div className="ghost-keys">
            {GHOSTS.map((id) => (
              <button
                key={id}
                disabled={automaticMode}
                aria-pressed={selectedSpirits.includes(id)}
                className={
                  automaticMode &&
                  action?.kind === "bind" &&
                  action.plan.aspects.includes(id)
                    ? "actuated"
                    : ""
                }
                onClick={() => useEntropyStore.getState().toggleSpirit(id)}
              >
                <i aria-hidden="true" />
                {names[id]}
              </button>
            ))}
          </div>
          <p>
            A seeded deck turns every three epochs. Every ghost enters the
            circuit; each binding changes the available language.
          </p>
          <div className="conductor-action" role="status">
            <b>
              {action
                ? `E${String(action.epoch).padStart(3, "0")} / ${action.kind.toUpperCase()}`
                : "AWAITING THE FIRST GESTURE"}
            </b>
            <p>
              {action?.detail ||
                "One seed begins an evolving chain of interventions."}
            </p>
          </div>
        </div>
        <div className="epoch-telemetry">
          <div className="conductor-caption">
            <b>THE SHAPE OF SURVIVAL</b>
            <span>LAST 24 EPOCHS / 96 IN LEDGER</span>
          </div>
          <svg
            className="heir-chart"
            viewBox="0 0 600 155"
            preserveAspectRatio="none"
            role="img"
            aria-label="Epoch chart: gold is lexical novelty, violet is lexical echo, both from zero to one hundred percent."
          >
            {[20, 73, 126].map((y) => (
              <line
                key={y}
                x1="10"
                x2="590"
                y1={y}
                y2={y}
                className="chart-grid"
              />
            ))}
            <polyline
              points={line(plotted, "novelty", 1)}
              className="novelty-line"
            />
            <polyline points={line(plotted, "echo", 1)} className="echo-line" />
            {plotted.map((e, i) => (
              <circle
                key={e.epoch}
                cx={10 + (i * 580) / 23}
                cy={126 - e.novelty * 106}
                r="2.5"
                className="heir-point"
              >
                <title>{`Epoch ${e.epoch}: heir ${e.heir}, ${names[e.source]}, novelty ${Math.round(e.novelty * 100)}%, echo ${Math.round(e.echo * 100)}%`}</title>
              </circle>
            ))}
            <text x="10" y="149">
              {plotted[0] ? `E${plotted[0].epoch}` : "ORIGIN"}
            </text>
            <text x="590" y="149" textAnchor="end">
              24 EPOCH WINDOW · 0–100%
            </text>
          </svg>
          <div className="chart-legend">
            <span>━ NOVELTY</span>
            <span>━ ECHO</span>
            <small>Word overlap, not a measure of meaning</small>
          </div>
          <svg
            className="population-chart"
            viewBox="0 0 600 80"
            preserveAspectRatio="none"
            role="img"
            aria-label="Population per epoch: violet bars show all generated nodes, gold bars show surviving nodes after pruning, up to 85."
          >
            {plotted.map((e, i) => (
              <g key={e.epoch}>
                <rect
                  x={10 + (i * 580) / 23}
                  y={65 - (e.population / 85) * 60}
                  width="4"
                  height={(e.population / 85) * 60}
                  className="population-born"
                />
                <rect
                  x={10 + (i * 580) / 23}
                  y={65 - (e.surviving / 85) * 60}
                  width="2"
                  height={(e.surviving / 85) * 60}
                  className="population-kept"
                />
                <title>{`Epoch ${e.epoch}: ${e.population} born, ${e.surviving} survive`}</title>
              </g>
            ))}
            <text x="10" y="78">
              BORN / SURVIVING · 0–85 NODES
            </text>
          </svg>
          <div className="conductor-meters">
            <div>
              <small>HEIR</small>
              <strong>{last ? `${last.epoch}:${last.heir}` : "—"}</strong>
            </div>
            <div>
              <small>SURVIVING / BORN</small>
              <strong>
                {last ? `${last.surviving} / ${last.population}` : "—"}
              </strong>
            </div>
            <div>
              <small>ENTROPY</small>
              <strong>{last?.entropy ?? "—"}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="conductor-bottom">
        <div className="oracle-monitor">
          <b>ORACLE / LIVE RITUAL OUTPUT {automaticOracleProgress}</b>
          <p>
            {automaticOracle ||
              "Markov and grammar transmissions will appear here. Every fourth epoch admits one into the next origin."}
          </p>
        </div>
        <ol className="actuation-log" aria-label="Recent machine actions">
          {actions
            .slice()
            .reverse()
            .map((a, i) => (
              <li key={`${a.epoch}-${a.kind}-${i}`}>
                <span>
                  E{a.epoch} / {a.kind.toUpperCase()}
                </span>
                {a.detail}
              </li>
            ))}
        </ol>
      </div>
      <details className="conductor-ledger">
        <summary>INSPECT EPOCH DATA / {epochs.length} RECORDS</summary>
        <div>
          <table>
            <thead>
              <tr>
                <th>Epoch</th>
                <th>Heir</th>
                <th>Ghost</th>
                <th>Born</th>
                <th>Surviving</th>
                <th>Novelty</th>
                <th>Echo</th>
              </tr>
            </thead>
            <tbody>
              {epochs
                .slice()
                .reverse()
                .map((e) => (
                  <tr key={e.epoch}>
                    <td>{e.epoch}</td>
                    <td>{e.heir}</td>
                    <td>{names[e.source]}</td>
                    <td>{e.population}</td>
                    <td>{e.surviving}</td>
                    <td>{Math.round(e.novelty * 100)}%</td>
                    <td>{Math.round(e.echo * 100)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
