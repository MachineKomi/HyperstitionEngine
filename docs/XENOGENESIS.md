# Xenogenesis: reading translated into a machine

The starting point was the bundled [Nick Land corpus](../src/assets/corpus/N_Land.json), derived from *Fanged Noumena*, and the repository's [semantic core](../bootstrap/HyperstitionEngine_semantic_core.md). This corpus includes editorial material as well as the collected writing; the interface's marginalia are design interpretations, not quotations.

Two passages guided the implementation:

> inputs program its outputs and its outputs program its inputs

> Long-range positive feedback is neither homeostatic, nor amplificatory, but escalative.

The resulting feature makes feedback a writing operation: each descendant retains a literal fragment of its parent, adds a fragment from a selected source, and passes through one of six original composition rules. Selecting a descendant and feeding it back makes its text the literal origin of the next run.

## The organism

- Branching: 2–4 children per parent.
- Depth: 1–4 generations.
- Population includes the origin: 1 + b + b² + … + bᵈ. Maximum: 341.
- Foreign matter changes the lengths of the inherited and incoming fragments. It is a mixing control, not a statistical percentage of the final sentence.
- REPLAY SEED drives a deterministic PRNG. Equal seed, source selection/order, corpus version, root, branching, depth, and foreign matter reproduce the same unpruned tree.
- Each child records its parent, generation, operator, source ID, inherited fragment, and incoming fragment.
- FEED BACK copies the selected node into the seed phrase and advances the epoch. OPEN THE CIRCUIT performs the next run.
- CANONIZE copies the selected fiction and its provenance into the session transmission log.
- BURN BRANCH prunes the selected node and its descendants from the temporary organism. The origin and sibling branches survive; already canonized text stays in the log.
- SEVER cancels between generations. Finished generations remain available.
- EXPORT THE ORGANISM downloads settings and the full current tree as JSON. Starting a fresh run replaces the displayed tree; export it first to preserve it.
- Signing the cog adds 137 entropy. Its seal counter and the organism population affect the field's drawing.

One run costs 20 entropy when it starts, including an interrupted run. The machine remains local; there is no generated-text network request. Randomized replay seeds use browser crypto; deterministic mutation uses the saved seed. This is a creative writing instrument, not a claim of supernatural access.

## Checks

Regression coverage includes all 341 parent links, source traces, deterministic replay, branch pruning, cancellation, feedback inheritance, and dimension validation. UI checks cover growth, selection, canonization, feedback, pruning, export, and desktop/mobile layout.
