# Book evidence integration staging — 2026-09-15

This branch is stacked on `feature/book-human-voice-pass` (PR #332) and is the controlled integration surface for the evidence-backed Book additions developed in research PR #333.

## First integration batch

- `hot-runners` — add **Command is not cavity state**
- `black-specks` — add **Build evidence before naming the cause**
- `cooling` — add **Diagnose, restore and verify**
- `mould-anatomy` — add advanced lifecycle callout **Mould condition changes through its life**

## Source/runtime invariant

For every Book content edit, update the authoritative `data/` file and the matching `src/domains/learning/book-data/` runtime copy identically. Do not merge any integration commit where the pair differs.

## Evidence boundaries

- no universal setpoints or maintenance intervals;
- reported numerical results remain source/case specific;
- synthetic worksheet values remain explicitly labelled synthetic;
- same-family studies remain grouped;
- no third-party figure tracing or reproduction;
- publication authorization does not expand implicitly;
- the existing `2026.09.14.4` physical-device candidate is not relabelled.

## Research handoff

The complete 12-artifact specifications, integration map and copy handoffs are retained in PR #333 under `sources/book-editorial-artifacts/2026-09-15/` and `data/research-expansion/2026-09-15/book-artifact-integration-map-v1.json`.

Tracked by issue #338.
