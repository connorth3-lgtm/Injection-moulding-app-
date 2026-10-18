# Preview integration of Android Learn and Book & Listen — 19 October 2026

## Scope and immutable ancestry

This record accompanies a two-parent non-production **preview** merge.
- First parent: `4f84e2368e5f4b3fd8000ec0f305f5a006899bef` (the current preview head after QA repair PR #649).
- Second parent: `213ca694a3f5362921775c10fc0cfa2576bb4c70` (combined integration PR #642, containing the complete original heads of PR #640 `a56094315a8d43cfe3b5083e1ff6367b89f67bfb` and PR #641 `012bc6af61afaf7af75b1c499da0e3635a84cc3c`).
- Target: `preview` **only**. No protected-main release, deployment, production authorization or physical-device validation is implied.

## Three-way reconciliation

The 60 paths changed by combined PR #642 relative to protected `main` were compared against preview. Twenty-three path blobs already matched PR #642 **exactly**, including `primary-learning-practice-hubs.js`, `reading-patch.css`, Book integration QA, the Android lesson and practice runtime packs and associated review packets. Two newly added integration paths exist on preview and include newer tests. The remaining 35 paths differ from PR #642 because preview contains later fixes, versioned cache/voice updates and current release-specific HOLD records.

In the selected runtime and feature QA paths, the differences were reviewed: `read-aloud.js` contains a later Android completion-without-onstart fix and keeps chapter navigation; `src/domains/learning/book-runtime.js` has a later Book focus guard; `src/domains/shell/learner-ui-polish.js` and CSS have later mobile/Materials/Book improvements; and `qa/book-audio-deep.spec.js` has later regression tests. `index.html`, `version.json`, `service-worker.js` and release gates retain the **newer** 2026.10.19.1 values, not older 2026.10.18.1 values.

### Conflict resolution

Resolve the divergent integration by retaining the entire first-parent `preview` file tree, adding only this reconciliation note and recording PR #642 as second parent. No learner-facing file is replaced, and no prior external evidence or visual approval is auto-promoted. This records integration lineage without downgrading Book speech, Learn cards, Materials, cache revisions or validation boundaries.

## Known release HOLD

A historical producer succeeded, and feature tests passed on earlier exact heads, but `Release External Validation Boundary`, `MouldMaster Release QA` and `Branch Release Assurance` remained failed on PR #649. These cannot be waived by the preview-only merge. The governed technical acceptance state remains FAIL and the seven human/physical-device/provider workstreams remain HOLD. New merge-head CI results must be checked independently before any future publication. Public GitHub Pages is published from protected main, not by this preview branch push.
