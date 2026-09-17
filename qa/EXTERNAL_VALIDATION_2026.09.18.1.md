# External validation boundary — 2026.09.18.1

Release `2026.09.18.1` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, or production-site evidence.

- retained pre-merge public candidate source: `0100306094648cda214fed513365761cff9c4f25`
- exact public-runtime fingerprint: `sha256:36d47a5343eb9095e33b63e50efb03d4b4b4542cbb781d686e637d95af9791d3`
- candidate build run: `35282006382` (`Pre-merge Public Candidate`)
- candidate artifact: `physical-pwa-candidate-0100306094648cda214fed513365761cff9c4f25` (`10522519333`; `sha256:a948a451f99e8ec5c0e128bf027bdf255520689f6f7747ba3d584f2bcc23f3b2`; expires `2026-10-17T22:26:18Z`)
- Pages disposition: production root remains governed separately. This retained artifact is the exact validation source for the current public byte set; protected-main publication must remain byte-equivalent under the release verifier before any production decision.

This is a candidate **rebind**, not external evidence. The learner-facing runtime deliberately advanced to release `2026.09.18.1` to add runtime-verified SHA-256 learner-backup integrity before restore. The Book teaching content and existing human/device/SME/learner/Windows evidence states were not promoted or relabelled. All six external workstreams remain HOLD until genuine release-specific evidence exists.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.09.18.1.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.09.18.1.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.09.18.1.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.09.18.1.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.09.18.1.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.09.18.1.md` | Real longitudinal learner evidence. |

Production use remains advisory-only; no automatic machine control, validated recipe authority, accreditation or learner-efficacy claim is authorized.
