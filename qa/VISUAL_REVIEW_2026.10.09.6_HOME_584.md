# Home Mission Control removal — scoped visual approval (2026-10-10)

## Decision and exact source

**Visual decision: APPROVED for the intentional Home de-bloat design only.** The project owner was shown before-and-after screenshots generated from draft [PR #584](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/584), including a 360×800 phone, 810×1080 tablet and 1440×900 desktop, and was asked: “Do you approve this cleaner Home layout for the new visual baseline?” The owner answered **“I do yes.”** This is the direct human design decision, not generated sign-off for devices, coursework, wider screenshot changes or production release.

The immutable baseline branch `visual-baseline/2026.10.09.6` was created **once** at approved exact UI source commit `88b1fcc7e8a95be18b80337fef37f12eb90c2b78`. The [visual manifest](../qa/visual-regression-baseline.json) now declares that release/ref/SHA with the **unchanged 12-pixel limit**. Subsequent docs/manifest/source edits in PR #584 are **not** part of that pinned screenshot source; runtime changes after it require new comparison and fresh human review if the rendered output changes.

## What is in the scope of the visual decision

- The oversized Home-only Mission Control title/evidence badge, machine/mould/material/part/case context and numbered-step bar disappear, as does the redundant Home Mission Control card. Home's **Continue Learning**, Book and specialist actions move earlier in the viewport.
- Underlying mission evidence and stage information remain stored per learner, and the real controls appear in **Practice, Materials and other non-Home workspaces**. The command palette and drawer hosts stay mounted. The fixed mobile navigation, Book entry and main Home cards remain functional.
- On the source head before the approved manifest change, the [Mobile Browser QA run 38016720758](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38016720758) retained [artifact 11656003482](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38016720758/artifacts/11656003482) with baseline/candidate/diff screenshot PNGs at 360×800, 412×915, 810×1080 and 1440×900. Twelve Home/Listen-derived comparisons intentionally changed; four other captured groups were unchanged. The Home snapshots' changed pixel counts were 91,650; 112,978; 196,066; 299,342 respectively. Listen player functionality was checked by existing automated tests but is **not** separately declared human-approved by this document.

## Quality and independent validation boundaries

The earlier approved screenshot ref was source `fa27bd16525f8cb216654ea524649a3a37a3195c`, visual manifest version `2026.10.09.5`. The proposed baseline deliberately changes the reference to the owner's newly approved Home layout, **not** the allowed difference threshold, source verifier, screenshot masking or browser coverage. An immutable branch is guarded by the workflow's ref/SHA exact-match test; any later ref movement must fail unless explicitly reviewed in a new proposal.

At the screenshot-decision stage, exact prior head `88b1fcc7e8a95be18b80337fef37f12eb90c2b78` passed 15/21 workflows including Premium UI Chromium+WebKit, UX Polish/Book Endurance, mobile Chromium/WebKit substantive tests and five app reliability shards. Six were fail-closed on the old visual lock and stale release-candidate metadata. **Green tests following this baseline update must be observed, not assumed.** Protected release readiness, retained artifact/source fingerprint, production permissions, real iPad/iOS/Android and 200%-zoom/AT work, independent Book/curriculum SME, NZQA/provider and real learner validation remain **HOLD** until genuine independent evidence and all required CI gates exist.
