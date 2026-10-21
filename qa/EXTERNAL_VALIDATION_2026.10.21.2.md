# MouldMaster 2026.10.21.2 — Book-only Read Aloud and headphone audio diagnostic

**STATUS: CANDIDATE PENDING / SOFTWARE QA IN PROGRESS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This release keeps Read Aloud on the Book only, removes the lesson Listening route, playlist and public lesson playback API, and provides a two-tone browser output check. Browser checks cannot confirm audible output through physical headphones.

## Candidate status and technical evidence

The exact-source 2026.10.21.2 candidate artifact is pending. The pre-merge candidate workflow will record its source, runtime fingerprint and artifact before software verification; all seven external reviews remain HOLD.

No tester invitation is authorized from this technical candidate. The Book player's **Test Book voice** control speaks a short sample through the same device speech service used by Listen; **Listen** tests Book speech through the device text-to-speech service. MouldMaster cannot detect whether a learner hears either. Real-device headphone output remains pending.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.21.2.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.21.2.md` — **HOLD**, physical Android/iOS install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.21.2.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.21.2.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.21.2.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.21.2.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.21.2.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.
