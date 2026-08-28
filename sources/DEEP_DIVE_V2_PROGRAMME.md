# MouldMaster Deep Dive v2 — evidence expansion programme

Status date: 2026-08-28

## Purpose

Deep Dive v2 replaces the earlier range-based expansion goals with fixed, deliberately larger corpus targets. The objective is not to maximise paper or synthetic-row count in isolation. The objective is to build a traceable injection-moulding evidence system that connects mechanisms, measured signals, materials, tooling, machine state and part-quality outcomes.

The machine-readable target ledger is `data/deep-dive-v2-targets.json`.

## Fixed corpus targets

| Area | Deep Dive v2 target |
|---|---:|
| Peer-reviewed papers | 2,000 |
| Primary measured studies | 1,000 |
| Systematic/review papers | 250 |
| Public/reusable measured-dataset candidates | 100 |
| Verified usable measured datasets | 50 |
| Real dataset adapters | 40 |
| Independent dataset benchmark reports | 30 |
| Material behaviour profiles | 300 |
| Resin families | 50 |
| Filled/reinforced/recycled variants | 150 |
| Defect/mechanism entries | 400 |
| Competing-cause diagnostic trees | 600 |
| Advanced-process modules | 50 |
| New diagnostic cases | 1,000 |
| Tooling/cooling cases | 250 |
| Machine-health cases | 200 |
| Material-condition cases | 250 |
| Quality/statistics cases | 250 |
| Sensor/process-monitoring cases | 200 |
| Maintenance cases | 150 |
| Energy/sustainability cases | 100 |
| Multi-cavity cases | 150 |
| Labelled waveform examples | 2,000 |
| Assessment/scenario items total | 1,500 |
| Expert-level scenarios | 300 |
| Appropriately licensed defect images, eventual | 10,000 |
| Lessons/modules total | 250 |
| Research/evidence domains | 100 |

These are programme targets. They do not imply that a release may claim completion before the underlying evidence exists.

## Baseline already present

Deep Dive v2 builds on the existing MouldMaster foundation rather than discarding it: the canonical 120-lesson pathway, specialist extensions, evidence-gated learner questions, 264 synthetic process-data cases / 19,008 generated cycles, the 20-pass research register, the 50-pass measured-evidence atlas, public benchmark preflight and the local privacy-first real-data intake path.

The next phase therefore prioritises evidence diversity and real measured signals instead of simply multiplying deterministic synthetic waveforms.

## Research-domain expansion

The first twenty passes remain valid. Deep Dive v2 grows toward 100 evidence domains by adding focused passes in the following families.

### Machine and plasticising

Check-ring/non-return-valve behaviour; screw wear; barrel wear; screw/barrel clearance; feed-zone behaviour; screw torque; plasticising drive current; recovery stability; back-pressure actuals; decompression/air ingress; injection-axis command versus actual response; servo following error; hydraulic thermal state; nozzle pressure; nozzle contact; machine fingerprints; cold-start and warm-equilibrium behaviour; transfer between machines.

### Clamp, mould motion and ejection

Individual tie-bar load; platen parallelism; clamp-force distribution; mould separation; core deflection; toggle/hydraulic clamp condition; ejector force; mould-open force; release friction; slide/lifter condition; ejection temperature; sticking and drag evidence.

### Cooling and tooling

Cooling hydraulics; Reynolds/flow regime; circuit pressure drop; inlet/outlet temperature; circuit balance; scale/fouling; corrosion; baffles/bubblers; core cooling; conformal cooling; high-conductivity inserts; additive-manufactured cooling inserts; thermal contact resistance; thermal maps; gate erosion; vent degradation; hot-runner thermal balance; heater duty; thermocouple bias; valve-gate timing; manifold expansion and leakage.

### Materials and material state

Commodity, engineering, high-performance, optical, flexible, bio-based and recycled polymers; moisture; drying; hydrolysis; residence history; oxidation; crystallisation; pvT; compressibility; batch rheology; regrind/PCR fraction; contamination; masterbatch/additive dosing; flame retardants; conductive compounds; short fibre; long fibre; mineral filling; orientation; attrition; anisotropy; property retention and conditioning.

### Defects and physical outcomes

Short shot; flash; sink; void; burn/dieseling; splay families; jetting; hesitation; weld/meld lines; delamination; colour and contamination defects; gate defects; ejection damage; optical haze/birefringence; fibre streaking/exposure; warpage/twist/bow; microfeature replication; foam-cell defects; LSR/thermoset cure defects; assisted-moulding penetration/wall-thickness defects; insert/interface defects.

### Special processes

Thin-wall/high-speed; precision; micro; ultrasonic micro; injection-compression; gas-assisted; water-assisted; projectile-assisted; microcellular/physical/chemical foaming; core-back; gas counter-pressure; co-injection; sandwich; 2K/3K; sequential multi-shot; insert and polymer overmoulding; organosheet/hybrid composite overmoulding; long-fibre; LSR; LSR overmoulding; optical silicone; thermoset; rubber; powder/metal/ceramic injection fundamentals; optical thermoplastic; variotherm/RHCM; vacuum assistance; in-mould labelling/decoration/electronics; cleanroom/medical; high-temperature PAEK.

### Sensors, metrology and quality

Cavity pressure/temperature; nozzle and melt pressure; infrared melt temperature; capacitance; dielectric; ultrasound; acoustic emission; mould strain; tie-bar strain; vibration; electrical signatures; thermal imaging; machine vision; laser/displacement; CT and dimensional metrology; calibration; drift; sample rate; filtering; aliasing; synchronisation; uncertainty; MSA/Gage R&R; capability; univariate and multivariate SPC; EWMA; CUSUM; Hotelling T2; PCA; functional/time-series monitoring.

### Data science and evidence interpretation

DOE; response surfaces; split-plot/nested/mixture designs; adaptive/Bayesian DOE; anomaly detection; transfer learning; domain adaptation; drift; out-of-distribution detection; uncertainty calibration; interpretable models; causal inference boundaries; digital twins; simulation discrepancy; cross-machine/process transfer.

## Real-data-first rule

New measured-data work should prefer evidence that preserves time, physical sensor location and part/cavity identity. High-value fields include complete cavity-pressure curves, injection position/velocity/pressure alignment, nozzle pressure, screw-recovery signals, coolant flow and differential pressure, hot-runner actual temperatures and heater duty, tie-bar/mould-strain signals, cavity-resolved mass/dimensions, material-lot/moisture history, maintenance events, measurement-system records and timestamped interventions.

Scalar summaries are useful but should not replace the waveform when the source exposes the waveform.

## Dataset intake gate

A candidate is not promoted to a verified MouldMaster dataset merely because a repository record exists. Verification should record source/version, licence, redistribution boundary, local SHA-256 when files are actually used, schema, units, row/cycle count, sampling rate, machine/material/tool context, sensor location, missingness, synchronisation, quality outcome, intervention/DOE structure and the exact claims the source can and cannot support.

## Evidence maturity

- **E0** — educational synthetic example.
- **E1** — authoritative engineering/regulatory/supplier/textbook mechanism evidence.
- **E2** — one primary measured peer-reviewed experiment.
- **E3** — multiple independent measured studies.
- **E4** — reusable raw dataset independently profiled and fingerprinted by MouldMaster.
- **E5** — relationship reproduced across more than one independent measured dataset.
- **E6** — relationship also validated against authorised de-identified site evidence.

Evidence level does not turn local numerical settings into universal production limits.

## Diagnostic-case architecture

A new defect/case should follow:

**observable symptom → competing mechanisms → supporting evidence → contradicting evidence → next discriminating measurement → bounded response → recovery confirmation**.

The app should avoid setting-only advice such as “increase pressure for a short shot” when the same symptom can arise from shot-volume, transfer, pressure-limit, velocity-tracking, check-ring, nozzle, runner, gate, vent, material, feed, recovery or thermal mechanisms.

## Phase structure

### Phase A — measured-data execution

Profile and fingerprint open publisher datasets already identified by the measured-evidence atlas, add adapters, and create non-raw benchmark reports. Grow from the initial public sources to 100 candidates and 50 verified usable datasets.

### Phase B — research expansion

Grow the research register to 2,000 peer-reviewed records with at least 1,000 primary measured studies. Reviews are discovery aids and do not replace primary evidence for mechanism-level claims.

### Phase C — knowledge modelling

Expand materials to 300 profiles, defects to 400 mechanisms / 600 competing-cause trees, and process coverage to 50 specialist modules.

### Phase D — case expansion

Add 1,000 new diagnostic cases while preserving explicit measured/synthetic provenance. Dedicate minimum subcorpora to tooling/cooling, machine health, material condition, quality/statistics, sensors, maintenance, energy and multi-cavity reasoning.

### Phase E — assessment and visual evidence

Grow formal/formative assessment toward 1,500 items and 300 expert scenarios. Build an appropriately licensed visual corpus toward 10,000 defect images where redistribution and privacy rights permit.

## Non-negotiable boundaries

1. Do not relabel synthetic data as measured.
2. Do not claim a raw-data benchmark was run until files were actually obtained and profiled.
3. Do not publish proprietary production data without explicit authorisation and governance.
4. Do not convert a measured association into a root-cause claim without supporting intervention/mechanism evidence.
5. Do not average away cavity identity when it is available.
6. Do not replace resin-supplier or equipment-specific limits with research-paper setpoints.
7. Do not treat model accuracy as proof of causality or safe automated control.
8. Do not reduce these target counts silently; target changes require an explicit reviewed programme revision.
