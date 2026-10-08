# New2 Android diagnostic and startup repair — 2026-10-08

**Release candidate:** `2026.10.08.8`; reviewed release-control checks must pass before promotion.

## User-reported defects

1. On a physical Android device, the unified diagnostic workbench's evidence checklist rendered each checkbox at form-input width, forcing the labels off-screen and inducing horizontal overflow.
2. Intermittent preview startup reported `Uncaught TypeError: currentLesson is not a function` at generated `core-inline-004.js` during the core dashboard render.

## Bounded repair

- CSS contains checkboxes to fixed 19 px sizing and flex basis under `#defects/#coach` only. Evidence text has its own shrinking/wrapping flex track and cannot overflow the view. The legacy generic `input{width:100%;padding:10px}` rule remains unchanged for other forms.
- The generated **active** core runtime keeps the compatibility `currentLesson()` global but uses a stable lexical `mmCoreSafeLesson()` resolver for its own renderers. This defends internal dashboard/lesson calls if the legacy global is clobbered, without rewriting the byte-frozen recovery core, learner data or validation logic. It does not by itself prove which external caller corrupted the global in the reported session.
- New Chromium browser regressions at a 360 px viewport measure actual checkbox and evidence-label rectangles, horizontal scroll extent, selection and evidence state. A separate controlled regression clobbers/restores `window.currentLesson`, renders the dashboard and checks that local learner storage was not changed.
- All technical/external evidence limits are unchanged. The Android screenshot is a bug report, **not** a passed physical-device release matrix. Real-device, AT, NZQA, SME and pilot statuses remain HOLD.

The release is gated on full PR-head QA, exact retained public candidate and release/HOLD packet rebinding, post-merge Preview workflows and a separately owner-approved protected-main squash promotion. No force pushing or bypassing the external HOLD contract.
