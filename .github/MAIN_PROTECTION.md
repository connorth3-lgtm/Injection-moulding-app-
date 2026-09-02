# Native protection for `main`

Status: repository-side preparation complete; GitHub still has to apply the native server-side ruleset.

The repository already has a compensating `Main PR Provenance Guard` that verifies merged-PR provenance and required PR workflow results after a push reaches `main`. Native GitHub protection is still required because it rejects an invalid merge/push **before** the branch changes.

Production publishers now also fail closed unless the reviewed native ruleset is live. That means an unprotected `main` must not be able to publish a new Pages production build or public desktop release even if a direct push reaches the branch.

## Intended native policy

Apply one active branch ruleset to `refs/heads/main` with no bypass actors:

- require a pull request before merge;
- require unresolved review conversations to be resolved before merge;
- require the branch to be up to date with `main` before merge;
- require the GitHub Actions checks:
  - `integrity` — job from **MouldMaster Release QA**;
  - `mobile-browser` — job from **Mobile Browser QA**;
  - `build-windows` — job from **Open Desktop Build**;
  - `question-quality-50-pass` — job from **Question Quality 50-Pass**;
- require linear history and allow squash merge only;
- block branch deletion;
- block non-fast-forward/force updates;
- apply to repository administrators as well as contributors by keeping bypass actors empty;
- do not require a second approving reviewer by default (`required_approving_review_count: 0`).

The zero-review setting makes the server require a PR, resolved conversations and the four technical gates without inventing a second human reviewer where one is not available. It can be tightened later if the contributor/reviewer model changes.

## One-command helper

The reviewed helper is:

```bash
.github/scripts/apply-main-ruleset.sh --dry-run
```

The default is a dry run and prints the exact JSON that would be sent to GitHub. It requires `gh` and `jq` and uses the current local GitHub CLI authentication. It does not read, generate, extract or store a token in the repository or a shell variable.

After reviewing the payload, an administrator can apply it from a trusted local shell:

```bash
.github/scripts/apply-main-ruleset.sh --apply
```

For a fork or renamed repository:

```bash
REPO=owner/repository .github/scripts/apply-main-ruleset.sh --apply
```

The helper is idempotent by ruleset name: it updates the existing `Protect main — MouldMaster required gates` ruleset if present, otherwise it creates it. It then reads the ruleset back and runs `tools/verify_production_source.py --protection-only`; the verifier uses the already authenticated `gh` session locally and fails unless GitHub reports the complete reviewed policy active.

## Required verification after applying

Do not treat script execution alone as proof of protection. Verify all of the following:

1. `GET /repos/<owner>/<repo>/branches/main` reports `protected: true`.
2. The `Protect main — MouldMaster required gates` ruleset is `active`, targets only `refs/heads/main`, requires PRs/resolved conversations/linear history/current required checks, and has no bypass actors.
3. Open a harmless test PR and confirm merge is blocked while any of `integrity`, `mobile-browser`, `build-windows`, or `question-quality-50-pass` is pending or failing.
4. Confirm unresolved review conversations block merge.
5. Confirm a normal squash merge succeeds only after **all four are green**.
6. Confirm `Main PR Provenance Guard` still runs successfully after the merge and records **all four required workflows green** for the merged PR head.
7. Confirm `Prune Fully Merged Branches` still runs only after the provenance guard succeeds.
8. Confirm production Pages and desktop release source gates accept the protected merged-PR source.

## Defense in depth

Native protection, provenance validation and release-source validation have different jobs:

- **Native ruleset:** prevents invalid changes from reaching `main`.
- **Main PR Provenance Guard:** independently checks a landed commit came from a validated merged PR with the four native pre-merge technical gates green.
- **Production source gate:** refuses Pages/desktop publication unless live native protection is present and the exact merged PR head passed the complete 15-workflow release set.

The provenance guard retains an emergency rollback attempt for the current unprotected state. Once the native `non_fast_forward` rule is active, GitHub may reject that force-update rollback. That is acceptable defense in depth because the native rule should already have prevented the unauthorised/non-compliant update. A guard failure under native protection should therefore be investigated rather than bypassed.

## Why this is not applied automatically in CI

A workflow running from the repository should not grant itself permanent administration authority over the branch that controls that workflow. Native ruleset creation is deliberately an explicit administrator action using a trusted local GitHub identity. The helper reduces that action to a reviewed, repeatable payload while keeping the credential boundary outside source control.

Issue #43 is the source-of-truth tracker. Keep it open until GitHub itself reports the protection/ruleset as active and the blocking test has been performed.
