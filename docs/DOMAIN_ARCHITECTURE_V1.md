# MouldMaster Engineering Domain Architecture v1

Status: foundation contract for the 1→10 app-audit implementation.

## Architecture freeze

New product capabilities must not be added as new root-level `*-fix.js`, `*-hardening.js`, `*-finalize.js`, or `*-extension.js` files unless the change is an emergency compatibility patch. New domain capabilities belong under `src/domains/<domain>/` and must expose one documented public API on `window.MM_*` until the legacy global shell is retired.

Existing root-level layers remain supported during migration. This is an incremental consolidation, not a big-bang rewrite.

### Enforced architecture-debt budget

The 2026-09-03 deep-dive audit converted the freeze from documentation into a monotonic CI contract. `qa_architecture_debt.py`, backed by `qa/architecture-debt-baseline.json`, allows the legacy bootstrap to shrink but not silently grow.

Current ceilings are:

- at most 39 scripts in the ordered `BODY_SCRIPTS` bootstrap list;
- at most 36 directly injected root-level runtime scripts;
- no new root runtime script outside the captured grandfathered set;
- no new root `*-fix.js`, `*-hardening.js`, `*-finalize.js`, or `*-extension.js` compatibility layer outside the captured grandfathered set;
- at most one legacy `document.write` bootstrap call;
- no `eval()`, `new Function()`, remote runtime script tags, CSP `unsafe-eval`, or external `connect-src` endpoints in the active runtime.

The budget is a ceiling, not a target. On 2026-09-03 the first deterministic runtime-pack tranche retired 23 direct evidence/process-data bootstrap entries into two ordered generated packs, reducing BODY_SCRIPTS from 60 to 39 and direct root runtime scripts from 59 to 36 without changing source execution order. Removing a root layer, moving capability under `src/domains/`, removing `document.write`, or replacing `unsafe-inline` with a stricter nonce/hash design is always an improvement and remains allowed.

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

Schemas and source/staging manifests remain under `data/materials/` and are intentionally outside the GitHub Pages public allowlist. The compiler emits only the validated runtime snapshot `material-catalog-v1.json` at the public root. This keeps acquisition/staging state separate from learner-visible exact-grade facts.

## Korean catalogue pilot

The scale/stress-test manufacturers are:

- LOTTE Chemical
- LG Chem
- Korea Polyacetal (KPAC), retaining the stable `mfr-kep` identifier for KEPITAL continuity
- KOLON ENP / KOLON engineering-plastics catalogue family

Pilot progress as of 2026-09-03:

- LOTTE Chemical has four validated exact commercial grades published in `material-catalog-v1.json`: NH-1033, NH-1034R, AE-3060 H and XP-2140C.
- LG Chem has three validated LUPOY exact grades published in `material-catalog-v1.json`: GP1000L, GP1000ML and GP5206F.
- Korea Polyacetal (KPAC) has four validated KEPITAL exact grades published in `material-catalog-v1.json`: F10-03H, F20-03, F30-03 and FG2025.
- KOLON ENP has four primary-source-reviewed exact KOCETAL identities in `kolon-enp-exact-grade-pilot-v1`: K300, K700, K100HS and GF702. These remain `source-reviewed-staging`; no KOLON numeric property is validated or published until comparison-critical test context and the stronger source revision/fingerprint identity requirements are satisfied.
- The runtime catalogue therefore remains at 11 published exact grades across three validated manufacturers. KOLON source review increases acquisition coverage without being counted as validation or publication.
- `korea-pilot-v1.json` is an umbrella progress manifest, not a second source of material claims; its `gradeRecords` arrays stay empty and point to separately reviewed/validated datasets.

No glass-fibre percentage, lifecycle state, approval, property condition or processing value is inferred when the primary source does not establish it.

## Runtime migration

New modules are grouped under `src/domains/`. The current HTML bootstrap remains compatible during migration. A generated public runtime asset manifest becomes the source for new domain assets and is audited against the Pages/offline/desktop packages. Internal schemas/staging are not runtime assets.

The remaining bootstrap migration is deliberately staged: retire root layers by domain, preserve browser/PWA/Desktop parity at every step, and only then replace the single legacy core-document rewrite. The architecture-debt budget ensures intermediate work cannot make the root/global stack larger.

## 1→10 implementation mapping

1. Architecture expansion freeze — this contract and CI guard.
2. Canonical material-grade schema — `data/materials/material-grade.schema.json`.
3. Staged material ingestion — `tools/material_catalog.py` plus staging manifests.
4. Korea stress test — `data/materials/staging/korea-pilot-v1.json` plus reviewed/validated manufacturer datasets.
5. Materials → Mould Master links — material registry and engineering-store `materialGradeId`/case links.
6. IndexedDB engineering persistence — `src/domains/engineering/engineering-store.js`.
7. Material semantic QA — `qa_material_catalog.py`.
8. Module consolidation — domain directory rule, runtime domain bridge and architecture debt ceiling.
9. Generated runtime manifest — `tools/generate_runtime_manifest.py` and public `runtime-domain-manifest.json`.
10. Product IA — `src/domains/shell/product-areas.js` exposes the five canonical areas for shell migration.

## Non-goals for this foundation

- No claim that Korean manufacturer catalogues have already been exhaustively ingested.
- No automatic replacement of the legacy Mould Master UI/storage.
- No universal production recipes.
- No forced migration of learner data.
- No removal of existing assessment/reference layers until their callers are migrated and QA-proven.
