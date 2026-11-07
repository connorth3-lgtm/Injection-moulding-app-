# PR #693 — 2026.11.08.2 owner visual approval

**STATUS: OWNER APPROVED VISUAL BASELINE FOR EXACT SOURCE e062c685bac1be2b32ab8564d625e3168042821f.** On 2026-11-08, after the exact-source before/after comparison sheets were presented for phone, tablet and desktop, the owner replied **“I approve.”** This approval is limited to the reviewed Learn, Practice and Materials consolidation at this source.

## Reviewed evidence

- Exact screenshot source: `e062c685bac1be2b32ab8564d625e3168042821f`.
- Mobile Browser QA run: [42420636034](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/42420636034).
- Screenshot artifact: [13593550727](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/42420636034/artifacts/13593550727), digest `sha256:0db417bd2b4bcdb326180c1c60ebab84f3719a38152620bccbcb7447e2ea8c3f`.
- The pre-approval artifact manifest records 52 expected and 52 captured surfaces, with the existing strict `maxDiffPixels=12`. Its `visualOwnerApproved=false` field remains unchanged as accurate machine-generated provenance.
- All 104 candidate and baseline PNG files were checked against their manifest SHA-256 values; there were zero mismatches.
- 42 of 52 comparisons matched the prior reference within the existing 12-pixel threshold. The 10 changes below are the complete approved visual scope.

## Approved changed screens

| Capture | Pixel differences |
| --- | ---: |
| desktop-1440x900-learn | 163,754 |
| desktop-1440x900-materials | 160,657 |
| desktop-1440x900-practice | 81,347 |
| phone-360x800-learn | 43,944 |
| phone-360x800-materials | 64,310 |
| phone-412x915-learn | 50,626 |
| phone-412x915-materials | 82,276 |
| tablet-810x1080-learn | 135,286 |
| tablet-810x1080-materials | 169,886 |
| tablet-810x1080-practice | 76,473 |

Learn places the interactive lesson within All lessons; Practice opens Guided fault practice from the Diagnose picker and keeps the worked review with the selected case; Materials places grade comparison/change and learning beside the catalogue controls. No other screen is included in this design approval.

## Immutable baseline

- Created `visual-baseline/2026.11.08.2` at exact reviewed source `e062c685bac1be2b32ab8564d625e3168042821f`.
- GitHub comparison verified the new reference is identical to the reviewed source (zero commits ahead or behind).
- The prior reference `visual-baseline/2026.11.03.2` remains unchanged.
- `qa/visual-regression-baseline.json` retains all four viewports, thirteen surfaces and the 12-pixel threshold. No mask, skipped capture or tolerance increase was added.

## Approval boundary

This is visual-design approval for the listed UI changes only. The strict exact-head CI checks still have to pass before merge. Physical-device, assistive-technology, Windows signing, Book and curriculum SME, learner-outcome, provider/NZQA and production validation remain **HOLD**. MouldMaster remains advisory-only; this approval creates no machine-control or production authority.
