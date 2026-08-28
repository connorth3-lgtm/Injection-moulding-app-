# MouldMaster Deep Dive v2 — 100-pass execution register

Status date: 2026-08-28

Purpose: execute the user's 100-times deep-dive request as 100 distinct evidence domains. This register separates evidence already seeded by this research cycle from gaps that still need dedicated primary-study saturation.

**Important:** `seeded_with_primary` means at least one primary/experimental evidence anchor was found for the pass. It does not mean the topic is complete. `gap_seeded` means the domain is explicitly opened and anchored, but stronger targeted primary evidence is still required.

- total passes: **100**
- seeded with primary/experimental evidence: **78**
- explicit targeted gaps: **22**

| # | Pass | Theme | Status | Initial evidence anchor(s) |
|---:|---|---|---|---|
| 1 | Non-return valve / check-ring wear | machine | `seeded_with_primary` | 10.1002/pen.26246 |
| 2 | Screw wear condition monitoring | machine | `seeded_with_primary` | 10.1063/5.0028341 |
| 3 | Barrel wear and screw/barrel clearance | machine | `gap_seeded` | 10.1002/pen.26246; 10.1016/j.measurement.2024.114163 |
| 4 | Plasticising torque, drive current and energy | machine | `gap_seeded` | 10.1002/app.57853 |
| 5 | Recovery stability and screw-return repeatability | machine | `seeded_with_primary` | 10.1002/PEN.20335 |
| 6 | Injection-axis command versus actual tracking | machine | `seeded_with_primary` | 10.1002/PEN.760240910 |
| 7 | Nozzle pressure and nozzle-contact evidence | machine | `seeded_with_primary` | 10.3390/polym16081057; 10.3390/s22134792 |
| 8 | Hydraulic thermal state, servo and valve response | machine | `seeded_with_primary` | 10.1002/PEN.760240910; 10.1007/s00170-020-06511-3 |
| 9 | Cold-start, warm-equilibrium and machine fingerprint | machine | `seeded_with_primary` | 10.3390/polym16010054 |
| 10 | Cross-machine transfer and normalization | machine | `seeded_with_primary` | 10.3390/polym16010054; 10.1007/s00170-020-06511-3 |
| 11 | Tie-bar load distribution | clamp_tool | `seeded_with_primary` | 10.1016/J.CIRPJ.2017.03.001 |
| 12 | Platen deflection and parallelism | clamp_tool | `seeded_with_primary` | 10.1016/J.CIRPJ.2017.03.001 |
| 13 | Mould separation under cavity load | clamp_tool | `seeded_with_primary` | 10.1016/J.PRECISIONENG.2017.11.007 |
| 14 | Toggle/direct clamp mechanical error | clamp_tool | `seeded_with_primary` | 10.3390/APP11020832 |
| 15 | Ejector force and pin-load distribution | clamp_tool | `seeded_with_primary` | 10.1002/PEN.11212 |
| 16 | Mould-open force and sticking | clamp_tool | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 17 | Core pin deflection and core shift | clamp_tool | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 18 | Slide and lifter mechanical condition | clamp_tool | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 19 | Demoulding friction and release mechanics | clamp_tool | `seeded_with_primary` | 10.1002/PEN.11212 |
| 20 | Clamp-force optimization and energy | clamp_tool | `seeded_with_primary` | 10.1016/J.PRECISIONENG.2017.11.007 |
| 21 | Cooling flow regime and Reynolds effects | cooling | `seeded_with_primary` | 10.1109/iciibms52876.2021.9651554 |
| 22 | Cooling-circuit pressure drop | cooling | `seeded_with_primary` | 10.1007/S11665-020-05251-5 |
| 23 | Parallel/series circuit balance | cooling | `gap_seeded` | 10.3390/pr12061232 |
| 24 | Scale, fouling and corrosion | cooling | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 25 | Baffles, bubblers and core cooling | cooling | `gap_seeded` | 10.3390/pr12061232 |
| 26 | Conformal cooling performance | cooling | `seeded_with_primary` | 10.3390/pr12061232; 10.1007/978-3-031-38563-6_42 |
| 27 | Additively manufactured cooling insert integrity | cooling | `seeded_with_primary` | 10.1007/S11665-020-05251-5 |
| 28 | Mould thermal maps and warpage | cooling | `seeded_with_primary` | 10.1109/iciibms52876.2021.9651554 |
| 29 | Variotherm / rapid heat-cycle moulding | cooling | `seeded_with_primary` | 10.1063/1.4918483 |
| 30 | High-conductivity inserts and thermal contact | cooling | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 31 | Hot-runner thermal balance | hot_runner | `seeded_with_primary` | 10.1063/1.4942273; 10.3390/polym16081057 |
| 32 | Heater duty and thermocouple faults | hot_runner | `gap_seeded` | 10.1063/1.4942273 |
| 33 | Manifold expansion, leakage and melt stagnation | hot_runner | `seeded_with_primary` | 10.1063/1.4942273 |
| 34 | Valve-gate timing and response | hot_runner | `seeded_with_primary` | 10.1002/APP.22371 |
| 35 | Runner and cavity filling balance | hot_runner | `seeded_with_primary` | 10.4028/WWW.SCIENTIFIC.NET/KEM.364-366.1306; 10.5762/KAIS.2011.12.4.1581 |
| 36 | Gate freeze, vestige and erosion | hot_runner | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 37 | Venting and vacuum assistance | hot_runner | `seeded_with_primary` | 10.1115/1.4032891; 10.1063/1.4918483 |
| 38 | Air traps and burn/dieseling mechanisms | hot_runner | `seeded_with_primary` | 10.1007/s00170-023-11100-1 |
| 39 | Gate/nozzle surface defects | hot_runner | `seeded_with_primary` | 10.1063/1.4942273 |
| 40 | Family and multi-cavity runner systems | hot_runner | `seeded_with_primary` | 10.4028/WWW.SCIENTIFIC.NET/KEM.364-366.1306 |
| 41 | Moisture, drying and reabsorption | materials | `seeded_with_primary` | 10.3390/app12031410; 10.37358/MP.20.1.5311 |
| 42 | Hydrolysis in PET/polyesters | materials | `seeded_with_primary` | 10.1002/PI.813 |
| 43 | Residence time and thermal/oxidative degradation | materials | `seeded_with_primary` | 10.3390/molecules28052344 |
| 44 | Batch-to-batch rheology variation | materials | `seeded_with_primary` | 10.1179/146580100101540662 |
| 45 | Regrind ratio and repeated heat history | materials | `seeded_with_primary` | 10.1007/s10098-024-02818-x; 10.3390/polym14122429 |
| 46 | PCR/PIR feedstock variability | materials | `seeded_with_primary` | 10.1002/pen.26836; 10.1016/j.resconrec.2024.107538 |
| 47 | Recyclate pvT and compressibility | materials | `seeded_with_primary` | 10.1002/app.70411 |
| 48 | Contamination, VOC and odor | materials | `seeded_with_primary` | 10.1007/s10098-024-02818-x |
| 49 | Masterbatch, additive and dosing variation | materials | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 50 | Bulk density, feeding and conveying | materials | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 51 | Crystallisation and semi-crystalline structure | materials | `seeded_with_primary` | 10.1002/PEN.760301606 |
| 52 | High-performance PEEK/PAEK/PPS/LCP | materials | `seeded_with_primary` | 10.1002/PEN.760301606 |
| 53 | Optical PC/PMMA/COC/COP behaviour | materials | `seeded_with_primary` | 10.3390/polym16020168; 10.3390/polym16162318 |
| 54 | Biopolymers and biodegradable resins | materials | `seeded_with_primary` | 10.3390/POLYM13101616 |
| 55 | Electrically/thermally conductive compounds | materials | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 56 | Flame-retardant and functional additives | materials | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 57 | Short-fibre orientation and anisotropy | composites | `seeded_with_primary` | 10.1007/S40684-020-00226-2; 10.1002/PC.24277 |
| 58 | Long-fibre attrition and length distribution | composites | `seeded_with_primary` | 10.3390/POLYM13213846 |
| 59 | Reinforced-material weld-line strength | composites | `seeded_with_primary` | 10.3390/polym17192712; 10.1063/1.4918486 |
| 60 | Organosheet and continuous-fibre hybrid overmoulding | composites | `seeded_with_primary` | 10.3390/POLYM13213846 |
| 61 | Short-shot and incomplete fill mechanisms | defects | `seeded_with_primary` | 10.1007/s00170-023-11100-1; 10.1109/icmeas58693.2023.10379241 |
| 62 | Flash and mould-separation mechanisms | defects | `seeded_with_primary` | 10.1016/J.PRECISIONENG.2017.11.007 |
| 63 | Sink, shrink and internal voids | defects | `seeded_with_primary` | 10.3390/polym16162318 |
| 64 | Burn marks, dieseling and trapped gas | defects | `seeded_with_primary` | 10.1007/s00170-023-11100-1 |
| 65 | Splay families: moisture, decompression, volatiles | defects | `seeded_with_primary` | 10.37358/MP.20.1.5311; 10.1007/s10098-024-02818-x |
| 66 | Jetting, hesitation and flow marks | defects | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 67 | Weld and meld lines | defects | `seeded_with_primary` | 10.1007/s10845-024-02460-w; 10.3390/polym17192712 |
| 68 | Warpage, twist and bow | defects | `seeded_with_primary` | 10.1007/S40684-020-00226-2; 10.1109/iciibms52876.2021.9651554 |
| 69 | Gate, ejection and release damage | defects | `seeded_with_primary` | 10.1002/PEN.11212 |
| 70 | Optical and surface-quality defects | defects | `seeded_with_primary` | 10.3390/polym16020168; 10.3390/polym16162318 |
| 71 | Microfeature and nanofeature replication | special_process | `seeded_with_primary` | 10.1115/1.4032891; 10.1007/S00170-015-7602-4 |
| 72 | Microfluidic and biomedical moulding | special_process | `seeded_with_primary` | 10.1179/0743289811Y.0000000017; 10.1002/adem.202502009 |
| 73 | Ultrasonic micro-injection moulding | special_process | `seeded_with_primary` | 10.1016/j.jmapro.2023.07.068 |
| 74 | Injection-compression moulding | special_process | `seeded_with_primary` | 10.3390/mi13081280 |
| 75 | Gas-assisted injection moulding | special_process | `seeded_with_primary` | 10.1002/PEN.20091 |
| 76 | Water/projectile-assisted moulding | special_process | `gap_seeded` | 10.14314/POLIMERY.2007.088 |
| 77 | Microcellular / MuCell physical foaming | special_process | `seeded_with_primary` | 10.3390/MA14154199 |
| 78 | Gas counter-pressure and core-back foaming | special_process | `seeded_with_primary` | 10.1002/pen.26822; 10.3390/polym14061078 |
| 79 | Chemical foaming | special_process | `gap_seeded` | 10.3390/MA14154209 |
| 80 | Co-injection and sandwich moulding | special_process | `seeded_with_primary` | 10.1002/PEN.23871 |
| 81 | 2K/3K and sequential multi-shot moulding | special_process | `seeded_with_primary` | 10.1115/1.4065847 |
| 82 | Polymer-polymer overmould adhesion | special_process | `seeded_with_primary` | 10.1016/j.prostr.2024.01.043; 10.1002/POLB.21719 |
| 83 | Polymer-metal insert moulding | special_process | `seeded_with_primary` | 10.1051/MFREVIEW/2020004; 10.1002/PEN.10253 |
| 84 | Hybrid composite / organosheet overmoulding | special_process | `seeded_with_primary` | 10.3390/POLYM13213846 |
| 85 | Liquid silicone rubber injection moulding | special_process | `seeded_with_primary` | 10.1002/app.53381; 10.7735/KSMTE.2014.23.2.206 |
| 86 | LSR multi-material and overmoulding | special_process | `seeded_with_primary` | 10.1007/S00170-017-0425-8 |
| 87 | Thermoset and rubber injection moulding | special_process | `seeded_with_primary` | 10.3390/polym14204404; 10.5254/1.3538554 |
| 88 | Powder, metal and ceramic injection fundamentals | special_process | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 89 | Cleanroom and medical injection moulding | special_process | `gap_seeded` | 10.1002/adem.202502009 |
| 90 | In-mould labelling, decoration and electronics | special_process | `gap_seeded` | 10.1016/j.measurement.2024.114163 |
| 91 | Cavity pressure and temperature sensing | sensors_quality | `seeded_with_primary` | 10.3390/s22134792; 10.1007/s00170-023-11100-1 |
| 92 | Ultrasound, dielectric and capacitance sensing | sensors_quality | `seeded_with_primary` | 10.3390/S21155193; 10.1109/tim.2024.3522402 |
| 93 | Strain/tie-bar and indirect cavity-pressure sensing | sensors_quality | `seeded_with_primary` | 10.1016/J.SNA.2018.11.009 |
| 94 | Infrared, vision and advanced metrology | sensors_quality | `seeded_with_primary` | 10.21741/9781644903735-70 |
| 95 | Sensor calibration, drift, timing and synchronisation | sensors_quality | `seeded_with_primary` | 10.1109/sds60720.2024.00027; 10.1109/tim.2024.3522402 |
| 96 | MSA, capability and multivariate SPC | sensors_quality | `seeded_with_primary` | 10.1177/00405175241239345 |
| 97 | Functional time-series and anomaly detection | data_science | `seeded_with_primary` | 10.3390/polym15040978; 10.1109/access.2024.3425582 |
| 98 | ML quality prediction and transfer learning | data_science | `seeded_with_primary` | 10.1007/S00170-020-06511-3; 10.1109/sds60720.2024.00027 |
| 99 | Predictive maintenance and energy signatures | data_science | `seeded_with_primary` | 10.3390/a18080521; 10.1063/5.0028341; 10.1002/app.57853 |
| 100 | Causal inference, digital twins and simulation discrepancy | data_science | `gap_seeded` | 10.1016/j.measurement.2024.114163 |

## Execution rule

Each pass must eventually produce: source identity/version; evidence type; measured signals/outcomes; material/machine/mould context; what mechanism it supports; what it cannot establish; candidate MouldMaster material/defect/signal/tooling/case additions; and any reusable-data/licence boundary.

Passes must not be closed merely because a review paper exists. Mechanism-level closure requires primary measured evidence, and reusable-data closure requires actual file-level profiling and fingerprinting where licences permit.

## Highest-priority gap passes from this cycle

- **Pass 3: Barrel wear and screw/barrel clearance.** Find measured barrel-clearance/wear studies and quality effects.
- **Pass 4: Plasticising torque, drive current and energy.** Use torque/current/electrical signatures to distinguish material load from machine condition.
- **Pass 16: Mould-open force and sticking.** Find measured mould-open/sticking force studies and release signatures.
- **Pass 17: Core pin deflection and core shift.** Add measured local tool deflection/core-shift evidence.
- **Pass 18: Slide and lifter mechanical condition.** Find current/force/wear signatures for slides and lifters.
- **Pass 23: Parallel/series circuit balance.** Build measured circuit-balance cases retaining circuit identity.
- **Pass 24: Scale, fouling and corrosion.** Find measured degradation of heat transfer from fouling/scale/corrosion.
- **Pass 25: Baffles, bubblers and core cooling.** Compare core-cooling architectures using measured thermal outcomes.
- **Pass 30: High-conductivity inserts and thermal contact.** Find measured insert/contact-resistance evidence.
- **Pass 32: Heater duty and thermocouple faults.** Add heater-current/duty and sensor-bias fault signatures.
- **Pass 36: Gate freeze, vestige and erosion.** Find measured gate-freeze/erosion trajectories and pressure response.
- **Pass 49: Masterbatch, additive and dosing variation.** Find gravimetric/volumetric dosing drift studies linked to part outcomes.
- **Pass 50: Bulk density, feeding and conveying.** Add feed-form/bulk-density/conveying evidence to recovery instability diagnosis.
- **Pass 55: Electrically/thermally conductive compounds.** Add filler orientation, conductivity anisotropy and flow/process effects.
- **Pass 56: Flame-retardant and functional additives.** Find measured residence, deposit, degradation and property trade-offs.
- **Pass 66: Jetting, hesitation and flow marks.** Find measured flow-front/thermal evidence for surface-flow defects.
- **Pass 76: Water/projectile-assisted moulding.** Find primary measured penetration/wall-thickness studies for water/projectile assistance.
- **Pass 79: Chemical foaming.** Add chemical blowing-agent decomposition and morphology evidence.
- **Pass 88: Powder, metal and ceramic injection fundamentals.** Add feedstock, debinding/sintering and moulding-stage defect evidence.
- **Pass 89: Cleanroom and medical injection moulding.** Add contamination, traceability, validation and precision evidence.
- **Pass 90: In-mould labelling, decoration and electronics.** Add insert/film placement, interface and functional quality measurements.
- **Pass 100: Causal inference, digital twins and simulation discrepancy.** Model evidence limits, interventions, uncertainty and simulation-to-machine discrepancy.
