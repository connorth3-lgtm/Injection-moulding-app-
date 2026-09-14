# Cooling restriction: diagnose, restore, verify

Status: Book-ready editorial artifact specification. Research/editorial only; not learner-runtime content.

## Teaching purpose

Cooling problems should be diagnosed as hydraulic and thermal systems, not treated as a nominal temperature-setting problem. The Book should show the complete chain from measured symptom through localization, maintenance and post-maintenance verification.

## Figure composition

Draw a four-stage horizontal process:

### 1. Detect the symptom

Possible evidence:

- low or unequal circuit flow;
- high pressure loss;
- unstable return temperature or parting-line temperature difference;
- long heat-up or cycle time;
- cavity-to-cavity dimensional/warpage difference;
- voids or other quality symptoms plausibly affected by cooling;
- zones with zero measurable flow.

Key question: **Is the problem actually hydraulic/thermal, or are we only looking at a machine setpoint?**

### 2. Localise the restriction or imbalance

Measure and compare circuit flow, pressure drop and temperature response by loop/zone. Inspect for fouling, corrosion, sediment, sludge, scale, blocked fittings, leaks, incorrect balancing and parallel-circuit short paths.

Key question: **Which circuit or zone fails to carry the expected coolant, and is the restriction local or system-wide?**

### 3. Restore the cooling path

Apply the justified maintenance action: cleaning, flushing, repair, de-scaling, leak correction, flow balancing or component replacement. Keep chemistry, equipment and cleaning conditions specific to the mould and maintenance method.

Key question: **What physical intervention addresses the measured failure mode?**

### 4. Verify recovery

Re-measure flow, pressure loss, temperature behaviour and relevant production outcomes. Confirm that the hydraulic improvement is sustained and that product response improved where product-quality recovery is actually measured.

Key question: **Did the system recover, and did the part recover? Those are separate checks.**

## Source-backed case callouts

### Three production cleaning cases

One reported case increased cooling flow from **0.2 to 0.5 L/min** after cleaning.

A second reported flow increasing from **0.3 to 0.6 L/min**, cycle time decreasing from **70 to 63 s**, and voids reported as reduced to zero.

A third reported flow increasing from **0.2 to 1.1 L/min**, heat-up time decreasing from **90 to 60 min**, startup discarded shots decreasing from **8 to 3**, with part-weight change remaining within tolerance.

These are practitioner case observations. They show what useful before/after evidence can look like; they do not define universal cleaning thresholds.

### Eight-cavity hydraulic recovery case

An eight-cavity mould case reported heavy rust/restriction, with flow increasing from **0.6 to 2.0 L/min** and pressure loss decreasing from **416 to 362 kPa** after cleaning, reported as a **13% pressure-loss reduction**. A water leak was also discovered during the pre-clean check, which is an important diagnostic confounder. The public case does not establish a controlled product-quality improvement, so the Book must not infer one from the hydraulic recovery alone.

### Severe flow-imbalance case

A large automotive-grille case reported **16 cooling zones**, **five with no measurable flow**, other zones reaching up to **2.5 gal/min**, and more than **1 mm** centre deformation. This is a strong example of why a nominal coolant-temperature setting cannot establish balanced heat removal.

## Learner exercise

### Scenario

A 16-zone mould produces more than 1 mm of part deformation. Five zones show no measurable flow. The remaining zones show widely different flow rates. The machine's temperature-control-unit setpoints are all nominal.

### Task

Design the next diagnostic and verification sequence before changing injection or packing settings.

### Expected reasoning

A strong answer should:

1. confirm the zero-flow readings and sensor/measurement validity;
2. localise the restricted or isolated circuits;
3. measure pressure loss and temperature response before intervention;
4. inspect for blockage, fouling, leak, valve/fitting problems and balancing errors;
5. perform the justified physical maintenance;
6. repeat the same hydraulic measurements after intervention;
7. then compare part deformation and other quality outcomes.

A weak answer changes packing pressure, mould-temperature setpoint or cooling time before establishing whether coolant is actually moving through the affected zones.

## Editorial boundaries

- Flow, pressure-drop and cleaning values are examples, not universal thresholds.
- Commercial before/after cases are not controlled causal experiments.
- Hydraulic recovery does not automatically prove part-quality recovery.
- Cooling setpoint is not equivalent to actual local heat-removal performance.
- Where product recovery was not measured, the Book must say so explicitly.

## Source routes

- wave6:mechanik-2018-cooling-channel-diagnosis-cleaning
- wave6:sanko-2025-cooling-pipe-cleaning-three-cases
- wave6:fuso-2023-eight-cavity-cooling-cleaning
- wave6:smartflow-2025-cooling-flow-balance-case

## Production instruction

Create the final four-stage diagram and the three compact case callouts as original Book-owned graphics. Do not reproduce supplier or publisher figures. Keep hydraulic and product-quality verification visually separate.
