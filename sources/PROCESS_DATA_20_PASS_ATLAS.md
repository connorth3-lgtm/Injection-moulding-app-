# MouldMaster 20-pass process-data atlas

Reviewed: 2026-08-26  
Review by: 2026-11-26

## Purpose

This atlas extends MouldMaster's process-data education with twenty independent deep-dive passes and 200 retained evidence cases. It is designed to teach how experienced troubleshooters separate a physical mechanism from a convenient setting change.

The atlas is **not plant data**, **not a validated production recipe**, and **not a source of universal temperatures, pressures, speeds, clamp forces, maintenance thresholds or acceptance limits**. The cases are deterministic synthetic training data.

## Why the baseline is normalized to 100

The first 50-case expansion used engineering-looking synthetic values to teach baseline → fault → recovery relationships. This 20-pass atlas deliberately goes further toward transfer-safe education: every signal starts from a unitless known-good evidence index of **100**.

- baseline index 100 = this case's own known-good signature;
- a fault index of 125 = about 25 index points above that case's baseline;
- recovery returns toward index 100;
- 100 does **not** mean 100 °C, MPa, bar, mm/s, kN, rpm, seconds, grams, percent or any other production unit.

This normalization makes the relationship portable as a learning concept without implying that numeric settings can be copied between machines, moulds, materials, grades, cavities or sites.

## Evidence chain required in every retained case

Every case contains four linked signals and the same reasoning structure:

1. known-good baseline;
2. observed fault-phase pattern;
3. ranked root-cause mechanism;
4. best next discriminating evidence;
5. recovery/verification expectation;
6. an explicit **compensation trap** describing what not to change merely to mask the mechanism.

Each case has 72 deterministic cycles:

- 24 baseline cycles;
- 24 fault cycles;
- 24 recovery cycles.

Each recovery target returns to the defined known-good index 100, and each case has at least two meaningful fault-phase signal changes.

## Twenty passes

1. Plasticising & shot delivery
2. Motion & pressure-control actuals
3. Clamp & structural mechanics
4. Cooling & thermal management
5. Hot runner & valve gates
6. Venting, runners, gates & flow balance
7. Ejection & tool condition
8. Drying, moisture & material handling
9. Crystallinity, shrinkage & dimensional history
10. Reinforced, blended & recycled materials
11. Rheology, fill-speed & pressure-loss studies
12. V/P transfer, packing & gate-seal studies
13. In-mould sensors & pressure-curve features
14. SPC, capability & time-series structure
15. Measurement systems, vision & metrology
16. Predictive maintenance & condition monitoring
17. Machine transfer & physical process equivalence
18. Overmoulding, inserts & multi-material interfaces
19. Micro, thin-wall & precision moulding
20. Energy, sustainability & auxiliary systems

Each pass retains exactly 10 cases, giving **200 cases** and **14,400 synthetic cycles**.

## Examples of higher-value distinctions added

The atlas explicitly trains distinctions that are easy to miss when troubleshooting only from machine settings:

- velocity command versus actual velocity;
- pressure command versus delivered pressure;
- machine pressure versus cavity pressure;
- pressure peak versus full pressure-time area;
- global averages versus cavity-specific evidence;
- material moisture at the dryer versus moisture at point of use;
- cooling controller setpoint versus actual mould thermal distribution;
- clamp-force command versus tie-bar/mould-separation evidence;
- hot-runner displayed temperature versus heater duty and local cavity response;
- mean shift versus variance increase;
- process variation versus measurement-system variation;
- maintenance condition trend versus settings compensation;
- same screen settings versus physical process equivalence on a second machine;
- cosmetic appearance versus required material/interface properties;
- energy per cycle versus energy per accepted part.

## Synthetic-data inventory after this expansion

The process-data learning inventory becomes:

| Layer | Cases | Cycles/case | Synthetic cycles |
| --- | ---: | ---: | ---: |
| Original Guided Data Diagnosis | 14 | 72 | 1,008 |
| 50-case deep-dive library | 50 | 72 | 3,600 |
| 20-pass atlas | 200 | 72 | 14,400 |
| **Total** | **264** | — | **19,008** |

The original 14 guided cases remain the structured question flow: **Read pattern → Diagnose → Choose next evidence → Interpret recovery**. The 50-case layer is a broader engineering-data explorer. The 20-pass atlas is the most extensive normalized mechanism/evidence/verification library.

## Evidence base

The atlas uses the existing MouldMaster evidence registry plus additional peer-reviewed review/research sources where the earlier library had a gap. New atlas-level references include:

- injection-to-holding-pressure switchover methods review: `10.3390/polym17081096`;
- mould thermal-control systems review: `10.3390/ma15124048`;
- AI-driven process cognition/monitoring: `10.1007/s00170-025-15611-x`;
- injection-moulding warpage review: `10.1177/14644207241285399`;
- conformal-cooling review: `10.3934/mbe.2020292`;
- process monitoring/control review: `10.1016/j.procir.2017.12.229`.

The atlas also reuses established MouldMaster evidence for cavity sensing, material moisture, MFR/MVR, packing/gate seal, hot runners, clamp loading, process capability, DOE, machine energy and safe injection-moulding machinery procedures.

Sources support the **mechanism and study method**. They do not turn synthetic indices into production limits.

## QA acceptance rules

`qa_process_data_20_pass.py` rejects the atlas unless all of the following remain true:

- exactly 20 passes numbered 1 through 20;
- exactly 10 retained cases per pass;
- exactly 200 unique stable case IDs;
- exactly four unique normalized signals per case;
- baseline = 100 and recovery target = 100 for every signal;
- at least two non-zero fault changes per case;
- normalized fault indices remain inside the deliberately broad training range;
- every case contains an observed pattern, ranked mechanism, next evidence, verification and explicit compensation trap;
- no universal production-setting instruction is embedded in case logic;
- at least two evidence source IDs exist per pass;
- runtime generation yields exactly 14,400 rows with 24/24/24 phase counts;
- no network transport, XHR, WebSocket or formal assessment-key mutation is introduced;
- browser, offline PWA and Electron desktop packaging include every atlas asset;
- the atlas uses explicit Data Diagnosis lifecycle integration and does not add another document-wide MutationObserver;
- real mobile-browser QA opens, filters and inspects the atlas.

## Best next data step

More synthetic case count is no longer the highest-value next move after this atlas. The next evidence-quality improvement should be a controlled import/anonymisation path for **real de-identified shot data**, keeping plant information local unless a user explicitly exports it.

Highest-value real-data targets are:

- high-frequency cavity-pressure curves by cavity;
- screw position, velocity and pressure command-versus-actual traces;
- transfer event timing and fill fraction proxies;
- cushion/shot-delivery history;
- TCU flow, pressure drop and supply/return temperatures;
- hot-runner zone temperature and heater-current/duty actuals;
- tie-bar/mould-strain or mould-separation evidence where available;
- resin grade, lot, drying, moisture and handling history;
- shot-linked part mass, dimensions and defect labels;
- vibration, current and thermal condition-monitoring histories;
- timestamped interventions with before/after verification.

Real plant data must remain clearly separated from universal advice: MouldMaster should help a learner ask **what changed, where, when, why, what evidence would discriminate the mechanisms, and what confirms recovery** — not silently infer authority to change a validated production process.
