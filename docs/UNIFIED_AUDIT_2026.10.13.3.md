# Unified MouldMaster audit and acceptance — 19 October 2026

**Single current audit tracker: [issue #632](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/632).** This document consolidates status; it does not merge different people's evidence or imply that an issue is closed. Each original issue retains its own history. The machine-readable issue map is in `qa/audit-issue-consolidation-v1.json` and is checked by the release documentation suite.

## Reviewed current release

| Fact | Audited evidence |
| --- | --- |
| Current governed candidate | `2026.10.19.1` from `version.json`; the `preview` branch head is `632010fa19bd9b50d6869b8b81742f98c43a828f` and repair PR [#649](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/649) is **not merged** |
| Current `main` source | `53712742aa8c82e400a264f4c0e4a38b864335c4`; the protected-main Pages workflow is the sole publisher |
| Public non-production preview | Last previously verified hosted preview was `2026.10.16.1`; no evidence that `2026.10.19.1` has been published to `/preview/`. The app opening on a phone does not prove new deployment or audible narration |
| Original audited historical merge | `89fe3e24c11c3eb660953870fce7e819280c55df` remains immutable historical provenance |
| Retained technical candidate | Exact source `4e8169602ca73fc78cfd2f2421a263632cfe84ea`, successful [Pre-merge Public Candidate run 39148051891](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39148051891), artifact `12143923886`, fingerprint `sha256:1f498160634145407bd394bfe8c32ed70a1ce5f862834e8159d2f1e9fdd6cee9` |
| Technical release acceptance | **FAIL / HOLD**, explicitly recorded in `data/release-external-validation-v1.json`; a retained producer artifact is not approval for publication |
| Book voice and mobile software checks | Read Aloud and mobile-browser GitHub Actions passed on repair PR #649's prior exact commits; mocked speech does **not** prove audible device output |
| Visual provenance | The 2026.10.16.1 approved immutable `visual-baseline` from PR #639 is retained unchanged; that approval covers only three reviewed phone screens, not unreviewed changes in 2026.10.19.1 |
| Root/production boundary | Production **HOLD**, educational/advisory-only; no validated recipe, machine control or accreditation |
| External acceptance | All seven independent human/device/provider streams **HOLD** |

The web release, Android release and Windows desktop are separate lanes. A passing Chromium speech simulation or repository workflow cannot certify real iOS/Android speaker sound, signed Windows distribution, a provider programme or current Pages publication.

## P1 — independently supplied release-acceptance evidence

| Issue | Workstream | Actual acceptance prerequisite |
| --- | --- | --- |
| #325 | Physical PWA | iOS/iPadOS + Android install, user-heard Book narration, background/lock behavior, offline reboot, atomic update, low-storage/safe-area tests on recorded devices |
| #362 | Human assistive technology | NVDA/VoiceOver combinations and documented focus/reader checks |
| #328 | Windows distribution | real signed package, installation, SmartScreen/Store evidence |
| #326 | Book SME | independent qualified review across 46 modules and source-grade limits |
| #327 | Academy curriculum SME | independent qualified review across 120 core lessons |
| #329 | Learning outcomes | consented real learner trial, retention and delayed transfer |
| #619 | NZQA/provider | G1–G8 actual provider, assessment, moderation, consent and governance evidence |

All seven remain `hold` in `data/release-external-validation-v1.json`. Their source/artifact bindings support traceability, **not** a human approval. The desktop-release immutability platform setting (#278) is separately outstanding.

## P2 — other open user, content and data work

| Issue | Outstanding work |
| --- | --- |
| #520 | Photograph exact on-device Android Mission Control/Book geometry and PWA cache revision; software fixture cannot replace the user phone |
| #512 | Owner-run `qa_tester_handoff.py --live --expected-source-sha <CURRENT_MAIN_SHA>`, actual-device operator smoke, explicit invite/no-send decision |
| #582 | Measured first-run Home/Book friction, real zoom, touch and screen-reader acceptance |
| #589 | Current supplier exact-grade property source comparability, Book material and editorial/source review |
| #521 | Human-reviewed lesson↔Book semantic link evidence; `approvedPublicLinks=false` |
| #278 | Enable actual immutable GitHub Releases and verify a newly governed Windows tag and protections |
| #430 / #428 | Obtain independent exact OEM/controller documentation before specific claims |
| #334 / #335 / #336 | Acquire genuine synchronized measured engineering fault, intervention and recovery datasets |

## P3 — versioned public wording and date reconciliation (not a release approval)

This remains a **documentation and deployment provenance** task, not evidence that a new public build shipped.

1. The existing privacy policy discloses that the browser/operating-system voice may use provider processing and that continuous Listening has its own background behaviour. Review the public effective/last-updated dates on the next governed public-asset release, using genuinely reviewed dates.
2. The candidate `version.json` records `published: 2026-10-18` and `published_timezone: UTC`. This is repository release metadata and does **not** prove that GitHub Pages deployed on that day. Record actual publication/deployment separately when verified.
3. The candidate `read_aloud_version` is `2026.10.19.1`, matching its speech runtime; physical phone speaker tests remain pending.

Do not quietly change the SHA-pinned public asset. Any public-runtime edit requires an appropriately versioned cache, a newly retained exact-source candidate, its actual fingerprint, passing protected release checks and owner publication authorization.

## P3 tooling provenance — restored on draft preview repair PR #649

The original `preview` branch had a historical 2026.10.11.3 visual baseline and Playwright 1.63.0 pins while the existing release QA already required the 2026.10.16.1 owner-approved baseline and Playwright 1.64.0 provenance. Draft PR #649 restores the unchanged approved baseline, original PR #638/#639 owner records, the aligned package lock and its integrity verifier. This is a **software QA synchronization**, not new human visual approval. It preserves strict 52-screenshot coverage, four viewports, 13 surfaces and `maxDiffPixels=12`. Release acceptance remains FAIL/HOLD until the real gates succeed.

## Historical duplicate issue disposition

#624 concerns a once-blocked PR #623 that later merged and is superseded by #627. #379 is an older provider-candidate tracker replaced by the still-open #619. #625 is a historical-release audit: cross-link to #632 and retain its evidence; close only if its actual outstanding work is represented here and in the independently open acceptance trackers.

**Important:** closing a superseded *tracker* is a housekeeping action. It does not close #325/#362/#328/#326/#327/#329/#619 or authorize production, learner certifications, machine recipes or outreach. This is a single consolidated development plan rather than a fictional assertion that all 21 issues have been fixed.
