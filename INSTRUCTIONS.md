# Run the Machine Chapel

## Frontend

Install Node.js 18+ and npm, then run from the repository root:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The repository includes its processed corpus; no Python setup is required to use the oracle.

For a production check:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

## Optional corpus ingestion

To process your own PDF or TXT sources:

```sh
python -m pip install -r ingestor/requirements.txt
python -m spacy download en_core_web_sm
python ingestor/process_corpus.py
```

Keep private source files in the ignored `raw_corpus_source/` directory. The pipeline writes corpus JSON and its manifest to `src/assets/corpus/`. Rebuild the frontend after changing them.

## Operation

The site opens in AUTO mode. Wait for ORACLE ONLINE and watch the tree grow. The engine supplies entropy, chooses growth settings and selection pressure, and feeds each heir into the next epoch. Set ORIGIN SEED and choose RESTART FROM SEED to replay from the beginning. Use the top-bar MANUAL button to stop and take control. Hidden tabs pause automatically; no accumulated work bursts on return.

In MANUAL mode, select aspects, wait for ORACLE ONLINE, then charge the field with pointer movement or the CHARGE FIELD button. A ritual requires 20 entropy. INVOKE generates one transmission; MULTIPLY generates 50 using the current protocol and aspects.

REBIRTH resets entropy and increments the cycle. The latest 200 transmissions stay in the current session. Export or copy them before reloading or closing the page.

In AUTOPOIESIS, BEGIN POSSESSION runs successive epochs using the origin and growth controls above it. Choose a selection pressure and epoch horizon. Each started epoch costs 20 entropy; END POSSESSION interrupts the loop. The last 108 completed epochs are saved in this browser's chronicle. Export/import backs up that chronicle; REPLAY EPOCH restores its origin, source settings, and selection pressure, while FOLLOW HEIR starts from its winning fragment.

## Clock and inspection

- Automatic playback starts at 1×: 0.8 seconds to charge, 1.5 seconds per generation and eight seconds to read the heir. The speed range is 0.25×–32×; arrow keys adjust the focused CLOCK SPEED slider.
- PAUSE CLOCK holds the unfinished beat, including during growth. RESUME CLOCK continues it. A hidden tab still cancels its partial epoch and retries that epoch on return; neither mechanism accumulates catch-up work.
- Clicking a node in automatic mode pins that fragment. PIN TO READ also holds the current selection. FOLLOW LIVE releases it. Pinned text and its provenance survive subsequent epochs until unpinned or the seed is restarted.
- CANONIZE records the inspected fragment. EXPORT THE ORGANISM exports the current live tree, even if you are inspecting an older pinned fragment.
- The fossil view starts with 12 entries. EXHUME reveals older entries in batches of 12; exports include the full retained chronicle (up to 108).

## Checks and troubleshooting

- EXAMINE THE GRAFT pins the live fragment and opens its highlighted extraction. PUNCTUATION UNITS shows conservative boundaries; FOLLOW LIVE releases the pin. New fossils retain this source evidence after export/import. Older records explicitly lack an exact address.
- After changing a bundled corpus, run `npm run sources:catalog` and review the fingerprint/count changes. Production builds reject a stale catalog. `npm run bench:sources` measures 250 engine-only epochs with theatrical waits disabled; it is not a browser benchmark.

- `npm test`: engine/store regression tests.
- `npm run lint`: ESLint and React hook checks.
- If no aspects are selected, select one to enable binding.
- Failed corpus or worker operations show an error with RETRY BINDING.
- Clipboard access may be unavailable in some browser contexts; EXPORT saves a text file instead.
- Generation is local. Google Fonts are optional; system font fallbacks work offline.
- The inherited dependency tree currently reports npm audit advisories. Review them before exposing a development server publicly; the preview command above binds to loopback.
