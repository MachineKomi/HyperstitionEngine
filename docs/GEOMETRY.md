# The geometry of consequence · v0.20

The mobile instrument now reserves a 32px page-scroll lane beside its readers and provides five persistent section shortcuts. Readers allow scroll chaining at their boundaries. The lane is a fixed sibling outside all nested scrolling panels: gestures over it scroll the document. Native scrollbars and safe-area insets are accounted for. On narrow phones the decorative brand label yields space to the auto/manual controls.

The new geometry chamber shows an actual small recurrent neural network, its learned readout, next-epoch lexical forecasts, source entropy and pruning. It is an observer: generation, corpus sampling, conductor decisions and archived composition versions are unchanged.

## The experiment

`reservoir-1` initializes a separate seeded stream. Each completed heir supplies 16 signed character-trigram hash bins, lexical novelty, echo, mutation and normalized tree population. Text work is capped before and after Unicode normalization at 1,200 code units. Hash collisions and word-form features are deliberate compromises; this representation does not establish semantic comprehension.

Twenty-four leaky tanh units receive 480 fixed input weights and 96 fixed recurrent connections. Each recurrent row has absolute weight sum 0.6; the recurrent update is contractive for fixed inputs. The leak rate is 0.35. A 25-weight linear readout, including bias, is clipped to [0,1] and updated with normalized LMS at learning rate 0.2, with weights bounded to [−2,2]. This is a small implementation of established reservoir ideas, not a claim to state-of-the-art NLP.

For epoch t, the engine first scores the forecast made at t−1 against the newly revealed novelty. It then updates the readout using the previous reservoir features, encodes the current heir, and forecasts t+1. The current text cannot alter an already-scored forecast. The comparison baseline is an exponential moving average with alpha 0.2. Both mean absolute errors use the same completed forecasts. No uncertainty interval or semantic quality score is implied.

Learning runs once per completed epoch, never on animation frames. History retains 48 scored predictions; source statistics use the existing last-96-epoch window. The fixed topology is shared between immutable updates. Resetting automatic history resets the observer with the active seed. Refreshing starts it afresh; its weights are not archived, and loading a fossil is not a neural-model replay. The geometry is memoized against unrelated parent updates.

## Measurement and contrary evidence

On the existing seed-137 production-preview recording from v0.19, 36 epochs supplied 35 prequential scores:

| Measurement | Result |
| --- | ---: |
| Reservoir MAE | 0.121588 |
| Moving-average MAE | **0.106419** |
| Median update, local Node process | 0.0416 ms |
| Maximum update in that process | 1.7055 ms |
| JSON-serialized observer state after 36 epochs | 17,944 bytes |

The simple baseline won this short stream. No hyperparameters were tuned to reverse that result. These timings include the update but exclude React rendering and source loading; they are not measurements on phone hardware. The JSON size is not JavaScript heap usage. A 3,000-step regression checks finite state, bounded features and history. A stationary-target test establishes that readout updates can learn, not that they improve engine predictions generally.

Re-evaluate any exported chronicle with:

```powershell
node scripts/evaluate-observer.mjs path/to/chronicle.json
```

The development recording is an ignored local QA artifact, not a bundled benchmark dataset. A useful next experiment needs multiple saved seeds, chronological holdouts, and feature ablation against the baseline before any proposal to couple prediction to generation.

Source entropy is `H = −Σ p log₂ p` in bits, using each winning source's share of retained completed heirs. Effective voices is `2^H`, the equal-share equivalent. Pruned population is `1 − sum(surviving)/sum(born)` over the same window. These quantities describe this engine's history. They are not external-world probabilities or literary judgments.

## Philosophy, art and a falsifiable machine

The [earlier Land reading](research/LAND_READING_2026-09-05.md) treats connection and return as design material. Here, recurrent edges correspond to actual signed weights; the circle is a chosen arrangement, not evidence of mystical geometry. An output meets a subsequent observation instead of becoming its own authority.

Nietzsche distinguishes a form's origin from its later uses in *Genealogy of Morals*, II §12. Functions are reinterpreted through changing relations. Our design interpretation is to expose what a system does now, how its weights change, and where the interpretation fails. This does not import his account of domination as an engineering objective. [Primary text, Horace B. Samuel translation](https://www.gutenberg.org/files/52319/52319-h/52319-h.htm).

Yoshimura and Tanaka's February 2026 preprint studies online reinforcement learning with an echo-state reservoir and recursive-least-squares adaptation under changing control dynamics. It supports investigating inexpensive online adaptation; its CartPole/HalfCheetah results are not NLP or browser evidence. This implementation uses a different, simpler normalized-LMS readout and does not reproduce their RL algorithm. [Preprint v1](https://arxiv.org/abs/2602.06326v1).

The artistic wager is that a fallible machine can be more captivating when its errors are visible. The gold and violet chords expose a mechanism; the baseline can disagree with it. Beauty is the experiment's presentation, not its validation.

## Release verification

All 60 tests, lint, production build and whitespace checks passed. Chromium production-preview checks covered 320×740, 390×844, 600×900, 700×900, 768×1024, 1024×768, 1440×1000, 1920×1080 and 844×390. No horizontal overflow was observed; mobile readers cleared the reserved lane and ghost controls retained 44px height. Five navigation links landed approximately 116px below the viewport top, clear of the sticky controls.

A wheel gesture over the lane moved the document 400px while the specimen reader stayed at scrollTop 0. An emulated touch swipe also moved the document. Scrolling at the bottom of the chronicle chained another 320px to the page. These are desktop Chromium viewport/touch-emulation checks, not physical iOS or Android device validation.

Eight desktop rectangle samples retained the geometry chamber at 1243.09×995.34px and the specimen panel at 515×1124px. At 320px, 28 samples across completed-epoch counts 9→12 retained geometry at 253×1644.94px, the tree at 251×240px and the specimen panel at 251×1190px. Pinned text survived live updates. The neuron selector and manual stop were browser-checked. No page errors appeared in the production interaction run. Existing corpus chunks remain the dominant loading cost; this release does not claim to reduce that cost.
