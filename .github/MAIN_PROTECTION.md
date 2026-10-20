# Native protection for `main` — solo-maintainer policy

Status: **repository transition prepared; GitHub's live ruleset remains authoritative.** MouldMaster is maintained by one person (`connorth3-lgtm`). The policy is **solo-maintainer manual owner approval plus automated evidence**; no second-person review is required or claimed. GitHub must be updated by the authenticated owner before this policy is enforced.

## Required native policy

Exactly one active branch ruleset protects `refs/heads/main`, with **no bypass actors**. A governed merge requires:

- a pull request, never a direct or forced push;
- **zero required second-person approving reviews** (the owner cannot approve their own GitHub PR);
- **manual owner merger recorded by GitHub**: only `connorth3-lgtm` makes the final squash-merge decision, recorded by `merged_by` and checked after merge against the exact main commit;
- **all review conversations resolved**, if any exist;
- release decisions bound to the exact PR head and not automatically triggered merely because CI passes;
- squash merge only, required linear history, and up-to-date branch;
- the six required GitHub Actions contexts:
  - `integrity`;
  - `mobile-browser`;
  - `build-windows`;
  - `question-quality-50-pass`;
  - `release-external-validation`;
  - `exact-head-risk-coverage`;
- existing CodeQL, code-quality and Copilot code-review rules;
- block branch deletion;
- non-fast-forward/force updates blocked.

The native ruleset requires no approval from another person. This is a deliberate **solo-owner release policy**, not a claim of independent technical, SME or safety review. **Automated checks do not establish external device, SME or safety validation.** Real-world release-specific validation remains a separate HOLD until genuine evidence exists.

## Manual release decision by the owner

Before manually pressing GitHub's `Squash and merge`, the owner:

1. Rechecks the latest PR head and the required exact-head CI/status checks, including security, browser, desktop and external-evidence integrity.
2. Reads the diff and checks the risk boundary; comments on the PR if any validation remains on HOLD.
3. Confirms no check is bypassed or made optional; unresolved failures or human/device requirements remain represented truthfully.
4. Deliberately performs the merge in the signed-in `connorth3-lgtm` account. GitHub's `merged_by` and the exact merged PR/head constitute the auditable owner decision.
5. Checks the **Main PR Provenance Guard** post-merge; this read-only audit checks the real merger identity, unique PR provenance and six exact-head workflows.

No automation should perform the final release merge merely because CI becomes green. If a second trusted maintainer joins later, reconsider whether human peer approval should be restored.

## `preview` trust boundary

The `preview` branch is an integration/staging branch and is **not** external-evidence authority. Native branch protection may remain weaker than `main`, but the public preview deployment is fail-closed: `.github/workflows/preview-pages.yml` accepts only the current `preview` head when that SHA is uniquely attributable to a merged PR targeting `preview`, and it requires the exact PR head's Release QA, Mobile Browser QA and Question Quality workflows to have succeeded. Direct pushes and workflow dispatch from arbitrary/stale refs cannot deploy.

The preview source is rechecked immediately before `deploy-pages` so a queued run cannot publish after `preview` moves. Main and preview deployment jobs share the repository-wide `mouldmaster-pages-site-publish` concurrency group with cancellation disabled, and live verification confirms `preview/deployment.json` contains the exact source SHA expected by the workflow.

No physical-device, assistive-technology, provider/NZQA, learner-outcome or other governed external evidence may bind to the mutable preview branch tip. Release-specific external evidence must bind to the immutable retained exact-head artifact recorded in `data/release-external-validation-v1.json:webCandidate`, including its source SHA, runtime fingerprint, workflow run, artifact id and artifact digest. A later learner-runtime change requires a fresh candidate rebind even when the web release label is unchanged. Artifact liveness/expiry and the release-bound NZQA tracker are verified against live GitHub state by the main external-validation promotion gate.

## Applying the policy safely

The reviewed helper reads and **transforms that exact** live main-only ruleset, preserving unrelated protections:

```bash
.github/scripts/apply-main-ruleset.sh --dry-run
```

Inspect the transformed rules. From an authenticated local GitHub CLI belonging to `connorth3-lgtm`, apply:

```bash
.github/scripts/apply-main-ruleset.sh --apply
```

The helper needs `gh`, `jq`, owner Administration permission and an unredacted live ruleset. It refuses a different authenticated account, any active `~ALL` branch ruleset, unexpected bypass actors or missing security/provenance controls. It preserves existing CodeQL, code-quality, Copilot review and all six GitHub Actions required contexts. A dry run never changes GitHub.

Alternatively, use GitHub's Settings → Rules → Rulesets → `connor`: set approvals to `0`, turn off latest-push, stale-review and unattributed-change extra approvals, keep conversation resolution, PR/squash, strict status checks, security controls and no bypass; **add `exact-head-risk-coverage`** while retaining the other five checks. Do not deactivate the ruleset.

**Coordinated transition:** Until both the canonical repository policy and the live server-side ruleset agree, `release-external-validation` correctly fails. The first protected merge still requires all six CI checks, and the owner must verify the resulting ruleset matches the policy; changing repository text alone does not grant merge rights.

## Ruleset attestation after live changes

A live change invalidates the version-bound `.github/main-ruleset-attestation.json`. Only after a real administrator read of the updated ruleset may that record be refreshed to include:

- the actual ruleset id and `updated_at`;
- `bypass_actors: []` and `current_user_can_bypass: never`;
- zero required second-person approvals, no last-push approval requirement, required conversation resolution and all six required GitHub Action contexts;
- retained CodeQL/code-quality/Copilot and squash-only/no-force rules.

Never manufacture an attestation or mark `data/release-external-validation-v1.json:governance.status` as enforced without reading and verifying the actual GitHub ruleset.

## Runtime verifier

```bash
python3 tools/verify_main_ruleset.py --self-test
python3 tools/verify_main_ruleset.py --repository connorth3-lgtm/Injection-moulding-app-
```

The verifier is **fail-closed** on live drift, missing required checks/security rules, bypass actors, stale/invalid attestations and an unprotected `main`.

## Required post-apply smoke test

1. PR stays blocked when any of the six status checks is missing/pending/failed.
2. PR stays blocked while review threads are unresolved.
3. PR source must be the exact latest head used by all six workflows.
4. CI green alone does not press Merge or publish; the signed-in owner chooses the exact candidate.
5. Owner performs `Squash and merge` after required checks pass; no independent approval is claimed.
6. Post-merge Main PR Provenance Guard verifies the GitHub `merged_by` owner, unique merged-PR SHA and all required exact-head workflow successes.
7. Live production Pages verification remains downstream of native policy/provenance, and external validation evidence remains HOLD where appropriate.

**owner-authorized merge decision, all six required checks are green** before any governed merge. Issue #43 remains open until the live policy is confirmed.

## External-validation boundary

Human AT testing, physical-device PWA testing, real Windows signed-package validation, curriculum/Book SME review, learner outcomes, provider/NZQA validation and production-site safety work are not replaced by this solo-maintainer decision. MouldMaster remains advisory-only.

## Migration-train PR containment

Historical PR #456 was an exceptional migration train, not a model for future work. Prefer small, reviewable domain-specific PRs. Squash-only history, exact-head automated checks, the real owner merger and truthful external evidence remain authoritative even for large changes. Squashing history does not substitute for independent technical expertise, or for release-specific human/device validation.
