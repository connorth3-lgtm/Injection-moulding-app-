# Preview-only application of PR #642 changes

Base branch `preview`: `3d483cea2a77b9419e46c1e1504a516350d1b182`
Approved-for-review source candidate PR #642: `213ca694a3f5362921775c10fc0cfa2576bb4c70`.

This commit transports the **60 paths changed by PR #642 relative to main** onto the existing preview branch. It is **not** a mechanical merge of the 138 main-history and 222 preview-history diverged commits: that produces Git conflicts and hundreds of unrelated changed files.

Purpose: stage Learn/Practice + Book/Listen for non-production review without modifying `main`, the original PRs, or erasing preview-only paths outside the 60 tracked changes. Each touched path is taken verbatim from the integrated review candidate. Reviewers must run exact-tree browser, Book audio and release coherence QA against the preview parent; preview-only assumptions may differ.

This does **not** constitute production authority. Release-specific external ledger, owner visual baseline, real phone audio, real assistive technology, independent SME/NZQA/provider and signed Windows packages remain separate HOLDs. No generated approvals, fake artifact fingerprints, or silently waived gates.
