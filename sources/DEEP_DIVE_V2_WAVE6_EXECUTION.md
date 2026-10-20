# MouldMaster Deep Dive v2 — Wave 6 execution

Status date: 2026-08-28

Wave 6 is additive. **Waves 1–5 are preserved unchanged.** This run adds IDs **501–600**, bringing Deep Dive v2 to **600 cumulative research/evidence passes**.

## Wave 6 result

- total new passes: **100**
- primary/experimental-seeded passes: **92**
- explicit evidence gaps retained: **8**
- previous passes preserved: **500**
- cumulative passes: **600**

`seeded_with_primary` is an intake/discovery status, not a claim that a domain is saturated. Full-text identity, methods, scope, data provenance and claim bounds still govern promotion to the final evidence registry. `gap_seeded` deliberately leaves weak areas visible rather than filling them with indirect or low-confidence evidence.

## What Wave 6 deepened

### Machine and plasticising

NRV/check-ring wear and backflow; pressure/torque/displacement fault diagnosis; ultrasound screw/barrel clearance; melt-temperature and unmelted-granule sensing; screw-wear flow benchmarking; solid-bed breakup; plasticising torque/power; nozzle-pressure repeatability; micro-shot metering and millisecond V/P-transition dynamics.

### Tooling and demoulding

Measured tubular ejection force; ejector-pin load distribution; quartz-sensor demould resistance; microfeature adhesion/friction; rapid-tool friction; stereolithography-tool ejection validation; thermomechanical ejection prediction. Mould-open-force and slide/lifter-condition evidence remain explicit direct-measurement gaps.

### Cooling

Real cooling-channel fouling and pressure loss; sensorised conformal-cooling industrial trials; AM-channel roughness and hydraulic penalty; Reynolds-number effects; waterfall-channel experiments; thermocouple-confirmed hotspot removal; hydraulic estimation of sediment thickness. Experimental insert-fatigue/pressure-drop coupling remains a targeted gap.

### Hot runner and multi-cavity

Directly visualised manifold stagnation and valve-pin/nozzle dead zones; side-fed versus centre-fed imbalance; runner cross-section temperature asymmetry; infrared multi-cavity thermal evidence; H-runner imbalance; PVC balance; physical runner-geometry rebalance; nozzle-pressure/tie-bar adaptive control. Heater-current/thermocouple fault signatures remain a priority gap.

### Materials and recyclates

PA/TPU moisture-splay; TPU/PC moisture cosmetics; six-loop polyolefin degradation with rheology/VOC/optical evidence; inline pvT dosing of variable recyclates; recycled-PP residence-time/temperature effects; repeated PLA reprocessing; moisture-compensation boundaries; variable-compressibility shot-volume correction.

### Fibre composites

Micro-CT fibre orientation; orientation-to-property mapping; gate-driven warpage; residual fibre-length attrition; weld-line orientation strength loss; orientation-dependent modulus; DOE effects on FOD; 3D model validation; fibre-fraction-driven breakage; void/fibre/weld-line morphology separation.

### Defects

Experimentally validated short shot; image-quantified burn marks; optical-lens sink; production-validated thick-wall sink voids; cavity-pressure fault signatures; visualised hot-runner flow/gate marks; reinforced weld weakness; fibre-driven warpage; moisture splay. Gate-blush prediction still needs stronger direct measured validation.

### Special/reactive/powder processes

LSR rheology/pvT/cure kinetics; water-assisted PA6/GF-PA6 penetration; gas-assisted burn mitigation; microcellular moulding; injection-compression; 2K interface strength; polymer-metal insert bonding; micro-injection wall-slip validation; metal/ceramic powder feedstock rheology, wall slip, powder loading, debinding and sintering. Gas-counter-pressure evidence quality is deliberately held as a gap pending stronger verification.

### Sensors, analytics, maintenance and energy

Integrated capacitance-pressure-temperature sensing; wireless cavity sensing; tie-bar ultrasound; barrel/nozzle/cavity pressure chains; sensorised conformal moulds; high-resolution time-series quality prediction; a long-run industrial melt-stability study using roughly 280,000 cycles; injection-machine predictive maintenance; transfer learning across 59 moulded parts; rolling energy prediction; multivariate SPC; drift-aware monitoring; NRV anomaly deployment; explicit prediction-versus-causality boundary.

## Evidence boundaries retained

1. No synthetic rows were relabelled as measured.
2. Reviews remain discovery aids unless a pass is separately backed by primary measured work.
3. Simulation-heavy evidence does not become `seeded_with_primary` merely because it reports an optimum.
4. Paper-specific numerical settings remain local to the reported machine, mould, material and measurement system.
5. Predictive accuracy and transfer performance do not prove root cause or safe autonomous control.
6. Earlier Wave 1–5 files are not overwritten by this run.

The machine-readable Wave 6 ledger is `data/deep-dive-v2-wave6-100-pass.json`.
