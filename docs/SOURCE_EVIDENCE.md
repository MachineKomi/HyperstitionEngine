# Source memory · v0.15

The generator previously retained a source group and its cut phrase. It now records the extraction unit, the exact span that supplied the phrase and a fingerprint of the bundled corpus. The reader can see what surrounded the cut. This release does not change the word-window composer, filter its vocabulary further or claim improved literary quality.

## Reading the evidence

Open EXAMINE THE GRAFT to pin a live specimen. The gold highlight is the original borrowed span, before whitespace normalization. PUNCTUATION UNITS separates conservative punctuation boundaries without truncating words or splitting at commas. These are inspectable units, not certified grammatical clauses. The reading surface keeps its height; longer evidence scrolls inside it. FOLLOW LIVE releases the specimen.

The same evidence appears under TRACE THE ANCESTOR in new fossils. Tree and chronicle JSON exports retain it; transmission text exports include its address and extraction. Old archives without an address display their original graft and an explicit missing-address state. Import validates span bounds, identity fields and agreement between the recorded slice and graft text. It does not authenticate a third-party archive's claims.

## Address and provenance

`source@corpus-fingerprint:unit` uses a zero-based extraction-unit index. The UI displays that unit number plus one. Character offsets are zero-based UTF-16 offsets with an exclusive end, matching JavaScript slicing. They address the bundled extracted string, not PDF pages or locations in the original edition.

The SHA-256 fingerprint covers `JSON.stringify(parsedCorpus)`, including its POS data. This deliberately ignores checkout line endings outside JSON strings. `npm run sources:catalog` regenerates the catalog; `npm run build` first checks it for staleness. Corpus additions require review of the resulting diff. No second full-text dataset is downloaded.

The original ingestion merged works under source groups and discarded section/speaker mapping. A group containing one listed file can name that file, while its quoted speaker remains unverified. Mixed groups cannot assign an exact work from their label. Flags for reference patterns, possible editorial matter, extraction damage, quotation marks and line breaks are heuristics. They do not automatically remove text: intentional experimental writing must not be treated as OCR damage merely because it is unusual.

## Audit and compatibility

All 11 bundled groups contain 88,197 extraction units; the unchanged generator filter accepts 51,919. This release removes **zero additional units**. The largest accepted original is 1,045 characters, below the 8,192-character archival evidence budget. The catalog includes group counts and overlapping flag counts.

Land's group contains 5,709 extraction units and 4,484 eligible units. Among eligible units the heuristic flags identify 3 possible editorial passages, 8 reference patterns, 3 possible extraction defects and 86 units with quotation marks. These counts are pattern matches, not a reviewed classification or a defect rate.

Tests inspect all 51,919 eligible units with four boundary/window combinations, including normalization and exact slicing. A baseline SHA-256 captured before implementation covers 30 seeded trees; after removing the newly added metadata, all text, IDs, ancestry and operators match it. New and legacy chronicle roundtrips, malformed addresses, whitespace, surrogate pairs, abbreviations, editorial fixtures, quotations, hyphenation and experimental line breaks also have coverage.

## Measured local cost

Run `npm run bench:sources` to reproduce the engine-only experiment. One run on Node v24.13.1 / Windows x64 used seed 137, N_Land + Bible + AI, and 250 automatic epochs. Corpus files were read before timing; intentional clock waits were disabled. It measured:

| Measurement | Observed |
| --- | ---: |
| Source preparation | 136.42 ms |
| Median epoch | 0.325 ms |
| p95 epoch | 1.544 ms |
| Slowest epoch | 4.109 ms |
| Largest tree | 85 nodes |
| Retained epochs | 108 |
| Pretty-printed archive | 180,589 bytes |

This is one local sample, not a phone benchmark or a comparison against the old implementation. It excludes network, rendering, storage writes and browser scheduling. The retained archive passed validation. Import allows files below 16 MiB to accommodate bounded context fields and JSON escaping; the 108-epoch retention bound is unchanged.

Browser checks at 320, 390, 768, 1024, 1440, 1920 and 844×390 CSS pixels found no horizontal overflow. Opening evidence pinned its address across subsequent epochs; switching evidence views retained panel height. Export/import retained source addresses and the recorded context. These are emulated viewport checks, not physical-device measurements.

## What this unlocks

This completes the address/inspection portion of roadmap 0B. Work/section mapping, reviewed extraction classes and a composition-ready clause dataset remain open. The next composer should select and transform intact units through a versioned adapter, preserve a recurring relation, and be compared against the unchanged baseline. Punctuation boundaries alone do not establish meaning or profundity.
