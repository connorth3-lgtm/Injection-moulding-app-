# Visual change review packet — proposed MouldMaster 2026.10.09.4

**Status: OWNER APPROVED THE PROPOSED TABLET/DESKTOP HOME LAYOUTS ON 2026-10-09; OTHER VISUAL/DEVICE/EXTERNAL APPROVALS REMAIN HOLD.**

This packet captures the requested fixes for [issue #520](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/520) as presented by [PR #524](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/524), candidate source `5046956f90404caa0b676454cf97349f2a74ce8f`. Baseline stays `2026.10.08.6` at `5d5ce2fa6a1d827bd935e38d4a70e06be6f7edad`. Diff tolerance remains **12 pixels**, unchanged.

## Reproducible exact-head screenshots

- [Mobile Browser QA run 37868071403](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/37868071403), Chromium visual job `113619523413`.
- [Retained visual review artifact `11589770134`](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/37868071403/artifacts/11589770134), named `mobile-browser-chromium-visual`, includes exact `*-baseline.png`, current `*.png`, diff `*-diff.png`, and Playwright traces for review. Verify artifact against the linked job and source before deciding.
- Current gate failed **seven** tablet (810×1080) / desktop (1440×900) groups. Phone (360×800 and 412×915) screenshot groups were not reported failed. The Chromium visual suite compared 2026.10.08.6 to proposed PR head; no thresholds were changed.

## Engineering review of the intended changes (NOT human approval)

1. **Tablet 701–900px footer**: `ui-shell.css` now specifies five equal `minmax(0,1fr)` columns instead of four, so `More` stays in the same fixed row as Home, Learn, Materials and Practice. The approved baseline contains the previous extra row. Affects all captured tablet surfaces; confirm at 701, 768, 810 and 900px, plus 1024/1100 desktop sidebar fallback. Check touch target sizes, scroll clearance, iPad actual viewport and 200% zoom.
2. **Desktop Home empty mission state**: `src/domains/shell/mission-control.js` no longer renders the top idle `Start a mission` strip. The Home dashboard keeps its primary `Start a connected learning mission` card; persistent context/search and existing active mission timelines remain. This changes vertical layout in Home and any page with the persistent mission strip; reviewed screenshots must consider the downstream section shifts.
3. **First Shot**: historic achievement badges still persist, while automatic `Achievement unlocked` notification suppression already existed in the protected `main` runtime and is reinforced by behavioural QA. No new awards semantics are claimed.
4. **No exclusions / baseline bypass**: The locked 12-pixel requirement and current approved reference are untouched. The expected red visual QA for the intentional differences is an approval gate, not a reason to disable it.

## Required decisions and rechecks

- [ ] **Human screenshot reviewer** opens the retained artifact, independently checks every affected surface's current/baseline/diff screenshots, confirms there are no new obscured controls or unrelated shifts, and records an explicit approval or requested corrections here and in the PR discussion. This check is currently **not signed**.
- [ ] Verify actual iPad, 200% zoom and all navigation clearances; these cannot be inferred from desktop Playwright.
- [ ] After approval, create a separately named, immutable **reviewed** reference commit, update `qa/visual-regression-baseline.json` to that real SHA/ref, and rerun Chromium pixel tests with the 12-pixel threshold unchanged. Do **not** rebind the reference to the unreviewed PR source or alter snapshot logic to hide the differences.
- [ ] Govern a strictly newer web release and service-worker revision; produce a **successful exact-source** artifact, rebind all `2026.10.09.4` release-specific review packets and open issue #379 with authentic SHA/fingerprint/run/artifact/digest/expiry. Current `2026.10.09.3` producer remains historical.
- [ ] All 6 protected-main exact-head required contexts green, resolved conversations and a manual squash-merge decision.

## Policy and external boundary

Physical iOS/iPadOS+Android, real NVDA/VoiceOver AT, Windows signed distribution, Book/curriculum SME, learner outcomes and NZQA/provider validation remain **HOLD**. This packet is for **non-production visual review**, not physical approval, evidence signoff, PWA production deployment, machine settings or competence authority.

## Owner's explicit design decision — 2026-10-09

The owner responded **“looks good”** to the provided tablet-810×1080 and desktop-1440×900 Home comparison screenshots. This approval is recorded in [PR #524 comment 6072486028](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/524#issuecomment-6072486028). It covers the proposed one-row five-tab tablet layout and single idle Home mission CTA. The strict 12-pixel reference has been promoted to the exact candidate source `fa27bd16525f8cb216654ea524649a3a37a3195c` via `visual-baseline/2026.10.09.4`. It does **not** assert that the owner examined every affected Book/lesson/assessment screenshot, performed real iPad/200%-zoom testing or granted any external or production sign-off. The new pixel lock protects against unreviewed later visual drift.

## Subsequent protected-merge and hosted verification — 2026-10-09

The unchecked checklist above is the **historical pre-approval request**, not an assertion that the later protected merge failed:

- Owner's scoped Home-layout approval and locked 12-pixel baseline were subsequently recorded (see owner decision above); independent review of **every** affected screen was *not* attested.
- The revised `2026.10.09.4` release and exact-source candidate producer passed; retained candidate provenance is recorded in the release-specific technical evidence packets. The earlier `.3` producer statement above is historical.
- [PR #524](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/524) merged into protected `main` at `566fe49e8254770774ae6d0f7a0c22f295924032`. Follow-ups [#525](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/525) and [#526](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/526) merged without file-content modifications.
- Latest observed hosted non-production `/preview/deployment.json` reported `3b3df9e3aa1b5af8078b7ad227f450abb302abdd` from `main` and version `2026.10.09.4`. See [post-merge audit](POST_MERGE_AUDIT_2026.10.09.4.md). This is not production authorization.
- **Still open:** real iPad/touch/200% zoom, physical PWA, human NVDA/VoiceOver, independent subject-matter/provider/outcomes validations. Root production stays HOLD.
