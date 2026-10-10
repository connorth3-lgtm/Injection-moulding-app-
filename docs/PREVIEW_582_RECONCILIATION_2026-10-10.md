# #582 four-area UX: preview ancestry and release-record reconciliation — 2026-10-10

**Scope:** Resolve #588 merge conflicts on the PR source branch and preserve existing `preview` commit ancestry, not approve a production release. **Do not merge into `main`**, force-push any branch, falsify evidence or bypass a required check.

## Exact sources for reviewed two-parent resolution

- Original `preview`: `dd537d5dcf26c63c870f411f81d09d4501691a9d`.
- Approved Book/Home/Materials/Learn combined staging source: `c292aa7f82be39a481a9be5fafec2ed41eb5c1c6`.
- Git comparison: the original `preview` has **25 commits** not in the original staging source; the staging branch has **191** not in `preview`. The review is not a direct reset or fast-forward.
- The original `preview` differs from the original protected `main` tree in **13 paths**, reviewed below. All 13 have also changed in the newer combined staging tree relative to `preview`.

## Resolution by path group

1. **Eight historical 2026.10.09.4 external/SME/signing packets:** `certification/WINDOWS_SIGNING_READINESS_2026.10.09.4.md`, `qa/ACCESSIBILITY_REAL_AT_2026.10.09.4.md`, `qa/BOOK_SME_REVIEW_2026.10.09.4.md`, `qa/CURRICULUM_SME_REVIEW_2026.10.09.4.md`, `qa/EXTERNAL_VALIDATION_2026.10.09.4.md`, `qa/LEARNER_PILOT_2026.10.09.4.md`, `qa/NZQA_EXTERNAL_VALIDATION_2026.10.09.4.md`, `qa/PWA_PHYSICAL_DEVICE_2026.10.09.4.md`: `preview` has historical `.4` wording describing it as current; the newer source has a historically qualified record and explicitly identifies the later `.5/.6` runtime. Keep the newer source text to avoid presenting obsolete `.4` evidence as current. The original exact `preview` text remains accessible through the merge second parent. No test/external status is promoted.
2. **`data/accessibility-real-at-validation-v1.json`:** preview still points to historical `.4` and prior producer, whereas source uses governed `.6` and keeps real AT tasks **HOLD**. Preserve newer `.6` *historical* source; the actual latest candidate still requires its own physical/AT evidence. Do not relabel `.4` or `.6` source SHA as a new tested candidate.
3. **`qa_release_docs.py`:** preview expects `2026.10.09.4`, staging expects the newer `.6` governed release. Preserve the newer source test; do not downgrade the expected release or disable any assertion.
4. **`qa/visual-regression-baseline.json`:** preview's approved immutable `.4` ref, the newer source's `.5` ref and owner-approved `visual-baseline/2026.10.10.1` QA-only ref are each separate historic sources. Keep the new approved exact composite QA ref, the unaltered 12-pixel limit, and all prior references unchanged.
5. **`qa/VISUAL_REVIEW_2026.10.09.4.md` and `qa/POST_MERGE_AUDIT_2026.10.09.4.md`:** retain newer source's contextualized historical records; earlier preview-only statements that `.4` was the current published preview were true at the older source, not current after `.5/.6`. The original preview snapshot remains a parent commit and auditable.

**Resulting tree:** deliberate selection of the exact approved combined staging source tree plus this conflict-resolution document, with **no runtime byte changes** made by ancestry reconciliation. Both original development and previous preview history are preserved by the resulting two-parent commit. Historical differences listed here are not interpreted as external test sign-offs.

## Gates after reconciliation

- Run exact-head CI for #588 with `base=preview`, including Chromium and WebKit substantive, the strict immutable visual gate, release QA, external evidence, pre-merge candidate, branch assurance and risk coverage.
- An owner-approved **visual design** does not assert real iOS/Android/iPad/AT, 200% zoom, independent Book/curriculum SME, NZQA/provider, Windows distribution or real learner tests.
- The runtime in this branch still requires a truly governed newer web release and exact candidate evidence; historical `.6` packets must not be rebound merely to make CI green.
- This source-branch ancestry repair is **not** permission to merge #588 until its required checks legitimately succeed.
