# PR #697 — 2026.11.08.4 visual baseline review

**STATUS: OWNER VISUAL APPROVAL — exact reviewed source `ba7a48b1cee1fdf88accac1d91eb904ffa22f120`.**

The repository owner explicitly directed: “Merge all PRs.” PR #697 is the only open PR. This approval record applies that instruction to the visual baseline needed for its requested Learn and Practice consolidation.

## Reviewed scope

The approved visual scope is limited to the copy changes that route diagnosis and process-data work through the unified Practice area:

- Home troubleshooting now describes the guided diagnosis route.
- The Practice process-data card is named **Process data lab** and describes guided synthetic or local data analysis.
- The existing card layout, navigation, viewports, and all other surfaces remain unchanged.

## Exact-source evidence

- Source: `ba7a48b1cee1fdf88accac1d91eb904ffa22f120`
- Mobile Browser QA run: [42455576429](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/42455576429)
- Screenshot artifact: [13607855703](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/42455576429/artifacts/13607855703), digest `sha256:f6eb69e1e85d11275349e3310e37ae84942d3316e29d1b4f4056d3bdd8b2d490`
- The artifact contains 52 expected and 52 captured surfaces.
- 47 unchanged captures passed the existing 12-pixel threshold. Five captures showed the requested copy changes:

| Capture | Pixel differences |
| --- | ---: |
| desktop-1440x900-practice | 4,714 |
| phone-360x800-practice | 32,066 |
| phone-412x915-practice | 3,343 |
| tablet-810x1080-home | 812 |
| tablet-810x1080-practice | 3,349 |

The machine-generated artifact retains `visualOwnerApproved=false`; this file is the separate owner authorization record. The four existing viewports, thirteen surfaces, strict 12-pixel threshold, and complete capture matrix are preserved. No masks or skipped surfaces were added.

## Immutable reference

- Created `visual-baseline/2026.11.08.4-pr697` at exact reviewed source `ba7a48b1cee1fdf88accac1d91eb904ffa22f120`.
- The previous `visual-baseline/2026.11.08.4` reference remains unchanged.
- `qa/visual-regression-baseline.json` pins the new reference, source and original strict threshold.

## Approval boundary

This record approves the visual baseline for PR #697 only. Accessibility, physical-device, Windows signing, Book and curriculum SME, learner-outcome, provider/NZQA, and production validation remain **HOLD**. No qualification credit, machine-control or production authority is created.
