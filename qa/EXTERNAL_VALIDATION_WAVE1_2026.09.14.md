# External Validation Wave 1 — execution index

Release: **2026.09.14.4**  
Release source: `9925eb26472c598d900a5a3d710e90ccf27e83e8`

The goal of Wave 1 is to execute everything automation can prove now, then make every remaining real-world requirement explicit and machine-checkable without manufacturing evidence.

| Workstream | Current state | Execution / evidence path | Completion effect |
| --- | --- | --- | --- |
| Live production/preview Book audit | Automated verifier wired; production root remains release-held until current physical evidence | `.github/workflows/book-live-pages-validation.yml`, `tools/verify_book_pages_candidate.py`, `data/external-validation-wave1-v1.json` | Proves deployed Book bytes, authorization, 46-chapter authored coverage, service-worker inclusion and Read/Listen runtime markers; does not release physical HOLDs |
| Physical iOS/iPadOS + Android | **HOLD** | `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, `device-validation.html`, `data/pwa-physical-device-validation-v1.json` | Exact-runtime physical evidence can authorize Pages production when the existing PWA verifier passes |
| Windows signed/Store distribution | **HOLD** | `.github/workflows/microsoft-store-msix.yml`, `certification/WINDOWS_SIGNING_READINESS_2026.09.14.md`, `certification/STORE_SUBMISSION_STATUS.md` | Release-specific signed/Store provenance + real Windows launch + reputation + package validation can change Windows external status |
| 46-chapter Book SME | **HOLD** | `data/book-sme-review-v1.json`, `qa/BOOK_SME_REVIEW_2026.09.14.md` | One real human review per chapter, all dimensions passed/resolved, can validate Book SME evidence |
| 120-lesson curriculum SME | **HOLD** | `qa/curriculum-semantic-review.json` | Remains separate from Book review; requires all canonical lessons reviewed |
| Real-learner pilot/outcomes | Protocol ready; evidence **HOLD** | `data/learner-pilot-v1.json`, `qa/LEARNER_PILOT_2026.09.14.md` | Pilot findings can drive product changes; longitudinal evidence is still required before efficacy/psychometric claims |
| Evidence-driven product improvements | Armed | `data/external-validation-wave1-v1.json` product-improvement rule | Findings must cite non-sensitive physical/SME/learner evidence before being attributed to external validation |

## Non-negotiable boundaries

- Automated Chromium/WebKit coverage is not physical iOS/Android evidence.
- An unsigned CI package is not signed-distribution evidence.
- AI/source review is not human SME approval.
- Synthetic/proxy learner data is not a real-learner outcome study.
- The Book's `Verified` state remains generic evidence-governed teaching and does not become a machine/material/mould/site recipe.
- Production authority remains advisory-only with no automatic machine-control authority.

## Gate

Run `python qa_external_validation_wave1.py` and `python tools/verify_release_external_validation.py`. Both must pass before Wave 1 governance changes are merged.
