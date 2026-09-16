# External validation boundary — 2026.09.16.2

Release `2026.09.16.2` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, or production-site evidence.

- Exact hardened pre-merge candidate source: `f7ad92a51cc2808b62fb942e2f8b87fc4ffb1b1f`
- Exact public-runtime fingerprint: `sha256:f44179f21716056300bb7637478e581bb059bc07091112e44b85d97586001e03`
- Candidate build run: `35145771290`
- Candidate artifact: `physical-pwa-candidate-f7ad92a51cc2808b62fb942e2f8b87fc4ffb1b1f` (`10467227083`; `sha256:c083623822ac3ae8a142cd8465c4c8204e2c1892af02badc9b2cb22c43fb9395`; expires `2026-10-16T20:18:41Z`)
- Pages disposition: production root remains **HOLD**. This retained pre-merge artifact is the exact validation source; after merge, the protected-main Pages workflow must independently stage and verify byte-equivalent runtime before any production decision.

The retained candidate includes the completed deep-audit hardening: one canonical Book runtime, exact-byte Book publication binding, Book-aware global search, canonical learner-facing academic evidence links, and release-versioned dynamic same-origin script loads. These are technical assurances only and do not satisfy any external workstream below.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.09.16.2.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.09.16.2.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.09.16.2.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.09.16.2.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.09.16.2.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.09.16.2.md` | Real longitudinal learner evidence. |

Production use remains advisory-only; no automatic machine control, validated recipe authority, accreditation or learner-efficacy claim is authorized.
