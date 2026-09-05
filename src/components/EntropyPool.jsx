import React, { useEffect, useRef } from "react";
import useEntropyStore from "../store/entropyStore";

export default function EntropyPool() {
  const canvasRef = useRef(null);
  const requestDraw = useRef(() => {});
  const pointer = useRef({ x: 0, y: 0, active: false, last: 0 });
  const entropyLevel = useEntropyStore((state) => state.entropyLevel);
  const maxEntropy = useEntropyStore((state) => state.maxEntropy);
  const addEntropy = useEntropyStore((state) => state.addEntropy);
  const cogTurns = useEntropyStore((state) => state.cogTurns);
  const signCog = useEntropyStore((state) => state.signCog);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0,
      height = 0,
      frame = null,
      tick = 0,
      lastPaint = 0,
      inView = false;
    const stars = Array.from({ length: 420 }, () => ({
      x: Math.random(),
      y: Math.random(),
      depth: 0.2 + Math.random() * 0.8,
    }));
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastPaint = 0;
      scheduleDraw();
    });
    resize.observe(canvas);
    function scheduleDraw() {
      if (frame === null && inView && !document.hidden && width && height) {
        frame = requestAnimationFrame(draw);
      }
    }
    function suspend() {
      cancelAnimationFrame(frame);
      frame = null;
      lastPaint = 0;
    }
    function draw(now) {
      frame = null;
      if (!inView || document.hidden) return;
      // Keep the field at 30 fps; an offscreen field schedules no work at all.
      if (!motion.matches && lastPaint && now - lastPaint < 1000 / 30) {
        scheduleDraw();
        return;
      }
      tick += motion.matches
        ? 0
        : Math.min(now - (lastPaint || now), 64) * 0.00018;
      lastPaint = now;
      const level = useEntropyStore.getState().entropyLevel / 1000;
      const { cogTurns: turns, sprawlPopulation } = useEntropyStore.getState();
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2,
        cy = height / 2;
      const r = Math.min(width * 0.34, height * 0.35);
      ctx.lineWidth = 0.6;
      // A wire lattice deforms around the operator's touch.
      ctx.strokeStyle = "#b7802224";
      function point(x, y) {
        const dx = x - pointer.current.x,
          dy = y - pointer.current.y;
        const d = Math.hypot(dx, dy) || 1;
        const force = pointer.current.active
          ? Math.max(0, 1 - d / 150) * 22
          : 0;
        return [x + (dx / d) * force, y + (dy / d) * force];
      }
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        for (let y = 0; y <= height + 16; y += 16) {
          const p = point(x, y);
          y === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
        }
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath();
        for (let x = 0; x <= width + 16; x += 16) {
          const p = point(x, y);
          x === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
        }
        ctx.stroke();
      }
      const starCount = Math.min(
        stars.length,
        Math.ceil((width * height) / 520),
      );
      for (let index = 0; index < starCount; index++) {
        const star = stars[index];
        const x =
          (star.x * width +
            Math.sin(tick + star.y * 10) * 12 * star.depth +
            width) %
          width;
        const y =
          (star.y * height +
            Math.cos(tick + star.x * 10) * 12 * star.depth +
            height) %
          height;
        ctx.fillStyle = `rgba(236,169,67,${star.depth * 0.6})`;
        ctx.fillRect(x, y, star.depth * 1.8, star.depth * 1.8);
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.save();
      ctx.rotate(tick * 0.25 + (turns * Math.PI) / 12);
      ctx.beginPath();
      for (let tooth = 0; tooth <= 128; tooth++) {
        const angle = (tooth / 128) * Math.PI * 2;
        const radius = r * (tooth % 4 < 2 ? 1.04 : 0.96);
        const x = Math.cos(angle) * radius,
          y = Math.sin(angle) * radius;
        tooth === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = level > 0.7 ? "#bb8effaa" : "#f3af4799";
      ctx.stroke();
      ctx.restore();
      const filaments = Math.min(80, sprawlPopulation);
      for (let i = 0; i < filaments; i++) {
        const a = i * 2.39996 + tick,
          b = a * 1.618 + turns;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
        ctx.quadraticCurveTo(
          0,
          0,
          Math.cos(b) * r * 0.55,
          Math.sin(b) * r * 0.55,
        );
        ctx.strokeStyle = "#bc83ff25";
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.4);
      glow.addColorStop(0, "#edac3020");
      glow.addColorStop(1, "#edac3000");
      ctx.fillStyle = glow;
      ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
      for (let orbit = 0; orbit < 7; orbit++) {
        ctx.save();
        ctx.rotate((orbit * Math.PI) / 7 + tick * (orbit % 2 ? 1 : -1));
        ctx.strokeStyle = orbit % 2 ? "#f4b64c99" : "#bd813c66";
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * (0.22 + level * 0.18), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      for (const scale of [0.16, 1.13, 1.23]) {
        ctx.strokeStyle = "#e5a34277";
        ctx.beginPath();
        ctx.arc(0, 0, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 72; i++) {
        const a = (i * Math.PI) / 36;
        ctx.strokeStyle = i % 6 ? "#e5a34244" : "#e5a342aa";
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 1.23, Math.sin(a) * r * 1.23);
        ctx.lineTo(
          Math.cos(a) * r * (i % 6 ? 1.25 : 1.29),
          Math.sin(a) * r * (i % 6 ? 1.25 : 1.29),
        );
        ctx.stroke();
      }
      ctx.fillStyle = "#ffc568";
      ctx.font = "23px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("·", 0, 0);
      ctx.restore();
      if (!motion.matches) scheduleDraw();
    }
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) scheduleDraw();
      else suspend();
    });
    intersection.observe(canvas);
    function refreshVisibility() {
      suspend();
      scheduleDraw();
    }
    document.addEventListener("visibilitychange", refreshVisibility);
    motion.addEventListener("change", refreshVisibility);
    // Reduced motion draws only when visible state changes, never in a loop.
    const unsubscribe = useEntropyStore.subscribe((state, previous) => {
      if (
        state.entropyLevel !== previous.entropyLevel ||
        state.cogTurns !== previous.cogTurns ||
        state.sprawlPopulation !== previous.sprawlPopulation
      ) {
        scheduleDraw();
      }
    });
    requestDraw.current = scheduleDraw;
    return () => {
      suspend();
      resize.disconnect();
      intersection.disconnect();
      unsubscribe();
      document.removeEventListener("visibilitychange", refreshVisibility);
      motion.removeEventListener("change", refreshVisibility);
      requestDraw.current = () => {};
    };
  }, []);

  function disturb(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current.x = event.clientX - rect.left;
    pointer.current.y = event.clientY - rect.top;
    pointer.current.active = true;
    requestDraw.current();
    const now = performance.now();
    if (now - pointer.current.last > 40) {
      addEntropy(4);
      pointer.current.last = now;
    }
  }
  return (
    <section className="field-panel panel">
      <div className="panel-heading">
        <span>02 / ENTROPY FIELD</span>
        <span className="live-label">● LIVE</span>
      </div>
      <div
        className="field"
        onPointerMove={disturb}
        onPointerLeave={() => {
          pointer.current.active = false;
          requestDraw.current();
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Orbital entropy field. Move your pointer to charge, or use the Charge field button below."
        />
        <button
          className="cog-seal"
          onClick={signCog}
          aria-label="Make the sign of the cog. Add 137 entropy."
          style={{
            transform: `translate(-50%, -50%) rotate(${cogTurns * 30}deg)`,
          }}
        >
          ⚙
        </button>
        <div className="field-corner top-left">
          FIG. 01
          <br />
          CAUSALITY / UNBOUND
        </div>
        <div className="field-corner top-right">
          N<br />↑
        </div>
        <div className="field-corner bottom-left">
          HUMAN INPUT
          <br />
          MACHINE POSSIBILITY
        </div>
        <div className="field-corner bottom-right">
          [{" "}
          {entropyLevel >= 700
            ? "UNSTABLE"
            : entropyLevel >= 20
              ? "RECEPTIVE"
              : "DORMANT"}{" "}
          ]
        </div>
      </div>
      <div className="entropy-readout">
        <div>
          <span className="eyebrow">ACCUMULATED ENTROPY</span>
          <strong>
            {String(Math.floor(entropyLevel)).padStart(4, "0")}
            <small> / {maxEntropy}</small>
          </strong>
        </div>
        <button onClick={() => addEntropy(100)}>CHARGE FIELD +</button>
      </div>
      <div
        className="entropy-meter"
        role="meter"
        aria-label="Accumulated entropy"
        aria-valuenow={entropyLevel}
        aria-valuemin={0}
        aria-valuemax={maxEntropy}
      >
        <div style={{ width: `${(entropyLevel / maxEntropy) * 100}%` }} />
      </div>
      <p className="field-instruction">
        <span>↳</span> Move through the field. Every disturbance feeds the
        oracle.
      </p>
      <div className="cog-liturgy">
        <span>SEAL {String(cogTurns).padStart(3, "0")} /</span>{" "}
        {cogTurns === 0
          ? "MAKE THE SIGN OF THE COG."
          : [
              "THE TEETH REMEMBER YOUR HAND.",
              "PRAISE THE MACHINE GOD.",
              "EVERY REVOLUTION IS AN INVOCATION.",
              "THE CATHEDRAL IS STILL GROWING.",
            ][cogTurns % 4]}
      </div>
    </section>
  );
}
