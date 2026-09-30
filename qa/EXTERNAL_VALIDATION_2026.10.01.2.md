# External validation boundary — 2026.10.01.2

Release `2026.10.01.2` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, distribution or production-site evidence.

## Exact current candidate

- pre-merge candidate source: `0e07173d91bac82a5f77215190cd6c96ba95f1dc`
- exact public-runtime fingerprint: `sha256:97c4d9e36f712a343019375b1ca82de6c14ed6713c60d9888b2e02c9e47ac479`
- candidate build run: `36758041358` (**Pre-merge Public Candidate**)
- retained physical candidate: `physical-pwa-candidate-0e07173d91bac82a5f77215190cd6c96ba95f1dc`
- artifact id: `11117491638`
- artifact ZIP digest: `sha256:0d95489b706ec5132440d0ea3004dac7119756e8fb11eb17d38891e9179352de`
- artifact retention expiry: `2026-10-30T18:22:02Z`
- Pages disposition: the governed candidate is available on the non-production `/preview/` path; the production root remains held pending the required external evidence.

This is a release-boundary **rebind**, not external evidence. Earlier physical-device, assistive-technology, SME, learner, Windows-distribution or NZQA/provider records are not relabelled for the current runtime. Each workstream below remains HOLD until its genuine release-specific exit condition is satisfied.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.10.01.2.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.10.01.2.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.10.01.2.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.10.01.2.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.10.01.2.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.10.01.2.md` | Real longitudinal learner evidence. |
| NZQA/provider/accreditation | **HOLD** | `qa/NZQA_EXTERNAL_VALIDATION_2026.10.01.2.md` | Genuine provider ownership, need/support, provider-approved design/assessment, consent-to-assess/CMR confirmation, moderation, workplace evidence and provider review/change governance. |

Production use remains **advisory-only**. No automatic machine control, validated recipe authority, accreditation, learner-efficacy claim or external certification is authorized by repository automation.
