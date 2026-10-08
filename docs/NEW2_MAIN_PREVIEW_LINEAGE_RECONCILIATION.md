# New2 protected-main / preview squash-history reconciliation — 2026-10-08

## Rationale

The protected `main` branch uses intentional **squash-only** PR merges, while `preview` retains separate integration squash commits. The branches therefore have different commit ancestry even where source changes were already promoted. The resulting `preview` → `main` promotion PR #499 reports `mergeable_state: dirty` despite green exact-preview build and browser checks.

The safe reconciliation is to **record the current protected `main` commit as an ancestor of a normal PR merge into `preview`**, preserving preview's current source tree. This does not force-push, rewrite protected main, drop preview work, disable protection, or declare external validation complete.

When PR checks pass, this source-bearing reconciliation PR should be merged into **`preview` only with GitHub's normal merge-commit method**, not squash. The merge commit must be attributable to this reviewed Preview PR. Verify preview and main branch ancestry and the exact post-merge candidate / release workflows afterward. Then recheck PR #499, its six protected-main exact-head checks and owner-authorized squash-merge rules. If any provenance or release gate fails, stop rather than bypass.

## Evidence and authority

- Initial protected `main` ancestor: `17f5628abbe927cd1b2ca2f1dbeba8cb163458f8`.
- Initial `preview` ancestor: `bd88f8706a51be15ac6027b462c25ba9ba1e274b`.
- No external human, hardware, machine safety, SME or site-process evidence is added by this documentation/ancestry operation.
- This PR is a Git history integration operation; **no protected-main merge is automated**.
