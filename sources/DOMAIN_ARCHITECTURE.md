# MouldMaster injection-moulding domain architecture

## Purpose

MouldMaster engineering rules must be independently testable without a browser, DOM, IndexedDB, localStorage, network access, release plumbing or machine-control integration. UI, storage and integration code may call domain functions; domain functions must not depend on those adapters.

This is an incremental migration contract. It deliberately avoids a broad learner-runtime rewrite on web release `2026.09.16.2`. Existing runtime implementations remain the active adapters for that frozen learner candidate and are protected by equivalence tests while pure domain modules are introduced.

## Dependency direction

Allowed direction:

`UI / learner views / imports / storage / integrations -> pure domain modules -> plain validated values`

Forbidden direction:

`pure domain modules -> DOM / browser storage / fetch / release metadata / UI rendering / machine control`

A domain result may contain values, units, assumptions, provenance and an unsupported-state reason. It must not mutate browser state or issue production commands.

## Canonical pure modules

### `src/domains/process/process-statistics.mjs`

Owns browser-independent statistical semantics currently needed by process-data interpretation:

- blank/null/invalid versus genuine-zero numeric semantics;
- numeric summaries and sample spread;
- fail-closed reference normalization;
- symmetric good/bad group-separation heuristic;
- aligned per-cycle energy-per-good-part calculation.

Its interpretation contract is documented in `sources/PROCESS_INTELLIGENCE_STATISTICS_CONTRACT.md` and exercised by `qa_process_statistics_domain.mjs`.

### `src/domains/process/engineering-core.mjs`

Owns browser-independent engineering boundary primitives introduced by the deep audit:

- clamp separating-force arithmetic with explicit area/pressure units and assumptions;
- shot/cavity mass accounting with explicit mass units and exclusions;
- channel semantic-readiness decisions used before process-data analysis;
- grade-specific/source-first processing boundary decisions.

These functions deliberately return explicit unsupported reasons rather than guessing units, material settings or machine capability.

## Current legacy/runtime adapters

`data-integration-runtime.js` remains the active `.16.2` connected process-data adapter. It currently combines browser persistence/orchestration with some statistical and semantic calculations. During migration:

- its exposed `diagnostics.num`, `diagnostics.stats`, `diagnostics.referenceScale`, window comparison and semantic-readiness behavior are regression-compared with the pure domain equivalents;
- the pure domain modules remain side-effect free;
- later learner-facing releases may delegate runtime calculations to the pure functions only after release identity, runtime fingerprint and release-specific validation packets are regenerated.

`process-intelligence.js` remains a presentation/orchestration layer for the current release. Statistical definitions shared with the pure layer are protected by golden tests and the written statistics contract until direct delegation is released.

## Engineering rule inventory and ownership direction

| Rule family | Current location | Target ownership |
| --- | --- | --- |
| Missing/zero numeric semantics | process-data runtime + process-intelligence UI | `process-statistics.mjs` |
| Summary statistics / reference spread | process-data runtime | `process-statistics.mjs` |
| Drift/window normalization | process-data runtime | `process-statistics.mjs` |
| Good/bad descriptive separation | process-intelligence UI | `process-statistics.mjs` |
| Per-cycle energy aggregation | process-intelligence UI | `process-statistics.mjs` |
| Process channel semantic readiness | process-data runtime | `engineering-core.mjs` |
| Clamp-force arithmetic | learning/calculation surfaces | `engineering-core.mjs` |
| Shot/cavity mass accounting | learning/calculation surfaces | `engineering-core.mjs` |
| Grade-specific processing-setting authority | lessons/material guidance | source-first domain boundary; exact grade documents remain controlling |
| Material drying/processing limits | supplier/grade evidence paths | no universal values in domain core; exact-grade evidence required |
| Machine capability / validated process limits | machine/site-specific evidence | never inferred from generic domain arithmetic |
| Production recipe / automatic machine control | outside public MouldMaster authority | prohibited without separate controlled-site validation and authorization |

## Domain result contract

A critical calculation/decision must make the following explicit where applicable:

1. validated numeric inputs and their units;
2. converted/result units;
3. assumptions used by the arithmetic or interpretation;
4. provenance/source reference when a real engineering value depends on external evidence;
5. a stable unsupported/ambiguous reason instead of a fabricated result;
6. authority boundary showing that an engineering estimate is not automatically a production limit or machine setting.

## Migration policy

Migration is one rule family at a time. A duplicate legacy implementation may remain temporarily only when either:

- the runtime delegates directly to the pure domain function; or
- executable equivalence tests prove the legacy and pure behavior agree for governed golden and edge fixtures.

When the learner runtime is changed to consume these pure modules, that is a learner-facing release change. It must advance the appropriate release identity/fingerprint and cannot inherit prior physical-device/AT evidence by relabelling.

## Safety and authority

The domain layer performs calculations and evidence-readiness decisions only. It does not establish universal process windows, material setpoints, machine safety limits, validated recipes, causal proof or automatic machine-control authority. Actual material, machine, mould, hot-runner, product and site requirements remain controlling.
