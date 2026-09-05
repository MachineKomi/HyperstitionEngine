export const CONTEXT_COMPOSER = "continuity-3";
export const CONTEXT_CUE_LABELS = {
  "discussion-reference": "Refers to an absent discussion",
  "empty-direction": "Directs attention to an unnamed referent",
  "notation-context": "Notation may need a local definition",
  "relative-fragment": "Relative clause may lack a main statement",
};

// Narrow, inspectable English cues. These do not establish meaning or grammar.
export function contextCues(text) {
  const cues = [];
  if (
    /\b(?:as (?:I|we) (?:said|mentioned|discussed|saw|noted)(?: before| earlier)?\s*[,;]|(?:last|previous|next) (?:lecture|episode|video|session)|(?:talk|talked|talking|spoke|spoken|discuss|discussed|discussing) about (?:this|that|it)[.!?]?$)/i.test(
      text,
    )
  )
    cues.push("discussion-reference");
  if (
    /^(?:(?:Now|So|Well|Again)[, ]+)*(?:notice|remember|recall|look)\b.{0,100}\b(?:what (?:this|that|it) (?:means|is)|(?:at|about) (?:this|that|these|those))[.!?]$/i.test(
      text,
    )
  )
    cues.push("empty-direction");
  if (
    !/\b(?:called|denoted|defined|represents?|where|let)\b/i.test(text) &&
    (/\b(?:choice|value) of [A-Za-z]\s*\(/.test(text) ||
      /\b(?:the|a|an)\s+[b-z]\s+(?:training|vector|matrix|parameter|objective)\b/i.test(
        text,
      ))
  )
    cues.push("notation-context");
  const head = text.split(",")[0];
  if (
    /^(?:The|A|An)\s+(?:[\p{L}'’-]+\s+){0,2}(?:of|beyond|within|without|between)\b[^,]+,\s+which\s+(?:is|was|are|were)\b/u.test(
      text,
    ) &&
    !/\b(?:is|are|was|were|has|have|had|can|could|will|would|shall|should|may|might|must|does|do|did|changes?|moves?|returns?|remains?|becomes?|seems?|grows?|[a-z]{3,}ed)\b/i.test(
      head,
    )
  )
    cues.push("relative-fragment");
  return cues;
}
