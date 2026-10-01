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

1. pressure unit conversion with mandatory pressure-type semantics;
2. location-explicit measured plastic-side pressure differences that exclude hydraulic/command pressure and preserve negative differences for investigation;
3. clamp separating-force range from an explicitly supplied pressure range;
4. shot-capacity utilisation only after comparable capacity basis is explicitly verified;
5. separate clamp-force, specific-plastic-pressure, volumetric-flow and plasticising-throughput capacity comparisons, each requiring a verified like-for-like basis;
6. fill-stage volume/mass/ram-rate arithmetic;
7. average residence-time screening from inventory/throughput;
8. average residence screening derived from shot mass and cycle time;
9. relative cooling-time diffusion scaling with explicit non-absolute-model boundaries;
10. source-bound linear shrinkage compensation-range arithmetic that refuses unsourced generic shrinkage inputs and explicitly stops short of a released tool dimension;
11. exact-identity mould-height, opening-stroke, maximum-daylight, tie-bar-clearance and ejector-stroke fit screens;
12. a declared-axis machine-suitability composer that preserves PASS / MARGINAL / FAIL / UNKNOWN without inventing a marginal threshold and forces UNKNOWN when a required axis is unresolved;
13. hydraulic-diameter, uniform-channel-volume and circular-channel apparent wall-shear-rate screens with explicit non-Newtonian/pressure-loss boundaries;
14. fail-closed pressure-loss modelling readiness that rejects MFR/MFI as a substitute for an explicit rheology model;
15. repeatability-aware gate-seal plateau analysis using a user-supplied decision tolerance.

All new functions return structured unsupported states rather than silently inventing missing engineering meaning.

### SPC/capability hardening

`src/domains/process/process-statistics.mjs` now has fail-closed capability arithmetic. It refuses to produce an index unless process stability, measurement-system adequacy, sampling adequacy, distribution/model adequacy and specification authority are all explicitly confirmed. A within-subgroup spread basis produces Cp/Cpk/Cpu/Cpl; an overall/long-term spread basis produces Pp/Ppk/Ppu/Ppl, preventing silent estimator relabelling. The function does not grade results against a generic 1.33/1.67-style threshold.

### Stable calculation registry

`data/engineering-calculation-registry-v1.json` is now the machine-readable calculation contract. Each calculation records:

- stable ID;
- formula/method;
- inputs and outputs;
- scope;
- evidence anchors;
- uncertainty boundary;
- advisory authority boundary.

`qa_engineering_domain.mjs` requires one-to-one registry coverage for every exported engineering calculation ID.

### Canonical academic-link governance

The Book publication-authorization record already carries canonical DOI mappings for high-value peer-reviewed sources, including Párizs 2023, Oubellaouch 2024, Zhao 2022 and Li 2024. Some learner-runtime claim-review payloads still contain intermediary discovery URLs. This engineering-only pass deliberately leaves those governed runtime bytes unchanged so it does not invalidate the current web-release fingerprint. Any future URL normalization should be performed as an explicit governed learner-runtime release with the required web-release/cache/fingerprint update.

## Highest remaining internal engineering debt

### P0 — legacy simulator weighted signals

`src/core-runtime/core-inline-004.js` still contains fixed weighted formulas such as temperature/time/percentage thresholds for short-shot, flash, sink, burn, splay and warpage training signals. The later engineer UI correctly relabels these as advisory training indicators rather than probabilities, but the formulas themselves are not validated physical prediction models.

Required direction:

- do not promote these outputs as probability, Cp/Cpk, specification or production-setting authority;
- replace fixed absolute thresholds with either (a) a clearly synthetic non-predictive training interaction or (b) a calibrated/measured model with retained validation data;
- preserve the current evidence-led verification prompts.

### P1 — migrate duplicate UI arithmetic to the pure domain

`src/domains/engineering/engineer-simulator-ui.js` still contains duplicate clamp and fill-rate arithmetic. Future runtime work should consume the canonical engineering-domain implementation through a governed browser adapter/module path so the app has one source of truth.

### P1 — machine suitability

Separate pure capacity screens now exist for clamp force, verified shot mass, specific-plastic pressure, volumetric injection flow and plasticising throughput. Exact-identity geometric screens now cover mould height, daylight, tie-bar clearance, opening stroke and ejector stroke, and the composition layer now preserves per-axis PASS / MARGINAL / FAIL / UNKNOWN while forcing UNKNOWN for unresolved required axes unless a known FAIL already dominates. Remaining machine-suitability work is to add evidence-scoped residence/thermal-history decisions plus nozzle/location, platen/load, utility and ancillary-equipment axes; no universal machine-ready PASS is authorised.

### P1 — thermal model depth

The current added thermal function is deliberately only a **relative diffusion scaling screen**. An absolute cooling/solidification calculation should only be added after the implementation explicitly handles:

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
- add cavity/branch balance evidence while preserving cavity identity;
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
