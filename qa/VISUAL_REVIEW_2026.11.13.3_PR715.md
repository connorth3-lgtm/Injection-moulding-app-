# PR #715 — Maths tab visual approval

**STATUS: OWNER VISUAL APPROVAL — exact candidate screenshots `0e20e1f0aa7c6976af23c9a6c65d8665a2a611a9`; immutable runtime reference `2154c7b6b7c3dd63f7752f84bca8a6e73c750883`.**

The owner requested that Maths become its own tab. After the phone and desktop Home previews were presented, the owner replied “Do this” to proceed with the release. This records approval for the visible Maths navigation design shown in those exact previews.

## Approved visual scope

- Show Maths as a dedicated primary destination in the phone bottom navigation and desktop sidebar.
- Keep the existing formulas and ungraded practice reachable from the Maths tab; remove the duplicate entry card from Process Data Lab.
- This approval applies to the Maths navigation change only. It does not approve separate changes or replace physical-device, accessibility, SME, learner-outcome, provider/NZQA, signing, or production validation.

## Exact-source comparison evidence

- Candidate screenshot source shown to the owner: `0e20e1f0aa7c6976af23c9a6c65d8665a2a611a9`.
- The locked visual comparison reports 52 expected and 52 captured viewport/surface captures. The artifact reports 45 of 52 comparisons differed from the previous reference `2026.11.13.1`; seven were pixel-identical. The intentional difference is the Maths navigation across the app surfaces.
- Mobile Browser QA run: `43403783240`.
- Chromium visual artifact: `14026049001` (`sha256:5e4185a53e9a9724c6191c1017659adccedfc2113c28bc985e59996cb485fae1`, expires 2026-11-27T09:51:09Z). The machine-generated artifact correctly retains `visualOwnerApproved=false`; this record separately records the owner decision.
- The owner-reviewed images were phone 360×800 Home and desktop 1440×900 Home. The runtime-equivalent visual reference is pinned at `2154c7b6b7c3dd63f7752f84bca8a6e73c750883`; GitHub comparison shows the subsequent two commits changed only QA assertions, so they do not change the rendered screenshots.
- New immutable reference: `visual-baseline/2026.11.13.3` at the exact runtime source above. The prior `visual-baseline/2026.11.13.1` is unchanged.
- All four viewports, thirteen surfaces, and the strict 12-pixel limit remain. No masks or skipped surfaces were added. No tolerance increases were made.

All seven independent human, device, Windows distribution, SME, learner-outcome and NZQA/provider review streams remain **HOLD**. Real assistive-technology and production reviews also remain HOLD.
