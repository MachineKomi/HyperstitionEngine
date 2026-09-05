# The sprawling roadmap

Version 1 · 5 September 2026 · Delivery horizon follows evidence, not a promised calendar.

Hyperstition Engine should open as a self-running work of procedural fiction: one seed, a few legible rules, and consequences that keep changing the next sentence. The reader can watch, inspect ancestry, interrupt, or take manual control. Complexity should emerge in relationships and memory while the application remains usable on the device in hand.

The user requested automatic default operation, responsive design, Vercel deployment, more coherent and profound writing, modern NLP, and evolving project guidance. The [constitution](../CONSTITUTION.md) records those commitments. The [research](research/LAND_READING_2026-09-05.md) motivates the choices below. Research interpretations and proposed targets are not completed features.

## What the present release contains

The code for the v0.13 release contains the following layers. Release validation and a successful deployment are recorded separately in the release notes; this table alone is not a claim that a hosted release has passed its checks.

| Layer | Implemented behavior | Important boundary |
| --- | --- | --- |
| Machine Chapel | Corpus selection, procedural oracle, entropy field, session transmission log | Original oracle generation is not covered by the seeded tree's replay guarantee |
| Xenogenesis | Six fragment-composition operators, deterministic branching, ancestry inspector, pruning and export | Manual trees are bounded at 341 nodes; word windows can damage syntax |
| Autopoiesis | A chosen leaf feeds the next epoch; novelty, echo or seeded-chance selection | Novelty and echo measure word overlap, not meaning |
| Chronicle | Validation, import/export, recall and 108 retained completed epochs | Storage is browser-local; older records expire |
| Automatic controller | Default auto mode, user seed, deterministic state transitions and manual toggle | Simple rules, not a trained agent or a neural language model |
| Responsive delivery | Adaptive layout work and Vercel configuration | Requires actual viewport and deployment checks, including hosted asset loading |

The automatic controller in [automatic.js](../src/engine/automatic.js) starts from seed `137` unless the user supplies another seed. It plans a bounded tree, supplies entropy, chooses a pressure, selects an heir, and feeds the heir into the next epoch. Every fifth epoch uses chance. Other epochs favor echo after strong lexical drift, otherwise a seeded choice permits novelty or echo. Mutation and tree dimensions vary from the seeded stream. Automatic populations are capped at 85 nodes. Layer and inter-epoch pauses reveal the growth; time is not an input to its decisions. The recent decision trace is bounded at 12; session transmissions at 200.

These mechanisms already make a useful distinction: an apparently unpredictable path can remain reproducible from known conditions. Neural generation is unnecessary for the automatic experience requested by the user.

## Outcomes to protect

1. A first-time visitor sees growth without configuring a ritual and can find manual control immediately.
2. A reader can identify an image or relation that persists through several changes.
3. A developer can explain and reproduce a transition from saved inputs.
4. A phone remains responsive while the field, text and genealogy unfold.
5. Optional semantic retrieval earns its cost against the procedural baseline.

The current plan does not include training a foundation model, autonomous network posting, hidden background execution, or treating generated statements as external-world predictions. Multi-user systems and server inference require separate designs because they change the local instrument's resource and data boundaries.

## P0 · The next complete increments

### 0A. Stabilize the automatic encounter

**Reader need:** arrive, watch, and retain control.

**Requirements:** keep the auto/manual switch prominent; expose the seed and current rule; pause unnecessary work when the tab is hidden; cancel in-flight growth when switching to manual; retain completed epochs; recover visibly from unavailable corpora or generation errors.

**Acceptance:** a fresh load produces a completed epoch without clicks; changing the seed restarts the lineage; repeated runs with identical conditions produce identical generated decisions and heirs; manual mode produces no later automatic entries; returning from a hidden tab does not create duplicate loops. Verify narrow portrait, narrow landscape, intermediate tablet and wide desktop layouts. Run an extended session that crosses every retention limit and observe bounded counts.

**Dependencies:** existing corpus loading, tree engine and chronicle. Current code implements this slice; release checks must establish the claims before publication.

### 0B. Give every fragment an address

**Reader need:** inspect where a striking phrase came from and which voice it belongs to.

**Deliverable:** a build-time source manifest and a compact clause dataset. Each record contains a stable ID, work/section, original span, normalized retrieval form, source version, known author or quoted voice, fragment kind and extraction confidence. Keep uncertain attribution explicit. Separate editorial matter, bibliography and clear OCR damage from selectable prose; preserve intentional experimental form as a distinct kind.

**Acceptance:** every generated source fragment resolves to a source record; filtering does not silently rewrite the original; at least one manually inspected fixture each covers editorial text, embedded quotation, a damaged hyphenation, a prose clause and an experimental line. A before/after report explains removed and retained counts. Existing archives remain readable with their original source-level traces.

**Dependencies:** corpus inventory and source-span mapping. No neural model required. This is the first language-quality implementation after the automatic release.

### 0C. Preserve a clause before finding a stranger one

**Reader need:** follow a thought while it changes.

**Deliverable:** a composition adapter that selects complete short clauses or sentence units. Operators specify allowed grammatical roles and return provenance for every inserted span. Start with a small, authored set of robust structures. Preserve a named object or relation from the parent; reject candidates ending in dangling conjunctions or broken extraction references.

**Acceptance:** deterministic fixtures verify intact span boundaries, inherited motif presence and source resolution. Compare 30 fixed seeds across the old and new composer, with the same selected corpora and generation budget. Publish examples that fail as well as succeed. Do not label a grammatical heuristic as full syntactic understanding.

**Dependencies:** 0B and a versioned operator interface. The old composer remains an explicit baseline for comparison.

### 0D. Measure the cost of the apparition

**Reader need:** smooth interaction without a long mandatory download.

**Deliverable:** reproducible measurements for cold load, first completed epoch, warm generation, main-thread long tasks, graph rendering and retained state. Split source-loading time from intentional theatrical pauses. Profile the existing corpus chunks before adding an index or model.

**Acceptance:** report browser, device, viewport, corpus selection, network/cache conditions, sample count and median/p95 where meaningful. Include at least a representative phone and desktop; emulation results must be labeled. Check mode-switch latency during growth and failure recovery while an asset request is interrupted. Adopt measured budgets for later changes.

**Dependencies:** 0A. This can proceed alongside 0B.

## P1 · Language with a memory

### 1A. Hybrid retrieval, optional local encoder

First form a bounded lexical shortlist from selected-source shards. Use exact IDs and stable ordering. Compare a no-model scorer with an optional sentence encoder that reranks candidate clauses for continuity with the parent and a small motif memory. Encode reusable source clauses once per model/corpus version; batch dynamic queries. The [research notes](research/LAND_READING_2026-09-05.md#modern-nlp-a-bounded-experiment) document primary sources and candidate models.

**Acceptance:** pin model/runtime revisions, tokenizer, pooling and normalization; identify download size and license; run inference away from the main thread; cap cache bytes; show loading and fallback state. No generation stalls while the optional model is unavailable. Compare warm quality and latency with the no-model baseline. Record selected source IDs so a replay need not depend on identical floating-point ranking across different hardware backends.

**Dependency:** 0B–0D. Begin with a small established encoder; benchmark a newer model separately. Do not make the initial automatic page load wait for a model download.

### 1B. Several pressures, no single profundity score

Score candidate sets along separate dimensions: grammatical completeness, motif retention, lexical repetition, source diversity, semantic distance if available, and change in the represented relation. Apply hard validity constraints first, then a diversity penalty and seeded selection among suitable candidates. Keep a few non-dominated alternatives rather than turning every property into one opaque scalar.

**Acceptance:** the inspector explains why a candidate survived or was rejected; repeated templates can lose preference even when their nouns change; conflicting pressures remain inspectable; metrics retain literal names. A reader preference study, not embedding distance alone, decides whether outputs improved.

### 1C. Motifs that go dormant and return

Maintain a finite ledger of objects, conflicts and unrealized images. Each motif has a source, last appearance, strength, expiry and a small transition history. Revisit a dormant motif after a seeded interval. Permit one announced image to condition later retrieval, creating an observable anticipation loop.

**Acceptance:** a recurrence has a trace to its earlier appearance; a motif can expire; memory cannot grow without limit; interruption and replay preserve the same motif state. Show recurrence through a restrained visual echo rather than replaying an entire transcript.

### 1D. Cadence and material form

Add operators for slow accumulation, sudden cut, echo, disagreement and scale change. Build a quiet reading mode with stable text, adjustable pace and a condensed genealogy. Animate edges when relationships change. Preserve purposeful line breaks from eligible sources. Let reduced-motion mode use static state changes.

**Acceptance:** the same core text and ancestry are available in animated and quiet modes; keyboard focus does not jump during autonomous updates; long text fits at every tested width; the interface offers periods of stillness without implying that the engine has failed.

## P2 · The further chambers

These are deliberately expansive experiments, ordered by dependency. Each needs a small prototype and an evaluation before entering the release path.

| Chamber | Experiment | Evidence needed to continue |
| --- | --- | --- |
| Rival lineages | Keep a small population of surviving voices with different pressures | Distinct lineages persist without duplicating the whole corpus or overwhelming reading |
| Cross-infection | Permit a traceable exchange of motifs between two lineages | The crossing changes later behavior and can be reconstructed |
| Extinction and succession | Retire sterile lineages; let surviving motifs seed successors | Retirement criteria reduce repetition without erasing all continuity |
| Ecology of operators | Adjust a bounded distribution of approved operators based on outcomes | The rule change produces measurable variety; generated text never becomes executable code |
| Counterfactual fork | Replay a past epoch under one changed pressure | Side-by-side views make the causal difference clear |
| Geological memory | Display long histories as strata with compact summaries and drill-down | Summaries retain citations and readers can retrieve the underlying records |
| Numeracy as structure | Explore constrained counting graphs and cyclical schedules | Numbers change actual transitions; any historical connection has a cited source |
| Polyphonic documents | Compose a short exchange between attributed procedural voices | Speaker continuity survives turns, with deliberate rather than accidental crossings |
| Archive as instrument | Search saved lineages, compare motifs and restart from a chosen fossil | Queries remain bounded and old exports migrate without silent loss |
| A book from the ruins | Export a curated sequence with chapters, provenance and an index | Export is readable independently of the animated site |
| Sound after consent | Map a few state changes into sparse generative audio | Audio begins only through an explicit control and can be stopped independently |
| Shared observatory | Optional, explicit publication of selected lineages | A separate data, identity and publication design exists before server work begins |

## Evaluation and provisional targets

These are proposed acceptance targets to test, not observed improvements or industry benchmarks. Adjust them from the first measured baseline and record the reason in the evolution log.

| Dimension | Initial target hypothesis | Method |
| --- | --- | --- |
| Automatic control | No completed automatic epoch after the operator switches to manual | Interrupt at each phase, including source load, generation and pause |
| Replay | Exact text, ancestry and rule sequence under matching procedural inputs | Fixed corpus fixtures, saved state, interrupted/resumed and uninterrupted runs |
| Responsive reading | No horizontal page overflow at 320, 390, 768, 1024, 1440 and 1920 CSS pixels | Portrait/landscape browser checks with long roots and exported text |
| Interaction latency | Manual toggle visibly responds within 100 ms on chosen test devices | Measure from input to state change during active growth; report failures |
| Clause integrity | At least 90% of a reviewed 100-output sample avoids accidental broken clauses | A documented human rubric; deliberate fragments labeled separately |
| Coherence | New composer preferred for continuity in at least 60% of non-tied pairs | Blind paired review over fixed seeds; report sample size and disagreement |
| Variety | Improved continuity without increased repeated-template rate | Count operator/form repetition alongside review, relative to baseline |
| Semantic option | Quality benefit survives the download and runtime cost report | Cold/warm comparison with model off, on, unavailable and canceled |
| Bounded operation | Counts and cache bytes remain within declared caps after an extended run | Observe at least 250 completed epochs, without requiring all output to stay mounted |

Profundity and unease are editorial judgments. Evaluate whether a reader can articulate a transformation, recall an image and discover a surprising relationship. Do not collect behavioral telemetry merely to turn these into a hidden engagement score.

## Dependency order and next action

The automatic instrument is deployed on Vercel. The v0.14 clockwork increment adds adjustable pacing, a stable map, pinned reading and bounded initial archive rendering. Next implement **0B source addresses and clause preparation**, accompanied by **0D performance measurement**. That unlocks **0C composition**, then the optional retrieval experiment and motif memory. Multi-lineage experiments come after one lineage can sustain a readable thought.

Unresolved implementation questions have concrete owners: engineering chooses the source-record format and measures browser costs; source curation resolves ambiguous attribution and distribution metadata; design reviews cadence and the quality rubric. None requires pretending that the whole future is specified. The immediate work is fully actionable.
