# Feedback that changes its own conditions

Research and design notes, 5 September 2026. This is a close reading of selected texts, followed by an engineering interpretation. It is not a claim to have mastered Land's whole oeuvre, and it does not turn philosophical propositions into scientific findings.

The direction for Hyperstition Engine is **recognizable thought under transformation**: preserve a clause, object, or conflict long enough for its return to matter. Let a consequence become the next cause. Multiplication is the substrate; relationships are the work.

## Scope and source boundaries

The primary local source is [N_Land.json](../../src/assets/corpus/N_Land.json), an extracted corpus associated with *Fanged Noumena*. The publisher identifies the collection as writings from 1987–2007, edited by Robin Mackay and Ray Brassier. The corpus includes their introduction, bibliographic matter, quoted passages, and experimental forms as well as Land's writing. A source ID is therefore not sufficient authorship metadata. [Publisher's book record](https://www.urbanomic.com/book/fanged-noumena/).

References to `sentences[n]` below are zero-based JSON array indices, not printed page numbers. These are extraction units: some contain several paragraphs, others a single word. They should not become stable citation IDs without a corpus version or hash.

| Material inspected | Local anchors | External check | Scope of evidence |
| --- | --- | --- | --- |
| *Machinic Desire* | 2595 onward; especially 2632–2677 | [Publisher chapter](https://www.urbanomic.com/chapter/fanged-noumena-machinic-desire/) | Operations, actual/virtual circuits, reproduction and structural departure |
| *Circuitries* | 2355 onward | [Publisher excerpt, pp. 289–318](https://www.urbanomic.com/chapter/fanged-noumena-circuitries/) | Typography and changes of scale; excerpt is not the whole chapter |
| *Hypervirus* | 3208 onward | [Full publisher PDF, pp. 383–390](https://www.urbanomic.com/wp-content/uploads/2015/03/hypervirus.pdf) | Stammer, circulation, anticipation, medium changes, resource dependence |
| *Meltdown* | 3843 onward; especially 3843–3945 | [Publisher excerpt, pp. 441–460](https://www.urbanomic.com/chapter/fanged-noumena-meltdown/) | Narrative framing, cadence, sensory scenes, historical and speculative registers |
| *Barker Speaks* | 4391–4474 | Bundled text | Staged interview voice, signal systems, geological and bodily scale |
| *Critique of Transcendental Miserablism* | 5572–5611 | Bundled text | Polemic against judging all change as predetermined failure |
| *A Dirty Joke* | 5612–5707 | [Publisher chapter record](https://www.urbanomic.com/chapter/fanged-noumena-a-dirty-joke/) | Narrative doubling, exhaustion, retrospective doubt |

Publisher excerpts and the extracted book are two forms of the same underlying source, not independent corroboration. The technical sources below support engineering possibilities; they do not validate Land's philosophical claims. No participant study was conducted.

## Seven findings

### 1. More descendants do not necessarily mean a changed system

**Evidence.** In *Machinic Desire*, 2632–2649 treats machines through connections, switches, loops and what they do. The discussion at 2667–2674 distinguishes departure from reproduction from merely enlarging an unchanged form. Several passages quote or build upon Deleuze and Guattari; nested quotations require their own attribution.

**Interpretation.** A tree with 341 nodes can still repeat one sentence structure 340 times. The more demanding translation is to let an outcome alter a subsequent relation: which motif survives, which sources can meet, or which operator becomes possible.

**Build consequence.** Keep the simple seeded controller inspectable. Add explicit state variables and transition rules before adding more templates. Record the rule responsible for each transition. Confidence is high in the textual distinction and medium that this particular interface translation will be compelling.

### 2. Anticipation can be a concrete writing operation

**Evidence.** *Hypervirus*, printed pp. 384–386, connects expectations of a future to present actions that make it more likely. Its typography repeatedly interrupts and restarts the apparent message. Later, pp. 387–388 contrasts destructive crudity with more sustained propagation. [Publisher PDF](https://www.urbanomic.com/wp-content/uploads/2015/03/hypervirus.pdf).

**Interpretation.** An engine can announce a future image, condition later selections on that image, then reveal the earlier announcement when the image returns. This is an authored feedback mechanic, not a prediction of the external world. A slow recurrence may be stranger than constant intensification.

**Build consequence.** Prototype a delayed motif with an explicit lifetime and a visible ancestry link. Example written for this design note: *The archive predicts a door. The builders obey the archive. By dawn, the prediction has become a corridor.* Confidence is high in the source observation; the proposed mechanic remains untested.

### 3. Form carries information that sentence extraction loses

**Evidence.** The opening of *Circuitries* uses short lines, a close view of a face, an abrupt cut, and recession toward a screen's centre. The publisher preserves these line breaks. The corresponding local extraction at 2355 merges a large passage into one item. [Publisher excerpt](https://www.urbanomic.com/chapter/fanged-noumena-circuitries/).

**Interpretation.** Removing layout is not neutral cleaning. Yet keeping every OCR accident is not source fidelity either. Deliberate broken form and accidental broken extraction need different handling.

**Build consequence.** Preserve a display form beside normalized retrieval text. Give fragments explicit kinds such as prose clause, verse line, heading, quotation, and uncertain extraction. Build visual transitions around actual generation changes, with a quiet reading surface that remains stable. Confidence is high; the extraction problem is directly inspectable.

### 4. Coherence can survive a violent change of scale

**Evidence.** *Meltdown* moves between historical narration, technical polemic, urban heat, short declarations and speculative futures. The narrative opening is externally verifiable; the longer sensory and argumentative passages were read in the local corpus. The heat passage includes a quoted voice, so it cannot all be attributed to Land. [Publisher excerpt](https://www.urbanomic.com/chapter/fanged-noumena-meltdown/).

**Interpretation.** Abrupt scale changes can remain legible when an image or relation persists. A city becoming a circuit is more effective if the heat, debt, or movement that connects them remains perceptible. Historical forecasts in a 1990s text are part of its rhetoric, not proof of predictive accuracy.

**Build consequence.** Give each short sequence one sensory anchor and one relation to transform. Alternate expansive sentences with short cuts. Test whether a reader can describe what changed without consulting a metric. Confidence is medium: this is a close-reading judgment, not a measured quality result.

### 5. A voice is a location, not an automatic authority

**Evidence.** *Barker Speaks*, 4391–4474, presents its ideas through an interview apparatus, research biography and a speaker who shifts from signal analysis to geological time and bodily tension. The reader encounters institutions and explanations inside the text. These are not independently verified scientific credentials or evidence for its geophysical claims.

**Interpretation.** A speaking position can make incompatible registers productive. Mixing clauses while erasing who speaks creates a different, often weaker, effect.

**Build consequence.** Store source work, section, speaker or quoted author where known, extraction confidence and original span. Allow a lineage to carry a voice while its objects change. Mark deliberate crossings in the ancestry inspector. Confidence is high about the framing, medium about the proposed composition benefit.

### 6. The collection complicates a simple cult of breakdown

**Evidence.** *Critique of Transcendental Miserablism* argues polemically against a stance that dismisses every novelty in advance. *A Dirty Joke* subsequently uses doubled names, a ruined narrator and retrospective investigation to describe a labyrinth that also becomes a trap. These are different arguments and forms; one should not erase the other.

**Interpretation.** The project should make room for discovery, refusal, exhausted patterns and altered direction. Treating every malfunction as revelation would flatten the work as well as conceal bugs. This is a design reading of texts, not a diagnosis of their author or reader.

**Build consequence.** Preserve a visible exit from automatic mode, report failures plainly, and let sterile lineages end. Dark fiction need not demand the operator's submission. Confidence is medium, with the tension retained rather than resolved into a single doctrine.

### 7. The engine's own record shows that lexical novelty is insufficient

**Evidence.** A real three-epoch export from the existing engine, seed `424242`, used sources `N_Land`, `Bible`, `AI`, three branches and depth three. Winning lexical novelty scores were `0.9615`, `0.9474`, and `1.0`; root-word retention was `0.125`, `0.0385`, and `0`. The winning fragments included a broken technical reference, a split OCR word, and an inherited clause ending mid-construction. The local inspection artifact was `output/playwright/flow-chronicle.json`; it is an ignored test artifact, not a committed dataset.

**Interpretation.** The metrics perform their stated word-overlap function. Their names must not imply semantic understanding or literary judgment. Selection can reward the complete loss of a thought.

**Build consequence.** Evaluate clause integrity, motif continuity, repetition and source fidelity separately. Keep lexical novelty as one pressure, not the definition of profundity. Confidence is high for these three records; this tiny sample does not establish an overall defect rate.

## Modern NLP: a bounded experiment

The procedural generator currently slices short word windows and passes them through six composition templates. A model cannot repair the provenance lost before retrieval. The next architecture should be:

`versioned source spans → clean clauses → lexical shortlist → optional encoder reranking → constrained composition → diversity selection → bounded motif memory`

Sentence encoders make independently encoded text comparable, avoiding a separate full model pass for every possible pair. This supports retrieval and clustering, not automatic judgments of truth or depth. [Sentence-BERT, Reimers and Gurevych, 2019](https://aclanthology.org/D19-1410/).

Use `all-MiniLM-L6-v2` as a small, established baseline: its model card specifies 384-dimensional representations, short-text use, a default 256-wordpiece truncation limit and Apache-2.0 licensing. Confirm the exact browser-compatible export, revision and license files before integration. It is a baseline, not a claim to be the newest model. [Model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).

For a newer comparison, investigate EmbeddingGemma only in a separate benchmark. Its card describes 300M parameters, 768-dimensional outputs with trained smaller representations, and Gemma terms with gated file access. Browser export compatibility, latency, memory and asset delivery remain unverified here. Those costs make it a research candidate rather than the default recommendation. [Google model card](https://huggingface.co/google/embeddinggemma-300m).

Matryoshka representation learning offers an approach to adjustable embedding dimensions. This property must be trained into a suitable model; arbitrary truncation of the MiniLM vector is not an equivalent implementation. [Kusupati et al., paper revised 2024](https://arxiv.org/abs/2205.13147).

Transformers.js provides browser inference through ONNX Runtime, with WASM and optional WebGPU paths and model-dependent quantization choices. Load an encoder in a worker only when requested; retain the procedural path during download, unsupported hardware, cancellation or failure. Pin a tested package version and model revision together instead of assuming the documentation's moving `main` branch matches an npm release. [Official documentation](https://huggingface.co/docs/transformers.js/index).

No encoder was installed or benchmarked for this reading. No claim of improved model quality or speed follows from these notes.

## Corpus size and implementation implications

A local count on 5 September inspected the 11 JSON files containing a `sentences` array, excluding metadata files, and ran each through `SprawlEngine.loadCorpus`. It found 88,197 raw extraction units, 51,919 accepted by the current 6–65-word filter, and 10,277,829 source JSON bytes. Land contributes 5,709 raw units and 4,484 accepted units. Acceptance measures length and a small exclusion pattern; it does not certify prose quality or authorship.

A dense float32 index of all accepted units at 384 dimensions would require `51,919 × 384 × 4 = 79,747,584` bytes, approximately 76.1 MiB, before text, model, runtime, graph and cache overhead. This is a storage calculation, not a browser memory benchmark. Begin with selected-source shards and a bounded lexical shortlist. Measure cold asset loading separately from warm retrieval and composition.

## Decisions and remaining uncertainty

The [constitution](../../CONSTITUTION.md) translates this reading into project commitments. The [roadmap](../ROADMAP.md) puts source repair, replay and observable automatic rules ahead of expensive model work. These are engineering judgments made in response to the user's request, not instructions issued by the corpus.

Open work: establish source-span and quotation metadata; audit ambiguous extraction; create a fixed evaluation set; compare clause-preserving composition with the existing engine; and measure the optional encoder on actual mobile and desktop hardware. Literary coherence, surprise and unease require reader evaluation alongside reproducible mechanical checks.
