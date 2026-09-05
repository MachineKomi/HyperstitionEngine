# Context, without flattening the stranger sentence

v0.18 introduces `continuity-3`, the automatic default. It preserves the twelve-impression ancestral memory and adds four narrow English cue checks before building the retrieval index. Manual mode retains `continuity-2`, `continuity-1` and `splice-1`. Their candidate pools and random draws are unchanged; archived composer versions determine replay.

The screen looks for references to an absent discussion, attention directed at an unnamed referent, notation that may need a definition, and a narrow relative-clause fragment pattern. It never rewrites source text. Exact offsets continue to address the original extraction. If no candidates remain, generation stops with a visible error rather than silently changing composers.

These are inspectable heuristics, not trained NLP, semantic understanding or a general grammar checker. A flagged sentence can be meaningful in its original context. An unflagged sentence can still be weak in a generated passage. PASSAGE CUES in EXAMINE THE GRAFT shows the current screen's findings, including on older archives; inspection does not retroactively change their rules.

## Candidate audit

Run `npm run audit:context` to write `output/context-candidates.json`, including every excluded sentence, cue, source fingerprint, zero-based unit and original span. The default source order is Land, Bible, AI. All 11 exclusions were read during development.

| Collection | Continuity II | Continuity III | Excluded |
| --- | ---: | ---: | ---: |
| N_Land | 1,430 | 1,430 | 0 |
| Bible | 339 | 339 | 0 |
| AI | 1,534 | 1,523 | 11 |
| Total | 3,303 | 3,292 | 11 |

Seven exclusions refer back to a discussion, two use locally undefined notation, one directs attention to an unnamed referent and one matches the relative-fragment pattern. Collection names do not establish authorship or speaker. The AI collection includes philosophical discussion as well as technical material.

Contrary evidence shaped the rules: an early pattern rejected Land's complete sentence about European reason because it failed to recognize “tried” as a verb. Another rejected a biblical reference to Moses; a third rejected a concrete image of someone trapped in one world imagining another. All three now survive and are regression cases. This is a development set, not a held-out reader evaluation. General experimental-form classification and work/section mapping remain open.

## Fixed-seed comparison

`npm run compare:context` runs seeds 0–29, 30 automatic epochs per seed, default sources, with playback waits disabled. Each resulting chronicle is validated. The JSON report retains every winning passage and the source fingerprints.

| Observation across 900 winning heirs | Continuity II | Continuity III |
| --- | ---: | ---: |
| Heirs matching the four cues | 38 | 0 |
| Source repeats within the preceding three heirs | 0 | 0 |
| Ending repeats within the preceding three heirs | 0 | 0 |
| Mean distinct source passages per 30-epoch lineage | 27.0 | 27.3 |
| Land / Bible / AI winning passages | 488 / 40 / 372 | 461 / 27 / 412 |

The cue count measures the intended exclusion, not profundity. Source balance remains uneven. Removing candidates changes index positions, lexical weights and later feedback, so matching seeds need not produce corresponding trees or source choices across versions. The newer run generated 27,707 nodes versus 29,003 under the older controller trajectory; this is not a speed comparison.

## Reading and resource behavior

The inherited sentence is quieter, the borrowed source receives the main reading weight, and the authored ending carries a gold rule. The bridge has its own small typographic line. These are display spans: exported text and provenance remain intact. The reading window retains its reserved height; source inspection pins the specimen while live growth continues.

At most two candidate indexes are cached for a bound corpus: the shared I/II index and the III index. Rebinding discards both. Index preparation yields and can be interrupted; each child still samples at most 24 candidates and carries at most twelve memory entries.

A local 250-epoch benchmark on Node 24.13.1 / Windows x64 recorded 133.5 ms source preparation, 914.4 ms for the first epoch including yielded indexing, 2.02 ms warm median and 7.91 ms warm p95. The retained 108-epoch archive was 1,157,999 bytes; maximum population was 85. This run overlapped other verification, excludes browser rendering and network, and does not establish an improvement over prior timings.

Verification includes frozen legacy/I/II replay digests, exact corpus spans, exclusion counts, false-positive cases, empty-pool errors, canceled/rebound indexes, III memory bounds, archive replay and interrupted lineage equivalence.

Production-preview browser checks passed at 320, 390, 768, 1024, 1440 and 1920px widths plus 844×390 landscape. No horizontal overflow or page errors were observed. Eight live samples retained identical graph, memory, reader and layout rectangles. Pinned text and memory remained unchanged while growth advanced. Exported Continuity II and III browser replays matched heir text, source trace, probability metadata and memory exactly; FOLLOW HEIR restored the winning ledger.
