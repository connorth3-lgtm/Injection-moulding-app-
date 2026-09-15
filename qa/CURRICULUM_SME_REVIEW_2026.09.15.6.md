# MouldMaster curriculum SME review — 2026.09.15.6

This packet governs the **human** semantic review of all 120 canonical Academy lessons for web release `2026.09.15.6`. It is separate from the 46-chapter Book SME review.

## Governed contract

- review ledger: `qa/curriculum-semantic-review.json`
- canonical lesson count: `120`
- required semantic dimensions per lesson: `7`
- release: `2026.09.15.6`

Each recorded dimension approval is bound to the SHA-256 fingerprint of the entire canonical lesson object. Any canonical lesson change invalidates prior approvals for that lesson and requires re-review.

## Required dimensions

For every lesson, a human SME must review:

1. `mechanism` — the underlying moulding/material/process mechanism is technically correct.
2. `diagnosticDecision` — the reasoning path distinguishes observation, evidence, competing causes and decision criteria.
3. `measurement` — measurements, units and interpretation are appropriate and not presented as false precision.
4. `practicalAction` — practical actions are scoped, safe and conditional rather than universal machine recipes.
5. `misconceptionFailure` — likely learner misconceptions/failure modes are addressed accurately.
6. `evidence` — evidence/source use matches the strength and scope of the claim.
7. `outcome` — the lesson outcome matches what the learner can reasonably demonstrate after the lesson.

## Review record requirements

For each approved dimension, record in `qa/curriculum-semantic-review.json`:

- the canonical `lessonId`;
- the current `reviewedLessonFingerprint`;
- `reviewStatus = approved`;
- a public-safe `reviewedBy` reference;
- ISO `reviewedAt` date;
- a substantive `reviewNote`.

Partial reviews are allowed and remain visible as partial. Do not create empty/pending review records merely to inflate coverage.

## Evidence boundary

Automated curriculum QA, AI/source review, Book SME approval and sampled lesson review do not count as completion of this 120-lesson contract. This ledger is public; use only reviewer attribution and notes intended for publication.

## Completion

Run:

- `python qa_curriculum_semantic_review.py`
- `python tools/verify_release_external_validation.py`

The external-validation ledger may move `curriculumSme.status` from `hold` to `validated` only when all 120 canonical lessons have all seven dimensions human-approved at their current whole-lesson fingerprints.

Until then, curriculum SME validation remains **HOLD**.