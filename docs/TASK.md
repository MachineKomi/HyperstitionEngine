# Hyperstition Engine - Critical Fixes & Polish

The v0.9 items below are historical. Current direction and acceptance criteria live in [ROADMAP.md](ROADMAP.md).

- [x] Fix White Screen (CSS) <!-- id: 0 -->
    - [x] Flatten `src/index.css` and ensure dark theme variables are applied to `body`.
- [x] Unblock Loading (Markov Engine) <!-- id: 1 -->
    - [x] Create `src/engine/markov.worker.js` to offload heavy training.
    - [x] Update `src/engine/markov.js` to communicate with the worker.
- [x] Fix Particles (EntropyPool) <!-- id: 2 -->
    - [x] Remove flocking/flow field logic from `src/components/EntropyPool.jsx`.
    - [x] Implement simple dust physics (random float) and mouse swirl.

## Visual & UX Polish
- [x] Update Documentation <!-- id: 3 -->
    - [x] Update `README.md` with new screenshot `Hyperstition_Engine_v0.9.0_Screenshot01.png`.
- [x] Enhance Loading Screen <!-- id: 4 -->
    - [x] Add more scrolling text (pre-generated, looping).
    - [x] Slow down character scramble (3x slower).
    - [x] Add more blank and weird ASCII characters.
    - [x] Fix loading bar pacing (fake progress to match initialization).
- [x] Improve Entropy Pool <!-- id: 5 -->
    - [x] Increase particle count (2x/3x).
    - [x] Add warping grid effect.
- [x] Fix Layout <!-- id: 6 -->
    - [x] Restrict application width to 50% of window.
- [ ] Address Visual Feedback (Round 2) <!-- id: 7 -->
    - [ ] Fix Loading Screen white border (make full screen fixed).
    - [ ] Fix Main App background (ensure dark void covers all).
    - [ ] Fix Generated Text (Left align, larger font).
    - [x] Fix Layout Width (Ensure app container is 50vw).

## Future Polish & Features (v0.9.2+)
- [ ] Advanced Entropy Visuals <!-- id: 8 -->
    - [ ] Layered Particles: Implement depth illusion with varied size, brightness, and parallax speed.
    - [ ] Space-Time Grid: Refine grid to be a "thin wire" mesh that warps responsively to mouse movement.
- [ ] Enhanced Oracle Interface <!-- id: 9 -->
    - [ ] CLI-Style Output: Implement scrolling history window (new text pushes old text up).
    - [ ] Session History: Store all generated text in session.
    - [ ] Copy All Button: Add button to copy entire session history to clipboard.

## Machine Chapel v0.10
- [x] Replace fixed-width layout with responsive amber console.
- [x] Render orbital field, layered particles, and pointer-deformed wire grid.
- [x] Add keyboard/touch-friendly charge control and reduced-motion support.
- [x] Make selected aspects retrain both engines.
- [x] Package corpus imports for production builds.
- [x] Add worker lifecycle cleanup, unique requests, errors, and timeouts.
- [x] Connect batch generation to the shared engine instances.
- [x] Record and export attributed session transmissions.
- [x] Add rebirth cycles that preserve session history.
- [x] Add regression tests and lint configuration.

## Xenogenesis v0.11
- [x] Read Land's feedback and escalation passages in the bundled corpus.
- [x] Build deterministic source-traced mutation trees with up to 341 nodes.
- [x] Add selectable radial ancestry map and accessible fragment selector.
- [x] Add feedback, canonization, subtree burning, cancellation, and JSON export.
- [x] Add cog signing and population-responsive field filaments.
- [x] Add purple-black sprawl chamber and reading marginalia.
- [x] Cover deterministic growth, ancestry, pruning, cancellation, and feedback with tests.

## Autopoiesis v0.12
- [x] Add repeated epochs with novelty, return, and seeded-chance selection.
- [x] Chain each winning text and replay seed into the next origin.
- [x] Account for fuel per started epoch and stop on exhaustion or cancellation.
- [x] Persist the last 108 completed epochs in browser storage.
- [x] Add validated chronicle import/export, replay, and heir recall.
- [x] Add mint-green flow console and source-traced fossil record.
- [x] Verify automatic inheritance, persistence, replay, cancellation, deduplication, and mobile layout.

## Automatic Cathedral v0.13
- [x] Start seeded rule-based exploration on load with no setup clicks.
- [x] Keep AUTO / MANUAL visible and allow immediate interruption and seed restart.
- [x] Show five rules, a bounded decision trace, live ancestry, and automatic heirs.
- [x] Bound automatic trees to 85 nodes, recent decisions to 12, and session transmissions to 200.
- [x] Pause hidden-tab work and preserve deterministic continuation.
- [x] Fix oversized inherited roots, resumed mutation progression, and repeated mode selection.
- [x] Add a source-grounded Land reading, constitution, roadmap, and evolving repository instructions.
- [x] Implement responsive layouts, touch controls, and reduced/offscreen animation work.
- [x] Add Vercel build configuration; deployment status is recorded in the release handoff.
- [ ] Implement source-span addressing and clause preservation (roadmap 0B/0C).
- [ ] Benchmark optional local semantic retrieval (roadmap 1A).
