# MouldMaster accepted sensor and machine-health registry

Status: first evidence-reviewed accepted tranche  
Reviewed: 2026-08-29

## Purpose

`data/sensor-machine-health-registry-v1.json` is the first normalized accepted registry for MouldMaster sensor, signal-integrity and machine-health concepts. It converts a small subset of the 220 draft concepts into counted educational/diagnostic knowledge only where the measurement meaning, location/domain, source units or feature semantics, confounders and measured provenance are explicit.

The accepted count is **26 / 200 minimum**. The remaining drafts are still non-counting.

## Accepted concept mix

- **20 direct measurements**
- **3 derived features**
- **2 bounded diagnostic interpretations**
- **1 measurement-integrity concept**

The registry is intentionally conservative. A sensor channel is not accepted just because it appears in a CSV, article or machine export. Its physical meaning and provenance must be reviewable, and unresolved source scaling stays unresolved instead of being silently normalized.

## Main measured evidence lanes

The first tranche is anchored in already accepted MouldMaster measured evidence:

- OpenMMS-T4G: mould-plate temperature, direct cavity pressure, extraction-pin force, extraction-plate accelerometer/gyroscope and separate acquisition clocks;
- SKZ LoKI: two direct high-frequency nozzle/viscometer pressure sensors plus the explicitly derived pressure-difference feature;
- scatimdata: high-resolution injection-pressure and injection-flow curves linked to physical part quality;
- iGuzzini: real-production screw position, screw torque, clamp force and back-pressure fields with documented units;
- FORinFPRO-HIMD: source-scaled ultrasound RMS features;
- Zenodo plant-energy dataset `10.5281/zenodo.20338544`: per-phase active power, apparent power, current, voltage and frequency;
- counted primary measured studies: cavity-pressure spatial interpretation, tie-bar strain external sensing, pressure/part-weight relationships and quantitative ejection-force evidence.

## Machine-health concepts now represented

The accepted tranche introduces real machine/tool-health learning around:

- extraction-force changes during a controlled extraction-system fault;
- local cavity-pressure differences as evidence that can point toward filling/tool-condition issues when sensor position and mould context are preserved;
- screw-torque and back-pressure load indicators, with material/rheology/process confounders retained;
- clamp-force and externally measured tie-bar-strain load signals;
- extraction-plate inertial measurements with raw scale/orientation caveats;
- electrical load/supply signals tied to a known plant measurement boundary;
- quantitative ejection-force dependence on tool surface condition, while keeping the reported surface roughness/coating results study-specific.

These are educational diagnostic concepts, not automatic fault classifiers.

## Hard interpretation boundaries

- **Signal evidence is not root-cause proof.** Similar signal changes can arise from different material, tool, machine or measurement causes.
- **Location matters.** A cavity sensor, nozzle sensor, tie-bar gauge, ejector-pin load cell and electrical meter measure different physical domains.
- **Direct and derived stay separate.** A pressure difference, RMS value, peak or curve descriptor is not counted as a new raw sensor channel.
- **Units and source scaling are preserved.** OpenMMS inertial scale ambiguity is retained; FORinFPRO ultrasound remains source-scaled where the public header does not establish a normalized engineering unit.
- **Cross-machine thresholds are not allowed.** Numerical values from one press, mould, resin or sensor installation do not become universal MouldMaster limits.
- **Timing integrity matters.** Separate acquisition clocks are not merged without explicit synchronization evidence.

## QA and compilation

`qa_sensor_machine_health.py` fails if:

- the accepted registry and hard target disagree;
- concept IDs are duplicated;
- required measurement-domain, units/feature semantics, confounders or bounded interpretation are missing;
- a referenced measured dataset profile does not exist;
- a referenced primary-measured DOI is absent from the canonical primary evidence registry;
- direct/derived/diagnostic/integrity category totals drift.

The registry is also embedded in `tools/compile_master_data.py`, and `qa_master_data_compile.py` verifies that the compiled master package contains the exact same accepted sensor concept IDs.

## Next promotion direction

The next sensor/health pass should prioritize independent measured evidence for screw/barrel wear, mould wear/alignment, cooling-circuit fouling, dryer/dew-point degradation, valve/hot-runner actuation health, hydraulic/servo condition and calibrated acoustic/ultrasound/dielectric interpretations. Draft concepts remain drafts until those evidence and semantics requirements are met.
