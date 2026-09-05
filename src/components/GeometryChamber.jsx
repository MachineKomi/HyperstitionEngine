import React, { useState } from "react";
import useEntropyStore from "../store/entropyStore";
import { sourceStatistics, UNITS } from "../engine/observer";

const point = (i, n, radius) => [180 + radius * Math.cos(i * Math.PI * 2 / n - Math.PI / 2),
  180 + radius * Math.sin(i * Math.PI * 2 / n - Math.PI / 2)];
const percent = (n) => `${(100 * n).toFixed(1)}%`;
const line = (history, key) => history.map((sample, i) => `${8 + i * 344 / 47},${90 - sample[key] * 76}`).join(" ");

function GeometryChamber() {
  const observer = useEntropyStore((state) => state.machineObserver);
  const epochs = useEntropyStore((state) => state.machineEpochs);
  const [selected, setSelected] = useState(0);
  const stats = sourceStatistics(epochs);
  const mae = observer.samples ? observer.errorSum / observer.samples : null;
  const baseline = observer.samples ? observer.baselineErrorSum / observer.samples : null;
  return (
    <section className="geometry-chamber" id="geometry" aria-labelledby="geometry-title">
      <header>
        <div><p className="eyebrow">04 / THE GEOMETRY OF CONSEQUENCE</p>
          <h2 id="geometry-title">A small mind. An open circuit.</h2></div>
        <span className="geometry-badge">24 NEURONS · 25 LEARNED WEIGHTS</span>
      </header>
      <div className="geometry-grid">
        <div className="reservoir-panel">
          <div className="geometry-caption"><b>THE RESERVOIR</b><span>EPOCH {observer.count.toString().padStart(3, "0")}</span></div>
          <svg className="reservoir-map" viewBox="0 0 360 360" role="img" aria-label={`Recurrent network. Selected neuron ${selected + 1}, activation ${observer.units[selected].toFixed(3)}. Gold positive, violet negative; highlighted edges feed the selected neuron.`}>
            <circle cx="180" cy="180" r="164" className="geometry-ring" />
            <circle cx="180" cy="180" r="110" className="geometry-ring" />
            <circle cx="180" cy="180" r="62" className="geometry-ring" />
            {observer.connections.flatMap((edges, target) => edges.map((edge) => {
              const a = point(edge.from, UNITS, 143), b = point(target, UNITS, 143);
              return <line key={`${target}-${edge.from}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
                stroke={edge.weight > 0 ? "#f1bd71" : "#b998ef"}
                opacity={target === selected ? 0.85 : 0.075} strokeWidth={target === selected ? 1.5 : 0.6} />;
            }))}
            {observer.inputs.slice(0, 16).map((value, i) => {
              const p = point(i, 16, 94);
              return <circle key={i} cx={p[0]} cy={p[1]} r={2 + Math.abs(value) * 7} fill={value < 0 ? "#b998ef" : "#f1bd71"} opacity="0.7" />;
            })}
            {observer.units.map((value, i) => {
              const p = point(i, UNITS, 143), label = point(i, UNITS, 163);
              return <g key={i}><circle cx={p[0]} cy={p[1]} r={4 + Math.abs(value) * 8}
                fill={value < 0 ? "#b998ef" : "#f1bd71"} stroke={i === selected ? "#fff2ce" : "#382e29"} strokeWidth="2" />
                <text x={label[0]} y={label[1] + 3} textAnchor="middle">{String(i + 1).padStart(2, "0")}</text></g>;
            })}
            <text x="180" y="171" textAnchor="middle" className="reservoir-symbol">Σ</text>
            <text x="180" y="194" textAnchor="middle">MEMORY → ERROR</text>
            <text x="180" y="207" textAnchor="middle">ERROR → WEIGHT</text>
          </svg>
          <label className="neuron-selector">INSPECT NEURON {String(selected + 1).padStart(2, "0")}
            <input aria-label="Inspect neuron" type="range" min="0" max="23" value={selected} onChange={(event) => setSelected(Number(event.target.value))} />
          </label>
          <div className="neuron-values"><span>ACTIVATION <b>{observer.units[selected].toFixed(3)}</b></span>
            <span>READOUT WEIGHT <b>{observer.weights[selected + 1].toFixed(3)}</b></span></div>
          <p className="geometry-note">A fixed recurrent circuit remembers surface patterns. Only its output weights learn. Highlighted chords are the four incoming connections of the selected neuron.</p>
        </div>
        <div className="geometry-instruments">
          <div className="forecast-panel">
            <div className="geometry-caption"><b>THE NEXT HEIR</b><span>LEXICAL NOVELTY / 0–1</span></div>
            <div className="forecast-number">{observer.forecast === null ? "—" : observer.forecast.toFixed(3)}<span>next-epoch estimate</span></div>
            <svg className="forecast-plot" viewBox="0 0 360 105" role="img" aria-label="Last 48 scored forecasts: gold forecast, ivory observed novelty, dashed violet moving-average baseline. Vertical scale zero to one, oldest at left.">
              {[14, 52, 90].map((y) => <line key={y} x1="8" x2="352" y1={y} y2={y} stroke="#443a32" />)}
              <polyline points={line(observer.history, "baseline")} fill="none" stroke="#b998ef" strokeDasharray="3 4" />
              <polyline points={line(observer.history, "forecast")} fill="none" stroke="#f1bd71" strokeWidth="2" />
              <polyline points={line(observer.history, "actual")} fill="none" stroke="#e9e4d3" strokeWidth="1.5" />
              <text x="8" y="103">OLDER</text><text x="300" y="103">48 EPOCHS</text>
            </svg>
            <p className="plot-key"><span>● forecast</span><span>○ observed</span><span>┄ baseline</span></p>
            <div className="geometry-errors"><span>NETWORK MAE<b>{mae === null ? "—" : mae.toFixed(3)}</b></span><span>BASELINE MAE<b>{baseline === null ? "—" : baseline.toFixed(3)}</b></span></div>
            <p className="geometry-note">{observer.samples} forecasts scored before learning. Lower error wins. Baseline: exponential moving average. This observer measures word variation; it does not judge meaning or steer the writing.</p>
          </div>
          <div className="source-measures">
            <div className="geometry-caption"><b>NUMBERS OF RUIN</b><span>LAST {epochs.length} HEIRS / MAX 96</span></div>
            <div className="source-probabilities" aria-label="Winning source probabilities">
              {stats.shares.map(({ source, p, count }) => <div key={source} style={{ flex: count }} title={`${source}: ${count} heirs, ${percent(p)}`}><span>{source.replaceAll("_", " ")}</span></div>)}
              {!epochs.length && <span className="geometry-note">Waiting for the first inheritance.</span>}
            </div>
            <dl className="geometry-statistics">
              <div><dt>Source entropy <small>H = −Σ p log₂ p</small></dt><dd>{stats.entropy.toFixed(3)} <small>bits</small></dd></div>
              <div><dt>Effective voices <small>2ᴴ · equal-share equivalent</small></dt><dd>{stats.effective.toFixed(2)}</dd></div>
              <div><dt>Pruned population <small>1 − surviving / born</small></dt><dd>{percent(stats.removed)}</dd></div>
            </dl>
            <p className="geometry-note">{stats.born.toLocaleString()} nodes born. {stats.kept.toLocaleString()} survive. Source diversity is a distribution, not a measure of literary worth.</p>
          </div>
        </div>
      </div>
      <details className="geometry-method"><summary>Open the mathematics & the philosophical wager</summary>
        <p>Sixteen signed character-trigram bins and four numerical features enter 24 leaky tanh units. Each unit has four fixed recurrent connections. Twenty-five output weights learn by normalized least mean squares once per completed epoch. State and charts are bounded; no language model, network inference or training loop runs between epochs.</p>
        <p>The circuit is a design interpretation: Land’s feedback becomes a visible return path; Nietzsche’s distinction between origin and later use becomes a record of changing function. Neither philosophy proves a model correct. The forecast must meet the next observation.</p>
        <p><a href="https://arxiv.org/abs/2602.06326" target="_blank" rel="noreferrer">2026 research on online reservoir adaptation ↗</a> · <a href="https://www.gutenberg.org/files/52319/52319-h/52319-h.htm" target="_blank" rel="noreferrer">Nietzsche, Genealogy II §12 ↗</a></p>
      </details>
    </section>
  );
}

export default React.memo(GeometryChamber);
