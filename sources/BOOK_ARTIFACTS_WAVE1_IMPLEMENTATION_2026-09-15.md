# Book evidence artifacts — implementation pack 1

Status: editorial implementation specification only. No learner-runtime content is changed by this file.

These four artifacts are original Book compositions built from the evidence routes in `book-evidence-to-artifact-plan-v1.json`. They are deliberately specified as **new diagrams/exercises**, not adaptations of publisher figures.

---

## Artifact A — Hot runner: command is not cavity state

**Target chapters:** Hot runners; Cavity pressure; Multi-cavity; Process monitoring

**Learning objective:** Teach the learner to distinguish a controller instruction from the mechanical state of the valve pin, the resulting melt restriction, the local cavity response, and the final quality outcome.

### Figure structure

Draw one left-to-right chain with seven boxes:

1. **Controller command** — open/close command or target stroke.
2. **Actual valve-pin motion** — measured position/stroke; may lag, differ, stick or not reach the target.
3. **Actuator effort** — motor current / torque / force where available.
4. **Hot-runner restriction** — effective flow area and pressure loss at the gate/nozzle.
5. **Local melt response** — branch flow and pressure transfer.
6. **Cavity response** — cavity-pressure trace at a stated sensor position.
7. **Part outcome** — cavity-specific weight, dimension, appearance or another measured quality characteristic.

Use solid arrows only for causal/physical links supported by the system architecture. Under each box add a small **MEASURE HERE** tag. Under box 2 explicitly add: **A command is not proof of motion.**

### Evidence tags below the chain

- `wave6:pps-2003-realtime-flow-rate-valvegated-hotrunner` — measured valve-gated pressure/flow chronology.
- `wave7:jpe-2022-hotrunner-crosssection-pressure-control` — servo-electric opening stroke used to change pressure resistance and cavity-pressure transfer.
- `wave7:ewikon-2022-electric-valve-gate-observability` — actual valve-pin position and motor-current/force observability; cavity-pressure sensing in a documented demonstration cell.
- `wave9:kazmer-dynamic-melt-control-1997-2006` — distributed melt control linked to measured dimensions, Cp and part-weight consistency.

### Gap overlay

Place a dashed bracket across boxes 1–7 labelled:

**Still wanted: one rights-clear synchronized dataset joining command + actual position + actuator effort + cavity pressure + cavity-specific quality on the same cycles.**

### Diagnostic exercise

**Scenario:** Gate 3 receives an OPEN command at the expected time. The machine pressure rises normally, but cavity 3 fills late and finishes light. Cavities 1, 2 and 4 are normal.

**Learner question:** Which measurement should you request next, and what would each possible result tell you?

**Expected reasoning:**

- Check **actual pin position**, not the command history alone.
- If actual position is late/short: investigate actuator/mechanical motion and controller/drive state.
- If position is correct but motor current/force rises abnormally: suspect mechanical resistance, contamination or pin/gate friction.
- If position/current are normal but local pressure transfer is weak: investigate restriction, melt condition or hot-runner pressure loss.
- If local cavity pressure is normal but part weight/dimension is wrong: move downstream to gate seal, cooling, measurement or material effects rather than blaming the valve command.

### Caption

**Commanded valve state, actual mechanical state, melt response and cavity-specific quality are different pieces of evidence. A troubleshooting sequence becomes stronger when each link can be measured rather than inferred.**

---

## Artifact B — Black speck: observation to discriminating evidence

**Target chapters:** Black specks; Diagnostic method; Complex diagnostics

**Learning objective:** Replace single-cause black-speck troubleshooting with evidence that separates contamination, thermal degradation, stagnant material and feed-system causes.

### Figure structure

Start with one box: **Black/brown inclusion observed**.

Split into four hypothesis branches:

### Branch 1 — External / feed contamination

Evidence to seek:
- hopper/feed cleanliness inspection
- incoming material sample comparison
- defect onset after material handling/change
- contamination morphology inconsistent with thermally degraded polymer

Intervention proof:
- remove contamination source
- document exact intervention time
- verify repeated post-intervention recovery

### Branch 2 — Previous material / stagnant region

Evidence to seek:
- defect chemistry or colour matching previous resin/masterbatch
- purge response over ordered cycles
- hot-runner/barrel dead-zone suspicion supported by location/history
- defect frequency decays after targeted cleaning/purge

Intervention proof:
- targeted cleaning/purge
- cycle-resolved recovery, not one clean part

### Branch 3 — Thermal degradation / carbonisation

Evidence to seek:
- barrel/hot-runner temperature and residence-time history
- material-specific degradation evidence
- inclusion microscopy / spectroscopy where justified
- defects worsen with exposure/hold history rather than random incoming contamination

Intervention proof:
- remove degraded inventory / clean affected region
- correct causal thermal/residence condition
- verify sustained recovery

### Branch 4 — Tooling / filter / process-local source

Evidence to seek:
- case-specific filter/mesh or local restriction evidence
- defect location/pattern tied to one flow path or cavity
- intervention isolates the suspect hardware rather than changing many settings at once

Intervention proof:
- documented hardware change/cleaning
- before/after production data plus sustained control

### Evidence panel

Use two compact case cards:

**Curbano 2023 plant case**
- Black-spot defect share before intervention: **7.85%**
- Study root cause: filter-mesh design
- After implementation: **2.16%**
- Process Z: **1.42 → 2.02**
- Boundary: single-company case; not a universal black-speck mechanism.

**Rattanabunditsakun 2014 plant/thesis case**
- Black-dot proportion: **0.65% → 0.34%**
- Reported reduction: **47.69%**
- Significant study factors included dirty/carbonised barrel and screw, trapped previous material, raw-material degradation and hopper contamination.
- Boundary: plant/machine/material-specific; no public shot-order onset/recovery trace established.

### Diagnostic exercise

Give learners three evidence packets with the same initial symptom:

- **Packet A:** black specks begin immediately after a dark-to-natural material change and fall steadily with each purge cycle.
- **Packet B:** defect frequency grows after repeated long holds at temperature and inclusion analysis is consistent with degraded polymer.
- **Packet C:** only one cavity shows defects and the issue disappears after a local feed/filter intervention.

Ask: **What is the leading hypothesis, what evidence supports it, and what would you measure before declaring root cause?**

### Caption

**Black specks are an observation, not a diagnosis. Strong troubleshooting separates competing mechanisms with chronology, material evidence, flow-path evidence and verified recovery.**

---

## Artifact C — Cooling restriction: diagnose, restore, verify

**Target chapters:** Cooling; Diagnostic method; Process monitoring

**Learning objective:** Show cooling maintenance as a measured hydraulic/thermal recovery problem rather than a parameter-adjustment problem.

### Figure structure

Use four vertical stages:

1. **Detect**
   - flow imbalance
   - excessive pressure loss
   - abnormal return temperature / slow thermal stabilization
   - cavity/zone-specific deformation or quality drift

2. **Localize**
   - compare zones/cavities
   - confirm zero/low-flow circuits
   - distinguish supply problem from local restriction
   - inspect/diagnose sediment, sludge or scale where evidence supports it

3. **Intervene**
   - clean/restore circuit
   - document method and affected zone
   - avoid changing unrelated process settings during the maintenance proof

4. **Verify**
   - repeat flow/pressure measurements
   - repeat thermal response
   - compare cycle time / defect / dimensional evidence
   - confirm balance, not only higher total flow

### Before/after evidence cards

**Production case A**
- Flow: **0.3 → 0.6 L/min**
- Cycle time: **70 → 63 s**
- Reported voids: reduced to **zero**

**Production case B**
- Flow: **0.2 → 1.1 L/min**
- Heat-up: **90 → 60 min**

**8-cavity cleaning case**
- Flow: **0.6 → 2.0 L/min**
- Pressure loss: **416 → 362 kPa**

**16-zone imbalance case**
- **5 of 16** cooling zones had no measurable flow
- Part deformation reported at **>1 mm**

Attach the label **case evidence — not universal limits** to every card.

### Diagnostic exercise

**Scenario:** A 16-zone mould develops >1 mm deformation. Five zones show no measurable flow. The operator proposes increasing packing pressure and extending cooling time.

Ask learners to create a three-step evidence plan before changing the moulding recipe.

**Expected answer:**
1. Verify the zero-flow readings and supply conditions.
2. Localize restriction/imbalance and restore the affected circuits.
3. Re-measure flow/pressure/thermal response and part deformation before deciding whether any process-setting change remains necessary.

### Caption

**Cooling maintenance is complete only when the intervention is followed by hydraulic/thermal measurement and production verification. Higher total flow alone does not prove every cavity or zone is balanced.**

---

## Artifact D — Mould lifecycle: run-in, production, degradation and intervention

**Target chapters:** Mould anatomy; Process monitoring; Dimensional stability; Documentation

**Learning objective:** Separate three different concepts that are often collapsed into one: statistical lifecycle state, physical wear/condition, and maintenance/recovery evidence.

### Figure structure

Draw a horizontal asset-life axis labelled **shots/cycles**. Above it place four states:

1. **Run-in**
2. **Stable production**
3. **Degradation / worn-out risk rising**
4. **Maintenance / refurbishment event**

After the intervention, branch to two possible outcomes:
- **verified recovery** — condition and part quality return toward a defined baseline
- **incomplete recovery / new failure mode** — additional diagnosis required

### Evidence layers

Use three stacked tracks below the life axis:

**Track A — Part metrology / quality**
- Example source: 13 high-volume production moulds with part metrology plus lifecycle data.
- Reported XGBoost in-class accuracy: **88% worn-out**, **73% early run-in**, **61% production**.
- Label: **classification evidence, not direct wear measurement**.

**Track B — Maintenance event history**
- Industrial history: **April 2011–March 2024**
- **64,020 maintenance notifications**
- **9,157 unique injection moulds**
- **2,553 spare parts**
- Shot counts available at maintenance notifications.
- Label: **event/exposure evidence; component condition and post-maintenance quality not fully linked in the public evidence**.

**Track C — Physical condition / intervention proof**
- Desired but still incomplete at fleet scale: measured component condition before maintenance + exact action + post-condition + comparable part quality/metrology.
- Label this track **current acquisition gap**.

### Diagnostic exercise

Provide a fictionalized trend where one dimension drifts steadily over 200k shots and a maintenance event occurs at 1.2M shots. After maintenance the dimension returns near baseline for 50k shots.

Ask:
- What does the quality trend prove?
- What does it *not* prove about physical wear?
- Which inspection/condition measurement would turn the maintenance event into stronger causal evidence?

**Expected reasoning:**
- The trend supports an asset-linked change and recovery.
- It does not identify the worn component or wear mechanism by itself.
- Add pre/post measured component condition (wear, clearance, flow restriction, surface condition, etc.) tied to the same event.

### Caption

**Lifecycle prediction, maintenance history and physical wear are related but not interchangeable. Strong evidence links exposure, measured condition, intervention and verified recovery on the same asset.**

---

## Implementation rules for all four artifacts

- Keep source IDs in the editorial/source layer even if final learner-facing graphics use numbered references.
- Redraw every figure from first principles; do not trace or crop third-party graphics.
- Keep all reported numerical results adjacent to their case/source context.
- Use explicit labels such as **measured**, **reported case**, **model classification**, **supplier capability** and **acquisition gap**.
- Do not convert percentages, pressures, flow rates, cycle times, maintenance durations or Cp improvements into recommended settings.
- Before learner-runtime integration, run the normal Book human-review and source/rights checks in a separate content PR.