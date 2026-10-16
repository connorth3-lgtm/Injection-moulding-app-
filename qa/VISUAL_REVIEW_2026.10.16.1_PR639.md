# PR #639 — 2026.10.16.1 owner visual approval

**STATUS: OWNER VISUAL APPROVAL FOR EXACT THREE REVIEWED PHONE SCREENS ONLY.** The owner was shown direct before/after comparisons of the real Chromium screenshots, asked whether the compact More and small Practice layout changes were approved, and answered **"Yes that's better"** on 2026-10-16 NZDT. This does not signify merge or deployment approval.

## Reviewed provenance

- **Exact source SHA:** `04628e13a6c9a9517bef22bae6c12a456896f299`. [Mobile Browser QA run 38846976380](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38846976380); real screenshot artifact **12023269036** with ZIP digest `sha256:bf52e4488c878e4d1a0357eaa67b61aebb65455500f66d2e5d2e5286cfbd3ed6`.
- Raw `visual-regression/review-manifest.json` from that artifact identifies 52/52 unmasked captures, 4 viewports × 13 surfaces. **49 passed** the prior strict 12-pixel comparison, **3 intentionally drifted**. The owner saw the three affected side-by-sides, not necessarily each of the 52 raw images.

| Approved phone capture | Measured drift | Candidate PNG SHA256 |
| --- | ---: | --- |
| 360×800 More | 83,431 pixels | `1f79241c1218b8efd665c66f86a82fe569776109f1421b32ca1faa99fc8707b6` |
| 412×915 More | 134,974 pixels | `50c30159c3dbe6b024ab2bd6bd3c28f01da95eb272fd4ad041fc44b8c340c4a5` |
| 412×915 Practice | 7,540 pixels | `500f4b266df92bfb407a91c0268b55ea7710fd18dd2e4bef810fe88843d61629` |

The CI artifact correctly has `visualOwnerApproved=false` because it was generated **before** the owner's subsequent answer. Do not alter historical screenshot artifacts or auto-claim owner validation.

## Immutable successor comparison

- New `visual-baseline/2026.10.16.1` was created directly at `04628e13a6c9a9517bef22bae6c12a456896f299` and its Git ref was verified equal to that source. Never move that branch.
- Preserve historical `visual-baseline/2026.10.15.3` at `82b1677caecb50c95c5395166317132447851e5b`, unchanged.
- Continue all four viewports, thirteen surfaces, 52 total captures and strict `maxDiffPixels=12` with zero masks, skipped surfaces or relaxed tolerances. Subsequent source changes must pass the newly locked screenshot suite.

## Non-visual release acceptance remains HOLD

Owner approval is limited to three source-linked visual differences. It does **not** authorize merge, publishing, tester invitations, device/real-AT/SME/NZQA/provider outcomes, signed distribution, accredited assessment, validated recipes or machine control. CI must pass for exact candidate bytes, then a **successful** Pre-merge Public Candidate artifact with authentic producer/run, digest, expiry and runtime fingerprint must be rebound to all seven external review packets. A file uploaded from a failing producer run is not a successful accepted release candidate. All seven human/device streams remain **HOLD** and production remains advisory-only.
