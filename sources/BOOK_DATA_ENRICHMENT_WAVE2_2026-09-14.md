# MouldMaster Book — Data Enrichment Waves 2–3

Date: 2026-09-14

This research stream broadens the Book beyond general mechanism explanation by adding candidates for measured examples, worked calculations, plots, tables, case studies and supplier-document reading exercises. It is research metadata only. It does not change the Book runtime, web release, physical-device candidate or publication authorization.

## Baseline already present

MouldMaster already has a substantial measured-data/evidence base. The repository documents 25 measured dataset families and a human-readable primary measured evidence ledger recording 70 unique peer-reviewed measured studies. These enrichment waves are not intended to inflate those counts. They are an editorial acquisition and integration map.

Wave 1 is novelty-audited separately. It contains 16 integration candidates: 9 were new repository discoveries and 7 were already-known evidence selected for Book reuse.

Wave 2 adds 25 integration candidates across defects, energy, materials, cooling, weld lines, rheology, ejection, recyclate variability, fibre orientation and supplier-grade guidance. Wave 3 adds a measured sink/venting experiment, an industrial black-speck fault-to-recovery case, and current exact supplier references for LCP, TPU, copolyester and PPS.

## Highest-value measured additions

- **75-run physical HDPE DOE** — complete physical table across seven process inputs and four outputs. Best worked DOE/process-window example.
- **420-part recycled-PP warpage/sensor study** — measured warpage, mass, in-mould temperature profiles, MFI/DSC/FTIR and controlled cooling/injection-temperature variation.
- **1,284 real industrial production cycles with 22 defect labels** — bounded production-data example across burn/gas mark, short shot, sink and flash, useful for class imbalance and prediction-versus-causation.
- **active vacuum venting experiment** — connects venting, productivity and energy using physical trials.
- **external-gas sink/venting experiment** — measured sink depth and visible streak response under controlled gas timing/pressure; useful precisely because its optimum is non-transferable.
- **black-speck fault investigation** — inspection found degraded polymer in stagnant screw/NRV regions; corrective hardware change was followed by production monitoring. This is valuable fault → intervention → follow-up evidence, though not an open raw time-series dataset.
- **industrial/module-level energy studies** — broaden the energy boundary beyond machine cycle time to drives, heaters, temperature-control units, cooling and peripherals.
- **transparent-PC weld-line/dimensional DOE**, **PA-GF weld-line strength**, **GF composite weld-line mechanical validation**, and **micro-injection weld-line work** — enable a proper material/scale evidence matrix rather than one generic weld-line rule.
- **new thermoplastic rheology-characterisation procedure** — practical experimental bridge between MFI, fitted rheology and injection response.
- **TPMS conformal cooling**, **threaded cooling-channel thermal trials**, **cooling/warpage metrology**, and **dynamic rapid-heat-cycle moulding** — create a multi-source cooling chapter.
- **measured ejection-force DOE** — draft angle, roughness, mould temperature, holding pressure and polymer identity measured with a force sensor; excellent for teaching interactions.
- **time-dependent PP shrinkage/conditioning** — directly supports the point that immediate post-mould dimensions are not necessarily final dimensions.
- **XCT fibre-orientation study** and **recycled GF-PP processing-history trials** — physical orientation/fibre-length/property evidence for reinforced-material chapters.

## Supplier-data coverage

Current supplier targets now cover a broader material range:

- BASF **Ultramid A3WG5** — PA66-GF25 grade-level moisture, drying, residence, screw-speed and directional-shrinkage fields.
- Asahi Kasei **LEONA PA** — moisture/water absorption, moulding, mould design and troubleshooting.
- Syensqo **KetaSpire PEEK** — high-temperature machine capability, moisture/drying, thermal stability, shutdown/purge.
- Syensqo **Udel PSU / Radel PPSU / Veradel PESU** — high-temperature amorphous processing/design.
- Celanese **Vectra LCP** — machine requirements, hot runners, high-flow/thin-wall behaviour and troubleshooting.
- Celanese **Fortron PPS** — current high-temperature/reinforced/low-warpage family reference.
- Lubrizol **TPU/ETP processing guide** — equipment, mould design, start-up and troubleshooting across TPU/ETP families.
- Eastman **Tritan copolyester** — processing, drying and mould-design guidance.
- Existing Book sources continue to cover BASF Ultradur PBT, Ultramid PA and Ultrason high-temperature polymers.

These references should appear as **source-reading exercises**, not copied recipe tables. The learner should identify material/grade, decide what is generic versus supplier-specific, and state which current document controls the production decision.

## 46-chapter coverage audit

`data/research-expansion/2026-09-14/book-chapter-quantitative-coverage-v1.json` maps every canonical Book chapter to concrete evidence routes.

Current classification:

- 32 chapters — strong measured route
- 10 chapters — strong mixed measured/supplier/standard route
- 3 chapters — strong authoritative route where standards or supplier documentation are intentionally more appropriate than additional raw data
- 1 chapter — targeted remaining raw-data gap: `black-specks`

The black-speck chapter now has a credible published fault/intervention/follow-up case as well as degradation and machine-health evidence. The remaining gap is narrower: a lawful public **raw cycle/trace dataset with contamination onset, intervention and recovery** would materially improve reproducible teaching.

## Recommended Book artifacts

### 1. Worked DOE spread
Use the 75-run physical HDPE table as the main worked example, then contrast it with the 420-part recycled-PP warpage experiment. Teach design, interaction, response surfaces and trade-offs—not a universal optimum.

### 2. Real defect-data spread
Use aggregate information from the 1,284-cycle industrial dataset to teach rare-class imbalance and association-versus-causation. Pair with mechanism-specific measured cases for short shot, burns, flash, sink/void and black specks.

### 3. Cooling evidence ladder
Progress from coolant/mould thermal design to measured surface temperature, part temperature, dimensions, warpage and weld-line strength. Make the point that a temperature-controller setpoint is not the whole mould thermal state.

### 4. Ejection interaction example
Plot material × draft × roughness × thermal-condition interaction. The lesson is that interactions matter; one setting does not produce the same effect across polymers.

### 5. Weld-line evidence matrix
Compare transparent PC, PA-GF, other GF composites and micro-injection. Include material, geometry/scale, measured output, process variables and what cannot be transferred.

### 6. Energy accounting example
Separate drive, heater, TCU, cooling and peripheral energy boundaries. Require the learner to define the measurement boundary before comparing 'energy efficiency'.

### 7. Supplier-document exercises
Use PA66-GF, PEEK, PSU/PPSU/PESU, LCP, PPS, TPU and copolyester examples. Grade/family numbers remain case/source data, never generic Book defaults.

### 8. Fault → intervention → recovery cases
Use scientific-moulding transfer, black-speck investigation, cavity-pressure failure diagnosis and controlled venting cases to teach evidence updates over time rather than symptom → guaranteed fix.

## Acquisition order

The machine-readable queue is `data/research-expansion/2026-09-14/book-data-acquisition-queue-v1.json`.

1. Extract article tables only where licence permits, preserving material/machine/mould/sample context.
2. Prefer public raw datasets with stable identifiers/checksums where available.
3. For article-only sources, create original derived summaries/plots when permitted; otherwise cite and describe without reproducing protected material.
4. Keep physical measurement, simulation, model prediction and supplier recommendation as distinct evidence classes.
5. Preserve units and sample units. A part, batch, cycle and time sample are not interchangeable counts.
6. Do not count embargoed data as usable. The large 2026 defect-image/process datasets remain held until their access state changes.

## Release boundary

None of this research changes the currently released Book. When selected examples are added to learner-visible Book content, governed learner-runtime bytes will change, a new `web_release` will be required, and a new exact physical-device candidate will be created. Until then, PR #332 remains the human-voice Book candidate and this research PR remains metadata-only.
