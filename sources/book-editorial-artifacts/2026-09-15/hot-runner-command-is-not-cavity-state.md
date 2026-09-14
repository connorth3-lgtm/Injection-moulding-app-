# Hot runner: command is not cavity state

Status: Book-ready editorial artifact specification. Research/editorial only; not learner-runtime content.

## Teaching purpose

A valve-open command is only the first event in a chain. The Book should teach learners to separate what the controller requested from what the actuator actually did, what restriction the melt experienced, what pressure reached the cavity, and what happened to the moulded part.

## Figure composition

Draw one left-to-right signal chain with eight boxes:

1. **Controller command** — open/close command or target stroke.
2. **Target valve-pin stroke** — the intended mechanical state.
3. **Actual valve-pin motion/position** — the measured mechanical state.
4. **Actuator effort** — motor current, torque or force where available.
5. **Hot-runner restriction** — the effective local flow resistance created by pin position and melt conditions.
6. **Local melt pressure / branch flow** — the hydraulic response in the runner branch.
7. **Cavity pressure** — the pressure actually observed in the mould cavity.
8. **Cavity-specific part quality** — weight, dimensions, appearance or other measured outcome.

Place a small evidence badge beneath each arrow:

- **Measured in published experiments** under links supported by the 2003 valve-gated pressure/flow work and the 2022 cavity-pressure-control work.
- **Instrumentable in modern systems** under actual pin position and motor-current/force monitoring documented in modern electric valve-gate systems.
- **Measured quality response** under the distributed melt-control studies that reported dimensional, Cp and part-weight outcomes.
- **Open acquisition gap** under any arrow requiring one synchronized public dataset that joins command, actual position, actuator effort, cavity pressure and cavity-specific quality on the same cycles.

Add one bold caption under the complete figure:

> **Commanded state is not measured mechanical state; measured mechanical state is not cavity state; cavity state is not part quality. Diagnose the chain rather than assuming the links.**

## Evidence notes for the figure

The 2003 two-cavity valve-gated study reports a distinct valve-opening sequence together with injection pressure, cavity pressure, screw-position-derived inlet flow and estimated branch flow. It therefore supports the chronology between valve-gate events and local hydraulic response, but it does not provide a modern servo pin-position/current dataset.

The 2022 servo-electric hot-runner study varied valve-pin opening stroke to change pressure resistance and cavity-pressure transfer. Its PID controller compared measured cavity pressure with a reference curve and used pin movement for compensation. It could compensate provoked holding-pressure disturbances, but not material-behaviour changes such as mould-temperature fluctuations. That distinction is useful: even a correctly moving valve cannot compensate every process mechanism.

Modern electric valve-gate documentation reports continuous valve-pin position monitoring, motor-current/force information and process-data export; a documented 4+4-cavity cell used two cavity-pressure sensors per cavity. Treat this as instrumentation-capability evidence, not proof that a synchronized quality dataset has been published.

The Kazmer dynamic-melt-control family provides downstream quality evidence. Across the linked studies, distributed/local melt control was associated with measured dimensional capability, Cp, part-weight consistency and productivity trade-offs. Keep the family grouped as one research programme rather than four independent replications.

## Worked diagnostic exercise

### Scenario

A four-cavity tool uses sequential electric valve gates. The controller log shows that Gate 3 receives its normal open command, but Cavity 3 develops a weaker pressure rise and lower part weight while the other cavities remain stable.

### Learner task

Select the next three measurements or comparisons that best separate these possibilities:

- controller/timing problem;
- mechanical valve-pin problem;
- actuator load or obstruction problem;
- melt-flow restriction downstream of the pin;
- cavity-side pressure/packing problem.

### Expected reasoning

A strong answer should first compare **command versus actual valve-pin position**, then inspect **actuator effort/current/force** for abnormal load, then compare the **local cavity-pressure trace** with the other cavities and with the expected timing. Part quality is the final outcome, not a substitute for the missing intermediate measurements.

A weak answer changes hold pressure, melt temperature or valve timing before establishing whether the commanded valve motion actually occurred.

## Editorial boundaries

- Never infer actual pin movement from command alone.
- Do not present modern servo systems as experimentally equivalent to the older dynamic/self-regulating-valve research family.
- Do not imply that current/force alone identifies root cause; it is one mechanical-state signal.
- Published aggregate quality improvements do not mean the project possesses synchronized raw actuator/cavity/quality traces.
- Any reported Cp, weight or productivity values remain attached to their original mould, material and actuator context.

## Source routes

- wave6:pps-2003-realtime-flow-rate-valvegated-hotrunner
- wave7:jpe-2022-hotrunner-crosssection-pressure-control
- wave7:ewikon-2022-electric-valve-gate-observability
- wave9:ipp-1998-multicavity-melt-control-quality
- wave9:pes-1997-multicavity-pressure-control-capability
- wave9:prc-2004-selfregulating-valve-consistency
- wave9:prc-2004-selfregulating-valve-productivity

## Production instruction

Create the final Book graphic from this specification as an original composition. Do not trace or reproduce third-party diagrams. Keep the open acquisition gap visually explicit rather than silently joining evidence from different systems into a synthetic measured dataset.
