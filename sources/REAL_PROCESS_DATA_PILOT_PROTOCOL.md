# MouldMaster real process-data pilot protocol

Status: pilot-readiness protocol; no production-control authority  
Reviewed: 2026-08-27  
Scope: controlled use of de-identified or pseudonymised real injection-moulding shot data to evaluate MouldMaster diagnostic learning against physical process evidence.

## Purpose

The 264-case synthetic library is intentionally broad, but synthetic data cannot prove that diagnostic patterns transfer to real machine, mould, material and quality histories. This pilot defines the first controlled bridge to real evidence while keeping raw production data local and preventing site-specific settings from becoming generic recommendations.

The pilot is for **learning validation and diagnostic-method evaluation**, not automatic process control, process approval, maintenance authorisation or production-release decisions.

## Public measured-data benchmark lane

Before an authorised site dataset is available, openly licensed measured datasets can be used to test limited parts of the data pathway such as schema mapping, units, missing-data handling, actual-versus-command separation, process/quality relationships and uncertainty language.

The reviewed external benchmark register is `PUBLIC_REAL_PROCESS_DATA_BENCHMARKS.md`. Public benchmark work does **not** satisfy this pilot's completion criterion unless the stronger governance, baseline/fault/intervention/recovery evidence and independent engineering-review requirements below are also met. Keep external measured benchmark data distinct from MouldMaster synthetic cases and do not copy third-party files into this repository unless the exact version/licence permits it and attribution is preserved.

## Minimum pilot design

Use at least one real process history containing:

- a stable known-good period;
- a documented onset or meaningful drift period;
- an intervention, maintenance action or controlled test where available;
- a recovery/verification period where available;
- enough sequential shots to distinguish sustained change from isolated noise.

Prefer a case where the physical mechanism was independently investigated by competent site personnel. Do not manufacture faults or defeat safeguards to create training data.

## Required governance before data collection

Before using operational data outside its originating site or team:

1. confirm the organisation permits the data to be used for the pilot;
2. identify the approved raw-data storage location and retention owner;
3. remove customer/person identifiers and unnecessary free text;
4. review proprietary part, tool, resin and machine identifiers for re-identification risk;
5. document who is allowed to see the raw and prepared files;
6. confirm the prepared dataset may be used for the intended learning/research purpose;
7. never commit raw production exports to the public MouldMaster repository.

Prepared data remain **pseudonymised, not guaranteed anonymous**.

## Shot-summary schema

The repository template `data/real-process-data-pilot-template.csv` defines the preferred minimum shot-summary fields. Keep field names stable where possible so different pilot datasets can be compared structurally without pooling proprietary values.

Required analytical identity fields:

- `shot_index` — monotonically increasing sequence within the prepared dataset;
- `cavity_alias` — per-file cavity identity;
- `machine_alias` — per-file machine/cell identity;
- `mould_alias` — per-file mould/tool identity;
- `material_alias` — per-file resin/grade identity;
- `lot_alias` — per-file material lot/batch identity where available;
- `phase` — one of `baseline`, `fault`, `test`, `recovery`, `verification` where defensible.

Preferred process/quality fields:

- fill time actual;
- transfer position actual;
- transfer/injection pressure actual;
- cushion actual;
- recovery/plasticising time actual;
- cycle time actual;
- TCU supply/return temperature and flow where available;
- resin moisture or dryer evidence where relevant;
- hot-runner actual/output evidence where relevant;
- part mass and dimensional result where available;
- quality result and de-identified defect category.

Keep units explicit in column names or the data dictionary. Never relabel a setpoint as an actual measurement.

## Optional high-frequency trace companion

Where the source system supports curves, preserve a separate local long-format file with:

- `shot_index`;
- `cavity_alias` where applicable;
- `sample_index` or relative time;
- signal name;
- engineering unit;
- measured value.

Useful traces include screw position, injection velocity actual, injection pressure actual, cavity pressure and cavity/mould temperature. Record sampling rate and sensor identity/calibration state in the local data dictionary.

Do not remove absolute timestamps until shot ordering and intervention alignment have been verified in the controlled source record. Prepared shared files should normally use relative shot/sample indices instead of real timestamps.

## Intervention record

For each controlled test or maintenance action, record separately:

- relative shot index before/after action;
- problem statement;
- ranked mechanism before the action;
- evidence used to choose the action;
- single controlled variable or maintenance/tool action where practicable;
- expected discriminating response;
- actual observed response;
- verification window;
- whether the result supports, weakens or does not resolve the hypothesis.

This prevents retrospective storytelling and keeps root-cause reasoning separate from compensation.

## Pilot acceptance checks

A dataset is ready for MouldMaster pilot analysis only when:

- shot order is valid and missing rows are understood;
- units are known;
- commanded values and actual values are clearly distinguished;
- cavity identity is retained for multi-cavity work;
- material lot/state changes are represented when relevant;
- sensor zero/calibration/replacement events are known where they affect interpretation;
- missing values remain missing rather than silently becoming zero;
- quality labels have a defined inspection method;
- interventions are aligned to the shot sequence;
- raw customer/person/free-text identifiers are absent from the prepared file;
- the site confirms the prepared file is acceptable for the intended use.

## Evaluation questions

For each pilot case, compare the evidence-first workflow against the known investigation:

1. Can a learner detect the physical change without being shown the answer?
2. Which signals are genuinely discriminating versus merely correlated?
3. Does the ranked mechanism match the independently investigated cause?
4. Does MouldMaster recommend checking evidence before changing settings?
5. Does it distinguish a root-cause action from a compensating setting change?
6. Does recovery behave as predicted?
7. Which missing signals create ambiguity?
8. Are any synthetic cases teaching a pattern that conflicts with the real evidence?
9. Are any labels, units or visualisations likely to mislead a learner?
10. What new case or source is justified by the real evidence?

## Evidence record for each pilot case

Keep a local controlled record containing:

- prepared dataset filename and checksum;
- source-system/export description;
- date prepared;
- data owner/approval reference retained outside the public repository;
- fields retained/dropped/aliased;
- known data-quality limitations;
- independent engineering finding, if available;
- MouldMaster diagnostic result;
- differences between app reasoning and site finding;
- corrective content/data action taken;
- reviewer and review date.

Do not publish private approval references, names, raw identifiers or proprietary process values in GitHub issues.

## Repository evidence boundary

The public repository may contain:

- this protocol;
- empty schemas/templates;
- synthetic demonstration data clearly labelled synthetic;
- aggregate findings that have been approved for publication and cannot reasonably identify a customer, person, site, tool, product or proprietary process.

The public repository must not contain raw production exports or site-confidential prepared data merely to prove that the pilot occurred.

## Safety and production boundary

No pilot finding authorises a real production change. Real changes remain subject to the exact machine, mould, material, validated process, approved site procedure, competent risk assessment, change control and applicable safety requirements. Never bypass guards, interlocks or hazardous-energy controls to create or investigate a training case.

## Pilot completion criterion

The first pilot is complete only when at least one approved real dataset has passed the acceptance checks, been evaluated against an independently investigated process finding, produced a documented learning/content conclusion, and retained its evidence under the site's approved data-governance process.

Until then, MouldMaster should describe the real-data path as **pilot-ready**, not as validated on real production data.
