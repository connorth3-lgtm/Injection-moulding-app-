# Pressure depends on where you measure it

Status: Book-ready measurement-diagram specification. Research/editorial only; not learner-runtime content.

## Teaching purpose

Pressure is not one number for the whole moulding system. The Book should teach learners to ask **where**, **when** and **how** pressure was measured before comparing values or diagnosing a restriction.

## Figure composition

Draw an original simplified melt path from machine to cavity with five measurement regions:

1. **Machine / hydraulic or drive response**
2. **Nozzle / injection pressure**
3. **Hot-runner manifold or branch**
4. **Gate-near region**
5. **Cavity pressure sensor location**

Between each region, show arrows labelled **pressure loss + time delay + geometry/rheology dependence**.

Under the mould, add two cavity branches to illustrate that the same upstream machine event can produce different downstream cavity responses.

Add the central rule:

> **A high upstream pressure does not prove that the cavity received high pressure. A low cavity pressure does not identify which upstream restriction caused it.**

## Measurement notes

The 2003 valve-gated two-cavity work measured injection pressure and cavity pressure while estimating branch flow from measured inlet-flow information and pressure histories. It supports teaching that valve sequence and branch conditions change the pressure/flow state locally.

Scientific-moulding and cavity-pressure evidence in the project similarly supports separating machine/nozzle demand from what arrives at the gate and cavity. The Book should avoid comparing absolute values from different sensor locations as if they were interchangeable.

## Diagnostic exercise

### Scenario

Machine injection pressure rises by 20% compared with the established baseline. Cavity 1 pressure remains normal, while Cavity 2 fills late and reaches a lower peak pressure.

### Task

Rank the most useful next measurements or comparisons.

### Expected reasoning

A strong answer should compare:

- the two cavity-pressure traces and timing;
- branch/gate restrictions feeding Cavity 2;
- actual valve-gate state if applicable;
- nozzle/manifold pressure where available;
- process conditions affecting viscosity and pressure loss;
- evidence of a local cooling or venting mechanism if the pressure difference alone cannot explain quality.

The learner should not conclude “machine pressure is too high” simply because the machine reports a larger upstream demand.

## Editorial boundaries

- Sensor position must accompany every pressure value used for diagnosis.
- Compare traces only when units, calibration, zeroing and timing reference are understood.
- Do not infer cavity pressure from machine hydraulic pressure or vice versa without a validated relationship for that machine/process.
- Pressure loss is process- and geometry-dependent; avoid universal allowable-drop numbers.

## Source routes

- wave1:jmmp-2021-scientific-moulding-transfer
- existing:scatimdata-avaps
- wave6:pps-2003-realtime-flow-rate-valvegated-hotrunner
- existing:impure-pascoe-2022

## Production instruction

Create the final pressure-location map as an original Book graphic. Use generic geometry and clearly mark all sensor locations. Do not reproduce source schematics.
