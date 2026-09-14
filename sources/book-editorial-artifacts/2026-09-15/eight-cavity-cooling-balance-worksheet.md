# Eight-cavity cooling balance after cleaning

Status: Book-ready diagnostic worksheet specification. Research/editorial only; not learner-runtime content.

## Teaching purpose

Teach learners to separate **total hydraulic recovery** from **cavity-to-cavity balance**. A cleaned system can move more coolant overall and still leave one or more cavities thermally different.

## Case anchor

A reported eight-cavity mould cleaning case documented heavy rust/restriction. After cleaning, total reported flow increased from **0.6 to 2.0 L/min** and pressure loss decreased from **416 to 362 kPa**, reported as a **13% pressure-loss reduction**. A water leak was discovered during the pre-clean check.

The public case does not provide cavity-by-cavity quality outcomes. Therefore, this worksheet uses **Book-owned normalized values** for teaching only; they are not reconstructed source measurements.

## Worksheet setup

Tell learners that the system-wide measurements changed as follows:

| Measurement | Before cleaning | After cleaning |
|---|---:|---:|
| Total flow | 0.6 L/min | 2.0 L/min |
| Pressure loss | 416 kPa | 362 kPa |
| Leak status | Leak discovered during pre-clean inspection | Repair/condition must be verified separately |

Then provide this explicitly synthetic, normalized cavity-balance dataset:

| Cavity | Relative flow after cleaning | Relative return-temperature rise | Part observation |
|---|---:|---:|---|
| 1 | 1.00 | 1.00 | baseline |
| 2 | 0.98 | 1.03 | baseline |
| 3 | 1.02 | 0.99 | baseline |
| 4 | 0.97 | 1.04 | baseline |
| 5 | 0.99 | 1.01 | baseline |
| 6 | 1.01 | 1.00 | baseline |
| 7 | 0.72 | 1.28 | warmer / slower cooling suspected |
| 8 | 0.96 | 1.05 | baseline |

Add the label **Synthetic teaching values — not source data** directly above the table.

## Learner tasks

1. Decide whether the cleaning restored total hydraulic performance.
2. Decide whether the eight cavities should be treated as balanced.
3. Identify the next checks for Cavity 7.
4. Explain why total flow alone cannot prove uniform cooling.
5. State which measurements should be repeated after any local correction.

## Expected reasoning

A strong answer recognises two different conclusions:

- The source-backed before/after values show substantial **system-level hydraulic improvement** after cleaning.
- The synthetic worksheet still shows a **residual local imbalance** at Cavity 7, so further diagnosis is required.

Reasonable next checks include local circuit restriction, valve/fitting condition, hose routing, parallel-path imbalance, trapped air, leak effects, sensor validity, and comparison of supply/return temperatures or local tool-temperature response.

After correction, repeat the same local flow/temperature measurements and compare a relevant part-quality response. Do not infer quality recovery from hydraulic measurements alone.

## Instructor discussion prompt

Ask: “If total flow has more than tripled, why might one cavity still run hotter?”

Expected themes: unequal hydraulic resistance, parallel-circuit distribution, residual local restriction, leak/bypass paths, geometry differences, flow-control settings, measurement error or a non-cooling cause of the observed part difference.

## Editorial boundaries

- Only the system-level 0.6→2.0 L/min and 416→362 kPa values are source-backed case values.
- The cavity-by-cavity table is deliberately synthetic and normalized for teaching.
- Do not imply that a 13% pressure-loss reduction is a universal cleaning target.
- Do not infer part-quality improvement from the source case because the public page does not report controlled quality recovery.

## Source routes

- wave6:fuso-2023-eight-cavity-cooling-cleaning
- wave6:mechanik-2018-cooling-channel-diagnosis-cleaning

## Production instruction

Present the source-backed system-level values and the synthetic worksheet in visually distinct boxes. The word **synthetic** must remain visible wherever the normalized cavity data appear.
