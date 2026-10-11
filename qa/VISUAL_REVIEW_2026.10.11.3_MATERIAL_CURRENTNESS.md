# Material Atlas visual regression acceptance record — 2026.10.11.3

**Scope:** Update the _Chromium visual comparison baseline only_, to the actual release-candidate learner-facing source `cf68994c400814a0b529b955a94f196b2b1449be`. This does **not** change any production UI code, website/runtime assets, validation status or release-HOLD policy.

## Detected difference from 2026.10.10.1

- Prior immutable comparison: `visual-baseline/2026.10.10.1` at `52160745ac51cbc9dae108315adc27fc1a3f5910`.
- Failure evidence: [PR #603 protected-main Mobile Browser QA run 38096152752](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38096152752); [artifact 11685789264 — candidate, old-baseline, diff PNGs for all 52 viewport/surface captures](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38096152752/artifacts/11685789264).
- Out of the 52 captured viewport/surface combinations, the only failing surface is **Book Materials** at each of four sizes:

| Viewport | Differing pixels vs prior baseline |
|---|---:|
| 360×800 phone | 21 |
| 412×915 phone | 4,429 |
| 810×1080 tablet | 17,911 |
| 1440×900 desktop | 27,784 |

The applicant/candidate capture adds an explicit visible safety/currentness boundary: **“Current availability and processing suitability not verified.”** It instructs learners to check current exact-grade supplier TDS, processing instructions and SDS where applicable. It appears when `grade.lifecycle.status` is `unknown`, after the canonical exact-grade evidence statement. The warning increases panel height and shifts supplier notes/property tables, accounting for the detected pixel drift. The Book/Catalog source and other surfaces were preserved. The screenshots are automated artifacts; an assistant inspected comparative images for four viewport sizes, not an independent human-device test or assertion that the owner inspected each capture.

## Owner authorization and exact QA reference

The owner explicitly replied **“Approve”** on 11 October 2026 after asking to merge PR #603 into `main` for the hosted **non-production** `/preview/` interface. This grants release intent subject to all protected-main CI; it is **not** evidence that the owner examined the image files individually. Avoid retroactively mislabelling that message as per-PNG visual inspection.

- New comparison ref: `visual-baseline/2026.10.11.3` pinned to `cf68994c400814a0b529b955a94f196b2b1449be` **before** this manifest-only change.
- `qa/visual-regression-baseline.json` is updated to that exact ref/commit.
- The old `2026.10.10.1` ref and audit records stay available for historical comparison.
- Same 4 viewports, 13 surfaces, **12-pixel maximum permitted drift**, strict Chromium test, no CSS masking or test skip. The new candidate **must independently pass** this reference; this document is not a test result.

## No external promotion

Only an owner-authorized, CI-verified protected-main merge may publish the current build under `/preview/`. Production root stays the release-HOLD page. Real iOS/iPadOS/Android testing, genuine NVDA/VoiceOver, 46 Book/120 curriculum SME human decisions, OEM/factory evidence, learner outcomes, NZQA/provider gates G1–G8, Windows signing/Store and all machine-control claims remain HOLD.
