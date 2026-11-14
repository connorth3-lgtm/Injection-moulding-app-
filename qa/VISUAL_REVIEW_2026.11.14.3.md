# Visual review — 2026.11.14.3 Process Data interface retirement

**STATUS: OWNER VISUAL APPROVAL — limited to the requested removal of Process Data screens and duplicate entry points while preserving the underlying local evidence.**

## Approved scope

The owner directed: “Remove the process data all together but the data behind it in the app still,” then requested merge. Approval covers removing the learner-facing Process Data routes and duplicate entry points. It preserves Maths as its own destination, the measured-evidence families and source records, the data-only helpers, the IndexedDB schema, and existing local prepared datasets and related records.

## Exact-source comparison

- Candidate screenshot source: `adf87268a9e65ea242dea6233e295ef5a2e90cb2`.
- Prior approved reference: `2154c7b6b7c3dd63f7752f84bca8a6e73c750883` (`visual-baseline/2026.11.13.3`).
- Mobile Browser QA run: `43541828069`.
- Chromium visual artifact: `14091978952`, digest `sha256:08d32ec85cc96e0d38d3a7e70eb47617f1815b00d3b9747ec30d1a5ab6fdd42f`, expiry `2026-11-28T01:42:33Z`.
- All 52 expected viewport/surface captures were produced. Forty-seven matched the prior reference; five expected captures changed: desktop Practice (68,598 pixels), 360×800 phone Practice (56,557), 412×915 phone Practice (56,145), 810×1080 tablet Home (19,502), and 810×1080 tablet Practice (86,044).
- The captured 412×915 Practice view shows two focused practice choices and no Process Data card. The 1440×900 desktop and 810×1080 tablet Practice captures show the same two choices; the tablet Home capture has no Process Data launcher.

The automated artifact correctly keeps `visualOwnerApproved=false`; this packet records the owner-directed decision separately. The strict comparison remains at 12 pixels with all 52 captures, four viewports and thirteen surfaces. No masks or skipped surfaces are added.

## New reference and limits

The new immutable reference is `visual-baseline/2026.11.14.3`, pinned to the exact screenshot source above. Subsequent exact-head visual QA must still pass all 52 captures at the unchanged 12-pixel threshold. This visual approval does not validate real assistive technology, physical devices, Windows signing, SME content, learner outcomes, NZQA/provider evidence or production use. Those streams remain **HOLD**.
