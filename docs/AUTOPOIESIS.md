# Autopoiesis: a loop with memory

**BEGIN POSSESSION** repeatedly grows the configured tree and chooses one leaf as the next epoch's origin. The latest tree remains visible in Xenogenesis. The fossil record retains each completed epoch's winning leaf, exact origin, source aspects, replay seed, branching, depth, foreign-matter setting, selection pressure, and source traces.

## Selection pressures

- **The Outside:** maximize the fraction of the candidate's distinct words absent from the current origin.
- **Eternal Return:** maximize the fraction of the origin's distinct words present in the candidate.
- **Blind Providence:** choose by a deterministic seeded random score.

Words are lowercased letter/number sequences of at least three characters. Ties use seeded chance. These are mechanical word-overlap measures, not judgments of literary quality, factual truth, or semantic novelty.

## Flow

Choose 3, 9, or 27 epochs. Every started epoch costs 20 entropy. A completed epoch yields its heir, advances the seed by hashing that heir with the preceding seed, and increases foreign matter by three percentage points per subsequent epoch, capped at 100%.

The loop stops when the horizon is reached, the offering drops below 20, or you end possession. You can sign the cog during the run to replenish its offering. Ending possession aborts both between generations and during the inter-epoch pause. Completed epochs survive; interrupted partial trees remain inspectable but do not enter the chronicle.

The flow uses the source settings and origin configured above it. Controls that would replace its engines or settings remain locked while it runs.

## Memory

The last 108 completed epochs are saved under `hyperstition.chronicle.v1` in localStorage for this browser and origin. This is separate from the older session-only transmission log and temporary organism tree. New records beyond 108 replace the oldest records; export regularly to keep longer histories.

**EXPORT CHRONICLE** downloads the retained epochs. **IMPORT CHRONICLE** validates and merges such an export, deduplicating record IDs. The importer accepts the version-1 chronicle format, up to 108 entries and 2 MB. It does not accept the single-organism export format.

**REPLAY EPOCH** restores its original phrase, source selection, seed, and growth controls. Open the circuit to reproduce that tree against the same corpus version. **FOLLOW HEIR** installs the winning text and next seed as a new origin.

Storage failures are shown in the chamber; JSON export remains available. Nothing is sent to a remote service. Browser storage can be cleared by browser settings, so export is the portable backup.

## Validation

Tests cover selection, seed advancement, inherited roots, fuel accounting, exhaustion, aborting between epochs, archive validation, deduplication, and the retention limit. Browser checks exercise automatic epochs, persistence across reload, import/export, replay/recall, cancellation, and responsive layout.
