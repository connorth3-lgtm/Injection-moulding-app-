# External validation boundary — 2026.09.18.1

Release `2026.09.18.1` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, or production-site evidence.

- retained pre-merge public candidate source: `26598f4dc5c7ee54b2fd38cbc008b38dd1190717`
- exact public-runtime fingerprint: `sha256:25b3676cc5aad6f85795e468bd0913eac43db25267e1d1415ac58098dacab048`
- candidate build run: `35283989564` (`Pre-merge Public Candidate`)
- candidate artifact: `physical-pwa-candidate-26598f4dc5c7ee54b2fd38cbc008b38dd1190717` (`10522957295`; `sha256:379e258aa4d09f7564db6795a0d1a28379944101072ed393f480057fcdb7df86`; expires `2026-10-17T22:50:20Z`)
- Pages disposition: production root remains governed separately. This retained artifact is the exact validation source for the current public byte set; protected-main publication must remain byte-equivalent under the release verifier before any production decision.

This is a candidate **rebind**, not external evidence. The learner-facing runtime deliberately advanced to release `2026.09.18.1` to add runtime-verified SHA-256 learner-backup integrity before restore and to keep the Book runtime/integrity identity coherent with the new release. The Book teaching content and existing human/device/SME/learner/Windows evidence states were not promoted or relabelled. All six external workstreams remain HOLD until genuine release-specific evidence exists.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.09.18.1.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.09.18.1.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.09.18.1.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.09.18.1.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.09.18.1.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.09.18.1.md` | Real longitudinal learner evidence. |

Production use remains advisory-only; no automatic machine control, validated recipe authority, accreditation or learner-efficacy claim is authorized.
