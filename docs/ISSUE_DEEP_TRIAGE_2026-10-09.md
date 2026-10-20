# Open-issue deep triage — MouldMaster 2026.10.09.5

**Snapshot:** 9 October 2026, after PRs #534, #537, #538. Protected main source at triage: `a505032557f0c152c89fce7ea4d96e5d9b266bab`. Web/PWA release: `2026.10.09.5`, hosted under labelled non-production `/preview/`; production root is release-held. **This is an engineering tracker, not certification, physical-device or human acceptance.**

## Technical issues and disposition

| Issue | State / finding | Next action |
| --- | --- | --- |
| #517 | **Closed** — .5 contains More-dialog instance guard, delayed first-run onboarding, retired certificate shim, and Playwright regressions. | Guard the fix in mandatory architecture QA. |
| #414 | **Closed as superseded** — old release tracker `2026.10.06.22`. | Use current #379; all independent child validations stay open. |
| #512 | **Open** — hosted .5 Pages publication and Book live validation passed; operator invitation preflight not attested. | Run `qa_tester_handoff.py --live --expected-source-sha <ACTUAL_DEPLOYMENT_SHA>` and manual desktop/touch/privacy/isolation checks; no invitations before signoff. |
| #520 | **Open** — .4/.5 UI code/browser tests fixed; physical iPad/200% zoom still untested. | Genuine device, safe-area, touch and zoom operator evidence. |
| #519 | **Open** — 10 duplicate top-level names in generated `core-inline-004.js`; not 10 simultaneous visible controls. | Reduce safely **one function at a time** through `tools/externalize_core_scripts.py` source transform and a **new governed runtime/cache release**; preserve frozen recovery HTML, compare exact user state and browser/Windows behavior. New CI ratchet forbids debt growth but does not remove it. |
| #521 | **Open** — developer-only NEW1 workbench staged and UI .4/.5 repairs shipped; remaining unified Book ⇄ lesson ⇄ practice ⇄ Virtual Apprenticeship/Spatial Twin navigation is not certified complete. | Single authored mapping, offline deep links, learner isolation, browser and real-device proof. |
| #442 | **Open** — engineering screens partly implemented, additional physically validated thermal/runner/gate/fit models not provided. | Evidence-driven model/benchmark work, no production setpoint promotion. |
| #428, #430 | **Open** — exact-model Hwamda OEM manuals and manufacturer/controller expansion outstanding. | Obtain exact-series rights-clear OEM technical documentation and versioned provenance. |

## Release-specific human, platform, and data tasks — all explicitly open

- **#379:** master `.5` NZQA/provider G1–G8 and cross-stream HOLD tracker; it is **not** cleared by technical CI or a source merge.
- **#325:** physical iOS/iPadOS/Android PWA install/update/offline/storage tests on the exact `.5` runtime.
- **#362:** genuine human NVDA/Firefox, NVDA/Chromium and VoiceOver/Safari macOS/iOS task matrix.
- **#327:** human SME semantic review of all 120 Academy lessons.
- **#326:** independent qualified review of all 46 governed Book modules.
- **#329:** consented real-learner outcomes and delayed-transfer study.
- **#328:** separately governed signed Windows/SmartScreen/Store distribution and physical testing; an unsigned CI build is insufficient.
- **#278:** platform-admin enabled *immutable GitHub Releases* and a newly published desktop tag whose API `immutable=true`. Previously published `desktop-v2026.09.29.1` currently remains `immutable=false`.
- **#334, #335, #336:** genuine rights-clear synchronized fault/intervention/recovery, hot-runner actuator/cavity/quality and mould maintenance/recovery measurements respectively. Header-only schemas and literature are not substitutes.

## Provenance and fail-closed boundaries

- Exact learner-runtime source: `581e08e58f0b9ec3c7a3501f9a3a71d47ed2c184`; fingerprint `sha256:216ec18dc5687ffbbb6aecee36b595533b65deb6c25c2c2bb7693f0bc6a97bcf`; retained artifact **11593612154** from successful run **37878945696**, expiring **7 January 2027**.
- Current `.5` release ledger: `data/release-external-validation-v1.json`; all seven independent external statuses remain **hold**. Developer-only technical acceptance must not be recast as device, SME, learner, signing, NZQA/provider or manufacturing authority.
- The Pages release-hold workflow passed for protected main `a505032557f0c152c89fce7ea4d96e5d9b266bab`; the latest deployed SHA must always be read before running the independent live tester handoff, because a later documentation-only merge can change provenance.
- Reopening old `.3/.4` issue bodies as historical data must never rewrite the current runtime fingerprint, `qa/visual-regression-baseline.json`, `version.json`, or protected-main rules.
- Do not claim the 20 issues are all closed: the open items above have real engineering, operator or external acceptance criteria. Update issue bodies and titles when release identity changes, preserve the archival trail, and close only issues whose own exit conditions are genuinely met.

## Generator-side retirement readiness — 9 October 2026

The frozen recovery HTML stays immutable. The deterministic core externalizer now has a **version-gated**, exact-inventory-checked path for retiring all ten earlier shadowed core declarations from the *generated* learner runtime once the governed web release reaches `2026.10.09.6` or later. CI independently computes the retirement preview and asserts the generator produces the identical candidate SHA-256 with one active declaration of each name. The existing `2026.10.09.5` runtime stays byte-for-byte unchanged until that version/release gate is deliberately raised. **Issue #519 remains OPEN** until regenerated release bytes, new service-worker cache/release identity, full exact-head CI, new candidate fingerprint and genuinely release-specific external HOLD packets are reviewed; a syntax-only proof does not constitute behavioral/physical-device acceptance.
