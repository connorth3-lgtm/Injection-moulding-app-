# MouldMaster 2026.10.20.1 — protected-main Read Aloud successor HOLD

**STATUS: EXACT-SOURCE TECHNICAL CANDIDATE PASS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This successor stages the Book Read Aloud callback fix that treats an active utterance's `onend` as completion when a mobile voice provider omits `onstart`, along with new exact release/cache identity. The candidate is non-publishing; it does not represent a live Pages deployment. The exact-source public candidate succeeded: source `0e31db7dec3a0f35bf296142cfb12bf4c6d164f0`, fingerprint `sha256:a208ca2c5fd94a00bde098f94232de14baf5625145ed2d7f2e6f09ce2caa20cf`, [producer run 39365753604](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39365753604), artifact `12239132766`, digest `sha256:d44e325a2fd88f41f72b561bcfdd4e700c6e8e2bfd1cebbb4a0ccfc21cc1bae5`, expiry `2027-01-18T03:43:08Z`. Exact-source [Mobile Browser QA 39365753819](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39365753819), [Question Quality 50-Pass 39365753816](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39365753816), and [Read Aloud QA 39365753925](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39365753925) passed. The candidate remains a non-publishing preview; all seven external reviews are HOLD.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.1.md` — **HOLD**, real NVDA + VoiceOver review
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.1.md` — **HOLD**, physical Android/iOS PWA and audible Book speech
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.1.md` — **HOLD**, signed Windows distribution
- `qa/BOOK_SME_REVIEW_2026.10.20.1.md` — **HOLD**, independent Book SME
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.1.md` — **HOLD**, independent curriculum SME
- `qa/LEARNER_PILOT_2026.10.20.1.md` — **HOLD**, human learner outcome pilot
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.1.md` — **HOLD**, NZQA/provider G1–G8

## Release boundary

1. Exact-source artifact provenance is bound to the successful governed Pre-merge Public Candidate workflow and exact candidate identity recorded above.
2. Real-device install/update/offline and audible-speech confirmation, human NVDA/VoiceOver, Book and curriculum SME, learner outcomes, Windows signing, and provider G1–G8 evidence remain **HOLD**.
3. Technical automation does not confer external approval, accreditation, efficacy, machine-control or production authority. No testers are invited by this staging record.

Source of truth: `data/release-external-validation-v1.json`.
