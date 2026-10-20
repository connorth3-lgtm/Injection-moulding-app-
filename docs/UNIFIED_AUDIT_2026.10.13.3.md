# Unified MouldMaster audit and acceptance — 17 October 2026

> **Archived snapshot — 17 October 2026; not current.** The release table, issue counts and follow-up text below preserve the state at that review date and must not be used as current release status.
>
> **Status checked 20 October 2026 (UTC):** protected `main` is `f896b988385b77c4190a7584db13b88748b7b106` and declares web release `2026.10.20.1`. The integrated Learn/Book draft stages successor release `2026.10.20.2`; its exact-source producer and fresh browser/visual review are pending. The prior main candidate is `2026.10.20.1`, bound to source `f896b988385b77c4190a7584db13b88748b7b106`, fingerprint `sha256:a208ca2c5fd94a00bde098f94232de14baf5625145ed2d7f2e6f09ce2caa20cf`, producer run `39368081782`, artifact `12240591156`, digest `sha256:59829f91d1cc0c1654fab81049bbe1d205c608c561964a05c0b16be63ea8444e`, expiry `2026-11-19T04:11:07Z`. It is historical for the integrated source and does not validate release `2026.10.20.2`; see [issue #619](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/619). The candidate is non-publishing. Seven independent device, assistive-technology, SME, learner-outcome, Windows-signing and provider review workstreams remain HOLD; production authority stays advisory-only.
>
> Use the generated [governance status](../GOVERNANCE_STATUS.md), [Book governance status](../BOOK_GOVERNANCE_STATUS.md) and the latest candidate/evidence tracker [issue #619](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/619) for current state. The first-read report's 850-word measure remains an editorial target, not an acceptance gate.

**Single current audit tracker: [issue #632](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/632).** This document consolidates status; it does not merge different people's evidence or imply that an issue is closed. Each original issue retains its own history. The machine-readable issue map is in `qa/audit-issue-consolidation-v1.json` and is checked by the release documentation suite.

## Reviewed current release

| Fact | Audited evidence |
| --- | --- |
| Last verified hosted non-production preview | 2026.10.16.1 after protected PR #639 merge; `main` merge SHA `53712742aa8c82e400a264f4c0e4a38b864335c4`; **2026.10.17.1 is NOT yet live** |
| Original audited historical merge | `89fe3e24c11c3eb660953870fce7e819280c55df` from PR #627 remains immutable provenance |
| Current draft candidate family | `2026.10.17.1` on PR #640, explicit technical FAIL and visual owner approval outstanding |
| Current retained public candidate | **NONE for 2026.10.17.1**; successful new source-bound producer, artifact hash, expiry and fingerprint missing |
| Last authenticated prior producer | `2026.10.16.1` source `e336f656351afa4eeaaae0940969bea881ae9b68` and artifact `12030806569`; history only |
| Browser automation | Draft substantive Chromium/WebKit, cross-browser, feature reachability and five 100-run reliability shards passed; strict new 52-screen/12px visual baseline unapproved |
| Visual provenance | Previous immutable approved ref `visual-baseline/2026.10.16.1` pinned to `04628e13a6c9a9517bef22bae6c12a456896f299`; **do not move or auto-approve it** |
| Root/production boundary | Production HOLD, educational/advisory only; no validated recipe, machine control or accreditation |
| External acceptance | All seven human/device/provider workstreams remain HOLD |

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

## P3 tooling-label metadata — FIXED in this documentation-only PR

The previously stale `qa/visual-regression-baseline.json.browser` label claimed Playwright `1.55.0` even though both the pinned reviewed screenshot source and current comparison runner use `@playwright/test 1.63.0`. This PR corrects that metadata label and separately records `referenceCaptureToolchain` and `currentComparisonToolchain`. Release docs QA now checks them against `package.json`. **The immutable visual-baseline ref, approved source SHA, all 52 surfaces and strict 12px threshold remain exactly unchanged.** No screenshot comparison was silently accepted or regenerated.

## Historical duplicate issue disposition

#624 concerns a once-blocked PR #623 that later merged and is superseded by #627. #379 is an older provider-candidate tracker replaced by the still-open #619. #625 is a historical-release audit: cross-link to #632 and retain its evidence; close only if its actual outstanding work is represented here and in the independently open acceptance trackers.

**Important:** closing a superseded *tracker* is a housekeeping action. It does not close #325/#362/#328/#326/#327/#329/#619 or authorize production, learner certifications, machine recipes or outreach. This is a single consolidated development plan rather than a fictional assertion that all 21 issues have been fixed.
