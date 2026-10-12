# MouldMaster .10 — Book-only Read Aloud visual decision

**Status: Owner-approved for the Book-only appearance actually shown.** This is a scoped visual-design decision, not production-release approval or external AT testing.

## Owner decision

On 2026-10-12 the owner said **“I approve”** immediately after being shown a composite of **actual 412×915 mobile browser captures** from PR #617: Home without the global audio player, the Book with one compact Listen button, and the Book with the speech controls expanded. The same request follows the owner's instruction that a large global reader is unnecessary and audio should be available only inside the Book.

This is approval of those *displayed* before/after app visuals, not approval of conceptual illustrations, every unshown screen size, physical iOS/Android audible output, or human assistive-technology results.

## Source-bound artifacts

- Candidate commit: `7b22514e45bb17068736f8e76d4c63862d726f8d`.
- [Mobile Browser QA run 38192253942](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38192253942).
- Artifact: `mobile-browser-chromium-visual`, ID `11720999793`, containing candidate, baseline and diff PNGs.
- The actual in-chat composite displayed the 412×915 Home (no audio), Book (compact audio), and expanded Book reader.
- Substantive Chromium, WebKit, cross-browser and five reliability shards passed at that candidate source; strict visual comparison failed against the **older**, intentionally different .10 baseline.

## Immutable successor comparison baseline

- New ref: `visual-baseline/2026.10.11.10-book-only`, **pinned** to `7b22514e45bb17068736f8e76d4c63862d726f8d` before any manifest-only changes.
- New `qa/visual-regression-baseline.json` compares the same **4 viewports × 13 surfaces = 52** images and retains `maxDiffPixels=12`.
- The release-doc contract allows **only** the exact pinned Book-only successor for release `2026.10.11.10`, rather than allowing arbitrary suffixes or updated SHA values.
- The already protected `visual-baseline/2026.10.11.10` and earlier `.9` refs remain untouched. Never force-move them to pass tests.
- The other non-shown viewports/surfaces remain browser-regression coverage, **not individual owner-image approvals**. Any new visible design change requires a fresh screenshot review and a separately named immutable reference.

## Distinct release controls

The UI approval is not a passing public-runtime candidate, producer run, digest/fingerprint, Windows signing, physical PWA test, human NVDA/VoiceOver/Android Read Aloud validation, SME sign-off, learner outcomes study, or NZQA/provider authority. All seven independent external validation streams remain **HOLD**; production root and automatic machine-control use remain unauthorized. Draft PR #617 must not merge unless its protected exact-head CI and release provenance rules are satisfied.
