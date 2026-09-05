import React, { useEffect, useMemo, useRef, useState } from "react";
import useEntropyStore from "../store/entropyStore";
import { ATLAS_AXES, atlasGraph, epochVector, nearestProjected, projectVector } from "../engine/atlas";

const HOME = { yaw: -0.6, pitch: 0.35, fold: 0.65, zoom: 1, panX: 0, panY: 0 };
const identity = (record) => `${record.originSeed}:${record.seed}:${record.epoch}`;

function PhaseAtlas() {
  const epochs = useEntropyStore((state) => state.machineEpochs);
  const paused = useEntropyStore((state) => state.clockPaused);
  const automatic = useEntropyStore((state) => state.automaticMode);
  const [dimensions, setDimensions] = useState(3);
  const [camera, setCamera] = useState(HOME);
  const [orbit, setOrbit] = useState(true);
  const [neighbors, setNeighbors] = useState(true);
  const [pan, setPan] = useState(false);
  const [pinned, setPinned] = useState(null);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const canvas = useRef(null), stage = useRef(null), projected = useRef([]), drag = useRef(null);
  const motion = useRef(0), draw = useRef(null);
  const graph = useMemo(() => atlasGraph(epochs, dimensions), [epochs, dimensions]);
  const selected = pinned || epochs.at(-1);
  const selectedKey = selected && identity(selected);
  const rotating = orbit && !reduced && !hidden && visible && automatic && !paused && dimensions > 2;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(stage.current);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const onMedia = () => setReduced(media.matches), onVisibility = () => setHidden(document.hidden);
    media.addEventListener("change", onMedia);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer.disconnect(); media.removeEventListener("change", onMedia); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  useEffect(() => {
    const element = canvas.current, context = element.getContext("2d");
    const paint = () => {
      if (!visible || hidden) return;
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height || !context) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (element.width !== Math.round(width * dpr) || element.height !== Math.round(height * dpr)) {
        element.width = Math.round(width * dpr); element.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const radius = Math.min(width, height) * 0.42 * camera.zoom;
      const view = { ...camera, yaw: camera.yaw + motion.current };
      const project = (vector) => {
        const p = projectVector(vector, dimensions, view);
        return [width / 2 + p[0] * radius + camera.panX * Math.min(width, height), height / 2 + p[1] * radius + camera.panY * Math.min(width, height), p[2]];
      };
      const stroke = (a, b, color, lineWidth = 1) => {
        context.beginPath(); context.moveTo(a[0], a[1]); context.lineTo(b[0], b[1]); context.strokeStyle = color; context.lineWidth = lineWidth; context.stroke();
      };
      context.strokeStyle = "#55452c"; context.lineWidth = 0.6;
      for (const r of [0.72, 1.04]) { context.beginPath(); context.arc(width / 2, height / 2, Math.min(width, height) * 0.42 * r, 0, Math.PI * 2); context.stroke(); }
      for (let i = 0; i < 60; i++) {
        const angle = i * Math.PI / 30, r = Math.min(width, height) * 0.42 * 1.04;
        stroke([width / 2 + Math.cos(angle) * r, height / 2 + Math.sin(angle) * r],
          [width / 2 + Math.cos(angle) * (r + (i % 5 ? 3 : 8)), height / 2 + Math.sin(angle) * (r + (i % 5 ? 3 : 8))], "#7e633b");
      }
      const vertices = graph.cage.vertices.map(project);
      graph.cage.edges.forEach(([a, b]) => stroke(vertices[a], vertices[b], "#9f805133", 0.8));
      const origin = project(Array(dimensions).fill(0));
      ATLAS_AXES.slice(0, dimensions).forEach((label, axis) => {
        const v = Array(dimensions).fill(0); v[axis] = 1.65;
        const endpoint = project(v); stroke(origin, endpoint, axis < 3 ? "#9f8051" : "#85729e", 0.8);
        context.fillStyle = axis < 3 ? "#d6bb8a" : "#c4acd9";
        context.font = "10px monospace"; context.fillText(label.toUpperCase(), Math.max(4, Math.min(width - 72, endpoint[0] + 5)), Math.max(12, Math.min(height - 8, endpoint[1])));
      });
      const points = graph.nodes.map((node) => project(node.vector));
      projected.current = points;
      if (neighbors) {
        context.setLineDash([2, 5]);
        graph.neighbors.forEach(([a, b]) => stroke(points[a], points[b], "#ba9cea55", 0.9));
        context.setLineDash([]);
      }
      graph.succession.forEach(([a, b]) => stroke(points[a], points[b], "#f1bd7199", 1.4));
      points.map((p, i) => ({ p, i })).sort((a, b) => a.p[2] - b.p[2]).forEach(({ p, i }) => {
        const active = identity(graph.nodes[i].record) === selectedKey;
        const r = active ? 7 : 3.5 + (p[2] + 1) * 1.4;
        if (active) {
          context.beginPath(); context.arc(p[0], p[1], 13, 0, Math.PI * 2); context.strokeStyle = "#ffe5aa"; context.lineWidth = 1; context.stroke();
          context.font = "11px monospace"; context.fillStyle = "#ffe5aa"; context.fillText(`E${graph.nodes[i].record.epoch}`, p[0] + 16, p[1] - 10);
        }
        context.beginPath(); context.arc(p[0], p[1], r, 0, Math.PI * 2);
        context.fillStyle = active ? "#fff0c4" : graph.nodes[i].record.protocol === "grammar" ? "#ba9cea" : "#efb458";
        context.fill(); context.strokeStyle = "#201a13"; context.lineWidth = 1; context.stroke();
      });
    };
    draw.current = paint;
    const resize = new ResizeObserver(paint); resize.observe(element); paint();
    return () => { resize.disconnect(); draw.current = null; };
  }, [graph, dimensions, camera, neighbors, selectedKey, visible, hidden]);

  useEffect(() => {
    if (!rotating) return;
    let frame, last = 0;
    const animate = (time) => {
      if (!last) last = time;
      if (time - last >= 1000 / 30) {
        motion.current += Math.min(time - last, 80) * 0.00012;
        last = time; draw.current?.();
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [rotating]);

  function adjust(key, value) {
    setOrbit(false);
    setCamera((old) => ({ ...old, [key]: value }));
  }
  function pointerDown(event) {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 5) return;
    start.moved = true; start.x = event.clientX; start.y = event.clientY;
    setOrbit(false);
    if (pan || event.shiftKey) {
      const rect = canvas.current.getBoundingClientRect(), size = Math.min(rect.width, rect.height);
      setCamera((old) => ({ ...old, panX: Math.max(-1.5, Math.min(1.5, old.panX + dx / size)), panY: Math.max(-1.5, Math.min(1.5, old.panY + dy / size)) }));
    } else setCamera((old) => ({ ...old, yaw: old.yaw + dx * 0.008, pitch: Math.max(-1.5, Math.min(1.5, old.pitch + dy * 0.008)) }));
  }
  function pointerUp(event) {
    if (drag.current && !drag.current.moved) {
      const rect = canvas.current.getBoundingClientRect();
      const index = nearestProjected(projected.current, event.clientX - rect.left, event.clientY - rect.top);
      if (index >= 0) { setPinned(graph.nodes[index].record); setOrbit(false); }
    }
    drag.current = null;
  }
  function navigate(delta) {
    const index = graph.nodes.findIndex((node) => identity(node.record) === selectedKey);
    const next = Math.max(0, Math.min(graph.nodes.length - 1, (index < 0 ? graph.nodes.length - 1 : index) + delta));
    if (graph.nodes[next]) { setPinned(graph.nodes[next].record); setOrbit(false); }
  }
  function frameHistory() {
    if (!graph.nodes.length) return;
    const view = { ...camera, yaw: camera.yaw + motion.current };
    const points = graph.nodes.map((node) => projectVector(node.vector, dimensions, view));
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const zoom = Math.max(0.6, Math.min(2.5, 1.4 / Math.max(0.1, maxX - minX, maxY - minY)));
    motion.current = 0; setOrbit(false);
    setCamera({ ...view, zoom, panX: -(minX + maxX) * 0.21 * zoom, panY: -(minY + maxY) * 0.21 * zoom });
  }
  const values = selected ? epochVector(selected).map((n) => (n + 1) / 2) : [];
  return <div className="phase-atlas" ref={stage}>
    <div className="atlas-heading"><div><p className="eyebrow">ATLAS / A HISTORY HAS MORE THAN ONE SHADOW</p><h3>The manifold of returns.</h3></div>
      <div className="atlas-dimensions" role="group" aria-label="Atlas dimensions">{[2, 3, 6].map((n) => <button key={n} aria-pressed={dimensions === n} onClick={() => { setDimensions(n); motion.current = 0; }}>{n === 6 ? "3 + 3D" : `${n}D`}</button>)}</div>
    </div>
    <div className="atlas-layout">
      <div className="atlas-view">
        <div className="atlas-coordinate-label"><span>{dimensions === 6 ? "6D → 3D → SCREEN" : `${dimensions}D STATE SPACE`}</span><span>{graph.nodes.length} / 96 HEIRS</span></div>
        <canvas ref={canvas} className="atlas-canvas" tabIndex="0" aria-label="Epoch graph. Drag to orbit, or use Pan view to move the graph. Vertical touch swipes scroll the page. Arrow keys rotate; plus and minus zoom. Use the heir selector below to inspect every node."
          onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
          onKeyDown={(event) => {
            const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            if (event.key.includes("Left") || event.key.includes("Right")) adjust("yaw", camera.yaw + (event.key === "ArrowLeft" ? -0.15 : 0.15));
            else if (event.key.includes("Up") || event.key.includes("Down")) adjust("pitch", Math.max(-1.5, Math.min(1.5, camera.pitch + (event.key === "ArrowUp" ? -0.15 : 0.15))));
            else adjust("zoom", Math.max(0.6, Math.min(2.5, camera.zoom + (event.key === "-" ? -0.1 : 0.1))));
          }}>Every epoch is also available in the labeled heir selector.</canvas>
        {!epochs.length && <p className="atlas-empty">The coordinate cage waits.<br />The first heir will leave a point.</p>}
        <div className="atlas-legend"><span>━━ succession</span><span>┄┄ nearest states</span><span>● Markov · <i>● grammar</i></span></div>
        <div className="atlas-tools">
          <button aria-pressed={orbit} onClick={() => setOrbit(!orbit)}>{orbit ? "ORBIT ON" : "ORBIT OFF"}</button>
          <button aria-pressed={pan} onClick={() => { setPan(!pan); setOrbit(false); }}>PAN VIEW</button>
          <button aria-pressed={neighbors} onClick={() => setNeighbors(!neighbors)}>NEIGHBOR LINKS</button>
          <button disabled={!epochs.length} onClick={frameHistory}>FRAME HISTORY</button>
          <button onClick={() => { motion.current = 0; setCamera(HOME); setOrbit(false); setPan(false); }}>RESET VIEW</button>
        </div>
        <div className="atlas-sliders">
          <label>ZOOM <input aria-label="Atlas zoom" type="range" min="0.6" max="2.5" step="0.01" value={camera.zoom} onChange={(e) => adjust("zoom", +e.target.value)} /></label>
          <label>ELEVATION <input aria-label="Atlas elevation" disabled={dimensions === 2} type="range" min="-1.5" max="1.5" step="0.01" value={camera.pitch} onChange={(e) => adjust("pitch", +e.target.value)} /></label>
          <label>DIMENSION FOLD <input aria-label="Dimension fold" disabled={dimensions !== 6} type="range" min="0" max="6.28" step="0.01" value={camera.fold} onChange={(e) => adjust("fold", +e.target.value)} /></label>
        </div>
        <p className="atlas-motion-note">{rotating ? "Slow orbit · display motion only." : reduced ? "Reduced motion · use the camera controls." : "Camera held · the engine keeps its own clock."} {pan ? "Drag to pan." : "Drag to orbit; Shift-drag to pan."} Vertical touch swipes remain page scrolling.</p>
      </div>
      <aside className="atlas-inspector" aria-label="Atlas heir inspector">
        <div className="geometry-caption"><b>{pinned ? "HELD FOR INSPECTION" : "FOLLOWING THE LATEST"}</b><span>{selected ? `E${selected.epoch}` : "—"}</span></div>
        <label className="atlas-heir-label">CHOOSE AN HEIR
          <select aria-label="Atlas heir" value={selectedKey || ""} disabled={!epochs.length} onChange={(e) => { const node = graph.nodes.find((n) => identity(n.record) === e.target.value); if (node) { setPinned(node.record); setOrbit(false); } }}>
            {!selected && <option value="">Waiting for inheritance</option>}
            {pinned && !graph.nodes.some((node) => identity(node.record) === selectedKey) && <option value={selectedKey}>Held E{pinned.epoch} · outside live window</option>}
            {graph.nodes.map(({ record }) => <option key={identity(record)} value={identity(record)}>E{record.epoch} · {record.source} · heir {record.heir}</option>)}
          </select>
        </label>
        <div className="atlas-stepper"><button disabled={!epochs.length} onClick={() => navigate(-1)}>← PREVIOUS</button><button disabled={!epochs.length} onClick={() => navigate(1)}>NEXT →</button><button disabled={!pinned} onClick={() => setPinned(null)}>FOLLOW LIVE</button></div>
        <p className="atlas-address">{selected ? `ORIGIN ${selected.originSeed} / TREE SEED ${selected.seed} / ${selected.source}` : "A source and seed will arrive with the first heir."}</p>
        <div className="atlas-reading" tabIndex="0" aria-label="Atlas selected heir text" key={selectedKey}>{selected?.text || "The space is prepared. Nothing has been invented to fill it."}</div>
        <div className="atlas-values">{ATLAS_AXES.map((axis, i) => <div key={axis}><span>{axis}</span><b>{selected ? values[i].toFixed(3) : "—"}</b><meter min="0" max="1" value={values[i] || 0} aria-label={`${axis}, normalized`} /></div>)}</div>
        <p className="geometry-note">Coordinates use fixed 0–1 scales. Nearby means similar measurements, not similar meaning. A held heir survives live-window eviction; FOLLOW LIVE releases it.</p>
      </aside>
    </div>
    <details className="atlas-method"><summary>Read the projection</summary><p>2D: novelty × echo. 3D adds population / 85. 3 + 3D adds entropy / 1000, surviving / born, and mutation. Three plane rotations mix coordinates 1↔4, 2↔5, 3↔6 before orthographic projection. The cage is a {dimensions}-dimensional hypercube: {graph.cage.vertices.length} corners, {graph.cage.edges.length} edges.</p><p>Gold edges join consecutive completed epochs. Violet edges connect each state to its two nearest neighbors in the chosen measured dimensions, with duplicate edges merged. They express proximity, not causation. Turning the camera never recomputes these relationships. Discarded coordinates can make distant states overlap on screen; use the selector to inspect them separately.</p></details>
  </div>;
}

export default React.memo(PhaseAtlas);
