# MouldMaster 2026.10.18.2 — preview-release external validation HOLD

**STATUS: TECHNICAL RETENTION PENDING / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** The combined Learn/Practice, Book/Listen, Materials and mobile repairs were merged to the non-publishing `preview` branch via PR #646. Automated functional checks on the PR head do not constitute an accepted, current-release exact-source public candidate, human visual approval, physical phone speaker/audio test, or independent accessibility/SME/provider approval. The prior-release candidate and earlier test reports are historical only.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.18.2.md` — **HOLD**, Real NVDA + VoiceOver review
- `qa/PWA_PHYSICAL_DEVICE_2026.10.18.2.md` — **HOLD**, Physical Android/iOS PWA
- `certification/WINDOWS_SIGNING_READINESS_2026.10.18.2.md` — **HOLD**, Signed Windows distribution
- `qa/BOOK_SME_REVIEW_2026.10.18.2.md` — **HOLD**, Independent Book SME
- `qa/CURRICULUM_SME_REVIEW_2026.10.18.2.md` — **HOLD**, Independent curriculum SME
- `qa/LEARNER_PILOT_2026.10.18.2.md` — **HOLD**, Human learner outcome pilot
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.18.2.md` — **HOLD**, NZQA/provider G1–G8

## Protected release acceptance

1. Retain a successful exact-source `2026.10.18.2` candidate from the governed producer, record its real source SHA, artifact ID/digest, runtime fingerprint and expiry, and independently verify its quality gates. Until then `webCandidate` must stay null.
2. Review genuine phone speaker sound, iOS/iPadOS and Android install/offline/update flows, human NVDA/VoiceOver outcomes, Book and curriculum SME review, learner pilot, signed Windows distribution and provider G1–G8 evidence against that candidate.
3. Keep all seven external streams **HOLD**, software publication **BLOCKED** and production machine-control authority **NOT GRANTED**. The `preview` branch and its artifacts are not a live GitHub Pages deployment.

Source-of-truth status: `data/release-external-validation-v1.json`.
