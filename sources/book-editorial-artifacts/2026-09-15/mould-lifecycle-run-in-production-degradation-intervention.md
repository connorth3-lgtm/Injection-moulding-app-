# Mould lifecycle: run-in, production, degradation and intervention

Status: Book-ready editorial artifact specification. Research/editorial only; not learner-runtime content.

## Teaching purpose

A mould is not a timeless object with one fixed condition. Its behaviour changes with accumulated production, maintenance history, component condition and process context. The Book should teach learners to distinguish statistical state detection from physical wear evidence and from maintenance prediction.

## Figure composition

Draw a left-to-right lifecycle with five states:

1. **Run-in / early-life state**
2. **Stable production state**
3. **Drift / degradation evidence emerging**
4. **Maintenance or refurbishment intervention**
5. **Post-intervention verification / new baseline**

Place three parallel evidence tracks underneath the states:

### Track A — product/metrology evidence

Examples: part dimensions, dimensional drift, cavity-to-cavity differences, repeatability, other measured quality outcomes.

### Track B — asset/condition evidence

Examples: component inspection, measured wear, cooling-circuit condition, guide/ejector condition, leakage, surface condition or other physical findings.

### Track C — history/exposure evidence

Examples: mould ID, component ID, shot count, production dates, maintenance notifications, replaced parts, intervention type and previous maintenance history.

Show a dashed boundary between **state inference** and **physical condition confirmation**. Add the note:

> **A classifier can identify a statistical state without proving which component is physically worn. Maintenance history can predict risk without proving that a repair restored part quality.**

## Evidence anchors

### Natural lifecycle/metrology evidence

A peer-reviewed study used data from **13 high-production-volume injection moulds**, combining mould lifecycle data with solidified-part metrology. It classified early run-in, production and worn-out states using multivariate SPC and XGBoost. Reported in-class accuracy was **88% for worn-out**, **73% for early run-in** and **61% for production**.

Use those values only to illustrate that measurable part/metrology patterns can contain lifecycle information. Do not turn the classifier outputs into maintenance thresholds or claim that the model directly measured physical wear.

### Long-horizon maintenance history

A 2025 industrial study covers **April 2011 to March 2024**, with **64,020 maintenance notifications**, **9,157 unique injection moulds** and **2,553 unique spare parts**. Records include mould identity, maintained spare parts, shot counts at notification time and maintenance dates. The work focused on gate bushes and centre units and used shots until next maintenance as a target rather than calendar age.

The study is important because it demonstrates that shot-linked maintenance histories can exist at large scale. It also reports substantial data-quality limitations, including mixed cleaning/maintenance records, duplicates, free-text information loss and lack of direct component-state information.

### Maintenance project history

A separate real mould-maintenance repository from a European mould-making SME includes mould age, cycle rate, cavity count, failures/issues and maintenance duration. This supports the Book's message that structured lifecycle records preserve diagnostic context. Reported maintenance times are company-specific historical examples, not planning allowances.

## Learner exercise

### Scenario

A mould has produced a gradual dimensional drift over several months. A lifecycle model labels the latest period as “worn-out.” The maintenance history shows rising shot count and two previous interventions, but no current component inspection has been recorded.

### Task

Answer three questions:

1. What can the available evidence justify saying now?
2. What cannot yet be called the physical root cause?
3. What additional inspection or measurement should be collected before deciding the maintenance action?

### Expected reasoning

A strong answer separates:

- **observed evidence:** dimensional drift and model state classification;
- **historical context:** exposure and prior maintenance;
- **missing causal evidence:** direct physical condition of the relevant mould components;
- **verification requirement:** after maintenance, the same quality/metrology measurements should be repeated to establish whether performance recovered.

A weak answer treats the classifier's “worn-out” label as proof that a specific component must be replaced.

## Minimum maintenance record shown beside the figure

The Book should recommend recording, at minimum:

- stable mould/asset ID;
- component ID;
- shot count or defensible production exposure;
- date/time;
- observed symptom;
- measured pre-intervention condition;
- maintenance/refurbishment action;
- measured post-intervention condition;
- comparable part-quality or metrology result before and after;
- who performed/verified the work;
- notes on material, machine and process context where relevant.

This record design is an editorial synthesis for future diagnosis, not a claim that every source contains every field.

## Editorial boundaries

- Statistical lifecycle classification is not direct physical wear measurement.
- Maintenance notifications are not equivalent to verified failure mechanisms.
- Model accuracy, maintenance interval and repair duration are study/company specific.
- Do not reconstruct non-public industrial rows from aggregate results.
- Do not claim maintenance success without post-intervention verification using comparable measurements.

## Source routes

- wave6:springer-2022-13mould-rul-metrology
- wave8:esrel-2025-9157mould-maintenance-history
- wave8:procir-2017-mould-maintenance-time-cbr
- existing:10.1080/0951192X.2020.1829062

## Production instruction

Create the final lifecycle diagram and minimum-record callout as original Book-owned graphics. Visually distinguish measured observations, statistical inference, physical inspection and verified recovery so learners do not collapse them into one concept.
