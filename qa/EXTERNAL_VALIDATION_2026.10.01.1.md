# External validation boundary — 2026.10.01.1

Release `2026.10.01.1` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, distribution or production-site evidence.

## Exact current candidate

- pre-merge candidate source: `5df2e2ff8f263227f5ee129acfa0095bbd3ef54a`
- exact public-runtime fingerprint: `sha256:9456d12da2902d202de4502203533a32e93567398b9913f04397fc501e4ec3d9`
- candidate build run: `36750415010` (**Pre-merge Public Candidate**)
- retained physical candidate: `physical-pwa-candidate-5df2e2ff8f263227f5ee129acfa0095bbd3ef54a`
- artifact id: `11114347709`
- artifact ZIP digest: `sha256:e9b538a86a69294f46881b73f2127565ac3fac244737f1e24e0421596746b264`
- artifact retention expiry: `2026-10-30T17:20:01Z`
- Pages disposition: the governed candidate is available on the non-production `/preview/` path; the production root remains held pending the required external evidence.

This is a release-boundary **rebind**, not external evidence. Earlier physical-device, assistive-technology, SME, learner, Windows-distribution or NZQA/provider records are not relabelled for the current runtime. Each workstream below remains HOLD until its genuine release-specific exit condition is satisfied.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.10.01.1.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.10.01.1.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.10.01.1.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.10.01.1.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.10.01.1.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.10.01.1.md` | Real longitudinal learner evidence. |
| NZQA/provider/accreditation | **HOLD** | `qa/NZQA_EXTERNAL_VALIDATION_2026.10.01.1.md` | Genuine provider ownership, need/support, provider-approved design/assessment, consent-to-assess/CMR confirmation, moderation, workplace evidence and provider review/change governance. |

Production use remains **advisory-only**. No automatic machine control, validated recipe authority, accreditation, learner-efficacy claim or external certification is authorized by repository automation.
