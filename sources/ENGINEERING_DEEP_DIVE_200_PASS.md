# Engineering Deep Dive — 200-Case Stress Pass

Status: 2026-09-02
Branch: `deep-dive/calculation-material-engineering`

## Purpose

This pass attacks boundary semantics rather than repeating a small set of known-answer examples. The calculation engine is exercised with deterministic pseudo-random engineering scenarios and adversarial cases so failures are reproducible from fixed seeds.

## Calculation findings hardened

1. **Zero feasible cavities must be a failure.** A mathematically valid cavity-count floor of zero cannot be presented as a passing machine/cavity result.
2. **Cavity-count confidence requires constraint coverage.** Verified cavity-count status requires shot, clamp, mould-fit and at least one flow/plasticising constraint.
3. **Cavity pressure must be domain-qualified.** Bare numeric pressure is rejected for clamp/cavity calculations; hydraulic and specific-plastic pressure are never silently interpreted as cavity pressure.
4. **Pressure conversion validates source domain.** A value tagged as one pressure domain cannot be declared as another `fromDomain` without rejection.
5. **Calibration outranks geometric pressure ratio.** If a calibration factor is supplied and differs materially from the geometric intensification ratio, the calibrated factor is used and a warning is emitted.
6. **Invalid numerics cannot silently become zero.** Hot-runner inventory and reserve factors reject non-finite values.
7. **Suitability checks fail closed.** Unknown check states are rejected and a suitability set with no critical checks returns insufficient data.
8. **Near-limit checks have bounded semantics.** Direction, evidence confidence and near-limit fractions are validated, and zero-capacity utilisation does not become `NaN`.

## Material coverage

The material system is now split into three evidence layers:

- Base grade-level database.
- Deep specialty extension.
- Common-material catalog extension.

Combined coverage is **50 material families and 51 representative supplier/grade records**.

The common selector exposes **50 day-to-day material choices**, including commodity polymers, engineering plastics, common blends, reinforced variants and elastomer classes. A separate **14-item specialty selector** covers PPS, PEEK, PPA, PEI, PPSU, PSU, PESU, LCP, PVDF, PAI, PAEK, PEKK, PARA and COC.

### New common-family anchors

The 50-family expansion adds MDPE, LLDPE, EVA, POE, TPO, TPV, TPC-ET, PEBA, ionomer, PLA, PA11, PA12, PVC, CPVC, PC/PBT, PC/PET and PPE/PS. Representative sources include Chevron Phillips Chemical Marlex MDPE, Dow DOWLEX/ENGAGE/SURLYN, LyondellBasell Hifax TPO, ExxonMobil Santoprene/EVA, Celanese Hytrel, Arkema Pebax/Rilsan, NatureWorks Ingeo, EMS-GRIVORY PA12, Teknor Apex PVC, Lubrizol Corzan CPVC, Covestro Makroblend and SABIC NORYL.

### Evidence discipline

- Exact-grade primary supplier data outrank family-level guides.
- Family-guide values remain labelled guide-level evidence.
- Missing exact-grade values remain null rather than being borrowed from another material.
- Formulation-class selector names such as PP-GF, ABS-FR, TPU-ether or flexible PVC are navigation choices, not production setpoints.
- Specialty and common records use the same provenance/audit rules.

## QA

- `qa-engineering.js`
- `qa-engineering-stress-200.js`
- `qa-material-engineering.js`
- `qa-material-engineering-deep-200.js`
- `qa-material-common-catalog-200.js`
- `Engineering deep dive QA` GitHub Action

The common-catalog QA enforces exactly 50 material families, 51 representative records, 50 common selections and 14 specialty selections, then samples the combined selector/provenance graph deterministically.

## Production boundary

This work improves engineering coverage and evidence discipline. It does **not** convert supplier starting guidance into a validated production process. Production still requires the current exact grade/revision, actual machine OEM limits and calibration, mould/hot-runner documentation, material handling controls, validated process window, site procedures and applicable safety requirements.