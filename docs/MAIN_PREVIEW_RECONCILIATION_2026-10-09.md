# Preview/main squash-ancestry reconciliation — 2026-10-09

**Scope: Git ancestry reconciliation on a review branch, not a protected-main merge or external-validation approval.**

## Why the release promotion PR became unmergeable

After protected-main squash merge of #505, the protected `main` head was `106eb6f7785ff70536e0f0a4b21da69fb7f1db64` (web release `2026.10.08.8`). The preview integration branch continued with newer changes and now contains release `2026.10.09.2` at `1551236557916bb7226a5d755b66c62653d7579c` after #510, #514 and #511. GitHub's PR #513 reported `mergeable=false` / `mergeable_state=dirty` even though the known Android startup/diagnostic fixes had already landed in preview.

The common history is split by a squash commit. Force-pushing either branch, suppressing a required check or copying older release ledgers over current ledgers would be unsafe.

## Exact reconciliation

A review branch contains a **two-parent Git commit** with:

- First parent: `1551236557916bb7226a5d755b66c62653d7579c` (newer `preview`).
- Second parent: `106eb6f7785ff70536e0f0a4b21da69fb7f1db64` (already protected `main`).
- Reconciliation commit: `de98a6780046b7b9eb703acfc68426ff92f8847f`.
- Tree SHA: `bf1a58447c308f8c74ec4846f9df990bf36f8ad0`, **exactly the preview parent tree**, before adding this documentation.

### Evidence that the older functional work is retained

The following known main-only functional fixes were confirmed present in `preview`, with identical Git blob content to the protected-main head before constructing the merge:

- `src/core-runtime/core-inline-004.js`: lexical `mmCoreSafeLesson` resolver protects startup and rendering when `window.currentLesson` is clobbered.
- `tools/externalize_core_scripts.py`: deterministic transform regenerates and guards the lexical resolver.
- `ui-shell.css`: fixed 19px checkbox sizing and label flex wrapping in 360px diagnostic workbench.
- `qa/learn-practice-mobile-style.spec.js`: explicit mobile checkbox and legacy name-clobber regression tests.

The historical `2026.10.08.8` repair/reconciliation documents, signing packet and learner/SME review packets were also present in both branches. Some older `2026.10.08.8` candidate packets had **different retained-artifact provenance** on the branches; this merge preserves the prior protected-main packet state in its second-parent history and retains the later preview packet bindings in the selected tree. It does **not** relabel either historical artifact as current validation.

The current `2026.10.09.2` candidate source, fingerprint, retained artifact details and all explicit external HOLD statuses remain unchanged. No public learner runtime bytes are intentionally changed.

## Required control sequence

1. Review the two parents and exact tree equality above; independently confirm release and validation ledgers are still correct.
2. Require the reconciliation PR's **exact-head** Release QA, Mobile Browser QA, Question Quality, Pre-merge Candidate and Branch Release Assurance checks, and no unresolved review threads.
3. Merge this PR **into `preview` using a regular merge commit, NOT squash**. Squashing destroys the second-parent ancestry and does not resolve the underlying protected-main PR divergence. Do not force-push.
4. Check the resulting `preview` contains `106eb6f7785ff70536e0f0a4b21da69fb7f1db64` as an ancestor, and run checks again on the exact merged preview head. Inspect PR #513's mergeability and **all** protected-main exact-head checks afresh.
5. The protected-main `main` PR remains **draft until the owner separately reviews, authorizes and performs the required governed squash merge**. This ancestry PR is not that authorization.
6. After any separately authorized main Pages release-hold deployment, verify the actual hosted `/preview/` against the exact published main SHA and web release per [tester handoff](TESTER_HANDOFF.md). The existing [rollout blocker](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/512) remains open until the live test passes.

## Immutable safety boundary

The production Pages root stays **release-held**, while the hosted `/preview/` is explicitly **non-production**. Physical iOS/Android device validation, real NVDA/VoiceOver accessibility, Windows signing, curriculum and Book SME, NZQA/provider and real learner-outcome evidence all remain **HOLD**. MouldMaster does not authorize production machine/settings changes. CI green, Git ancestry reconciliation or a human usability invitation do not satisfy these separate approvals.
