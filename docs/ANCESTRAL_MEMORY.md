# Ancestral memory · v0.17

The automatic engine now uses `continuity-2`. Each node inherits a ledger of at most 12 recent source passages and authored endings from its parent. A branch carries only its own ancestry; losing siblings cannot alter the winner's memory. The winning ledger becomes the next epoch's input, and the oldest impression expires when a new one enters.

This extends the [Continuity comparison](CONTINUITY.md), which found repeated source sentences and a small set of recurring endings. The aim is to give an image room to develop before the same passage returns. The existing Land reading informs that distinction between recurrence and repetition; no new philosophical attribution or neural inference is claimed.

## The rule

Retrieval still samples at most 24 candidates from the same indexed source pool. After removing sentences already present in the parent when alternatives exist, Continuity II removes passages matching any of its parent's remembered source strings **if an unremembered candidate remains**. It then applies the existing lexical-overlap filter and seeded temperature draw. If the shortlist contains only remembered passages, repetition is allowed and explicitly recorded. The engine does not scan the whole corpus to establish that no fresh sentence exists anywhere.

Authored endings already in memory give way to other endings, while the immediately preceding operator remains excluded. The chosen source, source passage and new ending are appended to the ledger. Each ledger entry is a small plain-text record, not a duplicate corpus or a source document. The selected node retains its normal exact source trace separately.

The probability spectrum describes the distribution **after** these filters. `memoryAvoided` counts remembered choices removed from the sampled pool, before lexical filtering. `memoryRevisit` says whether the chosen passage occurred in the parent's ledger. These quantities do not measure literary coherence or depth.

The inspector reserves all 12 positions before growth. Numbered impressions run oldest to newest. Selecting an impression pins the current branch and opens its recorded source passage; live growth continues elsewhere. The ledger is inspectable data, not an editable set of instructions. Collection labels do not establish authorship of a particular remembered sentence.

## Comparison: 30 lineages, 30 epochs each

Run `npm run compare:memory` to regenerate `output/memory-comparison.json`. Seeds 0–29 each run for 30 automatic epochs under both versions, using the bundled N_Land / Bible / AI sources in that order. Corpus fingerprints, complete winning passages and per-lineage counts are recorded. All 1,800 resulting epochs passed chronicle validation.

“Recent repeat” means an exact match with any of the previous **three winning heirs** in the same lineage. This measurement window differs from the engine's 12 ancestral mutations, which include intermediate generations. Tree dimensions can diverge because the unchanged automatic controller responds to the different generated heirs.

| Measurement | Continuity I | Continuity II |
| --- | ---: | ---: |
| Winning heirs inspected | 900 | 900 |
| Heirs repeating a recent source passage | 71 | 0 |
| Heirs repeating a recent authored ending | 282 | 0 |
| Mean distinct source passages per 30-epoch lineage | 25.83 | 27.00 |
| Total generated nodes, including origins | 29,323 | 29,003 |
| N_Land / Bible / AI winning sources | 441 / 38 / 421 | 488 / 40 / 372 |

These exact-repeat counts improve in this fixed sample. They do not prove the new writing is more profound, guarantee zero repeats for other seeds or establish a reader preference. Source balance remains uneven; fewer repeats did not produce an even distribution across voices. A single-source fixture correctly repeats when its shortlist has no new alternative.

Seed 0 begins with a source about a configurable cost module inside a condition frame. Its next heir turns to a different passage about a configurator, giving the shared term somewhere to develop. Later, it jumps to specialized philosophical vocabulary about strata and then to a statement about understanding beyond explanation. Those transitions preserve complete source spans but are not a reasoned argument. A later passage retains unusual “gen-us” and “gen-ders” typography. The source filter is unchanged, so extraction and context problems remain.

A browser-observed memory also contains “Now notice, of course, what this means.” It is an intact but uninformative sentence without its surrounding discussion. Repetition control cannot supply that missing context. This failure remains a reason to evaluate source curation and retrieval independently.

## Replay and bounds

Chronicles record both the input ledger in settings and the winning output ledger. Import checks the 12-entry bound, source membership, field sizes, expected ledger length, matching final passage/ending and valid diagnostic fields. Replay restores the input ledger; FOLLOW HEIR and manual feedback inherit the selected node's output ledger. Editing a root or choosing a composer clears the working ledger. Rebinding voices in Manual and returning to Auto starts a fresh lineage from the active automatic seed. Source-version mismatches in archived replay retain the existing explicit error.

`continuity-1` and `splice-1` remain available. A frozen 30-seed Continuity I tree digest and the existing legacy digest protect their behavior. Memory settings must not silently alter earlier composers. Imported ledgers are validated records supplied by the file, not authenticated evidence of an external history.

Trees remain bounded at 85 automatic / 341 manual nodes. A ledger retains 12 items, each source passage at most 320 characters and ending at most 500. The chronicle still retains 108 epochs; source indices, timers and retention limits are unchanged.

## Measurements and verification

The 250-epoch seed-137 benchmark (`npm run bench:sources -- --memory`) ran on Node v24.13.1 / Windows x64 with sources already read from disk and theatrical waits disabled. Source preparation took 91.7ms; the first epoch including yielded indexing took 1,045.7ms. The next 249 epochs had median 1.05ms and p95 4.35ms. The maximum population was 85. The final 108-entry archive validated and serialized to 1,155,801 bytes, larger than the previous release because it preserves both input and output memory. This is local engine timing, excluding browser rendering and network, not a physical-phone benchmark.

The 43-test suite covers memory bounds, sibling independence, exhausted-pool revisits, malformed imports, copied inheritance, exact replay and interrupted/resumed lineages. Browser emulation covers 320–1920px widths and 844×390 landscape. The memory panel and surrounding layout held their dimensions across live samples; selecting an impression preserved its passage and pinned specimen while later epochs advanced. Browser replay reproduced the archived input ledger, exact heir, output ledger and probability vector; FOLLOW HEIR restored the winning ledger. Rebinding from three sources to N_Land alone restarted at epoch zero with empty memory, then filled all twelve impressions from N_Land. The production preview started automatically at 1× with no failed requests or page errors. Long memory passages scroll within a fixed reading region.
