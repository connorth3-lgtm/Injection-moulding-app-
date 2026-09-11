# Native protection for `main`

Status: repository-side policy and verification tooling are complete. GitHub must report the exact reviewed server-side ruleset as effective before native protection is considered valid.

The repository has a read-only `Main PR Provenance Guard` that verifies merged-PR provenance and required PR workflow results after a push reaches `main`. Native GitHub protection remains authoritative because it rejects an invalid merge or push **before** the branch changes.

## Intended native policy

Apply one active branch ruleset to `refs/heads/main` with no bypass actors:

- require a pull request before merge;
- require **one independent approving review**;
- dismiss stale approvals whenever new commits are pushed;
- require approval of the **current head**, including approval after the latest push by someone other than that pusher;
- resolve every review thread before merge;
- require the branch to be up to date with `main` before merge;
- require the GitHub Actions checks `integrity`, `mobile-browser`, `build-windows`, and `question-quality-50-pass`;
- require linear history and allow squash merge only;
- block branch deletion;
- block non-fast-forward/force updates.

These human-review requirements are part of the release safety boundary. They must not be lowered to make a single-contributor PR mergeable. If no independent reviewer is available, the merge remains intentionally blocked.

Ref matching is case-sensitive. `refs/heads/Main` does **not** protect the repository's lowercase `main` branch. An active `~ALL` ruleset is also not an acceptable substitute because it can block ordinary feature-branch development.

## One-command helper

Preview the exact policy without credentials or network writes:

```bash
.github/scripts/apply-main-ruleset.sh --dry-run
```

After reviewing the payload, an administrator can apply it from a trusted local shell:

```bash
.github/scripts/apply-main-ruleset.sh --apply
```

For a fork or renamed repository:

```bash
REPO=owner/repository .github/scripts/apply-main-ruleset.sh --apply
```

The helper updates an existing active main ruleset when one is present, even if its display name differs, otherwise it creates the reviewed ruleset. It then reads the policy back and verifies the main-only ref condition, squash-only merges, one approval, stale-review dismissal, latest-push approval, review-thread resolution, all four strict status contexts, no bypass actors, and `protected: true` for lowercase `main`.

The repository runtime verifier is:

```bash
python3 tools/verify_main_ruleset.py --repository owner/repository
```

If GitHub Actions redacts `bypass_actors`, the administrator-readable result must be recorded in `.github/main-ruleset-attestation.json` with the exact ruleset id and `updated_at` instant. Any ruleset modification intentionally invalidates the previous attestation until that exact new version is independently re-attested.

## Required verification after applying

Do not treat script execution alone as proof of protection. Verify all of the following:

1. `GET /repos/<owner>/<repo>/branches/main` reports `protected: true`.
2. The active ruleset targets exactly `refs/heads/main`, has no bypass actors, and requires one approval, stale-review dismissal, latest-push approval, and review-thread resolution.
3. No active branch ruleset targets `~ALL` unless that broader policy is separately reviewed and intentionally required.
4. Open a harmless test PR and confirm merge is blocked without an independent current-head approval.
5. Confirm a new push makes the prior approval stale and merge remains blocked until the current head is approved.
6. Confirm an unresolved review thread blocks merge.
7. Confirm any pending/failing `integrity`, `mobile-browser`, `build-windows`, or `question-quality-50-pass` check blocks merge.
8. Confirm a normal squash merge succeeds only when the human-review conditions and all four technical gates are satisfied.
9. Confirm `Main PR Provenance Guard` and downstream branch pruning still succeed after the merge.

## Interaction with the provenance guard

Native protection and the repository guard have different jobs:

- **Native ruleset:** prevents invalid changes from reaching `main`.
- **Provenance guard:** independently checks the exact effective ruleset and verifies that a landed commit came from a merged PR whose exact head had all four required workflows green.

The provenance guard is strictly read-only. It has no branch-ref write permission, no rollback path, and never force-updates `main`. A guard failure under native protection must be investigated rather than "repaired" by rewriting branch history.

## Why this is not applied automatically in CI

A workflow running from the repository should not grant itself permanent administration authority over the branch that controls that workflow. Native ruleset creation is deliberately an explicit administrator action using a trusted local GitHub identity. The helper reduces that action to a reviewed, repeatable payload while keeping the credential boundary outside source control.

Issue #43 remains the source-of-truth tracker until GitHub itself reports the exact reviewed ruleset active and the blocking test PR has been verified.
