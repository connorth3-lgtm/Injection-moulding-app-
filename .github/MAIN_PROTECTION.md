# Native protection for `main`

Status: repository policy requires **independent human review plus automated evidence**. GitHub's live ruleset is authoritative and must match this target before the governance finding is closed.

## Required native policy

Exactly one active branch ruleset must govern `refs/heads/main`, with no bypass actors. A governed merge requires:

- a pull request;
- **at least one approving review from a person other than the PR author**;
- approval of the **latest pushed head**;
- all review conversations resolved;
- stale approvals dismissed after new pushes;
- extra approval required for unattributed changes;
- squash merge only and linear history;
- the branch up to date with `main`;
- the required GitHub Actions contexts:
  - `integrity`;
  - `mobile-browser`;
  - `build-windows`;
  - `question-quality-50-pass`;
  - `release-external-validation`;
  - `exact-head-risk-coverage` (cross-workflow exact-head risk aggregation);
- the existing CodeQL code-scanning rule;
- the existing code-quality rule;
- the existing Copilot code-review rule;
- block branch deletion;
- non-fast-forward/force updates blocked.

Automated checks are necessary but are not equivalent to independent human review. If fewer than two trusted write-capable collaborators are available, the safe state is **merge blocked** until an independent reviewer is added; the repository must not lower the approval requirement to make a merge convenient.

## Applying the policy safely

The reviewed helper is:

```bash
.github/scripts/apply-main-ruleset.sh --dry-run
```

The helper first reads the **live** main-only ruleset and transforms that exact object. This prevents a governance fix from accidentally deleting newer server-side protections such as CodeQL, code-quality, or Copilot review rules.

After reviewing the exact payload:

```bash
.github/scripts/apply-main-ruleset.sh --apply
```

For a fork or renamed repository:

```bash
REPO=owner/repository .github/scripts/apply-main-ruleset.sh --apply
```

The command requires `gh` and `jq` and a trusted local GitHub identity with repository Administration permission. Before writing, it verifies that at least two direct trusted collaborators have write-capable access; otherwise `--apply` fails closed. Credentials are never stored in the repository.

## Attestation after any live ruleset change

Any ruleset update changes the live `updated_at` value and therefore invalidates `.github/main-ruleset-attestation.json`. This is intentional.

After applying the policy, an administrator must re-read the ruleset detail and confirm:

- `bypass_actors` is exactly `[]`;
- `current_user_can_bypass` is `never`;
- one required approving review is configured;
- latest-push approval is required;
- unattributed-change extra approval is required;
- the ruleset id is unchanged or intentionally replaced;
- the attestation's `ruleset_updated_at` exactly matches the new live value.

Do not update the attestation until those live values have actually been verified.

## Runtime verifier

The repository verifier is:

```bash
python3 tools/verify_main_ruleset.py --repository owner/repository
```

It fails closed unless the effective main-only ruleset contains the exact independent-review settings, required automated gates, security/review controls, no bypass, and the exact protected lowercase `main` target. Its self-test is:

```bash
python3 tools/verify_main_ruleset.py --self-test
```

## Required post-apply test

Do not treat configuration text as proof. Open a harmless test PR and verify:

1. merge is blocked with zero approvals;
2. the PR author cannot satisfy the independent-review requirement;
3. an approval of an older head becomes stale after a new push;
4. the latest head requires a fresh independent approval;
5. merge remains blocked while a review conversation is unresolved;
6. each required status context independently blocks merge while pending/failing;
7. a squash merge succeeds only after the latest-head human approval, all five required checks are green and all review threads are resolved;
8. `Main PR Provenance Guard` succeeds after merge and proves the latest-head approval existed.

## External validation remains separate

Human AT testing, physical-device PWA testing, real Windows signed-package validation, curriculum SME review, longitudinal learner evidence and controlled production-site validation are not converted into CI claims. The `release-external-validation` gate verifies that these boundaries remain truthfully represented as HOLD until their release-specific evidence exists.

Issue #43 is the source-of-truth tracker for native protection. If the live server-side ruleset does not match this document, the issue must be treated as open even when repository code is green.