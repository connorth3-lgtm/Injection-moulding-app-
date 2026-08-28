# MouldMaster — 50-pass real measured-evidence deep dive

Reviewed: 2026-08-27

This audit adds **50 independent measured-evidence passes** arranged as **10 themes × 5 passes**. The machine-readable registry is `data/measured-evidence-50-pass.json`.

The purpose is not to add another synthetic case pack. It is to strengthen the evidence underneath MouldMaster by identifying real measured machine, mould, material, sensor, quality, geometry, energy and maintenance evidence that can support future learning cases and benchmark work.

## Boundary

- A peer-reviewed experiment is recorded as a **primary measured study**, not as a reusable raw dataset unless publisher files are actually available.
- An open repository is recorded as an **open measured dataset** only when the repository exposes measured-data files/metadata for reuse.
- An embargoed repository remains **embargoed measured dataset**. Metadata can guide future work, but MouldMaster must not claim it has run or validated those raw rows.
- Measured associations do not automatically prove root cause.
- No source-specific numeric setting is promoted to a universal process setpoint, maintenance threshold, acceptance limit or production recipe.
- The existing 264-case / 19,008-cycle corpus remains explicitly synthetic and separate.

## Open measured datasets

The first five passes prioritize raw-data sources that can support real benchmark execution:

1. Industrial injection/blow process-quality dataset — Mendeley Data `10.17632/gtnb4j7bfx.1`.
2. SKZ Injection Molding Dataset — time-resolved viscometer pressure, Euromap77/machine data and quality table.
3. RWTH post-consumer-recycled material process data — screw-antechamber pressure, cavity pressure, controller output, screw velocity/volume and part-mass control.
4. FORinFPRO-HIMD — synchronized machine, pressure/temperature, ultrasound and dielectric measurements for hybrid injection moulding.
5. Cross-process-chain injection-moulding/screw-driving dataset — upstream process and time-series data linked to downstream assembly evidence.

These five sources give MouldMaster a practical path from metadata-only research into actual file-level profiling, fingerprinting, missingness checks, grouping checks and measured process-quality analysis.

## Embargoed measured datasets

Two 2026 Zenodo records are deliberately retained as future targets rather than falsely treated as available raw data. Their metadata currently indicate an embargo through **31 December 2027**; access must be rechecked at execution time rather than inferred from licence metadata alone:

- Pass 45: image/segmentation/quantified multi-defect dataset — raw files not currently available for execution.
- Pass 50: polypropylene process/weight/energy/cycle-time dataset — raw files not currently available for execution.

The atlas records their provenance and expected signal structure but blocks any claim that MouldMaster has executed a raw-data benchmark on them.

## The 10 themes

### 1. Public datasets and machine traces — passes 1–5

Focus: reusable real records, time-series structure, repeated-cycle evidence, material identity, cross-process linkage, and file-level provenance.

### 2. Quality-linked pressure traces — passes 6–10

Focus: high-resolution injection pressure/flow, cavity-pressure failure signatures, pressure-time area, hold-state dependence and controlled factor studies tied to measured mass/dimensions/defects.

### 3. Machine, nozzle and tie-bar actuals — passes 11–15

Focus: barrel/nozzle/cavity pressure chains, viscosity indices, tie-bar strain/clamping response, transfer behavior, and the difference between screen settings and delivered physical process response.

### 4. Sensor fusion and new sensing — passes 16–20

Focus: multi-cavity sensing, capacitance-pressure-temperature probes, shrinkage/leakage sensing, cross-machine/material anomaly transfer, and indirect ultrasonic tie-bar pressure measurement.

### 5. Statistical and ML quality inference — passes 21–25

Focus: measured pressure features, uncertainty regions, interpretable pressure-profile models, learned curve representations and separation of quality prediction from causal diagnosis.

### 6. Thermal, cooling and warpage — passes 26–30

Focus: local mould temperature, thermal imbalance, measured warpage, cavity-temperature transfer, pressure-temperature flow-path measurements and physical verification against simulation.

### 7. Micro replication, venting and flow — passes 31–35

Focus: sensor location, variotherm/vacuum evidence, cavity thickness, micro-feature replication and cavity gas/air boundary conditions.

### 8. Material batch, recycled and fibre effects — passes 36–40

Focus: batch-to-batch rheology, regrind/material identity, operating-condition drift, fibre orientation, anisotropic warpage and grade/reinforcement effects on weld-line behavior.

### 9. Defects, mechanical performance and inspection — passes 41–45

Focus: measured weld-line geometry, local thermal intervention, obstacle/geometry effects, micro-weld behavior and future quantified vision-defect benchmarking.

### 10. Energy, maintenance and industrial drift — passes 46–50

Focus: per-cycle energy profiles, machine/resource effects, measured electricity consumption, predictive-maintenance vibration/electrical evidence and future joint weight-energy-cycle benchmarking.

## What the 50 passes say collectively

The measured literature repeatedly supports several evidence-design principles already used by MouldMaster:

1. **Full time-series matter.** Injection pressure/flow and cavity-pressure histories often contain information that scalar maxima hide.
2. **Sensor location matters.** Barrel, nozzle, runner, cavity, tie-bar and local temperature sensors do not measure interchangeable things.
3. **Cavity identity matters.** Multicavity averaging can hide local imbalance.
4. **Material identity matters.** Batch, MFR/rheology, recycled content and reinforcement change interpretation of the same nominal machine settings.
5. **Quality needs a physical outcome.** Part mass, dimensions, replication, warpage, mechanical properties, quantified defects or downstream assembly evidence are needed to anchor process signals.
6. **Prediction is not diagnosis.** A strong ML model can identify quality risk without proving which physical mechanism caused it.
7. **Interventions need before/after confirmation.** Temperature-control, transfer/control and maintenance studies are strongest when measured process signals and quality recover together.
8. **Energy is its own evidence family.** Energy drift can indicate machine/resource inefficiency without necessarily being a moulding-quality defect.
9. **Indirect sensors require calibration.** Tie-bar strain/ultrasound and learned sensor features are useful only with traceable reference measurements and context.
10. **Exact numeric outcomes are local.** Published values demonstrate relationships and methods; they are not universal production settings.

## What this changes in MouldMaster

The 50-pass registry becomes the evidence-selection layer for the next data work. New measured-data learning cases should prefer one of these evidence patterns and record:

- source and version;
- raw-file fingerprint when a dataset is actually used;
- machine/tool/material context;
- commanded versus measured/actual fields;
- sampling rate or cycle granularity;
- cavity/part identity;
- quality outcome and measurement method;
- missing-value behavior;
- intervention timing where available;
- whether the evidence is observational, controlled experimental, or closed-loop intervention data;
- what the evidence can and cannot establish.

This is stronger than simply adding more synthetic cases because it creates a path to validate existing educational mechanisms against measured evidence.

## What still needs real publisher files

The registry itself does **not** claim that all 50 source datasets have been downloaded. The next executable measured-data work is:

1. Run the existing publisher-file profiler against the open Mendeley industrial dataset and record its SHA-256 fingerprint.
2. Add file adapters for the SKZ B2SHARE dataset, RWTH PCR archive, FORinFPRO-HIMD and the cross-process-chain archive.
3. Produce one non-raw benchmark report per dataset: schema, row/cycle counts, missingness, grouping keys, time-series resolution, quality labels/outcomes and safe candidate relationships.
4. Never commit proprietary/site raw rows or third-party datasets into this repository unless licence and governance explicitly permit redistribution.
5. Keep the authorised real site pilot (#50) separate from public benchmark work (#53).

## Evidence-quality rule for future additions

A future source should not enter this registry merely because it mentions injection moulding. It should include actual experimental/manufacturing measurements relevant to process state, material state, tool condition, part quality, energy or maintenance. Reviews remain useful for discovery, but primary measured evidence is preferred for mechanism-level claims.
