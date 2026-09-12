# Native protection for `main`

Status: repository-side policy and verification tooling define a fail-closed
governance target. GitHub's live server-side ruleset is authoritative and must
match this policy before the governance finding is considered closed.

## Required native policy

Exactly one active branch ruleset must govern `refs/heads/main`, with no bypass
actors. This repository currently has one write-capable maintainer, so the
native policy is explicitly a **solo-maintainer policy**: pull requests and all
automated/security controls remain mandatory, while human approval requirements
that cannot be satisfied by a sole maintainer are disabled.

A governed merge must require all of the following:

- a pull request;
- **zero required approving reviews while there is only one write-capable maintainer**;
- approval of the latest push is disabled while there is only one write-capable maintainer;
- all review conversations resolved;
- stale approvals dismissed after new pushes;
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
- block branch deletion;
- non-fast-forward/force updates blocked.

The solo-maintainer exception is narrow. It does not authorize bypass actors,
direct pushes that avoid the pull-request rule, missing checks, unresolved
review threads, force pushes, branch deletion, or weakened security controls.
If a second trusted maintainer with write access is added, this policy should be
re-hardened to require at least one independent human approval and approval of
the latest push by someone other than the pusher.

Automated checks are necessary but are not equivalent to independent human
review. While the repository remains solo-maintained, merge authorization rests
on the protected PR workflow and all required automated/security gates rather
than a fabricated self-review or second account.

## Applying the policy safely

The reviewed helper is:

```bash
.github/scripts/apply-main-ruleset.sh --dry-run
```

The helper first reads the **live** main-only ruleset and transforms that exact
object. This prevents a governance fix from accidentally deleting newer
server-side protections such as CodeQL, code-quality, or Copilot review rules.
It preserves the current solo-maintainer review settings: zero required
approvals and no latest-push approval requirement.

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

It fails closed unless the effective main-only ruleset contains the exact
solo-maintainer review settings, required automated gates, security/review
controls, no bypass, and the exact protected lowercase `main` target. Its
self-test is:

```bash
python3 tools/verify_main_ruleset.py --self-test
```

## Required post-apply test

Do not treat configuration text as proof. Open a harmless test PR and verify:

1. the PR remains required even though approving reviews are set to zero;
2. merge remains blocked while a review conversation is unresolved;
3. each required status context independently blocks merge while pending/failing;
4. a squash merge succeeds only after all five required checks are green and all
   review threads are resolved;
5. `Main PR Provenance Guard` succeeds after merge;
6. branch-pruning automation, if enabled, still runs only after provenance
   verification.

When a second write-capable maintainer is added, repeat this test after restoring
at least one required approval and latest-push approval by another person.

## External validation remains separate

Human AT testing, physical-device PWA testing, real Windows signed-package
validation, curriculum SME review, longitudinal learner evidence and controlled
production-site validation are not converted into CI claims. The
`release-external-validation` gate verifies that these boundaries remain
truthfully represented as HOLD until their release-specific evidence exists.

Issue #43 remains the source-of-truth tracker for native protection. It should
record the current solo-maintainer exception and be revisited if repository
write access expands.
