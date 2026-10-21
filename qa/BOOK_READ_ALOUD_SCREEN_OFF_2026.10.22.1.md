# Book Read Aloud screen-off behavior — 2026.10.22.1

## Change

The reader no longer pauses or cancels speech when the page becomes hidden. Delayed voice startup and sentence chaining remain eligible to continue after the learner starts Book playback. When the browser reports that it paused the speech queue, the reader tries to resume it when the page returns to the foreground and exposes a Resume control if it remains paused.

## Automated verification

The exact-source candidate is `b511ca1f8d9407df7fafc292ff1fb36334b3a114`, retained by [producer run 39651883205](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883205) as artifact `12369292973` with fingerprint `sha256:2a7b3cbb95ca106cf7c765ad036f6767fa0fc58a75ae9a1d4e1289bb296d877f`.

- Local `python qa_read_aloud.py`, JavaScript syntax, release identity, branch policy, supply-chain, Book architecture and exact candidate-binding checks passed.
- [Read Aloud QA run 39651883188](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883188) — 51/51 tests passed. The screen-off tests cover delayed startup while hidden, late voice start, sentence chaining after hide, and resuming a queue the device reports as paused.
- [Mobile Browser QA run 39651883306](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883306) passed the full Chromium and WebKit substantive suites, cross-browser checks and all five 100-run reliability shards.
- [Question Quality 50-Pass run 39651883459](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883459) and [Combined Learn/Book QA run 39651883133](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883133) passed.

## Physical-phone check still required

Automated browser tests cannot verify actual audio through a locked phone. On the preview, open the Book, select an installed voice that works (record Automatic separately if you test it), tap Listen, wait until the player says **Reading**, then lock the phone and place it in a pocket for a sustained listen. Record whether speech continues, pauses or stops. After unlocking, confirm the player offers a usable Resume path if the device paused the speech service. This actual Android/iOS device check remains **PENDING**; browser and operating-system behavior can still interrupt speech.
