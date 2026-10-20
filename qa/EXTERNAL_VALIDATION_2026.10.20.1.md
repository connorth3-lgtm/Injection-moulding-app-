# MouldMaster 2026.10.20.1 — protected-main Read Aloud successor HOLD

**STATUS: TECHNICAL CANDIDATE BUILD PENDING / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This successor stages the Book Read Aloud callback fix that treats an active utterance's `onend` as completion when a mobile voice provider omits `onstart`, along with new exact release/cache identity. The candidate is non-publishing; it does not represent a live Pages deployment. A retained exact-source artifact and exact-head technical checks are still pending.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.1.md` — **HOLD**, real NVDA + VoiceOver review
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.1.md` — **HOLD**, physical Android/iOS PWA and audible Book speech
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.1.md` — **HOLD**, signed Windows distribution
- `qa/BOOK_SME_REVIEW_2026.10.20.1.md` — **HOLD**, independent Book SME
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.1.md` — **HOLD**, independent curriculum SME
- `qa/LEARNER_PILOT_2026.10.20.1.md` — **HOLD**, human learner outcome pilot
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.1.md` — **HOLD**, NZQA/provider G1–G8

## Release boundary

1. Exact-source artifact provenance will be recorded only after the governed Pre-merge Public Candidate workflow succeeds for this release identity.
2. Real-device install/update/offline and audible-speech confirmation, human NVDA/VoiceOver, Book and curriculum SME, learner outcomes, Windows signing, and provider G1–G8 evidence remain **HOLD**.
3. Technical automation does not confer external approval, accreditation, efficacy, machine-control or production authority. No testers are invited by this staging record.

Source of truth: `data/release-external-validation-v1.json`.
