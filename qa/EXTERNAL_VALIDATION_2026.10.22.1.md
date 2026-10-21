# MouldMaster 2026.10.22.1 — Book-only Read Aloud and audio output diagnostic

**STATUS: EXACT-SOURCE SOFTWARE CANDIDATE VERIFIED / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Read Aloud is available in the Book only; lessons, exams and generic page text are not narration sources. The **Test phone sound** control sends two short tones to check browser audio output. Use **Book Listen** to check speech. Browser checks cannot confirm audible output through physical headphones or Bluetooth.

## Current exact-source technical candidate (pending)

No exact-source technical candidate has been produced for release 2026.10.22.1. The prior 2026.10.21.3 candidate is historical and cannot satisfy this release. The exact public artifact and current browser and release-bound software gates must pass before the candidate can be retained. Physical-device audible speech and every independent external review remain HOLD.

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
