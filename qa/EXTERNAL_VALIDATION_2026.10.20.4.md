# MouldMaster 2026.10.20.4 — Android Read Aloud interrupted speech fix

**STATUS: EXACT-SOURCE CANDIDATE RETAINED / AUTOMATED QA IN PROGRESS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This release prevents the mobile start watchdog from cancelling speech when the device is already speaking without an `onstart` event. The candidate is non-publishing; it does not authorize production publication, tester invitations, accreditation, learner efficacy claims or production use.

## Current candidate and technical evidence

Release `2026.10.20.4` is bound to source `d0f582cef71364fcd0fce3ce07f2a69731aebd8c`, runtime fingerprint `sha256:0000000000000000000000000000000000000000000000000000000000000000`, [Pre-merge Public Candidate run 39469543774](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39469543774), retained artifact `12285498577` (`physical-pwa-candidate-d0f582cef71364fcd0fce3ce07f2a69731aebd8c`), digest `sha256:2f5d3dfac919a0f4c8a828064ea5ea4e12621201a1e924aaef230f18f25a4ef7`, expiry `2027-01-18T17:50:22Z`.

Exact-head automated checks are still being completed. This technical artifact does not establish audible speech on a physical phone or any of the seven independent external-review outcomes.

The owner-approved visual baseline remains pinned to its historical source and is used as an automated comparison reference. This Read Aloud behavior change does not alter the visible interface. The historical visual approval does not approve device behavior, accessibility, release or deployment.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.4.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.4.md` — **HOLD**, physical Android/iOS PWA install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.4.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.20.4.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.4.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.20.4.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.4.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.

