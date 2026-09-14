# Integration batch 2 — supporting Book copy and exercises

This editorial handoff supplies concise chapter-copy candidates for the remaining priority supporting artifacts. It is not learner-runtime content.

## pressure-loss — Pressure depends on where you measure it

Pressure is local to the point and time of measurement. The machine's injection-pressure signal sits upstream of the nozzle, feed system, gates and cavity, so a high machine value can coexist with a weak pressure response in one cavity. When pressure loss is part of the diagnosis, record the sensor location and compare the flow path in sections rather than treating every pressure number as interchangeable.

A useful pressure map follows the melt from machine/nozzle through manifold or runner, gate and cavity. Each restriction can consume pressure and shift timing, and parallel branches can behave differently. Use that map to decide what measurement would isolate the change instead of increasing machine pressure to compensate for an unknown restriction.

## warpage — Similar warpage can come from different mechanisms

Two parts can finish with a similar warped shape for different reasons. Uneven heat removal, asymmetric packing pressure, material morphology and directional fibre orientation can all create differential shrinkage or residual stress. The next test should be chosen from the evidence already present: cooling-flow and temperature measurements for a thermal hypothesis, cavity-pressure history for a packing hypothesis, and material/orientation evidence when anisotropy or morphology is plausible.

Treat warpage as a mechanism-discrimination problem. A process change that improves one part does not prove that the same variable caused another part's deformation, and a statistical effect does not replace physical evidence.

## process-window — Choose a robust region, not one optimum point

A process window is a tested region in which the important outputs remain acceptable, not the single setting that produces the best value for one response. Map more than one outcome—such as fill, dimension, defect level and process variation—and keep the rejected or unstable edges visible. That makes the trade-offs explicit and stops an apparent optimum from hiding another failure mode.

When quality priorities change, re-evaluate which part of the tested region still meets all requirements. Do not extend the claim beyond the material, mould, machine and factor ranges that were actually evaluated.

## documentation — Record maintenance so recovery can be proved

A maintenance record should preserve enough information to connect the asset, its production exposure, the observed condition, the work carried out and the verified result. Record stable mould and component identity, shot count or other defensible exposure, the measured pre-maintenance condition, the specific intervention, the post-maintenance condition and a comparable part-quality or metrology check.

“Cleaned mould — running OK” is not enough for later diagnosis. If a value was never measured, record it as missing rather than reconstructing it after the event. The purpose of the record is to let a future engineer test whether the same degradation pattern is returning and whether the previous intervention genuinely restored performance.

## process-monitoring — Recovery needs a trajectory, not one good part

When a process is recovering after cleaning, changeover or intervention, preserve cycle and cavity identity and watch the response over repeated parts. One acceptable part can occur before the system has stabilised. Define the measurement method and a stop rule in advance, then require enough consecutive evidence to show that the recovery has settled.

Cycle-resolved hot-runner colour-change research demonstrates the value of this chronology, but colour carryover is only an analogue for the method. Do not transfer its numerical recovery curve to black-speck behaviour.

## multi-cavity — Total flow can recover while one cavity stays different

Keep cavity identity after a maintenance intervention. A large improvement in total cooling flow or system pressure loss does not prove that every parallel circuit is balanced. Compare local flow and thermal response by cavity or zone, then verify the associated part result. If one cavity remains different, diagnose the local path rather than assuming the system-level improvement solved the whole tool.

## Boundary

Final learner-runtime integration must preserve chapter applicability, source-first language, explicit synthetic labels and the existing Book review boundary. It must update source/runtime Book pairs identically and undergo the release QA required for changed learner-runtime bytes.
