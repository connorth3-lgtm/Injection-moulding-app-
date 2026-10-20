# MouldMaster 2026.10.20.3 — Read Aloud default voice fix

**STATUS: EXACT-SOURCE CANDIDATE RETAINED / AUTOMATED TECHNICAL QA PASS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This release updates Book Read Aloud so mobile platforms can select their system default speech voice when no voices are listed. The release is a non-publishing validation candidate; it does not authorize production publication, tester invitations, accreditation, learner efficacy claims or production use.

## Current candidate and technical evidence

Release `2026.10.20.3` is bound to source `9ea761d15597f15631565cf514e46dc163c9f2c5`, runtime fingerprint `sha256:b9875512b44d9d5bfed5d6f21c9ab280950114f6d1e89e8dc3dd349d2d745eed`, [Pre-merge Public Candidate run 39410559794](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39410559794), retained artifact `12259316379` (`physical-pwa-candidate-9ea761d15597f15631565cf514e46dc163c9f2c5`), digest `sha256:08abe9d8df03d3c6bf8075db86e51e00c9e289adb2f8c6667f248b2ea1268cbe`, expiry `2027-01-18T10:48:45Z`.

Exact-source automated checks passed: [Mobile Browser QA 39410559791](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39410559791) (Chromium visual, reachability and substantive suites; WebKit substantive; cross-browser; all five 100-run reliability shards), [Question Quality 50-Pass 39410560044](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39410560044), [Read Aloud QA 39410560202](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39410560202), [Combined Learn Book QA 39410559701](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39410559701), and [Windows Listen package 39410559812](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39410559812). Automated software tests do not establish actual audible speech on a physical phone or device.

The owner-approved visual baseline remains pinned to its historical source and is used as an automated comparison reference. This Read Aloud behavior change does not alter the visible interface. The historical visual approval does not approve device behavior, accessibility, release or deployment.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.3.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.3.md` — **HOLD**, physical Android/iOS PWA install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.3.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.20.3.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.3.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.20.3.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.3.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.
