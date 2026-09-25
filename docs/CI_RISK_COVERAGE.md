# CI risk coverage contract

This file defines the minimum workflow coverage expected for pull requests to `main`. It is intentionally declarative: repository rules remain the authority for required checks, while this contract prevents high-risk paths from silently losing the workflows that exercise them.

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
