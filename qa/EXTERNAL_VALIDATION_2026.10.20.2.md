# MouldMaster 2026.10.20.2 — Learn and Book integration

**STATUS: EXACT-RUNTIME TECHNICAL AUTOMATION PASS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** The integration includes the Android Learn/Practice work and Book/Listen Read Aloud fix. Current PR-head CI status is recorded on PR #642. The retained candidate and owner-approved screenshot comparison are recorded below. External validation remains separate; no production release, tester invitation, accreditation, efficacy claim or production authority is authorized by these technical results.

## Retained candidate and visual approval

The exact-runtime candidate is release `2026.10.20.2`, source `e841e470e651c9f9c8766f1941554e60d554523f`, runtime fingerprint `sha256:abbe5ca24fcc7e2203436c75df21550264bd71d48fe983416eb6b6f87489bd4f`.

- [Successful producer run 39389190646](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39389190646) retained artifact **12248398761**, `physical-pwa-candidate-e841e470e651c9f9c8766f1941554e60d554523f`.
- Artifact digest: `sha256:9f5db7d8b3e898ff834b828b1590098944101c7f5734c0e215c73c1786e3a1b8`; expiry: `2027-01-18T07:50:26Z`.
- Current-head candidate verification confirmed the retained producer/artifact is reusable because the later integration-branch changes do not change learner-runtime bytes. No replacement artifact was created by that verification run.
- Owner visual approval for the presented integrated-app and Book Read Aloud phone comparisons is documented in [PR #642 visual review](https://github.com/connorth3-lgtm/Injection-moulding-app-/blob/77b457d2b64dc744223930b9e05e7d1c5f2a7d99/qa/VISUAL_REVIEW_2026.10.20.2_PR642.md). It is screenshot-design approval only, not approval of device behavior, accessibility, subject-matter accuracy, release or deployment.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.2.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.2.md` — **HOLD**, physical Android/iOS PWA install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.2.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.20.2.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.2.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.20.2.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.2.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge is a source-integration decision under `.github/MAIN_PROTECTION.md`; it does not clear any external HOLD or authorize a production release. The protected-main Pages workflow keeps the production root fail-closed and stages a release-hold/non-production preview candidate while exact-runtime physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI, artifact retention, screenshot approval or a merge.

Source of truth for candidate identity and external status: `data/release-external-validation-v1.json`.
