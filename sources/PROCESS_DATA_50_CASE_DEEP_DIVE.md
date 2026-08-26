# MouldMaster Process-Data Deep Dive — 50 Additional Cases

Reviewed: 2026-08-26  
Scope: educational process-data reasoning only

## Result

This pass adds **50 additional deterministic synthetic process-data cases** to the existing 14 guided cases.

- 50 new cases
- 10 machine cases
- 10 tooling cases
- 10 material cases
- 10 scientific-moulding cases
- 10 quality/sensor cases
- 4 linked signals per new case
- 24 baseline + 24 fault + 24 recovery cycles per case
- **3,600 new synthetic cycles**
- existing guided 14-case learning flow remains unchanged

The numerical magnitudes are deliberately synthetic. Literature and existing MouldMaster sources support the *types of signals, mechanisms and evidence relationships* represented here; they do not make these synthetic values universal process specifications, alarm limits, acceptance criteria or maintenance thresholds.

## Why these data were added

A setting-only troubleshooting model is weak because the screen recipe does not prove what the machine, material or mould physically experienced. The added cases deliberately compare multiple evidence layers:

1. commanded machine value versus actual response;
2. melt-delivery and cavity evidence;
3. material condition and handling evidence;
4. tooling/cooling/ejection evidence;
5. part-quality and measurement-system evidence;
6. recovery evidence after the suspected mechanism is removed.

This makes the learning sequence evidence-first: **pattern → mechanism → next measurement → recovery verification**.

## Machine — 10 cases

| ID | Main learning gap |
|---|---|
| `servo-velocity-tracking` | Commanded versus actual injection motion |
| `injection-pressure-sensor-offset` | Machine pressure reading versus independent cavity/part evidence |
| `hydraulic-oil-temperature-drift` | Machine thermal state affecting actual response |
| `actual-backpressure-drift` | Plasticising command versus actual back-pressure response |
| `screw-position-transducer-drift` | Position-reference drift versus independent shot evidence |
| `nozzle-contact-leakage` | Material loss at the nozzle/mould interface |
| `nozzle-tip-thermal-loss` | Displayed temperature versus true local nozzle thermal state |
| `feed-throat-bridging` | Pellet feed disturbance before injection |
| `tiebar-load-imbalance` | Total clamp force versus load distribution/tool separation |
| `drive-current-friction` | Electrical/mechanical condition trend without a moulding-quality recipe change |

## Tooling — 10 cases

| ID | Main learning gap |
|---|---|
| `vent-blockage-burn` | End-of-fill resistance plus burn/gas evidence |
| `gate-wear-balance` | Local gate geometry changing cavity balance |
| `multicavity-runner-imbalance` | Preserve cavity identity instead of relying on a pooled average |
| `tcu-flow-loss` | Cooling-flow loss and thermal quality response |
| `hotrunner-thermocouple-bias` | Hot-runner displayed temperature versus independent thermal evidence |
| `cavity-sensor-preload` | Pressure-sensor zero/preload shift |
| `ejector-pin-binding` | Mechanical ejection load versus cooling-driven release |
| `core-pin-deflection` | Cavity load causing local tool/geometry movement |
| `mold-open-sticking` | Release/opening force as tooling evidence |
| `cooling-scale-resistance` | Heat-transfer degradation not explained by flow alone |

## Material — 10 cases

| ID | Main learning gap |
|---|---|
| `pa66-moisture-reabsorption` | Moisture pickup after drying |
| `pet-hydrolysis` | Easier flow can accompany damaging molecular-weight loss |
| `abs-residence-thermal-history` | Residence/thermal history and degradation evidence |
| `pom-contamination-degradation` | Safe escalation for possible acetal contamination/degradation |
| `masterbatch-dose-drift` | Additive/colourant dosing as a process input |
| `glass-fiber-lot-orientation` | Reinforcement orientation and anisotropic response |
| `regrind-ratio-drift` | Regrind fraction changing rheology/properties |
| `bulk-density-feed-variation` | Feedstock form/density changing screw charging |
| `dryer-dewpoint-breakthrough` | Dryer capability before visible moulding symptoms |
| `conveying-air-leak` | Post-dryer moisture pickup during transfer |

## Scientific moulding — 10 cases

| ID | Main learning gap |
|---|---|
| `fill-speed-viscosity-curve` | Controlled fill-speed/shear-thinning study |
| `pressure-loss-chain` | Separate nozzle/runner/cavity pressure losses |
| `transfer-position-study` | Velocity-to-pressure handoff evidence |
| `cushion-repeatability` | Variation can matter more than the mean cushion |
| `actual-melt-vs-setpoint` | Measured melt thermal state versus barrel setpoints |
| `mold-surface-balance` | Thermal asymmetry between mould halves |
| `packing-pressure-ladder` | Bounded packing-response study rather than blind pressure increase |
| `cooling-time-plateau` | Thermal-quality/cycle-time trade-off |
| `decompression-air-ingress` | Gas-like symptoms require evidence beyond assuming moisture |
| `recovery-overlap-margin` | Plasticising capacity versus available cooling window |

## Quality / sensor — 10 cases

| ID | Main learning gap |
|---|---|
| `gage-rr-operator-shift` | Measurement-system variation versus process variation |
| `autocorrelation-control-chart` | Time correlation can create misleading chart alarms |
| `cavity-capability-split` | Capability must retain cavity identity |
| `generic-sensor-zero-drift` | Sensor calibration/zero drift versus real process movement |
| `ultrasound-solidification` | Non-invasive solidification sensing as a validated proxy candidate |
| `mold-strain-pressure-proxy` | Mould strain as an indirect pressure/load measurement |
| `vision-surface-defect` | Vision output must be checked against physical process evidence |
| `specific-energy-idle-loss` | Energy loss can be operational rather than a recipe defect |
| `recycled-blend-ratio` | Recycled-content fraction as controlled material data |
| `predictive-maintenance-vibration` | Vibration/current trends as maintenance evidence rather than settings to mask |

## Additional peer-reviewed evidence added in this pass

- Ageyeva, Horváth & Kovács (2019), *In-Mold Sensors for Injection Molding: On the Way to Industry 4.0*, Sensors 19(16), 3551. DOI: https://doi.org/10.3390/s19163551
- Zhao et al. (2024), *Measurement techniques in injection molding: A comprehensive review of machine status detection, molten resin flow state characterization, and component quality adjustment*, Measurement 226, 114163. DOI: https://doi.org/10.1016/j.measurement.2024.114163
- Shin et al. (2025), *Recent developments of in-situ process and in-line quality monitoring in injection molding using intelligent sensors*, Sensors and Actuators A: Physical 383, 116248. DOI: https://doi.org/10.1016/j.sna.2025.116248
- Ke, Wang & Nian (2024), *Data-driven quality prediction in injection molding: An autoencoder and machine learning approach*, Polymer Engineering & Science 64(9), 4520–4538. DOI: https://doi.org/10.1002/pen.26866
- Rebelo et al. (2026), *Condition maintenance and prediction system in an injection molding machine: a case study*, Journal of Quality in Maintenance Engineering 32(1), 234–268. DOI: https://doi.org/10.1108/JQME-05-2025-0050
- Kariminejad et al. (2021), *Ultrasound Sensors for Process Monitoring in Injection Moulding*, Sensors 21(15), 5193. DOI: https://doi.org/10.3390/s21155193

## Data-quality controls introduced

The dedicated `qa_process_data_deep_dive_50.py` gate fails if:

- there are not exactly 50 additional cases;
- a domain does not contain exactly 10 cases;
- any case ID is duplicated;
- any case has other than four linked signals;
- a case has fewer than two evidence-source IDs;
- fewer than two signals change during the fault phase;
- any recovery target does not return to the defined baseline;
- any case does not generate exactly 24 baseline, 24 fault and 24 recovery rows;
- formal assessment/certificate truth is mutated;
- network upload/control paths are added;
- browser, PWA or desktop packaging omits the data pack;
- unsafe POM degradation wording replaces the supplier/site-approved response boundary.

The real mobile-browser suite also opens the advanced library, verifies 50 cards, filters one domain to 10 cases, opens a dataset and checks the four-signal baseline/fault/recovery view.

## Important boundary

These cases are designed to teach *what evidence to gather and how signals can relate*. They are not a source of universal temperatures, pressures, velocities, clamp forces, moisture limits, dimensional specifications, maintenance alarm thresholds or machine-control commands. Exact resin, machine, mould, product and site requirements remain controlling.

## Next data gaps after this 50-case pass

The strongest next expansion should use real, de-identified factory datasets or validated public experimental datasets rather than simply generating more synthetic rows. High-value targets are:

- full high-frequency cavity-pressure curves rather than phase means;
- screw position/velocity/pressure time-series alignment;
- temperature-controller flow and differential-pressure traces;
- heater current/duty and actual temperature per hot-runner zone;
- cavity-resolved multi-cavity histories;
- measured part mass and critical dimensions linked by shot ID;
- real moisture/dew-point/material-lot history;
- vibration/current spectra for known maintenance events;
- real measurement-system repeatability/reproducibility records;
- timestamped interventions with before/after confirmation.

Real production data should only be added with explicit permission, de-identification, provenance, units, sampling metadata and a clear statement of whether each field is commanded, measured, derived or manually entered.
