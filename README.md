# Hyperstition Engine — The Automatic Cathedral (v0.17)

A browser-local cyber-occult writing instrument. It starts exploring by itself: a random seed and five simple rules grow branching fiction, select an heir, and feed the result back into the next generation. A visible **AUTO / MANUAL** switch lets you take control at any moment. No LLM or remote inference is involved in generation.

## Watch the automatic cathedral

Open the site and wait for the corpus to bind. Automatic mode supplies its own entropy and begins from seed **137**. Change **ORIGIN SEED** and choose **RESTART FROM SEED** to unfold another path. The rule trace explains each decision; the ancestry map grows one generation at a time. Every fifth epoch selects by seeded chance; other epochs balance new vocabulary against echoes of the previous origin.

Each automatic tree has at most 85 nodes. The engine retains 12 recent decisions, 200 session transmissions, and 108 completed epochs in the browser-local chronicle. Hidden tabs pause; returning retries any unfinished epoch without advancing its seed. Switching to Manual stops automatic work and keeps the visible fragments available for inspection. Restarting a seed starts a fresh path while preserving the chronicle.

Replay requires the same seed, corpus version, and source selection/order. Wall-clock times and record IDs vary; decisions and generated fragments reproduce. The ordinary manual Markov and grammar rituals are not seeded replays.

The **CLOCK SPEED** dial spans **0.25×–32×**. At the default **1×**, the circuit charges for 0.8 seconds, reveals each generation for 1.5 seconds, then holds its chosen heir for **8–18 seconds**, scaled to its word count. Change the dial with a pointer or arrow keys; SLOW, HUMAN and OVERDRIVE are quick presets. **PAUSE CLOCK** retains the unfinished beat. Changing speed or holding the clock never changes the seeded decisions. Restarting a seed releases pause and retains the selected speed.

Select a graph node or choose **PIN TO READ** to hold a specimen while growth continues. **FOLLOW LIVE** returns to the moving lineage; CANONIZE preserves the inspected fragment with its original epoch and source trace. The map reserves node positions before growth, and reading panels hold their size as content changes. The chronicle initially mounts 12 fossils; **EXHUME 12 OLDER EPOCHS** reveals more without reducing export or retention. Automatic mode presents the archive directly; switch to Manual for replay and possession controls.

## Run

**v0.19 / The conductor:** automatic mode now rotates all eleven ghosts, invokes seeded Markov and grammar rituals, charges the cog, multiplies transmissions, inoculates origins, prunes branches and performs rebirths. A switchboard lights each action; live plots and an epoch ledger show the consequences. See [the rules, replay contract and verification](docs/CONDUCTOR.md).

**v0.18 / Context & memory:** Continuity III is the automatic default. A narrow, audited screen removes passages that point back to missing context. The reader separates inherited text, borrowed prose and authored endings; PASSAGE CUES exposes the screen's findings. Earlier composers remain available for exact replay. See [the candidate audit, comparison and limits](docs/CONTEXT_SCREEN.md).

**v0.17 / Ancestral memory:** Continuity II introduced ancestral memory. Each branch remembers its last 12 source passages and authored endings, making room for fresh choices before letting old ones return. The memory inspector shows these impressions; selecting one pins its branch. Only the surviving branch's memory feeds the next epoch. Manual mode and archives retain Continuity I and the original word-splice composer. See [the rules, 900-epoch comparison and limits](docs/ANCESTRAL_MEMORY.md).

**v0.16 / Continuity:** the automatic composer carries a recurring image through three passages: an inherited sentence, an intact source span and an authored transformation. An indexed lexical shortlist and seeded probability draw select the source. The gold spectrum shows the actual conditional probabilities, surprisal and entropy. Larger fixed reading windows and word-count-based pauses give the passage room. Manual mode exposes both the new composer and the preserved word-splice baseline; old chronicles recall their original composer. See [the comparison, mathematics and limitations](docs/CONTINUITY.md).

**v0.15 / Source memory:** EXAMINE THE GRAFT now pins the live specimen and shows the recorded extraction with its borrowed span highlighted. PUNCTUATION UNITS exposes conservative boundaries for inspecting where the current word window cuts a thought. New tree, chronicle and transmission exports retain the source address and extraction. Older archives remain readable. Source labels do not establish the speaker or exact work inside a mixed collection. See [source evidence and measurements](docs/SOURCE_EVIDENCE.md).

Requires Node.js 18+ and npm.

```sh
npm ci
npm run dev
```

The processed corpus is already included. Python is only needed to ingest additional source material; see [INSTRUCTIONS.md](INSTRUCTIONS.md).

## Ritual

1. **Take control.** Choose **MANUAL** in the top bar, then bind one or more aspects. Engines rebuild from only the selected sources; the status strip reports when training finishes.
2. **Charge the field.** Move a pointer through the canvas, or use the keyboard-accessible **CHARGE FIELD +** button.
3. **Choose the rupture.** Markov recombines corpus transitions. Grammar moves from prophecy (0–300), to acceleration (301–700), to void (701–1000).
4. **Invoke.** A single transmission or a 50-transmission batch costs 20 entropy per ritual. Entropy influences Markov's minimum output length and grammar's template category; random choices use the browser's pseudorandom generator.
5. **Preserve.** Copy or export the log, including each transmission's time, aspects, protocol, entropy, and cycle. The latest 200 transmissions live in memory and are lost on page reload or close.
6. **Rebirth.** Reset the field and increment the cycle while preserving the current session's history.

Generated fragments are creative recombinations, not attributed quotations or factual statements. Source extraction artifacts can appear in outputs.

## Verification

```sh
npm test
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

The tests cover seeded automatic decisions and replay, interruption and inheritance, population and archive bounds, grammar rebinding, and entropy phase boundaries. Production corpus modules are loaded through Vite's asset graph; no development-only source URLs are required. Large corpus chunks are expected and loaded only when an aspect is selected.

## Structure

- `src/App.jsx`: binding lifecycle and shared single/batch generation
- `src/components/EntropyPool.jsx`: responsive Canvas 2D field and accessible charging
- `src/components/OracleDisplay.jsx`: attributed session log, copy, and export
- `src/engine/`: worker-based Markov model and grammar engine
- `src/engine/automatic.js`: deterministic rule controller and bounded automatic epochs
- `src/store/entropyStore.js`: entropy, aspect selection, history, and cycles
- `src/assets/corpus/`: bundled processed source texts
- `ingestor/`: optional Python corpus pipeline

The visual identity draws on cybernetic fiction, ritual computing, and handmade operating systems. Google Fonts enhance the typography when online; local fallback fonts remain available.

## v0.11 — Xenogenesis

The chapel now grows a branching fiction organism. Open **ENTER THE SPRAWL**, give it a seed phrase, set branching and generation depth, and open the circuit. Up to 341 descendants inherit and mutate source fragments. Inspect a node, feed it back into the origin, canonize it into the log, or burn its subtree. Export the organism as JSON to preserve settings and ancestry.

Click the field's central cog to sign its seal and add 137 entropy. The field grows filaments with the organism's population. The replay seed reproduces a run when its source corpus, selection/order, and controls match.

See [XENOGENESIS.md](docs/XENOGENESIS.md) for the Land reading notes, precise control behavior, and replay conditions. The sprawl is session memory: a new run replaces the displayed tree, so export it before starting another.

## v0.12 — Autopoiesis

The flow can now choose its own heir and continue automatically for 3, 9, or 27 epochs. Choose novelty, return, or seeded chance as its selection pressure. Every completed epoch is saved in a browser-local chronicle; import/export and recall controls let you recover or continue its lineage. Fuel and interruption controls remain live.

See [AUTOPOIESIS.md](docs/AUTOPOIESIS.md) for selection formulas, entropy costs, replay conditions, and the 108-epoch retention limit. The chronicle persists across reloads; the transmission log and currently displayed tree remain session-only.

## Constitution, reading, and future work

- [Constitution](CONSTITUTION.md): creative and operational principles.
- [Land reading and output analysis](docs/research/LAND_READING_2026-09-05.md): primary sources, interpretations, and observed coherence failures.
- [Roadmap](docs/ROADMAP.md): source fidelity, semantic retrieval, motif memory, interacting lineages, and performance gates.
- [Project agent guidance](AGENTS.md) and [evolution log](docs/EVOLUTION_LOG.md): evidence-based changes to this repository's working practices.

The new composer uses sentence heuristics, an inverted lexical index, inverse-document-frequency overlap and temperature-controlled sampling. No semantic encoder is shipped. Novelty, echo and lexical fit measure vocabulary overlap; probability statistics describe the sampled shortlist. None measures meaning or profundity.

## Vercel deployment

Import `MachineKomi/HyperstitionEngine` into Vercel, use **main** as the production branch, and keep the **Vite** preset, root directory `./`, build command `npm run build`, and output directory `dist`. No runtime secrets or server functions are required. `vercel.json` records the build settings and immutable caching for fingerprinted assets. Local `.vercel` links and environment files stay out of Git.

See [Vercel's Vite guide](https://vercel.com/docs/frameworks/frontend/vite) and [Git integration](https://vercel.com/docs/git/vercel-for-github).
