# MouldMaster Engineering Deep Dive — calculation contracts and material data

Status date: 2026-09-02

## Scope

This upgrade adds an engineering calculation layer and a grade-level material data layer without turning family-level learning guidance into universal production setpoints.

The runtime database currently contains **24 material families and 25 records**. It covers every material family already present in `reference-data.js` (20/20) and adds LDPE, PPA, PEI and PPSU. PA contains separate PA6 and PA66 grades.

The governing rule is deliberately conservative:

> Exact-grade supplier data outrank family guidance. A value not published for the selected grade remains `null`; it is not silently copied from another grade or from a generic polymer table.

Source levels are retained on every record:

1. `PRIMARY_SUPPLIER` — current supplier product page or grade processing sheet.
2. `PRIMARY_SUPPLIER_GUIDE` — supplier family/design/processing guide; useful but explicitly broader than one grade.
3. `SECONDARY_SUPPLIER_ATTRIBUTED` — a supplier-attributed mirror/database where a primary page was not available in the retained source set. These records are visibly lower confidence and should be rechecked before production use.

## Material coverage

Existing families: PP, HDPE, ABS, PC, PA6/PA66, POM, PBT, PET, PMMA, TPU, PPS, PEEK, PS, HIPS, ASA, SAN, TPE/TPR, LCP, PC/ABS and recycled-content compounds.

Additional families: LDPE, PPA, PEI and PPSU.

Representative high-specificity records include:

- **Covestro Makrolon 2405 (PC):** 120 °C dry-air drying for 2–3 h, maximum moisture 0.02%, melt 280–320 °C, mould 80–120 °C, rear/middle/front/nozzle windows, 50–150 bar specific back pressure and 30–70% shot-to-cylinder guidance. Source: https://solutions.covestro.com/en/products/makrolon/makrolon-2405_000000000000945088
- **Covestro Bayblend T65 XF (PC/ABS):** dry-air 95–110 °C for 4 h, maximum moisture 0.02%, standard melt 260 °C, mould 70–90 °C and grade-specific barrel/nozzle windows. Source: https://solutions.covestro.com/en/products/bayblend/bayblend-t65-xf_000000000000750258
- **INEOS Styrolution Terluran GP-35 (ABS):** MFR 3.1 g/10 min at 200 °C/5 kg, density 1.04 g/cm³, drying and injection-temperature guidance plus mould-shrinkage data. Source: https://eshop.ineos-styrolution.com/Product/Terluran_Terluran-GP-35_SKU300600120829.html
- **BASF Ultramid A3K/A3-series PA66 processing evidence:** current BASF processing sheets show the importance of grade-specific moisture, drying, melt, mould and residence limits rather than a single 'nylon' recipe. Example source: https://download.basf.com/p1/8a8082587fd4b608017fd64127506d71/en/ULTRAMID%25C2%25AE_A3K
- **Celanese polyester guidance:** Celanex PBT family guidance distinguishes PBT drying and injection ranges from PET, reinforcing why PBT and PET must not share a generic polyester process window. Source: https://www.celanese.com/-/media/Engineered-Materials/Files/Product-Technical-Guides/PBT-010_CelanesePolyesterTechTG_AM_0613.pdf
- **Rynite 530 NC010 (PET-GF30):** retained supplier-attributed data specify 120 °C drying for 4–6 h, ≤0.02% moisture, 280–300 °C melt and 120–140 °C mould. This record is marked secondary/supplier-attributed until a current first-party grade page is retained.
- **Syensqo Ryton PPS:** supplier guidance gives drying 149–177 °C for 2–3 h with <0.02% moisture sufficient for compounds and normal melt processing around 315–343 °C. Source: https://www.syensqo.com/en/brands/ryton-pps/faq
- **SABIC ULTEM 1000 (PEI):** supplier data show 150 °C drying for 4–6 h, maximum moisture 0.02%, melt 350–410 °C and mould 135–180 °C. The runtime record remains marked secondary until the retained URL is a direct first-party source.
- **Syensqo Radel R-5000 (PPSU):** the supplier design guide is stored as a paired drying schedule rather than collapsed into a misleading continuous range. Source: https://www.syensqo.com/sites/g/files/alwlxe161/files/2018-07/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf

## Formal calculation contracts

The calculation engine exposes 13 named contracts. Every result carries a calculation ID/version and supports provenance/confidence metadata.

### CALC-AREA-001 — projected area

`A_projected = cavity_count × A_part + A_runner + A_other_pressurised`

Units: mm². Runner/other pressurised area must not be omitted when it is exposed to cavity pressure.

### CALC-CLAMP-001 — clamp-force requirement

`F_N = A_mm² × P_MPa × reserve_factor`

Because 1 MPa = 1 N/mm², this conversion is dimensionally direct. The engine also returns kN, metric tonne-force and US ton-force. The contract rejects hydraulic or specific-plastic pressure when it is labelled as such: clamp force requires an effective cavity-pressure input. Estimated cavity pressure makes the result provisional.

### CALC-SHOT-001 — recurring shot

Recurring shot includes molded parts plus cold-runner material. Hot-runner inventory is intentionally excluded from recurring shot because it remains in the heated system and belongs in residence-time inventory.

### CALC-STROKE-001 — screw stroke and cushion

`A_screw = πD²/4`

`stroke_mm = shot_volume_mm³ / A_screw`

`metering_stroke = injection_stroke + target_cushion`

The engine can compare the result with a machine metering-stroke limit.

### CALC-PRESSURE-001 — pressure-domain conversion

Only hydraulic ↔ specific-plastic conversion is permitted, using an OEM/calibrated relationship or an explicitly supplied intensification ratio. **Cavity pressure is never inferred from hydraulic/specific-plastic pressure by this function.**

### CALC-FLOW-001 — fill rate

`Q = fill_volume / fill_time`

Returns volumetric flow and, when screw diameter is supplied, equivalent screw velocity.

### CALC-PLASTICISING-001 — required plasticising throughput

`required_kg/h = shot_mass_g × 3.6 / cycle_time_s`

This is a throughput requirement, not proof that a machine can deliver the required melt quality.

### CALC-RESIDENCE-001 — average residence time

`average_residence = heated_inventory / mass_flow`

Barrel-only and total heated-system estimates are separated. Hot-runner inventory can be added to the total system. The output is explicitly labelled an average because real material has a residence-time distribution.

### CALC-COOL-001 — first-order theoretical cooling

A one-dimensional conduction estimate is implemented with domain checks requiring melt temperature > ejection temperature > mould-wall temperature. It is labelled theoretical and must be validated on the real mould/part.

### CALC-CYCLE-001 — event timeline

The contract does not simply sum hold + recovery + cooling. It models overlap after fill:

`cycle = close + fill + max(cooling_from_end_fill, hold + recovery) + open + eject + handling + other`

This prevents double-counting recovery that occurs during the closed/cooling phase.

### CALC-SHRINK-001 — tooling/shrinkage estimate

The contract distinguishes ISO moulding-shrinkage interpretation from a simple tooling allowance. It always emits a tooling-validation warning: supplier/test-bar shrinkage is a starting estimate, not steel-cut authority.

### CALC-CAVITIES-001 — candidate cavity count

Candidate limits can be supplied from shot capacity, clamp capacity, flow, plasticising capacity and mould-fit constraints. The returned candidate is the minimum of available constraints; missing constraint families make the answer provisional rather than silently assumed acceptable.

### CALC-SUITABILITY-001 — machine suitability

Critical checks resolve to `PASS_VERIFIED`, `PASS_PROVISIONAL`, `WARNING`, `FAIL` or `INSUFFICIENT_DATA`. A missing critical limit does not pass.

## Pressure-domain safety rule

The engine treats hydraulic pressure, specific-plastic pressure and cavity pressure as distinct domains. Hydraulic pressure can only be converted to specific-plastic pressure when the machine relationship is supplied. Cavity pressure must come from a cavity-pressure measurement, a validated CAE/empirical estimate, or another explicitly identified source; it cannot be produced by the pressure-conversion function.

This prevents one of the most consequential calculation errors in injection moulding: applying a machine hydraulic value directly to projected area as if it were cavity pressure.

## Data quality and null policy

The material database deliberately contains partial records. Examples:

- A grade may have density/MFR from a supplier page but no public exact moulding window: process fields stay `null`.
- A supplier may publish a mould temperature only as an ISO specimen condition: the value is labelled as a test condition, not upgraded into a recommended range.
- A supplier guide may give a family range: source level is `PRIMARY_SUPPLIER_GUIDE`, not `PRIMARY_SUPPLIER` grade data.
- Secondary supplier-attributed data remain visibly lower confidence until revalidated against a current first-party grade source.

This is intentional. A smaller set of traceable values is safer and more useful than a visually complete table assembled from incompatible grades.

## Runtime and QA

The Engineering workbench is loaded from `app-shell-finalize.js` after the canonical app shell finalizes. It loads the calculation engine, material database and workbench sequentially, then registers an **Engineering** navigation item through the canonical shell registry.

Regression files:

- `qa-engineering.js` checks numeric results, domain rejection, cooling-domain validation, suitability failure behavior and the 13-contract registry.
- `qa-material-engineering.js` checks 20/20 legacy-family coverage, ≥24 total families, ≥25 grade records, source presence, deliberate null behavior and selected special data structures such as the Radel drying schedule.
- `.github/workflows/engineering-deep-dive.yml` runs both Node suites and static runtime-integration checks on the branch/PR.

## Production boundary

These values are engineering references and calculation aids, not authority to change a production process. Before production use, verify the exact resin grade/revision, supplier TDS/processing guide, machine OEM limits and calibration, hot-runner/tool documentation, validated process window, local procedures, part specification and applicable safety requirements.
