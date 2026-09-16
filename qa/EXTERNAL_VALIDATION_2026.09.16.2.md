# External validation boundary — 2026.09.16.2

Release `2026.09.16.2` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, or production-site evidence.

- Exact pre-merge candidate source: `0705a4a430868ec871200aa7dd65362ce79cdb96`
- Exact public-runtime fingerprint: `sha256:00a6be79979742d3dd12b8f6ae7b904bc6210e9bc1a457f340f9814e48f4e46f`
- Candidate build run: `35059209551`
- Candidate artifact: `physical-pwa-candidate-0705a4a430868ec871200aa7dd65362ce79cdb96` (`10431871537`; `sha256:98b1be94bd6b5801444ce7e404c6c944e8fded450fab3667e3bd1171ff3cee9b`; expires `2026-10-16T05:21:53Z`)
- Pages disposition: production root remains **HOLD**. This retained pre-merge artifact is the exact validation source; after merge, the protected-main Pages workflow must independently stage and verify byte-equivalent runtime before any production decision.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.09.16.2.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.09.16.2.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.09.16.2.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.09.16.2.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.09.16.2.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.09.16.2.md` | Real longitudinal learner evidence. |

Production use remains advisory-only; no automatic machine control, validated recipe authority, accreditation or learner-efficacy claim is authorized.
