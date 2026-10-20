# MouldMaster 2026.10.20.5 — Android Read Aloud idle-cancel fix

**STATUS: EXACT-HEAD CANDIDATE PENDING / AUTOMATED QA IN PROGRESS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Release 2026.10.20.5 skips cancellation of an idle device speech queue before starting Read Aloud. No exact-source candidate artifact is retained yet, and no real-device audio result is claimed.

## Candidate status and technical evidence

No exact-source artifact has been retained for release 2026.10.20.5 yet. The producer will record source SHA, runtime fingerprint, artifact digest, expiry and run provenance after the exact-head candidate workflow and required software quality gates succeed. Until then, technical automation remains FAIL and tester handoff remains STOP/no-send. Automated browser checks cannot confirm audible output on a physical phone.

The owner-approved visual baseline remains pinned to its historical source and is used as an automated comparison reference. This Read Aloud behavior change does not alter the visible interface. The historical visual approval does not approve device behavior, accessibility, release or deployment.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.5.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.5.md` — **HOLD**, physical Android/iOS PWA install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.5.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.20.5.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.5.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.20.5.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.5.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.

