# CI risk coverage contract

This file defines the minimum workflow coverage expected for pull requests to `main`. The contract is enforced at runtime by `tools/verify_ci_risk_coverage.py` inside the natively required `mobile-browser` protected context. The verifier classifies the exact PR diff, queries GitHub Actions for the exact head SHA, and fails if an applicable workflow is missing, remains unresolved beyond the bounded polling window, or completes non-successfully.

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

`MouldMaster Domain Foundation QA` runs on every pull request to `main`. At the end of the required Mobile Browser QA job, the exact-head meta-gate verifies the applicable workflows above using the pull-request head SHA. This closes the gap where a workflow trigger/event failure could otherwise look like a green subset of checks. The meta-gate does not treat its own `mobile-browser` run as external evidence; native branch protection still requires that job independently.
