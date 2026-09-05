# The manifold of returns · v0.21

The atlas gives the last 96 completed automatic heirs three views: a 2D measurement plane, an orthographic 3D space, and a six-dimensional state space folded through three coordinate planes before projection onto the screen. It is an exploratory diagram of recorded engine behavior. It does not add a neural model, alter the composer or change the conductor's random stream.

## What a point and an edge mean

Each point is a completed heir. Its inspector retains text, source ID, epoch, original conductor seed and tree seed. Its coordinates use fixed scales:

| Coordinate | Normalized measurement | Included in |
| --- | --- | --- |
| 1 | Lexical novelty | 2D, 3D, 6D |
| 2 | Lexical echo | 2D, 3D, 6D |
| 3 | Tree population / 85 | 3D, 6D |
| 4 | Conductor entropy / 1000 | 6D |
| 5 | Surviving population / born population | 6D |
| 6 | Mutation fraction | 6D |

Values are clamped to [0,1], centered to [−1,1], rotated, then scaled by `1/sqrt(dimensions)` for display. The coordinates are not z-scores, embeddings or independent random variables. Several are related by the engine's rules. Fixed scales prevent incoming points from repositioning existing measurements through automatic normalization.

Gold edges join consecutive completed epochs from the same origin seed. These are succession edges, not claims that one point directly caused every feature of the next. Violet edges connect each point to its two nearest neighbors by Euclidean distance in the selected normalized measurement dimensions; ties use record order and duplicate undirected edges are merged. Camera movement does not recompute neighbors. Changing dimensionality does, because it changes the measurement space. Neighbor links do not assert semantic similarity or causal influence.

The coordinate cage has `2^d` vertices and `d * 2^(d−1)` edges. At six dimensions that is 64 vertices and 192 edges. The three folds rotate coordinates 1↔4, 2↔5 and 3↔6, with angles `f`, `0.73f` and `1.17f`. Rotations preserve Euclidean distance in the full space. Orthographic projection discards coordinates, so distance preservation does not extend to the resulting screen image. The regression suite explicitly constructs two different six-dimensional states with identical initial screen positions, then separates them by folding.

## Interaction and bounds

Use the dimension buttons, drag orbit, keyboard arrows, zoom, elevation and fold sliders. PAN VIEW (or Shift-drag) moves the camera across dense regions. FRAME HISTORY centers and enlarges the retained points; it is a deliberate camera action, not an automatic rescaling of the measurements. RESET VIEW restores the coordinate cage. A slow display-only orbit is available in 3D/6D. Selecting a point, choosing an heir from the native selector or stepping through heirs holds a complete record. Held text uses a stable element identity, preserving its scroll position. If the record leaves the live 96-heir window or the origin seed changes, its inspector remains available until FOLLOW LIVE is selected. The larger chronicle and exact source-graft inspector remain separate instruments.

Touch gestures preserve vertical page scrolling on the canvas, and the existing page-scroll lane remains clear. The canvas reserves its dimensions before drawing, caps pixel density at 2, and redraws its orbit at at most 30Hz. It draws no orbit frames when offscreen, the document is hidden, reduced motion is requested, the engine is manual or its clock is paused. Rendering uses Canvas 2D with no extra dependency, WebGL runtime or physics simulation. Neighbor search runs on data/dimension changes rather than frames. At 96 nodes it evaluates 9,216 candidate distances, with at most 192 unique proximity links and 95 succession links. The inspector holds at most one additional record outside the live window.

## A perspective that can be contradicted

The existing [Land reading](research/LAND_READING_2026-09-05.md) motivates making return paths visible. The [Nietzsche reading](GEOMETRY.md) distinguishes a form's origin from its later function. Here the same history admits several views, while source IDs and seeds stay attached to the selected record. The philosophical interpretation does not supply a numerical result.

In Abbott's *Flatland*, the Square struggles to distinguish movement within his familiar plane from movement out of it; later, communicating the new dimension proves harder than repeating a memorable phrase. This suggests an interface that lets a reader manipulate an example instead of accepting an impressive label. The coordinate cage and the deliberately overlapping test pair are demonstrations of projection, not claims that the browser displays literal six-dimensional space. [Primary text, §§16–22](https://www.gutenberg.org/files/97/97-h/97-h.htm).

Hamming's *You and Your Research* connects ambitious problem selection to having a workable approach, and argues for communicating why a result matters before immersing an audience in detail. The engineering interpretation is to give each diagram an answerable question and visible controls: which epochs followed one another, which measured states resemble one another, and what disappears when a dimension is discarded? [1986 talk transcript hosted by the Naval Postgraduate School, pp. 5–8](https://edocs.nps.edu/AR/topic/misc/Hamming%20Lecture%20YouAndYourResearch.pdf).

An authored proposition for this instrument: *Every projection loses a world. Every edge makes a claim. Keep the witness beside the image.*

## Guidance amendment

The user requested evolving project instructions. This checkpoint adds one repository-scoped rule to AGENTS.md: name projected dimensions, scales and edge semantics; do not let the camera redefine data relationships; retain a non-spatial selector for overlapping points. Evidence is the tested counterexample in which distinct six-dimensional states share a projection. This clarifies the existing traceability and accessibility principles; it does not alter assistant identity, authority or permission boundaries.

## Compute measurement

`node scripts/benchmark-atlas.mjs` uses a synthetic maximum-window fixture of 96 states, 20 warmups and 100 measured repetitions. In this local Node run, graph construction took median 1.981ms / p95 3.666ms. Projection of all 96 states and 64 cage corners took median 0.0667ms / p95 0.2078ms. The fixture yielded 121 proximity edges, 95 succession edges and 192 cage edges. These are model/projection timings, excluding canvas drawing, React, source loading and physical-phone behavior. No mobile performance improvement is inferred from them.

## Release checks

All 66 tests, lint, build and whitespace checks pass. Production-preview Chromium checks cover 320×740, 390×844, 700×900, 768×1024, 1024×768, 1440×1000, 1920×1080 and 844×390. No horizontal overflow was observed; atlas controls retained 44px height and its reader cleared the page-scroll lane. A vertical emulated touch swipe over the graph moved the document from scrollY 2498 to 2873.

Three distinct rendered views, fold control, mouse orbit, keyboard rotation, panning, framing, point picking and the native heir selector were exercised. Across completed-epoch counts 15→18, ten phone rectangle samples retained the atlas at 251×1692.11px, its canvas at 227×320px, its inspector at 251×710.83px and its reader at 227×220px. Held text retained scrollTop 35. A separate development fixture repeated real observed measurements into 96 records and replaced the entire window; held text and scrollTop 40 survived eviction. The fixture is not a claim of 96 independently generated epochs.

In a fresh production-preview session after layout settled, reduced motion yielded zero additional canvas redraws over 1.008 seconds; ordinary orbit yielded 22 over 1.007 seconds; pausing yielded zero over 0.716 seconds. The measured orbit rate was about 22Hz on this host, below the 30Hz cap. Offscreen sampling in the broader interaction run also recorded zero redraws. Initial visibility/resize paints are separate from continuing animation.

The hosted release is checked separately after Git publication. These browser measurements use desktop Chromium and emulated touch/viewport sizes, not physical iOS or Android hardware. The existing corpus-loading cost and baseline advantage over the neural observer remain unresolved by this graphical release.
