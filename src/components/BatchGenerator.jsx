import React from "react";
export default function BatchGenerator({ onGenerate, disabled }) {
  return (
    <button className="batch-btn" onClick={onGenerate} disabled={disabled}>
      MULTIPLY THE SIGNAL <span>×50</span>
    </button>
  );
}
