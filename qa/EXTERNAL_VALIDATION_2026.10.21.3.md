# MouldMaster 2026.10.21.3 — Book-only Read Aloud and audio output diagnostic

**STATUS: EXACT-SOURCE SOFTWARE CANDIDATE VERIFIED / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Read Aloud is available in the Book only; lessons, exams and generic page text are not narration sources. The **Test phone sound** control sends two short tones to check browser audio output. Use **Book Listen** to check speech. Browser checks cannot confirm audible output through physical headphones or Bluetooth.

## Retained exact-source technical candidate

- Source SHA: `d41c633ccddecd3a0c2b51a53d43c2eb3e345517`
- Public-runtime fingerprint: `sha256:1256759b71ceddc4089425bdc5f55950399e795913388e3766048baeddf19ea3`
- Producer: [Pre-merge Public Candidate run 39641015654](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39641015654)
- Retained artifact: `12364559971`, digest `sha256:0107743e97bf85be0c6e70feacc2aa53766de9d9e7afd30233c38c370e17aa07`, expires `2027-01-19T17:20:46Z`

Exact-source software quality checks passed:

- [Read Aloud QA run 39641015852](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39641015852) — 50 tests passed, including Android `synthesis-failed` without `onstart`, cursor retention and same-sentence retry.
- [Mobile Browser QA run 39641015779](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39641015779) — required Chromium, WebKit, cross-browser, visual/reachability and five 100-run reliability shards passed.
- [Question Quality 50-Pass run 39641015590](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39641015590) passed.
- [Combined Learn and Book QA run 39641015644](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39641015644) passed in Chromium and WebKit.

These checks verify automated software behavior on source `d41c633ccddecd3a0c2b51a53d43c2eb3e345517`. They do not verify actual Android speech-engine reliability or that a person can hear Book narration on a physical phone, headphones or Bluetooth. No tester invitation is authorized from this technical candidate.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.21.3.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.21.3.md` — **HOLD**, physical Android/iOS install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.21.3.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.21.3.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.21.3.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.21.3.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.21.3.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.

The Android recovery path preserves the sentence when its speech provider emits `synthesis-failed`; it exposes the text-to-speech engine/voice settings path and retries that sentence only after the learner taps Listen. It does not add remote narration or alter Book content.
