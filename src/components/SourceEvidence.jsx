import React, { useMemo, useState } from "react";
import { extractionFlags, punctuationUnits } from "../engine/sourceSpans";
import catalog from "../assets/source_catalog.json";
import { contextCues, CONTEXT_CUE_LABELS } from "../engine/context";

export default function SourceEvidence({ node }) {
  const [view, setView] = useState("context");
  const trace = node?.sourceTrace;
  const flags = useMemo(
    () => (trace ? extractionFlags(trace.original) : []),
    [trace],
  );
  const units = useMemo(
    () => (trace ? punctuationUnits(trace.original) : []),
    [trace],
  );
  const record = catalog.sources[node?.source];
  const cues = contextCues(node?.sourceFragment || "");
  if (!trace)
    return (
      <div className="source-evidence source-unaddressed">
        <span>{node?.source || "ORIGIN"} / ADDRESS NOT RECORDED</span>
        <p>
          {node?.sourceFragment ||
            "The origin is supplied by the operator or inherited from an earlier epoch."}
        </p>
        <small>
          Older records retain their graft text. An exact location cannot be
          reconstructed from that label alone.
        </small>
      </div>
    );
  return (
    <div className="source-evidence">
      <div className="source-address">
        <b>
          {node.source} / UNIT {trace.unit + 1}
        </b>
        <span>
          CHARS {trace.start}–{trace.end}
        </span>
      </div>
      <div
        className="source-views"
        role="group"
        aria-label="Source evidence view"
      >
        <button
          aria-pressed={view === "context"}
          onClick={() => setView("context")}
        >
          RECORDED EXTRACTION
        </button>
        <button
          aria-pressed={view === "units"}
          onClick={() => setView("units")}
        >
          PUNCTUATION UNITS
        </button>
        <button aria-pressed={view === "cues"} onClick={() => setView("cues")}>
          PASSAGE CUES
        </button>
      </div>
      <div
        className="source-context"
        tabIndex="0"
        aria-label={
          view === "context"
            ? "Original extraction with graft highlighted"
            : view === "cues"
              ? "Current passage context cues"
              : "Punctuation units from the extraction"
        }
      >
        {view === "context" ? (
          <p>
            {trace.original.slice(0, trace.start)}
            <mark>{trace.original.slice(trace.start, trace.end)}</mark>
            {trace.original.slice(trace.end)}
          </p>
        ) : view === "cues" ? (
          <div className="passage-cues">
            <small>CONTEXT SCREEN / CONTINUITY III</small>
            <p>
              {cues.length
                ? cues.map((cue) => CONTEXT_CUE_LABELS[cue]).join(". ") + "."
                : "No listed context cue matched this passage."}
            </p>
            <p>
              Four narrow English cues check for absent discussions, unnamed
              referents, undefined notation and relative fragments. They do not
              establish meaning, grammar or truth.
            </p>
            <small>
              This inspection uses the current screen. Older composers retain
              their original selection rules.
            </small>
          </div>
        ) : (
          <ol>
            {units.slice(0, 24).map((unit) => (
              <li
                key={unit.start}
                className={
                  unit.start < trace.end && unit.end > trace.start
                    ? "grafted-unit"
                    : ""
                }
              >
                <small>
                  {unit.start}–{unit.end}
                </small>
                {unit.text}
              </li>
            ))}
          </ol>
        )}
      </div>
      {view === "units" && (
        <small>
          Conservative punctuation boundaries, not a grammar judgment.
          {units.length > 24 ? " Showing the first 24 units." : ""}
        </small>
      )}
      <div className="source-flags">
        {flags.length ? (
          flags.map((flag) => <span key={flag}>{flag}</span>)
        ) : (
          <span>No heuristic flags; extraction still unreviewed.</span>
        )}
      </div>
      <p className="source-credit">
        {record?.version === trace.version && record.files.length === 1
          ? record.files[0].replace(/_/g, " ")
          : "Collection-level source. Exact work not established."}{" "}
        Speaker and section unverified. This is extracted text, not a facsimile
        or an authenticated quotation.
      </p>
      <code className="source-fingerprint" title={trace.id}>
        {trace.id}
      </code>
    </div>
  );
}
