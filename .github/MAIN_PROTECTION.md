# Native protection for `main`

Status: repository-side policy and verification tooling are complete. GitHub must report the exact reviewed server-side ruleset as effective before native protection is considered valid.

The repository has a read-only `Main PR Provenance Guard` that verifies merged-PR provenance and required PR workflow results after a push reaches `main`. Native GitHub protection remains authoritative because it rejects an invalid merge or push **before** the branch changes.

## Intended native policy

Apply one active branch ruleset to `refs/heads/main` with no bypass actors:

- require a pull request before merge;
- require the branch to be up to date with `main` before merge;
- require the GitHub Actions checks:
  - `integrity` — job from **MouldMaster Release QA**;
  - `mobile-browser` — job from **Mobile Browser QA**;
  - `build-windows` — job from **Open Desktop Build**;
  - `question-quality-50-pass` — job from **Question Quality 50-Pass**;
- require linear history and allow squash merge only;
- block branch deletion;
- block non-fast-forward/force updates;
- do not require a second approving reviewer by default (`required_approving_review_count: 0`).

The zero-review setting makes the server require a PR and the four technical gates without inventing a second human reviewer where one is not available. It can be tightened later if the contributor/reviewer model changes.

Ref matching is case-sensitive. `refs/heads/Main` does **not** protect the repository's lowercase `main` branch. An active `~ALL` ruleset is also not an acceptable substitute because it can block ordinary feature-branch development.

## One-command helper

The reviewed helper is:

```bash
.github/scripts/apply-main-ruleset.sh --dry-run
```

The default is a dry run and prints the exact JSON that would be sent to GitHub. It requires `gh` and `jq` and uses the current local GitHub CLI authentication. It does not read, generate, or store a token in the repository.

After reviewing the payload, an administrator can apply it from a trusted local shell:

```bash
.github/scripts/apply-main-ruleset.sh --apply
```

For a fork or renamed repository:

```bash
REPO=owner/repository .github/scripts/apply-main-ruleset.sh --apply
```

The helper is idempotent by ruleset name: it updates the existing `Protect main — MouldMaster required gates` ruleset if present, otherwise it creates it. After applying, it reads the exact ruleset back, checks the main-only ref condition, PR/squash policy, four status contexts, no bypass actors, and rejects any active branch ruleset that targets `~ALL`. It also fails unless GitHub reports lowercase `main` as `protected: true`.

The repository runtime verifier is:

```bash
python3 tools/verify_main_ruleset.py --repository owner/repository
```

It is used by production-source verification and the post-merge provenance guard. Its self-test is exercised by repository governance QA.

## Required verification after applying

Do not treat script execution alone as proof of protection. Verify all of the following:

1. `GET /repos/<owner>/<repo>/branches/main` reports `protected: true`.
2. The active MouldMaster ruleset targets exactly `refs/heads/main`, has no bypass actors, and contains the reviewed PR/squash/status-check policy.
3. No active branch ruleset targets `~ALL` unless that broader policy is separately reviewed and intentionally required.
4. Open a harmless test PR and confirm merge is blocked while any of `integrity`, `mobile-browser`, `build-windows`, or `question-quality-50-pass` is pending or failing.
5. Confirm a normal squash merge succeeds once all four are green.
6. Confirm `Main PR Provenance Guard` still runs successfully after the merge.
7. Confirm `Prune Fully Merged Branches` still runs only after the provenance guard succeeds.

## Interaction with the provenance guard

Native protection and the repository guard have different jobs:

- **Native ruleset:** prevents invalid changes from reaching `main`.
- **Provenance guard:** independently checks the exact effective ruleset and verifies that a landed commit came from a merged PR whose exact head had all four required workflows green.

The provenance guard is strictly read-only. It has no branch-ref write permission, no rollback path, and never force-updates `main`. A guard failure under native protection must be investigated rather than "repaired" by rewriting branch history.

## Why this is not applied automatically in CI

A workflow running from the repository should not grant itself permanent administration authority over the branch that controls that workflow. Native ruleset creation is deliberately an explicit administrator action using a trusted local GitHub identity. The helper reduces that action to a reviewed, repeatable payload while keeping the credential boundary outside source control.

Issue #43 is the source-of-truth tracker. Keep it open until GitHub itself reports the exact reviewed ruleset active and the blocking test PR has been verified.
