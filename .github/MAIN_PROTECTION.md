# Native protection for `main`

Status: repository-side policy and verification tooling define a fail-closed
governance target. GitHub's live server-side ruleset is authoritative and must
match this policy before the governance finding is considered closed.

## Required native policy

Exactly one active branch ruleset must govern `refs/heads/main`, with no bypass
actors. A governed merge must require all of the following:

- a pull request;
- **at least one approving human review**;
- all review conversations resolved;
- stale approvals dismissed after new pushes;
- approval of the most recent push by someone other than the pusher;
- squash merge only and linear history;
- the branch up to date with `main`;
- the required GitHub Actions contexts:
  - `integrity`;
  - `mobile-browser`;
  - `build-windows`;
  - `question-quality-50-pass`;
  - `release-external-validation`;
- the existing CodeQL code-scanning rule;
- the existing code-quality rule;
- the existing Copilot code-review rule;
- branch deletion blocked;
- non-fast-forward/force updates blocked.

Automated checks are necessary but are not independent review. A fully green CI
state must not, by itself, authorize a governed release.

## Applying the policy safely

The reviewed helper is:

```bash
.github/scripts/apply-main-ruleset.sh --dry-run
```

Unlike the previous static helper, the current helper first reads the **live**
main-only ruleset and transforms that exact object. This prevents a governance
fix from accidentally deleting newer server-side protections such as CodeQL,
code-quality, or Copilot review rules.

After reviewing the exact payload:

```bash
.github/scripts/apply-main-ruleset.sh --apply
```

For a fork or renamed repository:

```bash
REPO=owner/repository .github/scripts/apply-main-ruleset.sh --apply
```

The command requires `gh` and `jq` and a trusted local GitHub identity with
repository Administration permission. Credentials are never stored in the
repository.

## Attestation after any live ruleset change

Any ruleset update changes the live `updated_at` value and therefore invalidates
`.github/main-ruleset-attestation.json`. This is intentional.

After applying the policy, an administrator must re-read the ruleset detail and
confirm:

- `bypass_actors` is exactly `[]`;
- `current_user_can_bypass` is `never`;
- the ruleset id is unchanged or intentionally replaced;
- the attestation's `ruleset_updated_at` exactly matches the new live value.

Do not copy a timestamp from the helper output without performing that
administrator-visible verification.

## Runtime verifier

The repository verifier is:

```bash
python3 tools/verify_main_ruleset.py --repository owner/repository
```

It fails closed unless the effective main-only ruleset contains the independent
review controls, required automated gates, security/review controls, no bypass,
and the exact protected lowercase `main` target. Its self-test is:

```bash
python3 tools/verify_main_ruleset.py --self-test
```

## Required post-apply test

Do not treat configuration text as proof. Open a harmless test PR and verify:

1. merge is blocked with zero approvals;
2. merge remains blocked while a review conversation is unresolved;
3. a new push invalidates the prior approval and requires a fresh independent
   approval of the latest push;
4. each required status context independently blocks merge while
   pending/failing;
5. a squash merge succeeds only after all five checks are green, all threads
   are resolved, and an independent approval is current;
6. `Main PR Provenance Guard` succeeds after merge;
7. branch-pruning automation, if enabled, still runs only after provenance
   verification.

## External validation remains separate

Human AT testing, physical-device PWA testing, real Windows signed-package
validation, curriculum SME review, longitudinal learner evidence and controlled
production-site validation are not converted into CI claims. The
`release-external-validation` gate verifies that these boundaries remain
truthfully represented as HOLD until their release-specific evidence exists.

Issue #43 remains the source-of-truth tracker for native protection. It should
not be closed merely because this repository-side remediation merges; close it
only after GitHub reports the hardened live policy and the blocking test PR has
been exercised.
