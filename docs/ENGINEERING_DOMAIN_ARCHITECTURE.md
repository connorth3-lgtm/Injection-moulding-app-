# MouldMaster injection-moulding domain architecture

## Purpose

Issue #310 requires engineering rules to be independently testable and reusable without coupling them to browser UI, storage, release plumbing, external integrations or machine-control authority. The canonical direction is therefore **presentation/adapters → pure domain**. The pure domain must never import from UI, DOM, IndexedDB/localStorage, network clients, GitHub/release tooling or platform packaging.

## Canonical process-domain modules

| Module | Responsibility | Browser/storage dependency |
| --- | --- | --- |
| `src/domains/process/engineering-core.mjs` | Pure injection-moulding engineering primitives and fail-closed source/semantic boundaries | none |
| `src/domains/process/process-statistics.mjs` | Pure descriptive/statistical evidence calculations with explicit unsupported states | none |
| `src/domains/process/process-data-integrity.js` | Browser compatibility adapter around site-local process-data storage/runtime | yes — adapter only |
| `data-integration-runtime.js` | Current `.16.2` UI/orchestration/storage runtime | yes — legacy orchestration layer |

The intended dependency direction is:

```text
UI / browser orchestration / storage adapters / release plumbing
                    |
                    v
       pure process-domain functions
                    |
                    v
            plain input/output data
```

A pure domain module may return data, reasons, assumptions, units, provenance and authority boundaries. It may not manipulate UI, persistence, browser globals or machines.

## Current extracted rules

`engineering-core.mjs` currently isolates the following rules without changing frozen learner-facing `.16.2` behaviour:

1. **Clamp separating-force arithmetic** — projected area × explicitly supplied representative pressure, with unit conversion and explicit warning that the arithmetic result is not automatically the required machine clamp rating.
2. **Shot/cavity mass accounting** — cavity count × part mass + optional runner mass, without claiming machine shot-capacity suitability.
3. **Process-channel semantic readiness** — role, meaning, unit/dynamic-unit and sampling-basis blockers, kept equivalent to the current `.16.2` browser implementation during migration.
4. **Exact-grade processing boundary** — grade-specific process settings require an exact grade and a current controlling supplier document; the pure domain does not invent generic production setpoints.

`process-statistics.mjs` separately owns the descriptive evidence calculations already extracted by the audit, including reference-spread normalization, group separation and energy-per-good-part with explicit unsupported-state reasons.

## Inputs, outputs and fail-closed behaviour

Pure functions accept plain JavaScript values/objects only. Engineering quantities must carry explicit units at the boundary. Where the input is absent, non-finite, unsupported, ambiguous or lacks required provenance, the function returns `ok: false` with a stable reason instead of guessing.

Successful engineering results carry the relevant units plus assumptions/provenance and an authority label. The authority labels are deliberately narrow: arithmetic estimates, mass accounting, semantic readiness and source-first guidance. None grant validated recipe authority or machine-control authority.

## Migration and duplicate-rule protection

The learner-facing `.16.2` browser runtime is intentionally not broadly rewritten by this audit PR. Migration is incremental:

- new or changed engineering logic should be implemented in the pure domain first;
- existing browser calculations remain unchanged until a deliberately versioned learner release migrates them;
- while duplicate logic exists, executable equivalence tests must compare the pure function to the captured current runtime rule or otherwise prove matching behaviour for representative and edge cases;
- a migration may remove the duplicate only after the consuming UI/adaptor calls the pure domain and the relevant browser/regression suites remain green.

`qa_engineering_domain.mjs` currently provides golden/invalid fixtures and an equivalence guard for the process-channel semantic-readiness rule. `qa_process_statistics_domain.mjs` provides the equivalent pure-statistics regression suite.

## Inventory for further extraction

The audit identified additional candidate rules that should move behind the same boundary when they next change: material/drying applicability, usable shot-capacity checks, cycle-time components, cooling/thermal estimates, energy and quality/drift calculations, process-limit/readiness rules, and any repeated clamp/pressure/mass logic found in learner UI or evidence workflows. Each extraction must preserve units, assumptions, provenance and unsupported-state reasons.

## Safety and authority boundary

This architecture introduces **no production or automatic machine-control authority**. MouldMaster remains advisory-only unless a separate controlled-site validation, safety/governance review and explicit authorization establishes a narrower authority for an exact site/system scope. Generic educational calculations must never be promoted into universal machine settings or validated production recipes merely because they are implemented in code.
