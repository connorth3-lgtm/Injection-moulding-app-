# MouldMaster 2026.10.20.5 — Android Read Aloud speech-queue fix

**STATUS: EXACT-SOURCE CANDIDATE RETAINED / AUTOMATED QA PASSED / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Release 2026.10.20.5 avoids canceling Android speech at idle startup, sentence handoff and natural completion. The exact-source browser candidate passed automated QA; audible output on a physical phone remains unconfirmed.

## Candidate status and technical evidence

The exact-source candidate for release 2026.10.20.5 is source 2b757e45dcf9fda8b3d6b06cb8ee681714cbd1ad, retained by successful Pre-merge Public Candidate run 39483291565 as artifact 12291733543 (physical-pwa-candidate-2b757e45dcf9fda8b3d6b06cb8ee681714cbd1ad), digest sha256:622f40906dd99d40f100800786095cf336314f516d1b9f80e5bbfa94aa77a9d2, expiry 2027-01-18T19:25:11Z, runtime fingerprint sha256:823228e414f98d0e74a3d2e1b3bb491d1d2a3f61d28339bedf40e2b13bb2f456. Exact-head Read Aloud QA, Mobile Browser QA and Question Quality 50-Pass succeeded. This is automated software evidence only; it does not confirm audible output on a physical phone. All seven external review workstreams remain HOLD, and tester handoff remains STOP until protected-main deployment and live preview verification.

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

