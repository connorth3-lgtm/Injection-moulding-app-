# MouldMaster Deep Dive v2 — evidence expansion programme

Status date: 2026-08-28

## Purpose

Deep Dive v2 replaces the earlier range-based expansion goals with fixed, deliberately larger corpus targets. The objective is not to maximise paper or synthetic-row count in isolation. The objective is to build a traceable injection-moulding evidence system that connects mechanisms, measured signals, materials, tooling, machine state and part-quality outcomes.

The machine-readable target ledger is `data/deep-dive-v2-targets.json`. Wave 1 remains preserved in `data/deep-dive-v2-100-pass.json`; Wave 2 is stored in `data/deep-dive-v2-wave2-100-pass.json`; Wave 3 is stored in `data/deep-dive-v2-wave3-100-pass.json`; and Wave 4 is stored in `data/deep-dive-v2-wave4-100-pass.json`. Together they form **400 cumulative research/evidence passes**.

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
| Research/evidence domains | **400** |

These are programme targets. They do not imply that a release may claim completion before the underlying evidence exists.

## Preserved baseline and cumulative execution

Deep Dive v2 builds on the canonical 120-lesson pathway, specialist extensions, evidence-gated learner questions, 264 synthetic process-data cases / 19,008 generated cycles, the earlier 20-pass research register, the 50-pass measured-evidence atlas, public benchmark preflight and the local privacy-first real-data intake path.

Wave 1 IDs **1–100**, Wave 2 IDs **101–200**, Wave 3 IDs **201–300**, and Wave 4 IDs **301–400** remain distinct ledgers. Later waves deepen rather than overwrite earlier work. Weakly supported subjects remain `gap_seeded`; a search result is not promoted simply to improve a count. A `seeded_with_primary` label means a relevant experimental/primary anchor was found for the domain; it is still subject to full-text identity, scope and claim-bounding review before promotion into the final evidence registry.

Wave 4 deliberately targets difficult blind spots that are often underrepresented in general injection-moulding reviews: functional additives and conductive/thermal compounds; recycled PC/ABS and rPET contamination; cooling fouling and coolant diagnostics; heater/thermocouple and valve-gate faults; purgeability and residence; machine lubrication and hydraulic-pump condition; surface coatings and demoulding; defect discrimination; medical/optical/electronic overmoulding; Gage R&R; waveform analytics; drift, uncertainty, OOD, transfer learning, causal boundaries and reproducible public datasets. It contains **69 primary/experimental-seeded passes and 31 explicit gaps** rather than padding weak areas with indirect evidence.

The next phase therefore prioritises evidence diversity and real measured signals instead of simply multiplying deterministic synthetic waveforms.

## Research-domain expansion

The 400 cumulative passes span the following evidence families.

### Machine and plasticising

Check-ring/non-return-valve closure and wear; screw and barrel wear; screw/barrel clearance; feed-throat behaviour and bridging; pellet feeding and bulk density; hopper loading and starvation; drying/dew point and material residence; screw torque, drive current and specific plasticising energy; recovery stability; cushion stability; decompression/suck-back; injection-axis command versus actual response; acceleration/jerk; servo following error; hydraulic thermal state; hydraulic pump/bearing condition; oil condition; nozzle pressure/contact/alignment; shot utilisation and residence volume; purging and colour change; machine fingerprints; cold-start and warm-equilibrium behaviour; predictive maintenance and transfer between machines.

### Clamp, mould motion, tooling and ejection

Individual tie-bar load; platen parallelism; clamp-force distribution; mould separation and deflection; core/cavity elastic deformation; toggle/hydraulic clamp condition; toggle lubrication; ejector force/friction; mould-open force; release friction; slide/lifter condition; mould surface roughness and texture; DLC/PVD and other coatings; laser-textured release surfaces; insert/gate wear; vent degradation; trapped-gas compression; vacuum evacuation; flash from mould deformation; sticking and drag evidence.

### Cooling and hot runners

Cooling hydraulics; coolant flow and differential pressure; Reynolds/flow regime; circuit pressure drop; parallel/series balance; scale/fouling and cleaning; cavitation/air locks; corrosion/coolant chemistry; baffles/bubblers; core cooling; conformal cooling; AM-channel roughness; AM insert porosity/fatigue/leakage; high-conductivity inserts; polymer/tool thermal contact resistance; thermal maps; TCU stability; hot-runner thermal balance; heater duty/coupling/faults; thermocouple bias; nozzle-to-nozzle thermal variation; valve-pin timing/wear/leakage; sequential gating; residence/dead spots; manifold expansion/leakage; cold-runner pressure loss; gate freeze/seal; cold-slug/nozzle-tip behaviour.

### Materials and material state

Commodity, engineering, high-performance, optical, flexible, bio-based and recycled polymers; moisture and reabsorption; over-drying; PA conditioning; hydrolysis; residence history; oxidation; crystallisation; inline pvT; compressibility and bulk viscosity; pressure-dependent rheology; in-mould viscosity; batch rheology; regrind/PCR fraction; recycled PC/ABS and rPET contamination; recycled VOC/odour; chemical-recycling evidence gaps; filler segregation; talc, glass beads, mineral fillers and boron nitride; masterbatch/pigment dispersion; flame retardants; UV/antioxidant gaps; carbon-black/CNT/graphite conductive compounds; thermally conductive compounds; natural fibres and wood-filled compounds; PEEK/PAEK; PPS; POM; PVC; LCP; TPU/TPE; PLA/PHA/PBS; short fibre; long fibre; carbon fibre; orientation; attrition; anisotropy; property retention and conditioning.

### Defects and physical outcomes

Short shot; flash; sink and read-through; shrink voids; gas bubbles; trapped gas; burn/dieseling; splay families; black-speck source discrimination; colour streaks; plate-out; blush/gate blush; ghost marks; gloss nonuniformity; delamination; stress whitening; jetting; hesitation/race tracking; tiger stripes/flow marks; weld/meld lines; gate defects; ejection damage; sticking; environmental stress cracking; optical haze/birefringence; fibre streaking/exposure; warpage/twist/bow; moisture-conditioned dimensional change; microfeature replication; foam-cell defects; LSR/thermoset cure defects; assisted-moulding penetration/wall-thickness defects; insert/interface defects.

### Special and reactive processes

Thin-wall/high-speed; precision and micro moulding; micro-shot metering; ultrasonic micro; injection-compression; optical injection-compression; gas-assisted; water-assisted; projectile-assisted; microcellular physical and chemical foaming; combined blowing agents; core-back and mould-opening foaming; gas counter-pressure; co-injection; sandwich; 2K/3K; sequential multi-shot; insert and polymer overmoulding; organosheet/hybrid composite overmoulding; long-fibre; LSR and LSR overmoulding; rubber/vulcanisation; optical silicone; thermoset and dielectric cure monitoring; powder/metal/ceramic injection; low-pressure PIM; debinding and sintering; variotherm/RHCM; vacuum assistance; in-mould labelling/decoration/electronics; electrical and PCB inserts; cleanroom/medical; COC/COP microfluidics; high-temperature PAEK.

### Multi-cavity, metrology and quality

Multi-cavity shear-heating imbalance; runner thermal asymmetry; cavity-resolved fill, mass and dimensions; melt-flipper balancing; family-mould pressure balance; runner/gate packing balance; CT and micro-CT dimensional metrology; optical and tactile comparison; measurement uncertainty; GUM uncertainty budgets; confocal in-line measurement; surface-quality metrics; cavity pressure/temperature; nozzle and melt pressure; infrared melt temperature; capacitance; dielectric; ultrasound; acoustic/vibration; mould strain; tie-bar strain; extraction force; electrical signatures; thermal imaging; machine vision and defect segmentation; laser/displacement; calibration; drift; sample rate; filtering; aliasing; synchronisation; uncertainty; MSA/Gage R&R; capability; univariate and multivariate SPC; EWMA; CUSUM; Hotelling T2; PCA/PLS; functional and full-curve time-series monitoring.

### Data science, maintenance and sustainability

DOE; response surfaces; split-plot/nested/mixture designs; anomaly detection; change-point and drift detection; LSTM autoencoders; representation learning; transfer learning; domain adaptation; out-of-distribution detection as an explicit evidence gap; calibrated/conformal uncertainty as an explicit evidence gap; interpretable models; causal inference boundaries; intervention-aware reasoning; digital twins; simulation discrepancy and experimental calibration; cross-machine/process transfer; mould wear-out prediction; condition monitoring from pressure, vibration, acceleration and extraction force; predictive maintenance; self-retraining analytics; measured electricity consumption; machine-selection energy models; specific energy consumption; eco-efficiency; and reproducible public measured-data benchmarks.

## Real-data-first rule

New measured-data work should prefer evidence that preserves time, physical sensor location and part/cavity identity. High-value fields include complete cavity-pressure curves, injection position/velocity/pressure alignment, nozzle pressure, screw-recovery signals, plasticising torque/current/energy, coolant flow and differential pressure, hot-runner actual temperatures and heater duty, tie-bar/mould-strain signals, cavity-resolved mass/dimensions, material-lot/moisture/dew-point history, maintenance events, measurement-system records and timestamped interventions.

Scalar summaries are useful but should not replace the waveform when the source exposes the waveform.

## Dataset intake gate

A candidate is not promoted to a verified MouldMaster dataset merely because a repository record exists. Verification must record source/version, licence, redistribution boundary, local SHA-256 when files are actually used, schema, units, row/cycle count, sampling rate, machine/material/tool context, sensor location, missingness, synchronisation, quality outcome, intervention/DOE structure and the exact claims the source can and cannot support.

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
