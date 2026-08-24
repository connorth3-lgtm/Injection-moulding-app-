# MouldMaster question-bank revision history

This register records assessment changes that can affect learner interpretation, difficulty, evidence or spaced-review identity. It is deliberately separate from general release notes so an assessment reviewer can see what changed and why.

## 2026.08.24.3 — final assessment hardening

- Kept the 57 live exam answer keys and the 40-scenario bank unchanged.
- Added an explicit 57-ID revision index and exposed the recorded per-question revision reason in the post-grade evidence panel. The 12 technical items changed during the deep review are individually identified as revision 2; all other live exam items remain at the audited revision-1 baseline.
- Replaced learner-facing response-time interpretation with exposure-based timing: the timer starts when at least 55% of a question is visible or the learner directly interacts with it, and time while the document is hidden is excluded. Older whole-exam elapsed timing is retained only as legacy analytics data.
- Added a separate research DOI freshness registry and scheduled resolver checks across research-bearing assessment/reference files. Resolver 404/410 results require human review; temporary publisher, access, rate-limit and network errors remain warnings.
- Bumped only `assessment_quality_version` to `2026.08.24.3`; `question_bank_version` and `content_version` remain `2026.08.24.2` because no question text, answer key or learning content changed in this hardening pass.

## 2026.08.24.2 — assessment quality suite

- Introduced stable question IDs independent of release version: `tech:<Level>:<zero-based-index>` and `reg:<Region>:<Level>:<zero-based-index>`.
- Added migration from older version-prefixed spaced-review IDs to the stable IDs. Existing review counts, stages and due dates are merged rather than discarded.
- Added device-local question analytics: attempts, selected distractors, correct/wrong/unanswered counts, response time, exam pass data and scenario selections. MouldMaster does not upload this analytics store.
- Added difficulty labels (Foundation, Applied, Diagnostic, Expert / Expert safety) and competency tags.
- Added a competency-balanced exam blueprint. A normal regional exam still contains 7 technical items plus 3 regional safety/compliance items; Compare All still contains 7 technical items plus all 9 regional items. The selector favours coverage across materials/rheology, machine/controls, tooling/thermal, process development, quality/statistics and troubleshooting, while regional items supply safety/compliance.
- Added per-question evidence/revision panels after grading with the exact cited source when one exists and a source-review freshness notice.
- Added automated near-duplicate and answer-leak risk reporting. These checks do not change an answer key automatically; they identify questions needing human assessment review.
- Expanded shop-floor scenario drills from 16 to 40. New cases cover hot runners, cooling restrictions, check-ring sealing, thermal degradation, venting/burns, reinforced weld lines, local flash, valve gates, pressure-curve features, vision domain shift, sensor service, robot delays, energy, overmoulding, insert temperature, microfeatures, foaming, recycled feedstock, tool wear, hot-runner leakage, startup equilibrium, model drift and cooling/warpage trade-offs.
- Added scheduled authoritative-source freshness monitoring using official ISO, OSHA, WorkSafe NZ, New Zealand Legislation, NIST and FDA pages. Network failures are warnings; a reachable official page losing all expected status/content markers is treated as a review trigger.

## 2026-08-24 — deep question review

- Reviewed all 57 live exam items and 16 then-current scenario drills for one-best-answer quality, distractor plausibility, safety, rationale depth, source fit and answer cues.
- Rewrote 12 technical questions and 8 scenarios where stronger competing diagnoses or evidence were needed.
- Regional UK/US/NZ safety/compliance answer keys were reviewed and retained.

See `sources/QUESTION_BANK_DEEP_DIVE.md` for the evidence rationale.

## 2026-08-24 — 100-pass structural assessment audit

- Added exactly 100 executable checks covering the 12-course/120-lesson data model, defects, scenarios, 30 technical items, 27 regional items, answer keys, feedback arrays, source URLs, randomisation and certificate logic.

See `sources/ASSESSMENT_AND_DATA_100_PASS_AUDIT.md`.

## 2026.08.21.1 — legacy spaced-review bank identifier

This version remains relevant only for migration of older locally stored spaced-review records. New assessment attempts use the stable IDs described above so future content-version changes do not orphan learner review history.

## Change-control rules

1. A question text or answer change must keep a stable ID unless the assessed competency itself changes materially.
2. If the assessed competency changes materially, create a new stable ID rather than reusing historical performance data.
3. Answer-key changes require a recorded reason and a source/reviewer check; automation must never silently flip a key.
4. Regional safety/compliance items require an official regulator, legislation or standards source and a freshness review.
5. Research results support mechanisms and methods, not universal production setpoints.
6. Question analytics are diagnostic evidence for question quality, not proof that a frequently selected answer is correct.
