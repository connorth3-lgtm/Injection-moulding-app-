# Visual comparison review — 2026.11.09.1 / PR #700

## Scope

This is a limited visual inspection of the Book rewrite candidate at source `58180fe3a6a92c88c33ea3a375feb163a925b168`. It supports the technical screenshot-baseline update and is not a human visual-owner approval, accessibility review, device test, or content SME sign-off.

## Automated comparison

- Chromium run: [Mobile Browser QA 42670487313](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/42670487313)
- Captured artifact: `mobile-browser-chromium-visual`, artifact `13698088984`
- The run captured all 52 viewport/surface combinations at phone (360×800, 412×915), tablet (810×1080), and desktop (1440×900) sizes.
- 32 combinations matched the previous release within the unchanged 12-pixel threshold.
- 20 combinations differed. Every difference was in the Book contents, Book chapter, Book trace, Listening, or expanded Listen surface. The changed pixels follow the requested rewritten chapter text, revised chapter titles, and longer explanations. No non-Book app surface was reported as changed.

## Visual sample review

Inspected the phone Book contents and late-chapter captures, plus tablet Listening and expanded Listen captures. The chapter list remains numbered and scrollable; the chapter heading, source-review boundary, and paragraph hierarchy are visible. The Listen controls and fixed bottom navigation remain present. The expanded Listen sample has the same narrow voice-selector label clipping as the previous baseline, so that is pre-existing and was not introduced by this content rewrite.

The visual deltas are expected content changes, so the technical comparison reference is advanced to a pinned branch at the Book rewrite source. The comparison keeps the same viewports, surfaces, and pixel threshold. The automated run must pass against that pinned source before merge.

## Review boundary

This report does not claim the candidate was tested with a human visual owner, an assistive-technology user, a physical Android/iOS device, or a Book subject-matter expert. All independent external-review states remain HOLD. Read Aloud behavior with the phone locked and the updated Android APK remain unverified/not built by this PR.
