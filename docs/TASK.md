# Hyperstition Engine - Critical Fixes & Polish

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
