# MouldMaster 2026.10.11.10 — candidate UI screenshot review (NOT APPROVED)

This checklist is for **PR #617's approved design direction**, not acceptance of the actual browser-rendered screens. The owner's mockup approval does not replace real browser screenshots. This packet remains **PENDING**; it cannot serve as the approved visual baseline or an external validation certificate.

## Generate and retrieve genuine candidate captures

The existing `Mobile Browser QA` → `browser-chromium (visual)` job runs `qa/visual-regression.spec.js`. It saves candidate, historical baseline and diff images under `qa-artifacts/visual-regression/` before failing on intentional screen changes. Download its `mobile-browser-chromium-visual` artifact from the **successful-to-capture run for the exact final PR HEAD**, not from an earlier commit. A failed strict comparison is expected during redesign review; do not change `maxDiffPixels: 12`, disable comparisons or label that failure green.

Inspect the image **without** `-baseline` and `-diff` suffix first: `<viewport>-<surface>.png`. Then compare `<viewport>-<surface>-baseline.png` and `<viewport>-<surface>-diff.png`. Record final source SHA, workflow run ID, artifact ID, image hashes and reviewer feedback; these values must be collected from the actual workflow, never guessed. Once final code stabilises and the 52 actual capture images have been reviewed, an explicitly approved **new release-specific** baseline may be prepared in its own governed change, retaining the immutable .9 baseline and strict tolerance.

## All 52 screenshots to review

**Viewports:** `phone-360x800`, `phone-412x915`, `tablet-810x1080`, `desktop-1440x900`.

**Surfaces on each viewport (13):** `home`, `learn`, `materials`, `practice`, `lesson`, `more`, `assessment`, `listen-expanded`, `listening`, `book-contents`, `book-materials`, `book-late`, `book-trace`.

## Reviewer checks

- Home: navy/teal image-led welcome, legible text, working Continue Practice, four usable quick tools including the unit converter and no content overlap.
- Learn: one illustrated lesson catalogue, actual course names, live search, open lesson content and progress.
- Materials: sourced polymer folders (PP **95** exact grades), family detail tabs, back/clear/search, complete supplier evidence, grade compare/change actions, and accessible legacy material-science learning.
- Practice: five illustrated actions with Questions in the same chooser; assessment scoring and source evidence are unchanged.
- More: visible Help and About, all existing governed actions still reachable with keyboard and screen-reader semantics.
- Accessibility/responsiveness: focus order, 320px and 360px overflow, reduced motion, touch target sizes, zoom, fixed bottom navigation, tablets and desktop.
- Safety: non-production preview language, family-level properties qualified as educational, production machine-control prohibited.

## Current authority

**Technical automation: FAIL/HOLD until all required exact-head checks pass.** The previous approved `2026.10.11.9` visual baseline at source `4116eda8950b65c337f22c7f0f981822e200569d` is immutable and is **not** an approval for the changed .10 screens.

All seven external streams remain HOLD (real assistive technology, physical PWA, Windows signing/distribution, Book SME, curriculum SME, learner outcomes, NZQA/provider). No merge, production root publishing or machine-control authority is conferred by this checklist.
