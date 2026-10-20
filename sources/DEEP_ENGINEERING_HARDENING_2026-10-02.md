# Deep engineering hardening — 2026-10-02

## Scope

This pass reviewed the current MouldMaster engineering/runtime architecture and governed Book evidence against the repository's own fail-closed contracts plus established injection-moulding engineering principles. It deliberately distinguishes **repository-controlled corrections** from **external evidence/review holds** that code cannot legitimately self-resolve.

## Confirmed strengths retained

- Pressure semantics already distinguish hydraulic/plastic/cavity meanings in learner-facing engineering guidance.
- The Book already uses claim-level evidence governance, 46 governed chapters and explicit publication boundaries.
- The Book does **not** claim independent SME approval; `data/book-sme-review-v1.json` correctly remains HOLD.
- Troubleshooting is mechanism/evidence-led instead of symptom → guaranteed fix.
- Material values are provenance-scoped and grade-specific values are not promoted from generic family guidance.
- Process-data statistics fail closed when engineering semantics/specification limits are not known.
- Production authority remains advisory-only; automatic machine control remains disabled.

## Repository-controlled changes in this hardening pass

### Pure engineering domain expanded

`src/domains/process/engineering-core.mjs` now owns additional browser-independent, unit-aware primitives:

1. pressure unit conversion with mandatory pressure-type semantics and canonical pressure-unit case (`Pa`, `kPa`, `MPa`, `bar`) so `mPa`/`mpa` cannot be treated as `MPa`;
2. location-explicit measured plastic-side pressure differences that exclude hydraulic/command pressure and preserve negative differences for investigation;
3. clamp separating-force range from an explicitly supplied pressure range;
4. shot-capacity utilisation only after comparable capacity basis is explicitly verified;
5. shot, clamp-force, specific-plastic-pressure, volumetric-flow and plasticising-throughput capacity comparisons tied to exact machine/injection-unit identity as applicable, traceable capacity-basis references, and exact material grade for plasticising;
6. fill-stage volume/mass/ram-rate arithmetic;
7. screw swept-volume and volumetric-rate machine-transfer geometry tied to exact injection-unit identities, including inverse target screw-speed translation without claiming a released setpoint;
8. average residence-time screening from inventory/throughput;
9. average residence screening derived from shot mass and cycle time;
10. relative cooling-time diffusion scaling with explicit non-absolute-model boundaries;
11. an evidence-gated absolute 1-D amorphous plane-wall cooling estimate that requires thermal-property/ejection/mould-surface provenance and rejects semi-crystalline material into a phase-change-model hold;
12. grade- and direction-bound linear shrinkage compensation arithmetic that requires exact material grade, directional basis, source-backed shrinkage range and conditioning/dimensional basis, refuses generic or silently interchanged directional shrinkage values, and explicitly stops short of a released tool dimension;
13. exact-grade, sample-specific moisture acceptance against a supplier-controlled limit with explicit measurement uncertainty and PASS / FAIL / INDETERMINATE states, without generating drying setpoints;
14. exact-identity mould-height, opening-stroke, maximum-daylight, tie-bar-clearance and ejector-stroke fit screens;
15. a declared-axis machine-suitability composer that preserves PASS / MARGINAL / FAIL / UNKNOWN, rejects cross-machine/cross-injection-unit/cross-mould identities as UNKNOWN, rejects identity-free custom axes unless they explicitly declare `contextIndependent` plus `contextBasisRef`, does not invent a marginal threshold, and requires `marginalBasisRef` for any MARGINAL assessment;
16. hydraulic-diameter, uniform-channel-volume and circular-channel apparent wall-shear-rate screens with explicit non-Newtonian/pressure-loss boundaries;
17. fail-closed pressure-loss modelling readiness that rejects MFR/MFI as a substitute for an explicit rheology model and blocks hydraulic/command pressure types;
18. repeatability-aware gate-seal plateau analysis using a user-supplied decision tolerance.

All new functions return structured unsupported states rather than silently inventing missing engineering meaning. The unit boundary also preserves SI prefix case across pressure, force, mass, length, area, volume, rates and diffusivity so ambiguous prefix changes are rejected rather than normalised.

### Multi-cavity statistics hardening

`process-statistics.mjs` now preserves cavity identity and reports per-cavity summary statistics plus the range of cavity means. It requires explicit measurement unit, sampling basis **and sampling-basis reference**, measurement-system adequacy **and measurement-system basis reference**, plus minimum repeated support per cavity. Bare adequacy flags are insufficient. The output is descriptive only: no generic balance percentage or tooling/process diagnosis is generated.

### Energy-intensity statistics hardening

`energyPerGoodPart` now requires unique cycle identity, a per-cycle sampling-basis reference, energy-measurement basis reference and quality-disposition basis reference. Negative energy is rejected; missing/duplicate/misaligned cycles fail closed. Energy consumed by rejected cycles remains in the numerator while only good parts contribute to the denominator, preserving the intended energy-per-good-part accounting.

### SPC/capability hardening

`src/domains/process/process-statistics.mjs` now has fail-closed capability arithmetic. It refuses to produce an index unless process stability, measurement-system adequacy, sampling adequacy and distribution/model adequacy are explicitly confirmed with a non-empty evidence-basis reference for each prerequisite; a common measurement unit, explicit spread-estimator reference and specification-authority reference are also required. Bare `true` flags are insufficient. A within-subgroup spread basis produces Cp/Cpk/Cpu/Cpl; an overall/long-term spread basis produces Pp/Ppk/Ppu/Ppl, preventing silent estimator relabelling. The function does not grade results against a generic 1.33/1.67-style threshold.

### Stable calculation registry

`data/engineering-calculation-registry-v1.json` is now the machine-readable calculation contract. Each calculation records:

- stable ID;
- formula/method;
- inputs and outputs;
- scope;
- evidence anchors;
- uncertainty boundary;
- advisory authority boundary.

`qa_engineering_domain.mjs` requires one-to-one registry coverage for every exported engineering calculation ID. It now also resolves every `evidenceAnchors` ID across the repository's governed Book/source ledgers plus a minimal peer-reviewed supplement list, applies the Book's canonical academic DOI overrides where available, rejects raw DOI strings as pseudo-IDs, and fails on orphaned evidence or conflicting source URLs. The local supplements are limited to peer-reviewed papers verified on 2026-10-02 for clamp/tie-bar behaviour and analytical/conformal cooling.

### Canonical academic-link governance

The Book publication-authorization record already carries canonical DOI mappings for high-value peer-reviewed sources, including Párizs 2023, Oubellaouch 2024, Zhao 2022 and Li 2024. Some learner-runtime claim-review payloads still contain intermediary discovery URLs. This engineering-only pass deliberately leaves those governed runtime bytes unchanged so it does not invalidate the current web-release fingerprint. Any future URL normalization should be performed as an explicit governed learner-runtime release with the required web-release/cache/fingerprint update.

## Highest remaining internal engineering debt

### Resolved — legacy simulator weighted signals

The fixed weighted short-shot/flash/sink/burn/splay/warpage score formulas have been removed. The runtime now emits **qualitative mechanism prompts only** from the direction of change relative to the learner's known-good training baseline.

The replacement deliberately has:

- no defect probability or severity score;
- no ranked “highest risk” output;
- no pseudo-safe numerical threshold;
- no visual defect prediction;
- no production-setting authority;
- explicit evidence-verification prompts before any controlled change.

The optional practice challenge is now baseline recovery: success means only that the exercise controls returned to the displayed reference state. `qa_engineer_simulator_units.cjs` rejects reintroduction of the retired weighted-score markers.
### P1 — migrate duplicate UI arithmetic to the pure domain

`src/domains/engineering/engineer-simulator-ui.js` still contains duplicate clamp and fill-rate arithmetic. Future runtime work should consume the canonical engineering-domain implementation through a governed browser adapter/module path so the app has one source of truth.

### P1 — material-condition acceptance

The pure domain now supports an uncertainty-aware exact-grade moisture comparison. The measurement method, sample identity and controlling supplier requirement are mandatory. A measurement whose uncertainty interval overlaps the limit is reported as INDETERMINATE instead of being rounded into a pass/fail. The function intentionally does not prescribe dryer temperature, time, dew point or airflow.

### P1 — process transfer arithmetic

The pure domain now converts actual screw motion and screw diameter into geometric barrel-displacement volumetric rate and can translate that rate to a different screw diameter. This is deliberately narrower than a full process-transfer recipe: target machine acceleration, pressure capability, melt preparation, check-ring behaviour, trace shape and product validation still have to be demonstrated. Hydraulic-to-plastic pressure conversion has **not** been added because that requires exact machine-specific intensification documentation rather than a generic ratio.

### P1 — machine suitability

Separate pure capacity screens now exist for clamp force, verified shot mass, specific-plastic pressure, volumetric injection flow and plasticising throughput. Exact-identity geometric screens now cover mould height, daylight, tie-bar clearance, opening stroke and ejector stroke, and the composition layer now preserves per-axis PASS / MARGINAL / FAIL / UNKNOWN while forcing UNKNOWN for unresolved required axes unless a known FAIL already dominates. Remaining machine-suitability work is to add evidence-scoped residence/thermal-history decisions plus nozzle/location, platen/load, utility and ancillary-equipment axes; no universal machine-ready PASS is authorised.

### P1 — thermal model depth

The pure domain now includes both a relative diffusion scaling screen and a narrowly scoped **amorphous 1-D analytical cooling estimate**. The absolute estimate requires source-backed thermal diffusivity, an explicitly centerline-temperature ejection criterion and mould-surface-temperature basis, and it rejects semi-crystalline materials. Remaining thermal work is a validated semi-crystalline/phase-change treatment plus deeper boundary modelling that explicitly handles:

- amorphous vs semi-crystalline applicability;
- melt/mould/ejection temperature criterion;
- thermal diffusivity provenance;
- crystallisation/latent heat limitations;
- thermal contact resistance;
- geometry/characteristic-thickness assumptions;
- coolant/mould thermal-resistance limitations.

### P1 — runner/gate engineering

The pure domain now includes hydraulic diameter, uniform channel volume, circular-channel apparent wall shear rate and a pressure-loss readiness gate. The remaining work is deliberately narrower:

- add non-circular gate/channel shear models only where aspect-ratio/formula applicability is explicit;
- add material-density mass accounting only with temperature/state provenance rather than a generic resin constant;
- add quantitative pressure-loss models only with validated rheology, thermal state and geometry;
- connect cavity-specific descriptive statistics to branch/pressure evidence while preserving cycle and cavity identity;
- connect these calculations to the existing gate-seal study and controlled pressure-loss workflow.

### P1 — measurement uncertainty

Calculation inputs that originate from measurements should be able to retain method, resolution/uncertainty and source identity. Gate-seal analysis already requires a user-supplied decision tolerance; the same pattern should be extended to dimensional, pressure and thermal measurements.

## External holds — do not "fix" with generated data or automated approval

The following remain legitimate external evidence requirements rather than software defects:

- independent human SME review of all 46 Book chapters;
- human SME semantic review of the Academy lessons;
- real learner pilot/longitudinal feedback;
- physical iOS/iPadOS/Android validation;
- real NVDA/VoiceOver validation;
- Windows signing/Store validation;
- NZQA/provider/accreditation validation;
- authorised real-site black-speck, hot-runner and maintenance/recovery datasets;
- OEM machine manuals/schematics needed for a broad machine library.

Automation must never mark these complete without the required external evidence.

## Book disposition

The Book does **not** need a wholesale scientific rewrite based on this pass. Its strongest remaining publication-quality gap is independent human semantic/technical review, not absence of an internal evidence framework. New engineering calculators should be linked into the Book only through the same claim/evidence/authorization process already used by the project.

## Release boundary

This hardening pass does not authorize machine settings, safety overrides, grade-specific processing values, mould limits or production recipes. Exact material, machine, mould/hot-runner, product and site documentation remain controlling.