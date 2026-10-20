# Measured Learning Production Gate V2

## Decision

The V2 authoring/review system now has a separate **production handoff gate** between transient engineering-review packets and learner-visible measured cases.

This change does **not** promote any case. The reviewed-binding registry starts empty, so the current product state remains:

- 70 release objectives;
- 40 transient source-derived authoring candidates in the full source-proof workflow;
- 70 transient engineering-review packets;
- 0 production-reviewed bindings;
- 0 promoted learner cases.

The gate exists so future promotion cannot be performed by editing `data/measured-learning/cases/` and `promoted-v1.json` alone.

## Why this gate exists

V2 already proved source/artifact/channel identity, deterministic feature calculations, case-specific review packets and independent author/reviewer fields. Review packets deliberately remain unreviewed CI artifacts, and `build_measured_learning_case.py` can build a reviewed binding supplied from an arbitrary path.

For production, MouldMaster now requires one canonical source-controlled reviewed binding per promoted learner case. That binding becomes the reproducible authority from which the final case must rebuild exactly.

The production chain is therefore:

**governed source evidence -> pinned authoring candidate -> independent review packet -> completed V2 binding -> independent engineering review -> canonical reviewed-binding registry -> canonical case rebuild -> promotion index -> learner runtime**

## Production files

`data/measured-learning/production-gate-v2.json` defines the production-only review contract.

`data/measured-learning/reviewed-bindings-index-v2.json` is the ordered registry of production-reviewed bindings. Each entry pins:

- the case ID;
- the only accepted canonical binding path, `data/measured-learning/reviewed-bindings/MLM-xxx.json`;
- a canonical SHA-256 fingerprint of the complete reviewed binding.

The registry is intentionally empty until a real case-specific review is completed.

## Review requirements

A production-reviewed binding must:

- use V2 binding schema version 2;
- set `reviewed: true`;
- name a non-empty author and reviewer;
- use different author and reviewer identities;
- use reviewer role `engineering-evidence-review`;
- use a production review-record type: `github-pr`, `github-issue`, `signed-review`, or `external-record`;
- never use `test-fixture` as a production review record;
- carry a stable review reference of the declared type;
- carry an explicit UTC `reviewedAt` timestamp;
- explicitly state `sourceEstablishesCausality: false` for the public measured-learning path;
- continue to satisfy every existing V2 source, artifact, channel, capability, unit, X-axis, feature, novelty, evidence-boundary and payload rule enforced by the case builder and release QA.

The production gate validates the structure and source-controlled identity of the review record. It does not manufacture reviewer judgment, and it does not turn generated review packets into approvals.

## Promotion procedure

After genuine case-specific engineering review is complete:

1. Save the completed binding as `data/measured-learning/reviewed-bindings/MLM-xxx.json`.
2. Register and fingerprint it:

   `python tools/promote_measured_learning_release.py --register data/measured-learning/reviewed-bindings/MLM-xxx.json`

3. Materialize all registered reviewed bindings into canonical learner cases and the promotion index:

   `python tools/promote_measured_learning_release.py --write`

4. Run the fast production gate:

   `python qa_measured_learning_production_gate.py`

5. Run the full measured-learning release QA/source-proof workflow before merge.

Registration validates the production review metadata and runs the binding through the existing V2 case builder before the registry is changed. Materialization builds all registered cases in memory before writing learner assets.

The tool refuses to silently delete an existing learner case that is no longer registered. Review revocation/removal therefore requires an explicit repository change rather than an accidental regeneration side effect.

## Fail-closed synchronization

`qa_measured_learning_production_gate.py` requires exact equality between three sets:

1. production-reviewed binding registry entries;
2. `data/measured-learning/cases/MLM-xxx.json` learner assets;
3. `promoted-v1.json` case IDs.

For each registered case, QA rebuilds the learner case from the canonical reviewed binding and requires the committed case JSON to match that rebuild exactly. A hand-edited case, unregistered promotion-index entry, missing binding, changed binding fingerprint, test-fixture review or reviewer-role drift fails the gate.

`.github/workflows/measured-learning-production-gate.yml` runs this compact gate on every pull request or `main` push that changes measured-learning data or the production-gate tooling. The existing full measured-learning workflow remains the authority for live source proof, authoring/review-packet generation and complete release QA.

## Current boundary

The new production gate makes the path to learner visibility deterministic and auditable, but it deliberately does not solve the remaining human task: independent engineering review of individual cases. Until those reviews exist, the reviewed-binding registry and promoted learner count correctly remain zero.
