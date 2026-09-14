# Cleaning recovery is a trajectory, not an after photo

Status: Book-ready time-series teaching-plot specification. Research/editorial only; not learner-runtime content.

## Teaching purpose

A single clean-looking part does not prove that a system has recovered. The Book should teach recovery as a time/cycle trajectory with a defined observation method and stop criterion.

## Plot composition

Create an original conceptual plot with:

- x-axis: **Cycle number after cleaning/changeover begins**
- y-axis: **Residual visual contamination / colour carryover signal**
- one curve for **combined injection-unit + hot-runner cleaning**
- one curve for **hot-runner cleaning after the injection unit has already been cleaned**

Do not digitise or trace the publisher's curves. Draw independently shaped monotonic recovery curves and label them **conceptual reconstruction from reported milestones, not raw source data**.

## Source-backed milestones

For the two-cavity valve-gated ABS study:

- each sampled part was identified by **cycle and cavity**;
- combined injection-unit + hot-runner cleaning was visually complete at approximately **135 cycles**;
- modelled cycles to **99% clean** were **148 and 132 cycles** for the two nozzles during combined cleaning;
- after the injection unit was cleaned separately, the hot-runner-only case was modelled at **34 and 34 cycles** to 99% clean;
- reported cleaning material use was **6.3 kg** for combined cleaning versus **3.2 kg** for the separated approach;
- reported time/material consumption was about **50% lower** when injection unit and hot runner were cleaned independently;
- the saturation-curve model described the measured colour-change data with **97.8% accuracy**.

## Book callout

> **Recovery needs chronology. Define what is being measured, identify every sample by cycle/cavity, and require sustained evidence before declaring the system clean or stable.**

## Learner exercise

A technician wants to stop purging as soon as one visually acceptable part appears.

Ask learners to define an evidence-based stop criterion using:

- repeated consecutive samples;
- cavity identity;
- an objective visual/measurement threshold;
- a rule for restarting the count if contamination reappears;
- enough cycles to demonstrate stabilization rather than a single acceptable part.

### Expected reasoning

A strong answer requires repeated observations and preserves cavity identity. It recognises that different flow paths can recover at different rates, and that the stop rule should be based on the chosen measurement method rather than intuition alone.

## Transfer boundary

This study concerns **colour changeover/cleaning**, not black-speck generation. Use it to teach chronology, sample identity and recovery verification only. Do not state or imply that black-speck contamination follows the same numerical trajectory.

## Source routes

- wave7:polytest-2022-hotrunner-color-changeover-cycle-trace

## Production instruction

Build an original conceptual chart from the reported milestones. Every non-source curve must be labelled conceptual. Keep the two cavities/flow paths visible in the teaching narrative even if the final visual simplifies them.
