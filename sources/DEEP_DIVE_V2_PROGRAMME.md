# MouldMaster Deep Dive v2 — evidence expansion programme

Status date: 2026-08-29

## Purpose

Deep Dive v2 builds a traceable injection-moulding evidence system connecting physical mechanisms, machine/mould signals, material state, process history, measurement quality and part outcomes. Volume is useful only when provenance and evidence quality remain explicit.

Seven additive 100-pass ledgers are preserved: Wave 1 IDs 1–100, Wave 2 IDs 101–200, Wave 3 IDs 201–300, Wave 4 IDs 301–400, Wave 5 IDs 401–500, Wave 6 IDs 501–600 and Wave 7 IDs 601–700. Together they form **700 cumulative research/evidence passes**. New waves deepen the corpus and never replace earlier data.

## Fixed corpus targets

| Area | Target |
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
| Research/evidence domains | **700** |

These are programme targets, not claims that the 2,000-paper or 1,000-primary-study corpus is already complete.

## Preserved baseline and cumulative execution

The programme builds on the 120-lesson pathway, specialist extensions, evidence-gated learner questions, 264 synthetic process-data cases / 19,008 generated cycles, earlier 20-pass research register, 50-pass measured-evidence atlas, public benchmark preflight and privacy-first real-data intake path.

`seeded_with_primary` means at least one relevant primary/experimental anchor was found for the domain. It still requires identity, method, scope and claim-bounding review before final evidence-registry promotion. `gap_seeded` keeps weak areas visible instead of padding the count.

Wave 6 remains preserved at **92 primary/experimental-seeded passes and 8 gaps**. Wave 7 adds **89 primary/experimental-seeded passes and 11 explicit gaps** and raises protected execution to **700 cumulative research/evidence passes**.

Wave 7 deliberately deepens areas where measured physical signals can discriminate mechanisms: gate freeze and solidification pressure, packing-pressure transmission, pvT/shrinkage discrepancy, true melt temperature versus barrel settings, nozzle/sprue shear heating, vent clogging and cavity-gas pressure, hot-runner stagnation and multi-cavity thermal imbalance, polyamide/polycarbonate moisture effects, PEEK crystallisation, fibre orientation and weld-line morphology, LSR cure/shrinkage, multimodal and ultrasonic sensing, streaming time-series quality monitoring, variable polymer/mould thermal contact resistance and measured machine energy.

The 11 retained Wave 7 gaps are intentional. They cover areas where current discovery is dominated by reviews, simulations, repository/preprint evidence or broader manufacturing evidence rather than sufficiently strong injection-moulding primary measurements. Examples include direct heater-duty/thermocouple-fault signatures, some moisture-sensitive rheology measurement controls, injection-specific waveform Gage R&R, and out-of-distribution/causal-intervention validation.

## Evidence families

The 700 passes span machine/plasticising, clamp/tooling/ejection, solidification/packing, cooling/hot runners, venting, materials/recyclates, defects, fibre composites, multi-cavity systems, special/reactive/powder processes, sensors/metrology, quality/statistics, AI/data science, maintenance, energy and sustainability.

High-value measured fields include complete cavity-pressure curves, injection position/velocity/pressure alignment, nozzle pressure, screw-recovery signals, plasticising torque/current, actual melt temperature, cavity-gas pressure, coolant flow and differential pressure, hot-runner temperatures/heater duty, tie-bar/mould-strain signals, cavity-resolved mass/dimensions, material-lot/moisture history, maintenance events, measurement-system records and timestamped interventions.

## Real-data-first rule

Prefer evidence that preserves time, sensor location, machine, mould, cavity and shot identity. Scalar summaries are useful but must not replace waveforms when the source exposes full time series.

A public dataset is only a candidate until source/version, licence, redistribution rights, SHA-256, file size, schema, units, row/cycle count, sampling rate, machine/material/mould context, sensor location, missingness, synchronisation, quality outcome, intervention/DOE structure and permitted/prohibited claims are checked.

## Evidence maturity

- **E0** — educational synthetic example.
- **E1** — authoritative engineering/regulatory/supplier/textbook mechanism evidence.
- **E2** — one primary measured peer-reviewed experiment.
- **E3** — multiple independent measured studies.
- **E4** — reusable raw dataset independently profiled and fingerprinted by MouldMaster.
- **E5** — relationship reproduced across more than one independent measured dataset.
- **E6** — relationship also validated against authorised de-identified site evidence.

Evidence maturity never turns local numerical settings into universal production limits.

## Diagnostic-case architecture

**observable symptom → competing mechanisms → supporting evidence → contradicting evidence → next discriminating measurement → bounded response → recovery confirmation**

The app should avoid setting-only advice. A short shot, for example, can originate from shot volume, transfer, pressure/velocity limits, check-ring leakage, nozzle/runner/gate restrictions, venting, material state, feed/recovery instability or thermal conditions.

## Phase structure

**Phase A — measured data:** grow toward 100 public candidates, 50 verified measured datasets, 40 adapters and 30 benchmark reports.

**Phase B — research:** grow toward 2,000 peer-reviewed records and 1,000 primary measured studies. Reviews are discovery aids and do not replace primary evidence.

**Phase C — knowledge:** build 300 material profiles, 400 defect mechanisms, 600 diagnostic trees and 50 specialist process modules.

**Phase D — cases:** add 1,000 diagnostic cases while retaining measured/synthetic provenance and E0–E6 maturity.

**Phase E — assessment/visual evidence:** reach 1,500 assessment items, 300 expert scenarios and eventually 10,000 appropriately licensed defect images.

## Non-negotiable boundaries

1. Do not relabel synthetic data as measured.
2. Do not claim a raw-data benchmark was run until files were actually obtained and profiled.
3. Do not publish proprietary production data without explicit authorisation and governance.
4. Do not convert measured association or prediction into root cause without intervention/mechanism evidence.
5. Do not average away cavity identity when available.
6. Do not replace resin-supplier or equipment-specific limits with research-paper setpoints.
7. Do not treat model accuracy as proof of causality or safe automated control.
8. Do not reduce targets or delete earlier waves silently; changes require an explicit reviewed programme revision.
