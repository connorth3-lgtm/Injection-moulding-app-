# PR #638 — actual-source visual review and release approval checklist

**Status: PENDING HUMAN REVIEW. This document is not approval.** The owner approved the blue Learn/Practice/Materials/Resources *design concept*, not the exact browser screenshots of this implementation.

## Exactly what must be reviewed
- Inspect the **actual** source-linked Playwright visual artifact for the **final PR head SHA**; compare every candidate, reference and difference image. The baseline SHA and release are immutable: `visual-baseline/2026.10.13.3`, commit `352bf204ae77779d548bc77dcf8b0a63db2a84e1`.
- The unchanged strict pixel gate is **12 pixels**. There are **52 locked captures**: thirteen screens (home, learn, materials, practice, lesson, more, assessment, listen-expanded, listening and five Book views) across four viewports (360×800, 412×915, 810×1080, 1440×900). The manifest and baseline cannot be silently modified, moved or passed using a higher tolerance.
- Inspect actual navigation, text and controls on changed Learn, Practice and More screens. Verify Materials catalogue still leads with exact-grade search, source-owned counts remain correct, and the blue More interior tiles are accessible. Verify no cropped text, navigation covered by sticky tabs, or hidden critical controls.
- Review the four supplemental hosted-preview status screenshots separately. These are not part of the 52 and do not establish physical-device or production authority.
- If acceptable, explicitly approve the **exact final source SHA** and captured evidence (archive artifact ID + run ID) in a new owner comment. Generic approval of an illustration or previous SHA does not count.
- Only then create an **independent immutable successor baseline** at that same approved source; preserve the prior baseline ref and exact 52-screen/12px parameters. Rerun visual QA on the successor baseline and verify the owner review identity. A successful pixel comparison alone never demonstrates human signoff.

## Recorded preliminary evidence (historical, not approval)
The 2026-10-15 exploratory visual run `38710505588` produced artifact `11960671455` (sha256 `885ce3e056bd4076f8707f63d596d77d7ea368490c23413b471bff6c7f7627db`) for PR source `2467cd4d681e2ae66b2545083eb1341f44552f90`. Its manifest recorded **52/52** candidate/reference screenshots, **12/52** above-threshold screens, and `visualOwnerApproved=false`. Learn, Practice and More differed at each of the four resolutions; unrelated screens were within tolerance. This artifact demonstrates the intentional redesign but is **stale for any later code change**.

View the preliminary source-linked action and download its **mobile-browser-chromium-visual** artifact:
https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38710505588

The actual **current final-head** visual artifact must replace that historical record before signoff. Compare `visual-regression/review-manifest.json` and every screenshot.

## Blocked technical promotion (do not override)
1. PR `mobile-browser` must be green on the final SHA, including substantive Chromium/WebKit, reachability, all five × 100 reliability shards, and the strict 52-screen visual suite.
2. Only a **successful** exact-head `Pre-merge Public Candidate` producer with retained, unexpired artifact can bind `data/release-external-validation-v1.json` and the seven successor HOLD packets via `tools/rebind_external_hold_candidate.py`. A build artifact from a failing producer is *not* an accepted candidate. Never invent artifact expiry, run ID, digest, fingerprint or source SHA.
3. Complete live external validation and NZQA tracker bindings with honest independent statuses: seven external human/device/SME/provider streams remain **HOLD**. `productionUse=advisory-only`; no machine control, accreditation or qualification is asserted.
4. All six protected exact-head checks (including Windows desktop, release external-validation, integrity, mobile-browser, question-quality and risk coverage) must be green. Do not remove their branch rules.
5. Owner alone authorizes the squash merge and verifies protected-main Pages exact-source publication; tester invitations remain **STOP/no-send** until issue #512 live/manual first-run gates are satisfied.

**Decision required:** Review the actual final-source PNG evidence. Until then, release promotion and merge are intentionally BLOCKED. Do not repin the baseline on the strength of a generated mockup.
