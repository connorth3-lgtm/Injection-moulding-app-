# MouldMaster 2026.10.21.1 — Book-only Read Aloud and headphone audio diagnostic

**STATUS: EXACT-SOURCE TECHNICAL CANDIDATE RETAINED / SOFTWARE QA PASS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This release keeps Read Aloud on the Book only, removes the lesson Listening route, playlist and public lesson playback API, and provides a two-tone browser output check. Browser checks cannot confirm audible output through physical headphones.

## Candidate status and technical evidence

The exact-source 2026.10.21.1 candidate is retained from [Pre-merge Public Candidate run 39546516253](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39546516253). Artifact **12320969604** (physical-pwa-candidate-82ba7b14909b89191cd9bc15f25440a9728f475f) has digest sha256:6731a7888bd71d3e01331d3970fbfc6b02620903c72677f5a92098ed6f2d39da, expires 2027-01-19T04:53:39Z, and public-runtime fingerprint sha256:5e45262087ffb404469ed82c16ba76e6d1cb97b5356e568a030f01233d031484. Exact-source static/contract, Read Aloud, Mobile Browser QA and Question Quality 50-Pass checks passed. These automated checks cannot confirm audible output through physical headphones, real-device behavior or human review.

No tester invitation is authorized from this technical candidate. The Book player's **Test phone sound** control sends two tones to the browser-selected output; **Listen** tests Book speech through the device text-to-speech service. MouldMaster cannot detect whether a learner hears either. Real-device headphone output remains pending.

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
