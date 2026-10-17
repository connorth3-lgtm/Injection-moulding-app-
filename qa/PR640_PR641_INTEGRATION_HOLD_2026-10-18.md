# PR 640 + PR 641 integrated draft — 18 October 2026

This integration candidate has two source parents:
- PR #641 Book/Listen branch: 012bc6af61afaf7af75b1c499da0e3635a84cc3c
- PR #640 Android Learn/Practice branch: a56094315a8d43cfe3b5083e1ff6367b89f67bfb

Integration policy:
1. Adopt the complete PR #641 tree as the release/Book/Listen base.
2. Adopt all 26 files unique to PR #640 unchanged, including its core Learn/Practice source, QA and explicitly HOLD external packets.
3. Resolve the two substantive shared learner presentation files from PR #640, preserving the expanded Home/Learn/Practice layout, updating their release/CSS version reference to 2026.10.18.1.
4. Preserve PR #641 for the other 14 shared files to keep one consistent web/cache release and Book audio/CSP runtime.
5. This is a REVIEW candidate, not a production-authorized merge. Recheck all exact-head QA. Pre-existing external validation, physical phones, accessible technologies, human SME, NZQA/provider and user visual-baseline sign-offs cannot be manufactured.
6. The superseded 2026.10.17.1 hold packets remain historical review material, not valid acceptance evidence for 2026.10.18.1.

Do not merge to protected main or deploy until the required candidate and human evidence is genuinely provided.
