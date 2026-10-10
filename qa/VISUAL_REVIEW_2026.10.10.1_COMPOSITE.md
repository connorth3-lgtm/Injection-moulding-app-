# Composite Book / Home / Materials / Learn visual acceptance — 2026-10-10

**Decision:** The user and project owner replied **“I approve the changes”** and then **“I approve”** after the proposed design changes and exact-head visual comparison artifact had been linked in this conversation. This is **explicit owner acceptance of the proposed visual/UX direction** for Book, Home, Materials and unified Learn. It is not an attestation that each comparison PNG was individually opened or checked. No assistant, automated test, or bot may claim independent manual screenshot review from this statement alone.

## Exactly which candidate is pinned

- Source PR: [#587 — draft composite QA only](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/587), incorporating the source scopes in #583–#586.
- Exact visual candidate source: `52160745ac51cbc9dae108315adc27fc1a3f5910` (before this manifest/documentation-only approval update).
- New immutable, release-named **QA comparison ref**: `visual-baseline/2026.10.10.1`, initially pinned to the source SHA above. The workflow must fail if the ref ever moves without a newly governed decision.
- Previous comparison reference **unchanged and retained**: `visual-baseline/2026.10.09.5`, `fa27bd16525f8cb216654ea524649a3a37a3195c`.
- Manifest: `qa/visual-regression-baseline.json`; **`maxDiffPixels: 12` unchanged**, same Chromium pixelmatch comparison logic, same captured surfaces, no masking or test exclusions.

## Exact-head evidence available for human inspection

- [Composite visual baseline/current/diff PNGs and traces — run 38038705991, artifact 11664742980](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38038705991/artifacts/11664742980). Retained until **2026-10-24**.
- Four captured viewport sizes: **360×800, 412×915, 810×1080, 1440×900**.
- Prior strict automated comparison reported **16 failing view-group comparisons** against the old 2026.10.09.5 UI. Representative 1440×900 differences included Home **309,481 pixels**, Book trace **295,135**, and Lesson **210,475**. These are design-change measurements, not proof each difference is harmless.
- The owner's approval covers the **overall proposed design direction after the artifact was linked**. The evidence above remains the source for any further per-screen review. No manual inspection of each image is claimed without an explicit record.

## What this approval does not authorize

This new visual reference is used solely to compare the **QA-only combined candidate**. PR #587 must **not** be merged into protected `main` on top of the component PRs. The component PRs retain their separate visual and release gate status; no unrelated PR head is auto-approved by this ref.

The following remain **HOLD**: any unperformed physical iPad or Android PWA tests, 200% zoom and real assistive-technology accessibility tests, Windows distribution, independent Book/curriculum human SME review, learner outcomes, NZQA/provider verification, external evidence packet source-SHA and runtime-fingerprint rebinding, and authorized production release. `version.json.web_release` still needs an appropriately governed newer release candidate and the existing `tools/sync_web_release.py` workflow; release status must not be inferred from visual-owner assent.

**Protected gating:** unchanged, including immutable SHA/ref check, 12px strict visual comparison, physical evidence fingerprint checks, and exact-PR-head release assurance. A successful technical visual comparison after this ref change is **not** release authorization or a substitute for device/SME tests.
