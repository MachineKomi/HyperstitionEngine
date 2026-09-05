# Continuity · v0.16

The automatic engine now generates a three-part passage. One sentence is inherited literally from the parent, one intact span is selected from a bound source, and an authored closing sentence carries the lineage's motif into the next generation. Eight structures explore condition, invariant, limit, witness, return, probability, measure and afterimage. These are original procedural frames, not quotations attributed to Land.

This develops the [reading notes](research/LAND_READING_2026-09-05.md): recurrence needs something that survives, and a change in relationship matters more than increased population. It is a design interpretation. The actual implementation is inspectable lexical retrieval and constrained composition, with no neural inference.

## Selection and its limits

The composer first applies conservative English heuristics to sentence spans from the existing eligible extraction units. It retains uppercase starts, terminal punctuation, 6–32 words, at least three content terms and a finite-verb cue. It excludes obvious references, several OCR patterns, dangling endings and some transcript disfluencies. Original extraction strings and UTF-16 offsets are preserved. No punctuation or missing word is invented inside the selected source span.

The default N_Land / Bible / AI selection produces **3,303 candidates**: 1,430 / 339 / 1,534 respectively. These are sentence spans, not counts of original extraction units. The new pool is a filtered subset; excluded material remains available through the legacy composer. The filter favors conventional English prose, loses some intentional experimental form, and still accepts some fragments. It is not a curated clause dataset or a syntactic parser.

Content terms use lowercase ASCII words and a stop list. For N candidates and document frequency df(t), a term's weight is `ln(1 + N / (1 + df(t)))`. The eight highest-weight parent terms each supply two seeded postings draws; eight additional draws explore the full candidate pool. Deduplication leaves at most 24 choices. Already-inherited sentences are removed if fresh alternatives exist. If any choice shares a content term with the parent, unconnected choices are removed.

For each surviving candidate, lexical fit is its shared term weight divided by its total term weight. At mutation m, temperature T is `0.18 + 0.6m`. Selection uses:

`P(i | shortlist, parent) = exp(4.5 × (fit(i) − maxFit) / T) / Σ exp(4.5 × (fit(j) − maxFit) / T)`

The subtraction stabilizes the exponential without changing the distribution. One seeded draw selects a sentence. The inspector retains the full shortlist probability vector and selected index; gold marks the selected bar, whose height is scaled relative to the largest probability. Surprisal is `−log₂ P(selected)` and entropy is `−Σ P(i) log₂ P(i)`. These are conditional on this sampled shortlist, not probabilities over every corpus sentence, the whole passage, truth or literary depth. The ritual's accumulated entropy meter is a separate control quantity.

## Thirty paired seeds

Run `npm run compare:composers` to regenerate `output/composer-comparison.json`. It compares seeds 0–29 with the same root, selected source order, source fingerprints, three branches, three generations, mutation 0.65 and echo heir selection. Each composer grows 40 nodes per seed. Timings include local computation and first-use preparation, with theatrical waits disabled. The artifact contains both complete heirs and their provenance.

Inspection of all 30 pairs found clearer boundaries and explicit recurring imagery, with remaining weak joins. This is an author/developer inspection, not a blinded preference study or a measured profundity score. Examples below come from the bundled corpus and the engine's authored frames; collection IDs alone do not establish an individual speaker.

| Seed | Legacy result / failure | Continuity result / interpretation |
| --- | --- | --- |
| 0 | Cuts the incoming source after “impact and.” | Keeps the entire lexicographic-ordinal sentence, but its opening remains awkward. Intact extraction is not equivalent to good syntax. |
| 1 | Joins a broken inherited clause to scripture with a slash. | A machine's changing shadow meets Cyberspace's shadow, followed by recurrence and memory. The shared image gives the transition something to develop. |
| 2 | OCR debris enters a praise template and changes the object to a beard. | A robot closing its eyes to satisfy a cleaning objective appears inside a measurement frame. The juxtaposition supports a reading about the limits of measures; no logical entailment is claimed. |
| 4 | An inherited phrase ends in “of” before another template begins. | “The God beyond the God of theism, which is a deeply transgressive statement.” remains a fragment. Its relative-clause verb passes the heuristic. |
| 21 | Several truncated templates pile up. | A source describes a circuit without repetition, followed by an authored sentence about repetition and memory. This tension can be interesting, but the composer cannot understand or resolve it. |
| 27 | Scripture is joined to a truncated afterimage. | The source retains “The w training process…”; mathematical variable notation survives without its surrounding definitions. |

For seed 1 the new passage is:

> The machine outlives one account of itself and begins to cast a different shadow.
>
> A different voice enters the recurrence: Now Cyberspace has its own shadow, its dark-twin: the Crypt.
>
> Repetition gives the machine a memory; the difference gives it somewhere to go.

The middle source sentence is recorded under N_Land; the surrounding text is procedural authorship. Across these 30 echo-selected heirs there are only **18 distinct source sentences**, with **24 N_Land and six AI selections**, despite Bible being bound. The shadow sentence recurs five times. Echo selection and the fixed root amplify repetition and source imbalance. Sixteen authored endings also limit long-session variety. A future motif ledger and repetition penalty must be compared against this version, not silently change its replay behavior.

## Replay and reading

The site defaults to `continuity-1`; the library retains `splice-1` as its backward-compatible default. Manual COMPOSITION exposes both. New chronicles record composer version, motif, selected source order, corpus fingerprints and the chosen node's probability distribution. Import validates distribution normalization, selected probability, surprisal, entropy, temperature and source-version consistency. Old archives without a composer retain legacy replay. A changed corpus produces an explicit replay error; choosing a composer again or editing the root starts a new path under the currently bound corpus.

The index is built once per source binding, yielding to the event loop every 256 extraction records and responding to cancellation. It uses no seeded draws during preparation. Each child scores a bounded shortlist rather than scanning the corpus. Automatic trees remain capped at 85 nodes, the chronicle at 108 entries and recent decisions at 12.

At 1×, reading holds for 220 ms per word, bounded to 8–18 seconds, after the existing charge and layer beats. The 0.25×–32× dial scales this time without changing selection. Reading windows reserve 560px on wider layouts and 620px on narrow phones; long content scrolls inside. Pinning holds the passage and its probability spectrum while the live lineage advances.

## Verification

The release's regression suite covers exact inherited/source spans, deterministic probability draws, archive round trips, old replay, changed-corpus rejection, interrupted indexing and lineage restart, bounded populations and reading beats. The preserved 30-seed legacy tree digest still matches the pre-composer baseline.

Chromium emulation checked 320, 390, 768, 1024, 1440 and 1920px widths plus 844×390 landscape, with no horizontal page overflow. A pinned passage and panel height stayed unchanged across live epochs. Browser import and manual replay reproduced both a new continuity heir and a pre-composer legacy heir. The production preview began composing automatically at 1×, held map/reader/layout rectangles across eight overdrive samples, stopped on Manual and reported no failed requests or page errors. Long text still needs internal scrolling at the narrowest widths. These are desktop browser emulations, not physical-phone performance measurements.

`npm run bench:sources -- --continuity` measured 250 seed-137 epochs on Node v24.13.1, Windows x64, with the default three sources already read from disk. One local run took 96.4ms to prepare the legacy corpus records and 980.5ms for the first epoch including yielded index preparation. Across the following 249 epochs, median computation was 1.26ms and p95 4.40ms. The maximum population was 85; the final 108-entry archive validated and serialized to 351,761 bytes. Theatrical waits, browser rendering and network were excluded. Other concurrent local runs were slower (warm p95 up to 20.4ms); these observations are not a device-independent performance guarantee. Batched preparation trades first-epoch latency for opportunities to render and interrupt, rather than claiming a faster cold start.
