# Windows signed-distribution readiness — deployed non-production 2026.10.09.4

**STATUS: HOLD — not approved for physical, external, provider or production use.**

The deployed non-production `2026.10.09.4` runtime includes issue #520 tablet navigation and Mission Control idle Home presentation changes. The project owner has approved the supplied tablet and desktop Home layout comparisons; this is scoped UI design approval, **not** complete visual/device or external validation. The immutable `visual-baseline/2026.10.09.4` ref and passing 12-pixel Chromium visual lock preserve the reviewed layout. A fresh exact-source technical runtime artifact exists and is detailed below. The historic `.3` candidate remains archival only.

**Required work:** real Windows package signing, SmartScreen or Store reputation and device test.

This workstream remains blocked until its own real, traceable external evidence and separate signoff are obtained. CI and screenshots alone are not substitutes for independent human testing, actual devices, signed distribution, accreditation or demonstrated learner competence. MouldMaster is advisory-only and does not authorize production machine controls or validated settings.

**Provenance (updated 2026-10-09):** [PR #524](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/524) merged into protected `main` at `566fe49e8254770774ae6d0f7a0c22f295924032`; follow-up history-only PRs [#525](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/525) and [#526](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/526) merged with no changed files. The latest audited protected `main` and hosted non-production `/preview/deployment.json` both identified `3b3df9e3aa1b5af8078b7ad227f450abb302abdd`, release `2026.10.09.4`. [Visual review packet](../qa/VISUAL_REVIEW_2026.10.09.4.md) records the owner's *scoped Home-layout* approval; [issue #379](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/379) tracks **current `.4` external-validation HOLD**, not approval. The production Pages root remains release-held; real devices, human AT, signed Windows, SMEs, outcomes, provider/NZQA and production are **not** approved.

## Verified exact `.4` automated technical candidate (EXTERNAL HOLD)

- Web release: `2026.10.09.4`.
- Source SHA: `ff53e2958d7c97d99aba890a23ba7caf4f21d3c6`.
- Public runtime fingerprint: `sha256:7776a3ccccd8d049e7b9a5167e957651220d8f98a8da3b51b046ab85ae0f53a8`.
- Producer: [Pre-merge Public Candidate run 37871212175](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/37871212175), exact-source completed **success**.
- Artifact: `physical-pwa-candidate-ff53e2958d7c97d99aba890a23ba7caf4f21d3c6`; ID `11589977636`.
- Artifact digest: `sha256:24754e06b2a55c9f1604a7c23fa7d946971068c36f303ebd6b8bec837fdfe8ae`.
- Artifact expires `2027-01-07T01:44:13Z`.
- Protected-main release authorization: **NOT granted**; independent physical device, NVDA/VoiceOver, Windows signing, Book/curriculum SME, learner outcome, provider/NZQA and production validation remain **HOLD**.

