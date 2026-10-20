# MouldMaster 2026.10.20.3 — Read Aloud default voice fix

**STATUS: EXACT-SOURCE CANDIDATE PENDING / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This release updates Book Read Aloud so mobile platforms can select their system default speech voice when no voices are listed. The release is a non-publishing validation candidate; it does not authorize production publication, tester invitations, accreditation, learner efficacy claims or production use.

## Current candidate and technical evidence

The release-specific exact-source candidate artifact has not yet been produced. Its producer run, source, artifact digest and runtime fingerprint will be recorded here only after the candidate workflow completes successfully. Release `2026.10.20.2` is historical and does not validate this release.

The owner-approved visual baseline remains pinned to its historical source and is used as an automated comparison reference. This Read Aloud behavior change does not alter the visible interface. The historical visual approval does not approve device behavior, accessibility, release or deployment.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.3.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.3.md` — **HOLD**, physical Android/iOS PWA install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.3.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.20.3.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.3.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.20.3.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.3.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.
