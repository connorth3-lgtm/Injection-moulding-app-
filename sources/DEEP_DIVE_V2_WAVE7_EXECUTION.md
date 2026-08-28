# MouldMaster Deep Dive v2 — Wave 7 execution

Status date: 2026-08-29

Wave 7 is additive. **Waves 1–6 are preserved unchanged.** This run adds IDs **601–700**, bringing Deep Dive v2 to **700 cumulative research/evidence passes**.

## Wave 7 result

- total new passes: **100**
- primary/experimental-seeded passes: **89**
- explicit evidence gaps retained: **11**
- previous passes preserved: **600**
- cumulative passes: **700**

`seeded_with_primary` remains an intake/discovery status, not a saturation claim. A source still needs identity, method, scope, provenance and claim-bound review before final evidence-registry promotion. `gap_seeded` keeps weak evidence visible instead of converting reviews, simulation-only work or repositories into primary measured evidence.

## What Wave 7 deepened

### Solidification, packing and shrinkage

Pressure-temperature measurements along the cavity; gate-freeze/pressure-decay signatures; local solidification pressure as a shrinkage indicator; packing-pressure transmission; isochoric pressure decay; crystallisation-flow coupling; semi-crystalline pvT cooling-rate mismatch; shrinkage simulation discrepancy; anisotropic polyester shrinkage and residual-stress boundaries.

### Melt temperature, plasticising and rheology

Infrared measurements showing actual transient melt temperature can depart strongly from barrel setpoint; nozzle/sprue shear heating; in-mould thermal estimation of bulk melt temperature; mould-type slit rheometry; local pressure/temperature/velocity/viscosity sensing; barrel-nozzle-cavity pressure-chain reasoning and viscous-dissipation/adiabatic-compression heating.

### Venting and trapped gas

Cavity-gas-pressure and cavity-gas-temperature vent-clog sensing; long-run vent monitoring; vacuum venting for microfeature replication; image-quantified burn reduction with external gas assistance; cavity-pressure failure diagnosis; volatile behavior in vented plasticising cylinders and vent-deposit maintenance mechanisms. Direct multiphase vent-geometry validation remains a gap where current evidence is simulation-heavy.

### Hot runners and multi-cavity

Direct visualization of manifold stagnation, valve-pin/nozzle dead zones and valve-gate melt-temperature profiles; side-fed versus centre-fed hot-runner imbalance; shear-induced H-runner thermal imbalance; melt-flipping rebalance interventions and experimentally checked hot-runner thermal fields. Direct heater-duty/thermocouple-bias fault signatures remain intentionally open.

### Material condition

Polyamide moisture uptake and dimensional growth; PA66 hygroscopic swelling/property loss; PA6 morphology and humidity sensitivity; polycarbonate moisture degradation; PEEK crystallinity gradients; polyester shrinkage/orientation and hydro-glycol ageing. Moisture-sensitive PET/PBT rheology measurement and sample-handling uncertainty remain targeted gaps until stronger primary injection-moulding evidence is added.

### Fibre composites

Gate-controlled fibre orientation/warpage; micro-CT validation; weld-line orientation and strength loss; fibre fracture/void morphology; nondestructive X-ray orientation; image-based orientation measurement; overmould healing versus mechanical interlock; active fibre reorientation and carbon-fibre PEEK/PPS fracture/interface morphology.

### Special processes

LSR process-property DOE, cavity-pressure crosslinking signature, anisotropic shrinkage and viscosity/pvT/cure kinetics; microcellular and injection-compression evidence; ultrasonic monitoring of co-injection/micromoulding behavior and powder-injection defect/process monitoring. Cross-process transfer remains bounded rather than assuming thermoplastic rules apply unchanged to reactive or powder systems.

### Sensors and metrology

Integrated capacitance-pressure-temperature sensing; tie-bar ultrasound as indirect cavity pressure; ANN dimensional-defect monitoring from in-mould pressure/temperature; lens form-error diagnosis; wireless melt-front sensing over hundreds of cycles; analytic-wavelet ultrasonic pressure sensing and barrel/nozzle/cavity sensor-chain comparison.

### Data science and quality

Streaming injection-moulding quality monitoring; long-run melt-stability modeling on roughly 280,000 production cycles; transfer learning; drift-aware monitoring; high-resolution waveform versus scalar prediction; multivariate SPC/fault classification. Injection-specific waveform Gage R&R and true out-of-distribution/causal-intervention validation remain explicit evidence gaps.

### Cooling and energy

A 2025 experimental measurement study of polymer/mould thermal contact resistance; variable-TCR versus constant-TCR simulation assumptions; conformal cooling pressure-drop/fatigue tradeoffs; experimentally validated MGSS cooling; additively manufactured conformal insert trials; measured/validated energy models, hydraulic-versus-electric cycle energy audits and machine-specific eco-efficiency.

## High-value Wave 7 evidence anchors

- `10.5545/SV-JME.2013.1000` — pressure-derived solidification history and shrinkage.
- `10.1002/PEN.760312308` — infrared transient melt-temperature measurement.
- `10.1016/J.CIRPJ.2021.01.009` — vent-clog monitoring using cavity gas pressure/temperature.
- `10.1002/APP.27057` — polyamide moisture uptake and dimensional change.
- `10.1002/pen.26756` — LSR anisotropic shrinkage.
- `10.1109/tim.2024.3522402` — integrated capacitance/pressure/temperature sensing.
- `10.1007/S00170-020-06011-4` — sensor-based online defect detection.
- `10.1109/IJCNN52387.2021.9534461` — streaming injection-moulding quality monitoring.
- `10.1002/pen.70028` — measured polymer/mould thermal contact resistance.
- `10.1080/19397038.2014.895067` — injection-moulding energy/eco-efficiency characterization.

## Evidence boundaries retained

1. No synthetic rows were relabelled as measured.
2. Repository/preprint/review/simulation evidence does not automatically receive primary-measured status.
3. Paper-specific numerical settings remain local to the tested machine, mould, material, geometry and measurement system.
4. Predictive accuracy is not treated as root-cause proof.
5. Multi-cavity and sensor-location identity should not be averaged away when available.
6. Waves 1–6 are preserved rather than overwritten.

The machine-readable Wave 7 ledger is `data/deep-dive-v2-wave7-100-pass.json`.
