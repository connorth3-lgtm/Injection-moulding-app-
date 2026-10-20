# MouldMaster 2026.10.20.6 — preview-release external validation HOLD

**STATUS: TECHNICAL CANDIDATE PENDING / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This preview-only change is awaiting a successful exact-source candidate producer. No current retained technical artifact is recorded for 2026.10.20.6; the prior release's candidate and test reports are historical only. The `preview` branch and its artifacts are non-publishing and do not deploy GitHub Pages.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.6.md` — **HOLD**, real NVDA + VoiceOver review
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.6.md` — **HOLD**, physical Android/iOS PWA and speaker validation
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.6.md` — **HOLD**, signed Windows distribution
- `qa/BOOK_SME_REVIEW_2026.10.20.6.md` — **HOLD**, independent Book SME
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.6.md` — **HOLD**, independent curriculum SME
- `qa/LEARNER_PILOT_2026.10.20.6.md` — **HOLD**, human learner outcome pilot
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.6.md` — **HOLD**, NZQA/provider G1–G8

## Protected release acceptance

1. No 2026.10.20.6 technical candidate has been retained yet. Wait for a successful producer run on the exact source and bind its source SHA, runtime fingerprint, artifact provenance and expiry before technical release checks.
2. After retention, review actual phone speaker sound, iOS/iPadOS and Android install/offline/update flows, human NVDA/VoiceOver outcomes, Book and curriculum SME review, learner pilot, signed Windows distribution and provider G1–G8 evidence against that candidate.
3. Keep all seven external streams **HOLD**, software publication **BLOCKED** and production machine-control authority **NOT GRANTED**. The `preview` branch and its artifacts are not a live GitHub Pages deployment.

Source-of-truth status: `data/release-external-validation-v1.json`.
