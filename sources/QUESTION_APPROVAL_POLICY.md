# MouldMaster question evidence approval policy

Reviewed: 2 September 2026

Every keyed learner decision must have a stable identity, one defensible answer, a rationale, traceable evidence, a reviewer/review basis, a review date, an approval status and a content fingerprint or an approval fingerprint tied to immutable reviewed content.

The approval scope is internal educational content approval. It does not imply external accreditation or independent third-party SME endorsement.

## Canonical release scope

The source of truth for the learner-visible keyed assessment inventory is the machine-generated `data/canonical-assessment-manifest-v1.json`, reproduced by `tools/generate_assessment_manifest.py --check` in release QA. Manually maintained prose totals are not release authority.

Current canonical coverage is:

- 30 technical exam questions;
- 27 UK/US/NZ regional safety/compliance exam questions;
- 40 scenario drills;
- 36 questions across the 9 Diagnostic Learning Labs;
- 24 questions across the 6 Material Behaviour Labs;
- 40 optional Material Practice decisions;
- 12 Real Measured-Data Evidence decisions across four audited data-contract cases;
- **197 standardized learner decisions + 12 measured-data decisions = 209 keyed learner decisions in total.**

The historical `assessment-evidence-approval.js` runtime layer remains a useful evidence-display/approval mechanism for the 157 formal/scenario/diagnostic/material decisions that it directly models. It is no longer the complete inventory authority. The canonical manifest adds the 40 optional Material Practice decisions and 12 measured-data decisions with their explicit source-ID or pinned data-contract evidence basis.

## Evidence rules

Regional safety/compliance questions must retain a direct official regulator, legislation or standards source. Technical questions may use a question-specific source or a mapped authoritative/peer-reviewed source that supports the mechanism or method being assessed. Material Behaviour and optional Material Practice decisions use explicit source IDs selected for the resin/mechanism being taught. Real measured-data decisions must retain the pinned contract path/blob, licence and evidence boundary for the dataset being interpreted.

Mapped evidence must be topic-appropriate. A generic fallback source is not permitted: if the evidence resolver cannot identify a source that supports the actual question/scenario/lab topic, the record is blocked and release QA must fail with the affected stable ID. Research findings support mechanisms and methods; they are not universal production recipes.

## Assessment discrimination rule

`assessment-discrimination-hardening.js` may alter learner-visible option wording only when the pre-rewrite cue population exactly matches the reviewed audit population. The current gate expects 111 affected items and 179 review warnings across the six audited cue categories. If that population drifts, the layer must fail closed with `review-required` and make no automatic rewrite.

The discrimination layer must never change a correct answer index or the assessed proposition. It must not turn an unsafe safeguard-bypass distractor into an acceptable action. `qa_assessment_discrimination.py` verifies the exact population, zero answer-key changes and removal of those audited wording cues. The canonical manifest fingerprints the resulting learner-visible options.

## Approval invalidation

Approval is invalidated when a reviewed content-bearing source changes without the corresponding generated manifest/fingerprint and QA updates. A changed question, answer, rationale, scenario, lab, optional practice decision or measured-data contract therefore requires a fresh evidence/review pass before release QA can pass.

`tools/generate_assessment_manifest.py --check` must be run rather than hand-editing the canonical manifest. The checked-in JSON is a deterministic review artifact and drift from generated runtime content is a release failure.
