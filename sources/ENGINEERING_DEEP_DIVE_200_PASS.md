# Engineering Deep Dive — 200-Case Stress Pass

Status: 2026-09-02
Branch: `deep-dive/calculation-material-engineering`

## Purpose

This pass deliberately attacks boundary semantics rather than repeating a small set of known-answer examples. The calculation engine is exercised with 200 deterministic pseudo-random engineering scenarios and adversarial cases so every failure is reproducible from a fixed seed.

## Calculation findings hardened

1. **Zero feasible cavities must be a failure.** A mathematically valid cavity-count floor of zero cannot be presented as a passing machine/cavity result.
2. **Cavity-count confidence requires constraint coverage.** Three arbitrary limits are not enough for `PASS_VERIFIED`; verified cavity-count status requires shot, clamp, mould-fit and at least one flow/plasticising constraint.
3. **Pressure domains are not interchangeable.** Cavity-pressure inputs used for clamp/cavity calculations are domain-checked; hydraulic and specific-plastic conversions remain isolated from cavity pressure.
4. **Pressure conversion validates source domain.** A value tagged as one pressure domain cannot be declared as another `fromDomain` without rejection.
5. **Calibration outranks geometric pressure ratio.** If a calibration factor is supplied and differs materially from the geometric intensification ratio, the calibrated factor is used and a warning is emitted.
6. **Invalid numerics cannot silently become zero.** Hot-runner inventory and reserve factors reject non-finite values rather than being coerced into harmless-looking numbers.
7. **Suitability checks validate status vocabulary.** Unknown check states are rejected rather than silently contributing to a pass.
8. **Near-limit checks have bounded semantics.** Direction, evidence confidence and near-limit fractions are validated, and zero-capacity utilisation no longer becomes `NaN`.

The deterministic calculation stress suite is `qa-engineering-stress-200.js`.

## Material coverage expansion

The deep extension adds nine injection-moulding material families while preserving the policy that missing exact-grade values remain null.

| Family | Grade / supplier anchor | Evidence retained |
|---|---|---|
| PVDF | Arkema Kynar 720 | Primary product identity, 1.78 g/cm³, primary processing-guide barrel zones and directional shrinkage. The current Arkema HTML renders the terminal 50–90 °C injection-table column as `DIE`; the database deliberately does not rename it to mould temperature without stronger evidence. |
| PSU | Syensqo Udel P-1700 WH 7407 | Primary grade identity plus supplier-family guidance: injection moisture <500 ppm (0.05%), 135 °C / 4 h drying, and minimum 140–150 °C tool-surface guidance. Hot runners are generally not recommended except under specific supplier conditions. |
| PESU | Syensqo Veradel HC A-301 | Primary identity and injection-moulding suitability; numeric production setpoints remain null. |
| PAI | Syensqo Torlon 4203 L HF | Primary identity and injection-moulding suitability; supplier FAQ requirement for post-cure and special screw/check-ring guidance retained as process flags, not invented temperatures. |
| PAEK | Syensqo AvaSpire AV-651 NT | Primary identity and conventional injection-moulding suitability; numeric setpoints remain null. |
| PEKK | Arkema Kepstan 8010C30 | Primary exact-grade identity, CF30, density 1.39 g/cm³ and injection-moulding suitability; numeric setpoints remain null. |
| COC | TOPAS 6013S-04 | Primary supplier performance note explicitly identifies 6013S-04 as an injection-moulding grade; numeric setpoints remain null. |
| Copolyester | Eastman Tritan TX1001 | Primary exact-product identity and mouldability; Eastman links processing/mould-design resources, but numbers remain null until current guidance is captured and bounded. |
| PARA | Syensqo Ixef GS-1022 WH01 | Primary exact-grade identity, 50% glass fibre and injection-moulding process; numeric setpoints remain null. |

## Primary web anchors retained in the executable extension

- Arkema Kynar 720 product page and Kynar PVDF processing guidelines.
- Syensqo Udel PSU FAQ and Udel P-1700 WH 7407 product page.
- Syensqo Veradel HC A-301 PESU page.
- Syensqo Torlon 4203 L HF page and Torlon PAI FAQ.
- Syensqo AvaSpire AV-651 NT page.
- Arkema Kepstan 8010C30 page and PEKK injection-moulding guide.
- TOPAS 6013S-04 performance note.
- Eastman Tritan TX1001 product page.
- Syensqo Ixef GS-1022 WH01 page.

## New audit policy

`material-engineering-deep-extension.js` adds a `deepAudit()` routine that checks duplicate family/grade IDs, family referential integrity, HTTPS source URLs, known evidence levels, process/range ordering, optimal-within-range rules, and discrete drying schedule validity. The 200-case material QA randomly samples the combined database with a fixed seed and re-checks provenance/range invariants.

## Production boundary

This work improves evidence discipline and rejects more false-positive calculations. It does **not** turn supplier starting guidance into a validated process. Production still requires the current exact-grade documentation/revision, actual machine OEM limits and calibration, mould/hot-runner documentation, material handling controls, validated process window, site procedures, and applicable safety requirements.
