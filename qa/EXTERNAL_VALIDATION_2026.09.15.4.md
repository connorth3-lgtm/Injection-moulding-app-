# MouldMaster external validation index — 2026.09.15.4

This index binds every remaining release-external workstream to web release `2026.09.15.4`. Automated QA may prove the contracts are coherent and fail closed; it cannot manufacture human, physical-device, signing, learner or site evidence.

## Exact software candidate

- protected-main source commit: `f83daaf5b597afc4ef7c1c8ae2653bd7bf67040b`
- public-runtime fingerprint: `sha256:36cb9bbc8acd664ea7b72bd32ad06f75defd0d2019c6879039c87e7d4c45ebf8`
- Pages run: `34923733290`
- retained physical candidate artifact: `physical-pwa-candidate-f83daaf5b597afc4ef7c1c8ae2653bd7bf67040b`
- artifact id: `10379530204`

## Workstreams

| Workstream | Status | Release-bound execution path | Completion rule |
| --- | --- | --- | --- |
| Physical iOS/iPadOS + Android PWA | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_2026.09.15.4.md`, `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, `data/pwa-physical-device-validation-v1.json` | Exact-runtime physical install/standalone/offline/reboot/update/storage checks pass on both platforms and evidence verifier accepts the record. |
| Real assistive technology | **HOLD** | `qa/ACCESSIBILITY_REAL_AT_2026.09.15.4.md`, `data/accessibility-real-at-validation-v1.json` | Human NVDA Firefox + Chromium on Windows and VoiceOver Safari on macOS + iOS all pass the governed task matrix. |
| Signed/Store Windows distribution | **HOLD** | `certification/WINDOWS_SIGNING_READINESS_2026.09.15.4.md`, `.github/workflows/microsoft-store-msix.yml`, `certification/STORE_SUBMISSION_STATUS.md` | Signed/Store provenance, physical launch, SmartScreen/Store path and WACK/equivalent validation all have release-bound evidence. |
| 46-chapter Book SME review | **HOLD** | `qa/BOOK_SME_REVIEW_2026.09.15.4.md`, `data/book-sme-review-v1.json` | One genuine independent human approval per governed chapter across all six required dimensions, with objections resolved. |
| 120-lesson curriculum SME review | **HOLD** | `qa/CURRICULUM_SME_REVIEW_2026.09.15.4.md`, `qa/curriculum-semantic-review.json` | All 120 canonical lessons have all seven semantic dimensions human-approved at their current whole-lesson fingerprints. |
| Real-learner pilot/outcomes | **HOLD** | `qa/LEARNER_PILOT_2026.09.15.4.md`, `data/learner-pilot-v1.json` | Real learner cohort and separately reviewed longitudinal evidence satisfy the governed contract; synthetic/proxy data never counts. |

## Production boundary

MouldMaster remains advisory-only. No external workstream in this index authorizes automatic machine control, site recipe validation, accreditation, learner efficacy or certification by itself.

## Promotion rule

A workstream may move from `hold` to `validated` only through a protected PR containing genuine release-bound evidence references that pass `tools/verify_release_external_validation.py` and the relevant specialist verifier. If runtime bytes change, the `.4` physical/AT candidate binding must not be reused as authorization for the changed release.