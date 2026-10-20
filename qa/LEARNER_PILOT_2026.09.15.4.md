# MouldMaster real-learner pilot — 2026.09.15.4

This is the execution protocol for `data/learner-pilot-v1.json` and web release `2026.09.15.4`.

The pilot is deliberately **exploratory**. It may reveal usability, comprehension and diagnostic-transfer signals; it does not establish population efficacy, accreditation, psychometric validity, production-recipe validity or machine-control authority.

## Cohort

Aim for 8–15 completed adult learners spanning beginner, setter/technician and process-engineer experience where practical. Participation should be voluntary. Use a locally generated pseudonymous participant code; do not put names, contact details, employer/customer/site identifiers, production-part details, private screenshots or raw proprietary process data in this repository.

## Session sequence

1. **Baseline:** complete a short matched concept and diagnostic task set before the assigned learning path.
2. **Guided learning:** use the relevant Academy content and Book chapters naturally; do not coach the answers.
3. **Immediate transfer:** complete matched concept and diagnostic tasks after learning.
4. **Book-boundary tasks:** find a relevant Book chapter, state its applicability boundary, distinguish plausible mechanism from guaranteed cause, and identify when controlling machine/material/mould/site documentation overrides generic guidance.
5. **Qualitative debrief:** record non-identifying confusion points, navigation friction, confidence shifts and why answers changed.
6. **Delayed transfer:** where feasible, repeat matched tasks after 7–14 days without showing the original answers.

## Minimum aggregate measures

Record only public-safe aggregates or a non-sensitive analysis reference for:

- baseline correct rate;
- immediate correct rate;
- delayed transfer correct rate;
- diagnostic reasoning rubric;
- time to relevant evidence;
- Book boundary recognition rate;
- task abandonment rate;
- recurring confusion themes.

Do not interpret a small pilot as a statistically validated effect. A positive pilot can justify product iteration and a larger longitudinal study; it cannot by itself change `learnerOutcomes.status` to `validated`.

## Evidence-to-product loop

Every product change attributed to the pilot should carry a traceable, non-sensitive finding reference and be classified as one of:

- navigation/discoverability;
- content clarity;
- evidence/applicability boundary;
- diagnostic reasoning;
- Read/Listen comprehension;
- mobile/offline/update friction;
- assessment wording or feedback.

Prioritise repeated high-severity findings over isolated preferences. Never change technical guidance solely to satisfy a preference if it weakens evidence, safety or uncertainty boundaries.

## Completion boundary

After the exploratory pilot, keep `data/release-external-validation-v1.json` learner outcomes on **HOLD** unless a separately reviewed longitudinal evidence object satisfies `tools/verify_release_external_validation.py`. Synthetic datasets, proxy learner datasets and AI-generated responses do not count as real-learner evidence.
