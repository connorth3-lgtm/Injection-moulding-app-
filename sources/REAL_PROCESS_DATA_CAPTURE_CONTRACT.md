# MouldMaster real process-data capture contract

Status: required metadata contract for authorised real-site pilot work; no production-control authority  
Reviewed: 2026-08-29

## Acceptance rule

**No measured value becomes accepted evidence unless its field meaning, engineering unit, sampling basis and cycle/source linkage are known.** Where a channel depends on a physical sensor, its measurement location and calibration/zero state must also be known well enough for the intended interpretation.

This contract supplements `REAL_PROCESS_DATA_PILOT_PROTOCOL.md` and `REAL_PROCESS_DATA_INTAKE.md`. Raw factory exports remain under the site's approved governance process and must not be committed to the public repository.

## Required capture pack

A serious real-site pilot should be prepared as a linked set rather than one oversized CSV:

1. `data/real-process-data-pilot-template.csv` — one row per prepared shot/cavity summary.
2. `data/real-process-data-dictionary-template.csv` — definition of every retained field/channel.
3. `data/real-process-trace-template.csv` — optional long-format high-frequency traces linked to shot/cavity.
4. `data/real-process-sensor-calibration-template.csv` — sensor location, unit, calibration/zero/scaling and validity window.
5. `data/real-process-event-template.csv` — process changes, maintenance, interventions and verification windows aligned to relative shot/time order.

The public templates are header-only. Site values belong in approved private working storage.

## Shot/cycle evidence

Preserve, where available and authorised:

- source shot/cycle order and source timestamps long enough to prove ordering and event alignment;
- prepared `shot_index` after the ordering check;
- machine, mould/tool, cavity, material, lot/batch and production-period identity using approved aliases in the prepared shareable layer;
- actual process response rather than screen setpoints where diagnosis depends on physical response;
- material batch/lot, measured moisture, drying history, dryer/dew-point evidence and regrind fraction where relevant;
- tool/cavity identity, maintenance history and process-change/intervention alignment;
- defect, mass, dimensional or inspection outcomes linked to the exact cycle/cavity where possible.

Absolute timestamps may remain in the controlled raw/source record. They should normally be removed or converted to relative order/time in a prepared shareable file after sequence and intervention alignment are verified.

## Data dictionary requirements

Every retained field or trace channel must define:

- source system and source field/channel name;
- exact meaning;
- role: identity, direct measurement, command/setpoint, derived value, quality label, event or metadata;
- measurement location where physically meaningful;
- explicit command/setpoint versus actual/measured semantics;
- engineering unit;
- data type and allowed values where applicable;
- sampling basis and sampling rate/time basis for sampled signals;
- missing-value codes and whether zero is a valid physical value;
- scaling factor, offset or conversion rule if the stored value is not already engineering units;
- cycle/cavity/quality linkage;
- sensor/calibration reference where applicable;
- confidentiality classification and unresolved limitations.

Unknown semantics must be recorded as unknown and remain non-counting where they affect interpretation. Do not infer units or meanings solely from abbreviated column names.

## Sensor and calibration requirements

For sensor-backed channels record, where available:

- stable sensor/channel ID;
- physical measurement location;
- machine/mould/cavity context;
- engineering unit;
- calibration state/reference;
- scale factor, offset and zero/reference state;
- sampling rate;
- validity window by shot range or controlled source time;
- replacement, re-zero or relocation events.

A calibration record is evidence about interpretation, not permission to make a production change.

## Material-state requirements

Where material state could confound the mechanism, link the relevant shot range to:

- material and lot/batch alias;
- measured moisture and method where available;
- drying temperature/time history and dryer/dew-point evidence;
- regrind or recycled-content fraction where controlled;
- material changeover or interruption events.

Do not generalise one grade, lot, drying history or regrind fraction to another material without independent evidence.

## Tool, maintenance and process-change requirements

Preserve relative timing for:

- mould/tool and cavity identity;
- maintenance, cleaning, component replacement and inspection events;
- TCU/hot-runner/tooling changes where relevant;
- approved process changes and controlled diagnostic tests;
- expected discriminating response and verification window.

Event timing should be linked to `shot_index` and relative time after source timestamps have been reconciled.

## Quality outcome requirements

Prefer cycle/cavity-resolved outcomes with a defined method:

- accepted/rejected result;
- physical defect class;
- part mass;
- dimensional characteristic and unit;
- inspection/metrology method or approved alias;
- vision/model output only when its relationship to physical inspection is understood.

Do not pool cavities or inspection methods if pooling can hide a local effect.

## Generalisation programme

After one pilot is interpretable, test transfer rather than assuming it:

1. repeat across another production period on the same machine/tool/material;
2. repeat across another mould/cavity configuration;
3. repeat across another material/lot state;
4. repeat across another machine or cell;
5. compare whether the same signal/mechanism relationship survives differences in machine, mould, material and period;
6. record failures to generalise as evidence, not as data to discard.

A finding should not be described as broadly generalised until independent machine/material/mould/period evidence supports that claim.

## Current external-data priority order

1. Cross-process data dictionary and lower-workpiece TXT format — issue #73.
2. ImPure analogue-input and sensor-channel definitions — issue #74.
3. Warwick Origin/OriginPro export — issue #75.

These tasks may unlock already obtained data, but they must obey the same rule: unknown units/semantics or ambiguous source structure remain non-counting.

## Safety and governance boundary

This contract is for evidence quality, learning validation and diagnostic-method evaluation. It does not define validated process windows, universal settings, maintenance limits or automatic control logic. Real changes remain subject to the exact machine, mould, material, approved process, site procedures, change control, competent engineering review and applicable safety requirements.
