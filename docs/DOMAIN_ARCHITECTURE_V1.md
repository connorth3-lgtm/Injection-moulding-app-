# MouldMaster Engineering Domain Architecture v1

Status: foundation contract for the 1→10 app-audit implementation.

## Architecture freeze

New product capabilities must not be added as new root-level `*-fix.js`, `*-hardening.js`, `*-finalize.js`, or `*-extension.js` files unless the change is an emergency compatibility patch. New domain capabilities belong under `src/domains/<domain>/` and must expose one documented public API on `window.MM_*` until the legacy global shell is retired.

Existing root-level layers remain supported during migration. This is an incremental consolidation, not a big-bang rewrite.

## Five user-facing product areas

1. **Learn** — Academy, lessons, specialist learning, assessments and certificates.
2. **Materials** — exact commercial grades, supplier documents, material properties and processing evidence.
3. **Diagnose** — Mould Master troubleshooting cases and controlled verification.
4. **Analyse** — local process-data intake, baselines, interventions, drift and quality intelligence.
5. **Evidence** — reference library, source provenance and evidence maturity.

Implementation detail should be hidden behind these user intentions.

## Canonical engineering domain

The engineering domain is the shared language for Materials, Diagnose and Analyse.

Core entities:

- `MaterialManufacturer`
- `MaterialBrand`
- `MaterialGrade`
- `MaterialPropertyObservation`
- `MaterialProcessingObservation`
- `SourceDocument`
- `Machine`
- `Mould`
- `Cavity`
- `Dataset`
- `Baseline`
- `Intervention`
- `TroubleshootingCase`
- `QualityObservation`

Every production-adjacent conclusion should be traceable to domain IDs rather than relying only on display text.

## Evidence rule

A numeric value is not a usable engineering fact unless its semantics are complete enough for the intended comparison.

Examples:

- MFR/MFI requires method, temperature, load and unit.
- shrinkage requires direction/method/conditioning where applicable.
- mechanical properties require test method and material/specimen condition where applicable.
- process signals require role, unit, meaning and sampling basis.

Missing comparison-critical semantics make an observation `comparisonReady=false`; they must never be silently guessed.

## Material identity rule

A material-family label such as `PC`, `PP`, `ABS`, `PA66` or `PC/ABS` is educational context, not an exact production material identity.

Exact-grade identity uses:

`manufacturer -> brand -> commercial grade -> composition/modifiers -> source revision`.

Mould Master and Process Data may retain free-text material fields for backward compatibility, but new links should prefer `materialGradeId`.

## Storage rule

New engineering records use IndexedDB through the v2 engineering store. Legacy Mould Master localStorage records remain readable and can be migrated without deletion. Migration is additive and reversible until a later release explicitly retires the v1 store.

## Ingestion rule

External material data moves through three states:

1. `staging` — source acquired, claims not trusted for runtime.
2. `validated` — schema/semantic/provenance gates pass.
3. `published` — explicitly approved into the runtime catalogue.

No scraper or importer writes directly to the published catalogue.

## Korean catalogue pilot

The first scale/stress-test manufacturers are:

- LOTTE Chemical
- LG Chem
- Korea Engineering Plastics (KEP)
- KOLON ENP / KOLON engineering-plastics catalogue family

The pilot manifest intentionally contains no invented commercial-grade facts. Grade records are added only after source-backed extraction and semantic validation.

## Runtime migration

New modules are grouped under `src/domains/`. The current HTML bootstrap remains compatible during migration. A generated runtime asset manifest becomes the source for new domain assets and is audited against the shell/offline package.

## 1→10 implementation mapping

1. Architecture expansion freeze — this contract and CI guard.
2. Canonical material-grade schema — `data/materials/material-grade.schema.json`.
3. Staged material ingestion — `tools/material_catalog.py` plus staging manifests.
4. Korea stress test — `data/materials/staging/korea-pilot-v1.json`.
5. Materials → Mould Master links — material registry and engineering-store `materialGradeId`/case links.
6. IndexedDB engineering persistence — `src/domains/engineering/engineering-store.js`.
7. Material semantic QA — `qa_material_catalog.py`.
8. Module consolidation — domain directory rule and runtime domain bridge.
9. Generated runtime manifest — `tools/generate_runtime_manifest.py` and `data/runtime-domain-manifest.json`.
10. Product IA — `src/domains/shell/product-areas.js` exposes the five canonical areas for shell migration.

## Non-goals for this foundation

- No claim that Korean manufacturer catalogues have already been exhaustively ingested.
- No automatic replacement of the legacy Mould Master UI/storage.
- No universal production recipes.
- No forced migration of learner data.
- No removal of existing assessment/reference layers until their callers are migrated and QA-proven.
