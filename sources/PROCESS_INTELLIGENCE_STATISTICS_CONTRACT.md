# MouldMaster process-intelligence statistical contract

This document defines the meaning and failure boundaries for site-local statistical quantities used by MouldMaster. It is an engineering interpretation contract, not a production-control specification.

## Numeric inputs

Blank strings, whitespace, `null`, `undefined`, invalid numeric text and non-finite numbers are missing values. Numeric `0` and string `"0"` are valid zero measurements. Missing values must never be silently converted to zero.

## Reference-normalized shift

A reference summary requires at least two finite observations. The reference spread is:

`max(sample standard deviation, IQR / 1.349)`

using only positive estimable candidates. If no positive spread can be estimated, the normalized shift is **unscored**. No epsilon denominator is permitted.

The resulting quantity is an absolute mean difference divided by a conservative reference-spread estimate. Because the denominator can be the robust `IQR / 1.349` estimate rather than the sample standard deviation, the result must not be interpreted as a literal count of Gaussian standard deviations, a control-limit breach, statistical significance, or causal proof.

## Good-vs-bad group separation

The current descriptive comparison requires at least three finite observations in each group. Its denominator is the symmetric unweighted RMS of the two sample standard deviations:

`sqrt((sd_left^2 + sd_right^2) / 2)`

The score is the absolute difference between group means divided by that spread. This is a **symmetric descriptive separation heuristic**. It is deliberately not labelled Cohen's d, Hedges' g, a p-value, a confidence level or a causal effect. If both groups have zero spread, the result is unscored rather than divided by an arbitrary epsilon.

## Energy per good part

Energy-per-good-part is calculated only when the energy channel is explicitly confirmed as `per-cycle`, the unit is a supported energy unit, every included cycle has both finite energy and a resolved quality label, and at least one good part exists. Missing or misaligned coverage makes the ratio unscored rather than silently biasing the numerator or denominator.

## Boundaries

These quantities are site-local evidence aids. They do not create universal process windows, machine safety limits, validated recipes, automatic root-cause conclusions, statistical-control claims or machine-control authority. Machine, mould, material grade, job, units, sampling basis, sensor meaning and data adequacy must remain explicit.

The canonical browser-independent primitives are in `src/domains/process/process-statistics.mjs`; edge/golden coverage is in `qa_process_statistics_domain.mjs`. Runtime migration into those primitives must occur only on a deliberately new learner-facing release, because changing the current `.16.2` runtime would invalidate its release-bound external-validation candidate.
