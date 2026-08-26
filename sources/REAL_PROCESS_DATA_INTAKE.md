# MouldMaster real process-data intake standard

Status: engineering/data-learning guidance only  
Reviewed: 2026-08-26  
Scope: local preparation of de-identified or pseudonymised injection-moulding process data for evidence-led learning and troubleshooting.

## Why this exists

The synthetic libraries teach mechanism recognition, but real investigations depend on whether the source data preserve the physical process. A large CSV is not automatically useful data. The highest-value records keep **shot order, cavity identity, actual machine response, material state, tool/thermal state, quality outcome and intervention timing** tied together.

The browser/desktop intake tool processes a selected CSV in memory only. It removes timestamp/direct-identifier fields by default, aliases operational identifiers per file, keeps numeric evidence signals, and exports a prepared CSV plus data dictionary. This is **pseudonymisation, not guaranteed anonymisation**; the prepared output still needs human review before sharing.

## Preferred capture hierarchy

### Tier 1 — minimum useful shot record

- shot/cycle sequence number
- machine/cell identity (may be aliased during preparation)
- mould/tool and cavity identity
- material grade and lot/batch identity
- fill time actual
- transfer position actual
- transfer/injection pressure actual
- cushion actual
- cycle time actual
- part quality outcome / defect code

Without cavity, material and shot identity, many otherwise strong correlations become ambiguous.

### Tier 2 — scientific-moulding evidence

- screw position versus time
- injection velocity actual versus time
- injection pressure actual versus time
- cavity pressure curve or pressure features
- cavity/mould temperature curve or features
- pressure-time area / integral where validated
- actual melt temperature measurement where available
- part mass
- cooling time and ejection temperature

Prefer actual response over screen setpoints when diagnosing whether the physical process changed.

### Tier 3 — material and auxiliary state

- dryer dew point / air temperature / residence history
- measured resin moisture where applicable
- material lot, recycled-content blend and regrind fraction where controlled
- TCU supply temperature
- TCU return temperature
- circuit flow
- circuit differential pressure where available
- hot-runner zone actual temperature
- hot-runner heater output/current/duty where available

These signals help separate material/thermal/tooling mechanisms from recipe compensation.

### Tier 4 — machine and maintenance condition

- plasticising/recovery time
- screw rotation actual
- back-pressure actual
- motor current / torque proxy where available
- hydraulic/oil temperature on hydraulic machines
- vibration or condition-monitoring features
- maintenance event code
- component change/inspection event

Machine-condition evidence should lead to approved maintenance investigation rather than being hidden with moulding settings.

### Tier 5 — quality and metrology

- cavity-resolved part mass
- dimensional result with characteristic ID
- inspection method / gauge ID where appropriate
- measurement repeatability/reproducibility study link or state
- visual defect class
- vision score only when linked to physical confirmation
- accepted/rejected result

Do not pool cavities or measurement methods if doing so can hide a local problem.

## Intervention record

For troubleshooting, preserve a separate event record containing:

- relative shot index at intervention
- reason for intervention
- one controlled variable or maintenance/tool action where possible
- hypothesis being tested
- expected discriminating response
- actual observed response
- verification window / repeat cycles

This supports **baseline → fault → controlled test → recovery → verification** rather than retrospective story-building.

## Data-quality checks before analysis

1. Confirm units and distinguish commanded values from actual values.
2. Confirm timestamps/shot order are monotonic before timestamps are removed for sharing.
3. Confirm cavity identity is retained when multi-cavity behaviour matters.
4. Confirm sensor zero/calibration state and any sensor replacement event.
5. Confirm missing values are represented consistently; do not silently convert missing data to zero.
6. Confirm material grade/lot changes and dryer interruptions are captured.
7. Confirm maintenance/tool changes are timestamped relative to the shot sequence.
8. Confirm quality labels come from a known inspection method.
9. Check sampling rate before comparing high-frequency curves.
10. Keep the original raw export under the site's approved data-retention/security process; MouldMaster's prepared export is not a substitute for the controlled source record.

## Privacy and confidentiality

- Do not assume an aliased machine/tool/material value is anonymous.
- Remove customer names, people names, email/phone/address fields and unnecessary free text before sharing.
- Review part numbers, proprietary grade names, mould IDs and rare event combinations for re-identification risk.
- Use the local intake tool only as a preparation aid; follow organisational confidentiality and data-governance requirements.
- Raw selected CSV data are not uploaded or persisted by the MouldMaster intake module.

## Engineering boundary

This capture standard does not define acceptable production limits, validated process windows, maintenance thresholds or universal setpoints. Any real process change remains subject to the exact machine, mould, material, validated process, approved site procedure, change control and applicable safety requirements.

## Recommended next evidence expansion

The highest-value future real-data studies are:

1. cavity-pressure curve repeatability by cavity
2. command-versus-actual screw position/velocity/pressure traces
3. transfer and cushion repeatability across machines
4. TCU flow/temperature/differential-pressure histories
5. hot-runner output/current versus displayed temperature
6. resin moisture/dew-point/lot histories tied to shot data
7. part mass/dimension/defect labels tied to exact shots and cavities
8. machine vibration/current trends tied to maintenance findings
9. controlled before/after tooling maintenance evidence
10. de-identified process-transfer studies between machines

These should be treated as evidence sets to investigate mechanisms, not as a source of generic production recipes.
