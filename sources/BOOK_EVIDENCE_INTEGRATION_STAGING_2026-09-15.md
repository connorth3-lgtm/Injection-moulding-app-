# Book evidence integration staging — 2026-09-15

This branch is stacked on `feature/book-human-voice-pass` (PR #332) and is the controlled integration surface for the evidence-backed Book additions developed in research PR #333.

## Integrated artifact set

All 12 completed editorial artifacts are now represented in governed Book content:

- `hot-runners` — **Command is not cavity state**
- `black-specks` — **Build evidence before naming the cause**
- `cooling` — **Diagnose, restore and verify**
- `mould-anatomy` — **Mould condition changes through its life**
- `black-specks` — **What two intervention cases actually show**
- `hot-runners` — **Measured quality outcomes from distributed melt control**
- `multi-cavity` — **Total flow can recover while one cavity stays different**
- `documentation` — **Record maintenance so recovery can be proved**
- `process-monitoring` — **Recovery needs a trajectory, not one good part**
- `pressure-loss` — **Pressure only means something when you know where it was measured**
- `warpage` — **Similar warpage can come from different mechanisms**
- `process-window` — **Choose a robust region, not one optimum point**

The first four are integrated into the existing authored chapter batches. The remaining additive material is carried by `data/book-evidence-enrichment-v1.json` and its byte-identical runtime mirror.

## Source/runtime invariants

For every governed Book data edit, the authoritative `data/` file and matching `src/domains/learning/book-data/` runtime copy must remain byte-identical.

Current paired blob identities:

- foundations pair: `798920a4252cc20fa85a5a9c437be0e0e3b7e68c`
- remaining-authored pair: `97f7bbd5af096b71d72bf5fed836de05a277d59e`
- evidence-enrichment pair: `b36f633741104f0332b85c3a30dd83a368d531dc`

## Publication gate

The pre-existing Book authorization is retained as historical authorization for the prior Book bytes. Runtime loading applies that authorization first, then applies the evidence-enrichment gate. The ten touched chapters are explicitly returned to `technical-review` after authorization, so the new content cannot silently inherit the old release decision.

The ten gated chapters are:

`mould-anatomy`, `cooling`, `hot-runners`, `black-specks`, `pressure-loss`, `warpage`, `process-window`, `documentation`, `process-monitoring`, and `multi-cavity`.

The expected runtime state is therefore 36 previously authorized chapters still verified and 10 enriched chapters in technical review until separately reviewed and re-authorized.

## Evidence boundaries

- no universal setpoints or maintenance intervals;
- reported numerical results remain source/case specific;
- synthetic worksheet values remain explicitly labelled synthetic;
- same-family studies remain grouped;
- no third-party figure tracing or reproduction;
- publication authorization does not expand implicitly;
- the existing `2026.09.14.4` physical-device candidate is not relabelled.

## Release boundary

The enrichment JSON is intentionally not added to the existing `2026.09.14.4` service-worker cache generation. Adding new governed bytes to that cache name would mutate an existing release generation. A future enriched offline/device release therefore requires a deliberate new release/cache identity followed by full release QA and a new publication decision.

A QA-only mirror PR to `main` is used to trigger the repository workflows while PR #339 remains correctly stacked on PR #332.

## Research handoff

The 12 artifact specifications, integration map and copy handoffs remain in PR #333 under `sources/book-editorial-artifacts/2026-09-15/` and `data/research-expansion/2026-09-15/book-artifact-integration-map-v1.json`.

Tracked by issue #338.
