# MouldMaster 2026.10.11.10 — owner visual review recorded; final baseline pending

The owner has explicitly approved the shown **actual app before-and-after screens** in chat. This is a **visual design approval of displayed captures**, not a successful CI result, independent GitHub code review, approval of unseen technical behavior, or source-bound immutable visual baseline. The release remains **HOLD** until the final exact-head capture and remaining protected checks pass.

## Owner screenshot review decision — 2026-10-12

- **Decision:** “I approve”, immediately after presentation of the remaining-visual-review montage and linked small-phone, tablet and desktop detailed before/after comparisons.
- **Previously approved:** five displayed primary-navigation surfaces at `phone-412x915` (Home, Learn, Materials, Practice and More) in an earlier actual .9-to-.10 screenshot comparison.
- **Newly displayed and approved:** the remaining visual-review sheet: Home, Learn, Materials, Practice, More and expanded Read Aloud across `phone-360x800`, `phone-412x915`, `tablet-810x1080` and `desktop-1440x900`; 24 changed capture slots, of which the five 412px primary screens had already been approved. The other 28 of 52 captures were reported visually unchanged at the locked comparison threshold, not individually approved by the owner.
- **Captured evidence:** `Mobile Browser QA` run [38183115817](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38183115817), artifact `mobile-browser-chromium-visual` ID `11717723861`, rendered candidate source `748b043a867a0dca124009f875fd0e483a001274`.
- **Later functional repair:** the Read Aloud expanded panel was found overlapping Home's Today's focus card. The mitigation and regression test were committed after those images at `461a1e3aa8fe42ba2c76198f1b34314c19f0be03`, with dedicated Read Aloud QA passing. **The post-fix expanded Read Aloud screen is not covered by the earlier image approval** and must be re-captured and inspected.
- **Remaining baseline steps:** capture the final exact-head visuals after the repairs; verify the repaired Read Aloud panel and all changed screens against the approved direction; record actual hashes/artifact/source; then create a separately reviewed release-specific immutable .10 baseline. Preserve the .9 baseline and strict 12-diff-pixel comparison. No automatic approval is inferred for new screenshots or behavior.



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
