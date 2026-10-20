# External validation boundary — 2026.09.16.2

Release `2026.09.16.2` is technically automated and governed, but the following external workstreams remain explicit **HOLD**. This index does not create human, device, learner, accreditation, signing, or production-site evidence.

- retained pre-merge public candidate source: `e20d789464f65f411afb3e508722644f59867436`
- exact public-runtime fingerprint: `sha256:df173158dae2b63da7b764cc8a7a7dd1ab20e99387279d3162800ccd2d14a1ef`
- candidate build run: `35182050411` (`Pre-merge Public Candidate`)
- candidate artifact: `physical-pwa-candidate-e20d789464f65f411afb3e508722644f59867436` (`10480573719`; `sha256:88ce4f47209e81610347088bb8035b16fe574e61bde142e5cecfe4214216fafc`; expires `2026-10-17T04:28:37Z`)
- Pages disposition: production root remains governed separately. This retained artifact is the exact validation source for the current public byte set; protected-main publication must remain byte-equivalent under the release verifier before any production decision.

This is a candidate **rebind**, not external evidence. The Academy/Book learner runtime remains release `2026.09.16.2`. The public fingerprint changed because the frozen legacy Windows recovery metadata in `latest.json` was hardened so both the recovery app and launcher URLs are immutable-commit pinned and SHA-256 locked. The Book content, Academy learner runtime and existing human/device evidence states were not promoted or relabelled.

| Workstream | Status | Release packet | Required genuine evidence |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.09.16.2.md` | Current-release hands-on device execution across the governed install/update/offline matrix. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.09.16.2.md` | Human NVDA and VoiceOver matrix evidence. |
| Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.09.16.2.md` | Signed/Store provenance, physical Windows launch, reputation path and package validation. |
| Independent Book SME | **HOLD** | `qa/BOOK_SME_REVIEW_2026.09.16.2.md` | 46/46 human chapter approvals across six dimensions. |
| Curriculum SME | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.09.16.2.md` | 120/120 human lesson semantic approvals. |
| Learner outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.09.16.2.md` | Real longitudinal learner evidence. |

Production use remains advisory-only; no automatic machine control, validated recipe authority, accreditation or learner-efficacy claim is authorized.
