# Release 2026.10.08.8 — protected-main squash-ancestry reconciliation

## Trigger

The Android user reported two reproducible defects in the prior release `2026.10.08.7`: a horizontally broken unified diagnostic evidence checklist at ~360px, and `currentLesson is not a function` during core dashboard startup. PR #504 resolves them and has been squash-merged into `preview`; exact head `dcc464ea3c480594da611683493410db53a05090`.

Prior protected `main` promotion PR #499 was also a deliberate **squash merge**, so main is `2dcbc47a95eb11b3b191facbc21cc26f10e8caf0` and Preview does not automatically inherit that new main commit as an ancestor. Consequently candidate PR #505 (Preview → main) reports a spurious file-history merge conflict even though the desired path is an owner-reviewed protected squash promotion.

## Controlled Preview-only resolution

This documentation and an explicit two-parent **merge commit on this review branch**, retaining the complete current Preview tree and recording current `main` as second parent, join the histories without altering or force-pushing protected `main` or overwriting Preview code. Review/merge this PR to `preview` using **merge commit**, never squash, only once its actual PR-head tests and Preview tests have passed. Recheck the protected-main PR #505 exact SHA, all required main workflows, review threads, release hold, and no changed main baseline before any separate owner-authorised **squash merge** to main.

The ancestry merge is not physical-device, real-AT, NZQA, learner, machine-control or human-SME validation. All external gates remain **HOLD** and are not satisfied by CI, user bug screenshots or this history operation.

## Guardrails

1. Preview source/runtime remains `2026.10.08.8`, including the generated active-core lesson resolver and bounded CSS checkbox change, with no modification to the frozen recovery source.
2. No branch protection, release hold, test or artifact-provenance control is bypassed.
3. When Preview is merged, run exact merged-Preview workflows again; do not rely solely on branch-head results.
4. Main deployment remains limited to the non-production `/preview/` site until all real-world release holds are cleared.
