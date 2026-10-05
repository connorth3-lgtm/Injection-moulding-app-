# CI risk coverage contract

This file defines the minimum workflow coverage expected for pull requests to `main`. The contract is enforced at runtime by `tools/verify_ci_risk_coverage.py` in the dedicated `Exact-head CI Risk Coverage` workflow. The verifier classifies the exact PR diff, queries GitHub Actions for the exact head SHA, and fails if an applicable workflow is missing, remains unresolved beyond the bounded polling window, or completes non-successfully. The canonical main policy requires its `exact-head-risk-coverage` job context independently of the browser job.

schema: 1

## Universal pull-request gates

- MouldMaster Release QA
- MouldMaster Domain Foundation QA
- Deep Audit Governance

## Browser/runtime risk

Paths: `index.html`, `*.css`, `*.js`, `src/domains/**`, `src/core-runtime/**`, `service-worker.js`, `qa/**/*.spec.js`

Required coverage: Mobile Browser QA, Premium UI QA, MouldMaster Physical PWA Contract QA.

## Desktop risk

Paths: `desktop/electron/**`, `runtime-domain-manifest.json`, `service-worker.js`

Required coverage: Open Desktop Build.

## Release/provenance risk

Paths: `version.json`, `service-worker.js`, `runtime-domain-manifest.json`, `release-asset-graph.json`, `tools/build_pages_artifact.py`, `data/release-external-validation-v1.json`

Required coverage: MouldMaster Pages Release Readiness, Release External Validation Boundary, MouldMaster Physical PWA Contract QA, Open Desktop Build.

## Assessment risk

Paths: assessment runtime/data/QA and question-bank changes.

Required coverage: Question Quality 50-Pass, Premium UI QA, MouldMaster Release QA.

## Evidence boundary

A passing repository workflow is not physical-device, assistive-technology, SME, learner-outcome, signing, Store, production-site, or accreditation evidence. External HOLD states remain controlled by their evidence contracts.


## Runtime enforcement

`MouldMaster Domain Foundation QA` and `Mobile Browser QA` run independently on pull requests to `main`. The dedicated `Exact-head CI Risk Coverage` workflow verifies the applicable workflow set above against the exact pull-request head SHA. This keeps assurance layers honest: browser QA reports browser evidence only, while cross-workflow coverage reports aggregate release/governance coverage. A failure in native governance must not relabel otherwise-passing browser evidence as a browser failure.

## Post-push branch assurance

Repository-controlled validation does not stop at the pull-request boundary.

- **preview**: `Branch Release Assurance` waits for exact-push success of `MouldMaster Release QA`, `Mobile Browser QA`, `Question Quality 50-Pass`, and `MouldMaster Preview Candidate` on the same preview SHA. The preview workflow proves merged-PR provenance, requires the exact PR-head `Pre-merge Public Candidate`, builds the governed release-hold candidate, verifies it locally by exact SHA and retains it as an Actions artifact. It has no Pages publish authority.
- **main**: the same gate waits for exact-push success of `MouldMaster Release QA`, `Mobile Browser QA`, `Question Quality 50-Pass`, `Deep Audit Governance`, `Release External Validation Boundary`, `MouldMaster Pages Release Readiness`, and `Main PR Provenance Guard` on the same main SHA.
- The gate is read-only and fail-closed. It does not publish, rewrite branches, approve reviews, or replace the underlying workflow evidence.
- Main is the sole live GitHub Pages publisher. Main Pages rebuilds from the exact protected-main SHA, rechecks current-main provenance immediately before and after deployment, and verifies the deployed release-hold/preview artifact including source/release metadata plus SHA-256 and byte size for every offline-critical/precache asset against the governed Pages manifest. Preview never calls the Pages deployment action; it verifies the same release-hold candidate locally and retains the exact-SHA artifact.
- External physical-device, assistive-technology, SME, learner-outcome, provider, signing, Store, and production-site evidence remains outside automated CI authority.

- Branch assurance emits Markdown and JSON diagnostics with the first failed or unresolved dependency, exact workflow run identity, and exact source SHA. Transient GitHub workflow-state API reads are retried before being classified separately as an infrastructure/API error.
