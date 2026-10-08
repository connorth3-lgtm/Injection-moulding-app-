# MouldMaster UI duplication and consistency audit — 9 October 2026

**Target:** protected-`main` browser release `2026.10.09.2` (`c843474c1f8fd0e72a8d1b1a19b6d2d2feabc820`).  
**Method:** canonical shell, learner polish, PWA shell, CSS breakpoint, first-use, Book, mobile and Playwright source review; new automated Chromium/WebKit visual-layout interaction contracts. **No assertion of physical iOS/Android testing or real NVDA/VoiceOver approval.**

## Audit classification

| Priority | Surface | Observation | Disposition |
| --- | --- | --- | --- |
| **P2 stale-code risk** | Home progress | The *current* `renderDashboard()` uses `user.learningAwards` and a `.progress-card`. A legacy `syncCertificateCounter()` still reads obsolete `user.certificates` but targets old `.statline` markup that the current Home renderer no longer produces. | **Confirmed stale code; NOT a confirmed visible wrong-zero bug.** Add a nonzero-award active-layout regression; prune the dead updater in a future governed runtime release only after correct source/release/candidate handling. Tracked in [#517](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/517) |
| **P2 potential modal race** | More modal | Registry More items are appended on the next animation frame using the modal's *current* generic `.grid2`; if a different modal opens within that frame, actions could be appended to the wrong modal. | **Potential from source**, not reproduced; require a timed interaction test and node-identity guard before labeling fixed |
| **P1 test coverage gap** | Learner UI test CI | `qa/learner-ui-polish.spec.js` existed, but was absent from all active Playwright `testMatch` configurations. Its seeded profile also used obsolete `certificates`. | **Corrected in this PR**: suite enabled under UX workflow, fixture updated to `learningAwards` |
| **P2 preventive** | Home cards | Several former Home task shortcuts and game/gamification panels coexist in historical source; canonical runtime should display only today's lesson focus, Book/resume, two specialist actions and learner-specific cards. | Regression now verifies singular Home focus, Book and specialist panel; no retired duplicate task-hub/utility cards across seven widths |
| **P2 preventive** | Sidebar / mobile bottom nav | Legacy core, registry and polish layers all participate in navigation, making duplicate buttons or multiple active tabs an ongoing risk, especially after repeated view changes. | Regression now checks unique primary controls, correct active state and intentional Book desktop-only inclusion at six widths |
| **P2 preventive** | More tools | Original core menu, registry-provided links and retired dynamic tool handlers could create duplicate tool buttons or blank labels. | Regression now reopens More three times at three viewport widths; checks unique action IDs/names and absence of retired duplicate tool buttons |
| **P2 visual proof gap** | Actual hosted preview | An image-level, interactive deployed-browser audit could not be completed: connected Opera browser was unavailable, and the TinyFish automation service reported insufficient wallet credit. | **Unverified live visual appearance**; do not infer screenshots or touch-device approvals from static source review. A separate real-device/visual pass is required |

## Intentional, not accidental, repeated access

A Home **Book** resume card and a **Book** navigation destination serve different entry contexts; do not delete the resume card for being reachable twice. Likewise, **Home** and **Practice** may both lead to an evidence-led diagnostic tool, but the Home panel offers two different actions (Troubleshoot and Analyse data), while Practice is the broader hub.

The compact mobile navigation has exactly **Home, Learn, Materials, Practice, More**; desktop uses those plus **Book**. The Help/Support, Standards & safety and Profile links are in **More** rather than duplicated as primary mobile destinations. Repeated names are only treated as defects when two distinct, simultaneously actionable controls compete within the **same surface**, not when an intentional route is reachable via Home and a separate hub.

## New active regression coverage

`qa/ui-duplication-audit.spec.js` adds:
- Home card idempotence after repeated `switchView`, dashboard recomposition, runtime polish refresh and width changes at 1440, 1024, 810, 412, 390, 360 and 320 px.
- More menu idempotence after three open/close cycles at 1440, 810 and 390 px, including named action uniqueness and retired-controls absence.
- Primary navigation uniqueness and exactly one active item at desktop, tablet and phone widths.

`playwright.ux-polish.config.cjs` now executes the existing `qa/ux-polish.spec.js`, previously dormant `qa/learner-ui-polish.spec.js`, and the new duplicate-audit suite under **Chromium and WebKit**; `.github/workflows/ux-polish-qa.yml` now triggers for their spec files and the actual shell/polish source files.

These are executable **non-production automated layout/interaction checks**. They do not imply human accessibility, device installation, offline update certification, technical Book SME, NZQA approval, learner-outcomes proof or manufacturing production control authority. Runtime version `2026.10.09.2`, existing candidate fingerprint and all external HOLDs are unchanged in this QA-only PR.

## Follow-up and release discipline

1. Complete exact-head CI for this UI-audit PR, including the newly activated Chromium/WebKit UX matrix. Fix any meaningful test failures without weakening their assertions merely for green CI.
2. Add a **nonzero, earned-certificate** behavioral test for the *active* Home `.progress-card` first. Do not assume the obsolete `.statline` updater is reached. Remove/repair stale compatibility code only in a separately governed release with PWA/cache bump, retained exact-runtime candidate and truthful external HOLD rebinding. Do not modify the existing `.2` candidate provenance.
3. Reproduce the More/modal animation-frame race before changing its runtime. If confirmed, populate the originally opened grid only while it is still connected and labeled as the More menu, and regress rapid modal replacement.
4. Perform a separately documented hands-on desktop/touch visual review (browser screenshots, 200% zoom, keyboard, screen reader as applicable) before sending invitations. Passing the automated UI matrix alone is not human device/AT approval.

**Release safety:** production root remains held and learner app remains non-production/advisory-only. All seven external validation workstreams remain HOLD.
