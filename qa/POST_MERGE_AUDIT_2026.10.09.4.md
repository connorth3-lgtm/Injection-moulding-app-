# MouldMaster 2026.10.09.4 — post-merge preview audit and remaining gates

**Historical release record (2026.10.09.4 only).** This packet records the state observed on 9 October 2026 before the later `.5` integration. It does not describe the latest protected `main` or deployed preview. Current `.5` release evidence is governed separately; all independent human/device/provider validations and production-root authorization remain on HOLD.

**Scope:** verifiable automation/repository/hosted non-production preview only, checked 2026-10-09. **Production, human and external validation: HOLD.**

## Immutable provenance

- Feature merge [PR #524](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/524) landed on protected `main` as `566fe49e8254770774ae6d0f7a0c22f295924032`.
- Reconciliation PRs [#525](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/525) and [#526](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/526) were merged; both had **zero file-content changes**. Their merge commits are `ed47decde93694b3b4b2d7b25f9b30e0b752ebe8` and `3b3df9e3aa1b5af8078b7ad227f450abb302abdd`, respectively.
- PR #526's repaired exact head `4f32dc6fbc64aa28fd946ffb055f79c26f992468` reported **20/20 completed successful** PR workflows before its squash merge. This is not a claim about new post-merge push workflows.
- At the time of this `.4` snapshot, `main` versus git `preview` had **no differing files**, but commit ancestry diverged. The branches later diverged again during `.5` development; do not extrapolate this historical comparison. The hosted Pages `/preview/` is built from protected `main`, not from the git `preview` branch; no force-push/rewrite is justified by ancestry differences.
- The [hosted `/preview/deployment.json`](https://connorth3-lgtm.github.io/Injection-moulding-app-/preview/deployment.json) subsequently reported `web_release=2026.10.09.4`, `source_ref=main`, and exact `source_sha=3b3df9e3aa1b5af8078b7ad227f450abb302abdd`. The [live version file](https://connorth3-lgtm.github.io/Injection-moulding-app-/preview/version.json) agreed on `2026.10.09.4`. Cache revision is `new1-tablet-nav-mission-r77-20261009`.
- At the time of the `.4` snapshot, the public [production root](https://connorth3-lgtm.github.io/Injection-moulding-app-/) still serves the **release HOLD** page; it is not an authorized production learner runtime.
- The retained pre-merge learner-runtime candidate is source `ff53e2958d7c97d99aba890a23ba7caf4f21d3c6`, fingerprint `sha256:7776a3ccccd8d049e7b9a5167e957651220d8f98a8da3b51b046ab85ae0f53a8`, producer [run 37871212175](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/37871212175), artifact `11589977636`, digest `sha256:24754e06b2a55c9f1604a7c23fa7d946971068c36f303ebd6b8bec837fdfe8ae`, expiration `2027-01-07T01:44:13Z`. That is **automated technical evidence**, not human acceptance.

## Historical release acceptance tasks (not a current runbook)

- [ ] From an exact intended checkout, run the separate live tester handoff preflight **against the actually deployed SHA**, not an obsolete initial merge:
  ```sh
  # Historical .4 example ONLY — do not execute this obsolete SHA as current.
  python3 qa_tester_handoff.py --live --expected-source-sha 3b3df9e3aa1b5af8078b7ad227f450abb302abdd
  ```
  Record real exit status/logs and execution source in [#512](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/512). **This document does not attest that command passed.** Re-check deployment metadata before running: if Pages moved, use the new actual source SHA.
- [ ] Owner-operated first-run desktop and touch smoke; privacy, profile isolation and accessible navigation. Hold tester invitation until [#512](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/512) pre-send gate is attested.
- [ ] Physical iPad (portrait/landscape, notch/safe area, five navigation targets, fixed controls) and 200% zoom checks against actual devices, tracked in [#520](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/520).
- [ ] Real PWA iOS/iPadOS/Android install/update/offline/reboot/storage-pressure tests; real NVDA/VoiceOver task matrix.
- [ ] Human Book and curriculum SME review, genuine learner-outcomes evidence, Windows signed distribution, and eight NZQA/provider validation gates. [#379](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/379) stays **HOLD**.
- [ ] Separate investigations [#517](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/517) (unconfirmed More-modal/onboarding timing; obsolete certificate counter) and [#519](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/519) (duplicate declarations) remain engineering maintenance, not grounds to bypass release governance. Any *runtime* fix requires its own governed release and PWA/cache identity; do not silently mutate the immutable `.4` runtime.

## Historical records versus current truth

Earlier `2026.10.09.4` visual-review checklists record decisions that were pending *at the time*; they are retained to preserve their evidence trail. The owner approved only scoped tablet/desktop Home comparisons, and the 12-pixel visual gate was subsequently locked. Neither that approval nor the automated clean build closes human-device/external work. The current live Preview SHA can change after later protected `main` merges; always consult the hosted deployment metadata.

**Decision as observed for `.4` on 9 October 2026:** Non-production preview was available for controlled review. **Production/root, physical/external validation and manufacturing authority remain HOLD.**
