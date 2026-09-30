# External validation boundary — 2026.09.30.7

Release `2026.09.30.7` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, distribution or production-site evidence.

## Exact current candidate

- protected-`main` source: `359730b042302a4a8c338b1f62f65b39ea1f0027`
- exact public-runtime fingerprint: `sha256:e50a7685f649322ec518385f8f9d774dbb7b4c13f083f9a3c08403904dfa24a5`
- candidate build run: `36671748087` (**Pre-merge Public Candidate**)
- retained physical candidate: `physical-pwa-candidate-359730b042302a4a8c338b1f62f65b39ea1f0027`
- artifact id: `11078068093`
- artifact ZIP digest: `sha256:e66880819a64fabbc02823b58221e6fbcb4acf7c3a2a337002530139b0e2404e`
- artifact retention expiry: `2026-10-30T05:04:49Z`
- Pages disposition: the governed candidate is available on the non-production `/preview/` path; the production root remains held pending the required external evidence.

This is a release-boundary **rebind**, not external evidence. Earlier physical-device, assistive-technology, SME, learner, Windows-distribution or NZQA/provider records are not relabelled for the current runtime. Each workstream below remains HOLD until its genuine release-specific exit condition is satisfied.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.09.30.7.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.09.30.7.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.09.30.7.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.09.30.7.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.09.30.7.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.09.30.7.md` | Real longitudinal learner evidence. |
| NZQA/provider/accreditation | **HOLD** | `qa/NZQA_EXTERNAL_VALIDATION_2026.09.30.7.md` | Genuine provider ownership, need/support, provider-approved design/assessment, consent-to-assess/CMR confirmation, moderation, workplace evidence and provider review/change governance. |

Production use remains **advisory-only**. No automatic machine control, validated recipe authority, accreditation, learner-efficacy claim or external certification is authorized by repository automation.
