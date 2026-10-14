# Unified MouldMaster audit and acceptance — 15 October 2026

**Single current audit tracker: [issue #632](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/632).** This document consolidates status; it does not merge different people's evidence or imply that an issue is closed. Each original issue retains its own history. The machine-readable issue map is in `qa/audit-issue-consolidation-v1.json` and is checked by the release documentation suite.

## Reviewed current release

| Fact | Audited evidence |
| --- | --- |
| Protected `main` | `89fe3e24c11c3eb660953870fce7e819280c55df`, squash merge [PR #627](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/627) |
| Preview | `2026.10.13.3`, published under `/preview/`, independently checked from `deployment.json` |
| Retained producer source | `77fe83877de37cd5ce92cee7f4a1bc87a10965b7` |
| Candidate | successful run `38523473535`, artifact `11874731686` |
| Technical QA | 27/27 exact-head protected PR workflows passed |
| Visual lock | approved immutable `visual-baseline/2026.10.13.3`, 52 captures, maximum 12 differing pixels |
| Root release | production HOLD, advisory-only; no machine-control/accreditation authorization |
| External acceptance | seven independent human/device/provider workstreams HOLD |

The web release, Android release and Windows desktop are **separate lanes**; a passing browser workflow cannot certify physical Android/iOS, signed Windows or a provider's program. Avoid describing preview as production.

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

## P3 — public wording and date corrections intentionally deferred to a versioned release

**This is an unresolved documentation consistency issue, not a claim of completed work.**

1. The public `privacy.html` says `Effective: 5 September 2026`, even though the background Listening disclosure changed with release `2026.10.13.3`. Add a clear `Last updated: 14 October 2026` or accurate reviewed date during the *next governed public-asset release*.
2. The current `version.json` says `published: 2026-10-13` with `published_timezone: UTC`, whereas PR #627 merged at `2026-10-14T07:02:27Z`. Clarify whether the field is logical family-publication date or actual deployment date. Prefer adding an explicit deployment timestamp if dates serve different purposes. Do not quietly change the SHA-pinned public asset.
3. Review `version.json.read_aloud_version` (`2026.10.04.2`) as a *component* version separate from the `2026.10.13.3` web release; no mismatch claim without a component-code change.

Changing either public file without a newly versioned cache and source-bound, successful candidate would break the current 166-asset manifest/retained runtime fingerprint. This consolidation makes **no** public runtime changes. Future release work requires user-facing screenshot approval if visual appearance changes, 52-surface/12px strict gate, successful source-bound producer, and all protected checks.

## Historical duplicate issue disposition

#624 concerns a once-blocked PR #623 that later merged and is superseded by #627. #379 is an older provider-candidate tracker replaced by the still-open #619. #625 is a historical-release audit: cross-link to #632 and retain its evidence; close only if its actual outstanding work is represented here and in the independently open acceptance trackers.

**Important:** closing a superseded *tracker* is a housekeeping action. It does not close #325/#362/#328/#326/#327/#329/#619 or authorize production, learner certifications, machine recipes or outreach. This is a single consolidated development plan rather than a fictional assertion that all 21 issues have been fixed.
