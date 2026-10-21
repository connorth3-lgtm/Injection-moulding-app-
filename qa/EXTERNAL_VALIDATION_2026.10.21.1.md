# MouldMaster 2026.10.21.1 — Book-only Read Aloud and headphone audio diagnostic

**STATUS: SUCCESSOR RELEASE STAGED / EXACT-SOURCE CANDIDATE PENDING / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This release keeps Read Aloud on the Book, removes the lesson Listening route, and adds a two-tone browser audio check beside the Book voice test. A current candidate has not yet been produced or verified. Audible output through physical headphones remains unconfirmed.

## Candidate status and technical evidence

No 2026.10.21.1 exact-source candidate artifact is retained yet. The prior 2026.10.20.5 artifact is historical evidence only; it does not establish successor-release software QA, audible output, real-device behavior or human review. The candidate workflow must produce an artifact for the successor source, and the exact-head software checks must pass before technical automation can be marked PASS.

No tester invitation is authorized while the exact-source candidate is pending. The app's two-tone check can send audio to the browser-selected output, but it cannot detect whether a learner hears it.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.21.1.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.21.1.md` — **HOLD**, physical Android/iOS install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.21.1.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.21.1.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.21.1.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.21.1.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.21.1.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.
