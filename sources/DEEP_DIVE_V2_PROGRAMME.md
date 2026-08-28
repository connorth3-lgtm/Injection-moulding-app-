# MouldMaster Deep Dive v2 — evidence expansion programme

Status date: 2026-08-28

## Purpose

Deep Dive v2 is the evidence-growth programme for MouldMaster. Its purpose is not to maximise paper count or synthetic rows in isolation; it is to build a traceable injection-moulding knowledge system connecting physical mechanisms, machine and mould signals, materials, process history, measurement quality and part outcomes.

The machine-readable target ledger is `data/deep-dive-v2-targets.json`. Five additive 100-pass ledgers are now preserved: Wave 1 IDs 1–100, Wave 2 IDs 101–200, Wave 3 IDs 201–300, Wave 4 IDs 301–400, and Wave 5 IDs 401–500. Together they form **500 cumulative research/evidence passes**. New waves deepen the corpus and never replace earlier data.

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
| Research/evidence domains | **500** |

These are programme targets. They do not imply completion of the 2,000-paper or 1,000-primary-study corpus until the underlying records and evidence exist.

## Preserved baseline and cumulative execution

Deep Dive v2 builds on the canonical 120-lesson pathway, specialist extensions, evidence-gated learner questions, 264 synthetic process-data cases / 19,008 generated cycles, the earlier 20-pass research register, the 50-pass measured-evidence atlas, public benchmark preflight and the privacy-first real-data intake path.

`seeded_with_primary` means at least one relevant experimental/primary anchor was found for the domain; full-text identity, scope, method and claim-bounding review is still required before final evidence-registry promotion. `gap_seeded` keeps weak areas visible instead of padding counts with indirect sources.

Wave 4 is preserved with 69 primary/experimental-seeded passes and 31 explicit gaps. Wave 5 adds another 100 passes with **95 primary/experimental-seeded domains and 5 explicit gaps**, deepening check-ring/backflow, plasticisation and feeding, demoulding mechanics, polymer–mould thermal contact resistance, real cooling-channel fouling, hot-runner stagnation, moisture/recycling degradation, filled-material warpage, quantified surface defects, gas-assisted and reactive moulding, acoustic/ultrasonic sensing, drift-aware analytics, measured energy, powder injection moulding and in-mould electronics.

## Research-domain expansion

The **500 cumulative research/evidence passes** span these evidence families.

### Machine and plasticising

Check-ring/non-return-valve closure, backflow and wear; screw/barrel wear and clearance; ultrasound and melt-inclusion monitoring; solids conveying and feed-throat bridging; screw torque and plasticising drive current; recovery and cushion stability; decompression/suck-back; injection-axis command versus actual response; acceleration/jerk; servo/hydraulic thermal state; nozzle pressure/contact/alignment; melt-temperature homogeneity; shot utilisation and residence volume; machine fingerprints; startup equilibrium and cross-machine transfer.

### Clamp, mould motion, tooling and ejection

Individual tie-bar load; platen parallelism; clamp-force distribution; mould separation and elastic deformation; ejector force and pin distribution; mould-open force; adhesion versus sliding friction; coatings, surface energy, roughness and texture; microfeature demoulding; slide/lifter condition; vent degradation; vacuum evacuation; sticking, drag and release-force trends.

### Cooling and hot runners

Cooling hydraulics; coolant flow and differential pressure; Reynolds regime; pressure loss; balance; scale/fouling and cleaning; coolant medium; AM conformal-channel roughness; AM insert integrity; polymer–mould heat-transfer coefficient and thermal contact resistance; air-gap evolution; thermal maps; hot-runner thermal balance; melt stagnation; heater duty and faults; thermocouple bias; valve-pin timing/wear/leakage; residence/dead spots; multi-cavity thermal/rheological imbalance.

### Materials and material state

Commodity, engineering, high-performance, optical, flexible, bio-based and recycled polymers; moisture, diffusion and reabsorption; PA conditioning; hydrolysis; residence and oxidation; crystallisation; inline pvT and compressibility; pressure-dependent/in-mould rheology; batch variation; regrind/PCR; VOC/odour; contamination; masterbatch/additive dosing; fillers; conductive/flame-retardant compounds; PEEK/PAEK/PPS/POM/PVC/LCP; TPU/TPE; PLA/PHA/PBS; short/long/carbon fibre; orientation, attrition, anisotropy and property retention.

### Defects and physical outcomes

Short shot; flash; sink; shrink voids; bubbles; trapped gas and dieseling; splay; black specks; colour streaks; plate-out; gate blush; gloss and topography; delamination; stress whitening; jetting, hesitation and flow marks; weld/meld lines; gate/ejection damage; optical haze/birefringence; fibre streaking; warpage/twist/bow; microfeature replication; foam-cell defects; LSR/thermoset cure defects; assisted-moulding penetration and wall thickness; insert/interface defects.

### Special, reactive and powder processes

Thin-wall/high-speed; precision/micro; ultrasonic micro; injection-compression; optical injection-compression; gas/water/projectile assisted; physical/chemical foaming; core-back and gas counter-pressure; co-injection/sandwich; 2K/3K; sequential multi-shot; insert/overmoulding; hybrid composites; LSR and LSR overmoulding; rubber/vulcanisation; thermoset; powder/metal/ceramic injection; feedstock rheology, wall slip, powder loading, debinding and sintering; variotherm/RHCM; vacuum; in-mould labelling/decoration/electronics; medical/cleanroom and high-temperature PAEK.

### Sensors, metrology, multi-cavity and quality

Cavity pressure/temperature; nozzle/melt pressure; tie-bar strain and ultrasound; capacitance; dielectric; ultrasound; acoustic emission; vibration; electrical signatures; thermal imaging; machine vision; AFM/SEM and optical/tactile metrology; laser/displacement; calibration, sample rate, filtering, aliasing and synchronisation; measurement uncertainty and MSA/Gage R&R; cavity-resolved fill/mass/dimensions; SPC, EWMA, CUSUM, Hotelling T2, PCA and functional/time-series monitoring.

### Data science, maintenance, energy and sustainability

DOE and response surfaces; anomaly detection; autoencoders; representation learning; transfer/domain adaptation; drift and out-of-distribution behaviour; uncertainty calibration; interpretable models; causal inference boundaries; digital twins and simulation discrepancy; condition monitoring and predictive maintenance; electrical/energy phase segmentation; specific energy consumption; machine-selection energy models; process-specific LCA and eco-efficiency.

## Real-data-first rule

New measured-data work should prefer evidence that preserves time, physical sensor location, machine and cavity identity. High-value fields include complete cavity-pressure curves, injection position/velocity/pressure alignment, nozzle pressure, screw-recovery signals, coolant flow and differential pressure, hot-runner actual temperatures and heater duty, tie-bar/mould-strain signals, cavity-resolved mass/dimensions, material-lot/moisture history, maintenance events, measurement-system records and timestamped interventions.

Scalar summaries are useful but should not replace the waveform when the source exposes the waveform.

## Dataset intake gate

A candidate is not promoted to a verified MouldMaster dataset merely because a repository record exists. Verification must record source/version, licence, redistribution boundary, local SHA-256 when files are actually used, file size, schema, units, row/cycle count, sampling rate, machine/material/tool context, sensor location, missingness, synchronisation, quality outcome, intervention/DOE structure and exact permitted/prohibited claims.

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

The app should avoid setting-only advice such as “increase pressure for a short shot” when the same symptom can arise from shot-volume, transfer, pressure-limit, velocity tracking, check-ring, nozzle, runner, gate, vent, material, feed, recovery or thermal mechanisms.

## Phase structure

### Phase A — measured-data execution

Profile and fingerprint open publisher datasets, add adapters and create non-raw benchmark reports. Grow toward 100 candidates and 50 verified usable measured datasets.

### Phase B — research expansion

Grow the evidence register to 2,000 peer-reviewed records with at least 1,000 primary measured studies. Reviews are discovery aids and do not replace primary evidence for mechanism-level claims.

### Phase C — knowledge modelling

Expand materials to 300 profiles, defects to 400 mechanisms / 600 competing-cause trees and specialist processes to 50 modules.

### Phase D — case expansion

Add 1,000 new diagnostic cases while preserving measured/synthetic provenance and evidence maturity. Maintain dedicated tooling/cooling, machine-health, material-condition, quality/statistics, sensor, maintenance, energy and multi-cavity subcorpora.

### Phase E — assessment and visual evidence

Grow assessment toward 1,500 items and 300 expert scenarios, and build an appropriately licensed visual corpus toward 10,000 defect images.

## Non-negotiable boundaries

1. Do not relabel synthetic data as measured.
2. Do not claim a raw-data benchmark was run until files were actually obtained and profiled.
3. Do not publish proprietary production data without explicit authorisation and governance.
4. Do not convert a measured association into a root-cause claim without supporting intervention/mechanism evidence.
5. Do not average away cavity identity when it is available.
6. Do not replace resin-supplier or equipment-specific limits with research-paper setpoints.
7. Do not treat model accuracy as proof of causality or safe automated control.
8. Do not reduce these target counts silently; target changes require an explicit reviewed programme revision.
