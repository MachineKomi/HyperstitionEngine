import React, { useEffect, useRef, useState } from "react";
import useEntropyStore from "../store/entropyStore";

export default function OracleDisplay() {
  const { sessionHistory, isGenerating } = useEntropyStore();
  const [notice, setNotice] = useState("");
  const log = useRef(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [sessionHistory]);
  const transcript = () =>
    sessionHistory
      .map(
        (item) =>
          `[${item.time}] CYCLE ${item.cycle} / ${item.mode.toUpperCase()} / ${item.aspects.join(" + ")} / ENTROPY ${item.entropy}${item.seed !== undefined ? ` / SEED ${item.seed} / EPOCH ${item.epoch} / FRAGMENT ${item.fragmentId} / ${item.operator}` : ""}\n${item.text}${item.sourceFragment ? `\n[GRAFT: ${item.source}] ${item.sourceFragment}\n[INHERITED] ${item.inheritedFragment}` : ""}${item.sourceTrace ? `\n[ADDRESS] ${item.sourceTrace.id} / UTF-16 ${item.sourceTrace.start}:${item.sourceTrace.end}\n[RECORDED EXTRACTION] ${item.sourceTrace.original}` : ""}`,
      )
      .join("\n\n");
  async function copy() {
    try {
      await navigator.clipboard.writeText(transcript());
      setNotice("COPIED TO CLIPBOARD");
    } catch {
      setNotice("Clipboard unavailable. Use EXPORT to save your log.");
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([transcript()], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "hyperstition-transmissions.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("LOG EXPORTED");
  }
  return (
    <section id="transmissions" className="transmissions panel">
      <div className="panel-heading">
        <span>04 / TRANSMISSION LOG</span>
        <div className="log-actions">
          <button onClick={copy} disabled={!sessionHistory.length}>
            COPY ALL
          </button>
          <button onClick={download} disabled={!sessionHistory.length}>
            EXPORT ↗
          </button>
        </div>
      </div>
      <div
        ref={log}
        className="log-window"
        role="log"
        aria-label="Oracle transmissions"
        aria-live={isGenerating ? "off" : "polite"}
      >
        {!sessionHistory.length ? (
          <div className="empty-log">
            <span className="empty-glyph">⌁</span>
            <div>
              <h3>The silence is listening.</h3>
              <p>Bind an aspect. Disturb the field. Invoke the oracle.</p>
            </div>
            <span className="cursor">▌</span>
          </div>
        ) : (
          sessionHistory.map((item, index) => (
            <article className="transmission" key={item.id}>
              <div className="transmission-meta">
                <span>TX_{String(index + 1).padStart(4, "0")}</span>
                <span>
                  {item.mode} / CYCLE {item.cycle} / {item.aspects.join(" + ")}
                </span>
                <time>{new Date(item.time).toLocaleTimeString()}</time>
              </div>
              <p>{item.text}</p>
            </article>
          ))
        )}
      </div>
      <div className="log-foot">
        <span role="status">
          {notice ||
            (isGenerating
              ? "RECEIVING SIGNAL…"
              : "LAST 200 TRANSMISSIONS / EXPORT BEFORE CLOSING")}
        </span>
        <span>{sessionHistory.length} RECORDS</span>
      </div>
    </section>
  );
}
