import React, { useEffect, useState, useRef } from "react";
import { MEMORY_LIMIT } from "../engine/memory";

export default function LineageMemory({ node, onPin }) {
  const memory = node?.memory;
  const [focus, setFocus] = useState(null);
  const reading = useRef(null);
  useEffect(() => setFocus(null), [memory]);
  const index =
    focus !== null && focus < (memory?.length || 0)
      ? focus
      : (memory?.length || 0) - 1;
  const item = memory?.[index];
  useEffect(() => {
    if (reading.current) reading.current.scrollTop = 0;
  }, [item]);
  return (
    <section className="lineage-memory" aria-label="Ancestral memory">
      <div className="memory-heading">
        <div>
          <span>IV / WHAT SURVIVES THE RETURN</span>
          <h3>The branch remembers.</h3>
        </div>
        <strong>
          {String(memory?.length || 0).padStart(2, "0")}
          <small> / {MEMORY_LIMIT}</small>
        </strong>
      </div>
      <div
        className="memory-slots"
        role="group"
        aria-label="Remembered source passages, oldest first"
      >
        {Array.from({ length: MEMORY_LIMIT }, (_, slot) => (
          <button
            key={slot}
            disabled={!memory?.[slot]}
            aria-pressed={slot === index}
            aria-label={
              memory?.[slot]
                ? `Inspect memory ${slot + 1} from ${memory[slot].source}`
                : `Empty memory ${slot + 1}`
            }
            onClick={() => {
              onPin();
              setFocus(slot);
            }}
          >
            <span>{String(slot + 1).padStart(2, "0")}</span>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        className="memory-reading"
        ref={reading}
        tabIndex={0}
        role="region"
        aria-label="Remembered source passage"
      >
        <span>
          {item
            ? `${item.source} / MEMORY ${index + 1}`
            : "ROOM FOR WHAT HAS NOT HAPPENED"}
        </span>
        <p>
          {item?.fragment ||
            "Each surviving branch carries twelve recent source passages. What falls beyond them can return."}
        </p>
      </div>
      <p className="memory-rule">
        {memory
          ? "Select an impression to hold this branch. Recent passages and endings give way to fresh choices."
          : node
            ? "Ancestral memory belongs to Continuity II. Earlier composers retain their original rules."
            : "A new lineage begins with an empty memory. Twelve impressions await their turn."}
      </p>
    </section>
  );
}
