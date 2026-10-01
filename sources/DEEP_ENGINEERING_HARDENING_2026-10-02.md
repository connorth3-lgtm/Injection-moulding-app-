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
2. clamp separating-force range from an explicitly supplied pressure range;
3. shot-capacity utilisation only after comparable capacity basis is explicitly verified;
4. fill-stage volume/mass/ram-rate arithmetic;
5. average residence-time screening from inventory/throughput;
6. average residence screening derived from shot mass and cycle time;
7. relative cooling-time diffusion scaling with explicit non-absolute-model boundaries;
8. repeatability-aware gate-seal plateau analysis using a user-supplied decision tolerance.

All new functions return structured unsupported states rather than silently inventing missing engineering meaning.

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

### Canonical academic links

Governed Book claim-review evidence now points directly to canonical DOI records for the Párizs 2023 in-mould sensor paper, Oubellaouch 2024 fibre-orientation paper, Zhao 2022 warpage/shrinkage review and Li 2024 weld-line review instead of intermediary discovery-index URLs.

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

The pure domain still needs a fail-closed machine-suitability composition layer for:

- clamp capacity;
- verified shot capacity;
- available plastic pressure;
- volumetric flow/injection-rate capability;
- plasticising/recovery capability;
- residence/thermal history;
- mould height/daylight/tie-bar/opening/ejector fit.

No overall PASS should be produced when one of the required semantics is unknown; the output should show per-axis PASS / MARGINAL / FAIL / UNKNOWN.

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

Add geometry-scoped screens only where formula and material/rheology assumptions are explicit:

- hydraulic diameter;
- volume/mass accounting;
- apparent geometric shear-rate screens;
- pressure-loss readiness (not pressure-loss prediction without rheology);
- balance/cavity identity;
- gate-seal study linkage.

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
