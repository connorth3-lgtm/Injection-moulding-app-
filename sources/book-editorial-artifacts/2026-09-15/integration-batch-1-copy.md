# Integration batch 1 — chapter copy

This file contains the proposed prose additions for the first four priority Book chapters. It is an editorial handoff, not learner-runtime content.

## hot-runners — Command is not cavity state

A valve-open command tells you what the controller requested. It does not prove that the pin reached the intended position, that the melt saw the expected restriction, or that the cavity received the expected pressure. Where the hardware allows it, compare commanded state with actual pin position or motion, actuator effort and the cavity-pressure response. Treat each step as evidence in a chain rather than assuming one signal proves the next.

Modern electric valve-gate systems can expose pin position and actuator-current or force information, and experimental work shows that changing local valve restriction can change cavity-pressure transfer. Older distributed melt-control studies also show downstream effects on dimensions, part-weight consistency and process capability. Those studies come from different systems and should not be fused into a single synthetic measured dataset. The practical lesson is simpler: diagnose from command to mechanism to cavity to part.

## black-specks — Build evidence before naming the cause

A black speck is an observation, not a root cause. Start by describing when and where it appears, which cavity is involved and whether the pattern follows downtime, a material container, a changeover or a particular flow path. Then use the safest observation or test that separates competing explanations such as foreign contamination, degraded or stagnant polymer, feed-system carryover, or a tooling/flow-path source.

Published production cases show that very different interventions can reduce superficially similar black-spot defects. That is useful evidence for method, not a universal repair list. A corrective action becomes much more convincing when the suspected mechanism, intervention and repeated recovery are linked in time and competing explanations have been tested. Until then, keep the language at the level the evidence supports.

## cooling — Diagnose, restore and verify

When cooling is suspected, measure the hydraulic and thermal system before moving the process. A temperature-control-unit setpoint cannot tell you whether every circuit is carrying coolant or whether parallel paths are balanced. Compare circuit flow, pressure loss and temperature response where practical, localise restrictions or zero-flow paths, then choose the maintenance action that fits the physical evidence.

After cleaning, repair or balancing, repeat the same measurements. A restored flow rate or lower pressure loss proves hydraulic recovery, not automatically product recovery, so verify the relevant part response separately. Production case studies report large improvements after cooling-circuit maintenance, but their flow, pressure, cycle-time and defect values belong to those particular tools and are examples rather than generic thresholds.

## mould-anatomy — Mould condition changes through its life

A mould's condition is part of the process history. Shot exposure, cleaning, component maintenance and physical wear can change how the tool behaves over time, and part metrology can sometimes reveal that change before the mechanism is obvious. Long-horizon production studies show that mould identity, shot count and maintenance events can be tracked at scale, while lifecycle studies show that statistical patterns in part measurements can distinguish different stages of tool life.

Keep three kinds of evidence separate: a statistical state label, a recorded maintenance event and a measured physical condition are not the same thing. Before calling a component worn, inspect or measure the relevant hardware. After maintenance, repeat comparable condition and part-quality measurements so the new baseline is based on verified recovery rather than the fact that work was carried out.

## Boundary

These additions intentionally contain no universal setpoints, maintenance intervals or repair recipes. Final integration must preserve current chapter applicability and review boundaries and must keep the `data/` and runtime Book copies byte-identical.
