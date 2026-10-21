# MouldMaster 2026.10.22.1 — Book-only Read Aloud and audio output diagnostic

**STATUS: EXACT-SOURCE SOFTWARE CANDIDATE VERIFIED / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Read Aloud is available in the Book only; lessons, exams and generic page text are not narration sources. The **Test phone sound** control sends two short tones to check browser audio output. Use **Book Listen** to check speech. Browser checks cannot confirm audible output through physical headphones or Bluetooth.

## Current exact-source technical candidate (retained; automated checks passed)

Release `2026.10.22.1` candidate source `b511ca1f8d9407df7fafc292ff1fb36334b3a114` was retained by [Pre-merge Public Candidate run 39651883205](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883205) as artifact **12369292973**, `physical-pwa-candidate-b511ca1f8d9407df7fafc292ff1fb36334b3a114`, digest `sha256:c155973f62e388b88f20df6808d95294b0b460be7ad79bc25808f7131aee176b`, expiry `2027-01-19T18:20:50Z`, with public-runtime fingerprint `sha256:2a7b3cbb95ca106cf7c765ad036f6767fa0fc58a75ae9a1d4e1289bb296d877f`.

Exact-source software checks passed:

- [Read Aloud QA run 39651883188](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883188) — 51 tests passed, including delayed startup, late `onstart`, sentence chaining after page hide, and recovery when the device reports a paused queue.
- [Mobile Browser QA run 39651883306](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883306) — Chromium and WebKit substantive suites, cross-browser, visual/reachability, and all five 100-run reliability shards passed.
- [Question Quality 50-Pass run 39651883459](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883459) — passed.
- [Combined Learn/Book QA run 39651883133](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39651883133) — passed.

These checks verify software behavior only. They do not confirm audible speech while a physical phone is locked or in a pocket. Screen-off audio and every independent external review remain HOLD.
## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.22.1.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.22.1.md` — **HOLD**, physical Android/iOS install, update, offline behavior, audible Book speech and sustained screen-off continuation.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.22.1.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.22.1.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.22.1.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.22.1.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.22.1.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.

The screen-off change removes MouldMaster’s pause-on-hide behavior and allows delayed voice start and sentence chaining while the page is hidden. Browser or operating-system speech may still pause or stop while the phone is locked; actual screen-off audio requires physical-device verification. No remote narration or Book-content change is introduced.
