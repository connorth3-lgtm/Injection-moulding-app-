# MouldMaster question-bank revision history

This register records assessment changes that can affect learner interpretation, difficulty, evidence or spaced-review identity. It is deliberately separate from general release notes so an assessment reviewer can see what changed and why.

## 2026.08.30.1 — evidence-based diagnostic question bank

- Upgraded **all 30 technical questions** so every live technical item requires evidence interpretation, a diagnostic decision, a discriminating test, verification/recovery reasoning or recognition that the available evidence is insufficient.
- Upgraded all **27 regional UK/US/NZ safety/compliance questions** from rule-name recall to applied workplace safety/compliance decisions. The safety-critical keyed answer positions were deliberately retained: regional answer-key changes = **0**.
- Preserved all 57 stable live-question IDs because each rewrite retains the assessed competency. Revision governance now records every live ID: **39 revision-2 items** (the 12 earlier technical reviews plus all 27 regional applied-safety reviews) and **18 revision-3 technical items**.
- Re-reviewed keyed-option positions and rationale/source fit. A changed option index is never treated as an automated answer flip; the keyed engineering or safety conclusion is explicitly reviewed and recorded in `sources/QUESTION_REVISION_INDEX.json`.
- Added deliberate coverage of five reasoning modes: observation, decision, discrimination, verification and **insufficient evidence**.
- Added fail-closed cases that prohibit inferring pressure units/references or quantitative pressure loss from ambiguous signal names or magnitudes.
- Audited the complete optional practice surface rather than treating it as secondary content: **40 scenario drills + 36 Diagnostic Learning Lab decisions + 24 Material Behaviour Lab decisions = 100 optional keyed questions**. Strong existing optional items were retained; release QA now verifies their structure, keys, feedback, safety boundaries and evidence rather than rewriting sound items for change-count purposes.
- The evidence-approval snapshot covers **157/157 keyed learner questions**: 57 live + 100 optional. Unmatched evidence fails closed.
- Grounded questions in the types of accepted measured evidence available to MouldMaster—pressure/flow response, cavity pressure, thermal/cooling behaviour, shot delivery, process actuals and quality outcomes—without copying raw third-party rows or turning study-specific values into universal production settings.
- Advanced `question_bank_version` to `2026.08.30.1` while leaving measured-data acceptance counts unchanged.

See `sources/QUESTION_BANK_DEEP_DIVE.md`, `sources/QUESTION_REVISION_INDEX.json` and `qa_question_deep_dive.py`.

## 2026.08.25.2 — fail-closed evidence hardening

- Kept all 57 live exam answer keys, question text, the 40-scenario bank and the 9 Diagnostic Learning Labs unchanged.
- Removed the generic technical-source fallback from the evidence resolver. An unmatched technical/scenario/lab topic is now blocked rather than labelled approved with a merely general source.
- Changed evidence QA to reconstruct the real guided-training scenario text instead of placeholder scenario records.
- Added topic-specific source guards for previously weakly traced scenarios covering degradation/black specks, local flash, valve-gate timing, robot/IMM sequencing, energy per accepted part, insert/overmould thermal state, hot-runner service/warm-up and model drift.
- Added explicit Molding Window evidence for the Advanced process-window question and corrected hyphenated short-shot matching for the cavity-specific Diagnostic Lab.
- Enrolled the added authoritative and research-bearing evidence sources in source/DOI freshness tracking and advanced the offline cache revision.
- Added `assessment_evidence_version` = `2026.08.25.2`; `question_bank_version` and `content_version` remain `2026.08.24.2` because learner question text and answer keys did not change.

## 2026.08.25.1 — answer-evidence approval layer

- Kept all 57 live exam answer keys and question text unchanged.
- Added an evidence-approval record for every keyed learner question then in scope: 30 technical exams, 27 regional safety/compliance exams, 40 scenario drills and 36 Diagnostic Learning Lab questions (133 total at that release stage).
- Every approval record carries a reviewer, review date, status, rationale/reference context, direct HTTPS evidence links and a content fingerprint. Diagnostic-lab question fingerprints are tied to the approved lab source-file blob plus lab/step identity.
- Regional questions retain their direct question-specific regulator, legislation or standards source. Technical/scenario/lab items without an existing direct question citation are mapped to authoritative technical documentation, standards, supplier guidance or peer-reviewed evidence supporting the assessed mechanism or method.
- Added a release gate that fails if any keyed question is unsourced/unapproved, if expected coverage drops, if regional items lose direct official/standards sourcing, or if a reviewed content-bearing source file changes without a fresh approval update.
- Added learner-facing post-grade evidence approval panels and Diagnostic Learning Lab approval/source panels.
- Added `assessment_evidence_version` = `2026.08.25.1`. This is an evidence/control-layer change; `question_bank_version` and `content_version` remain `2026.08.24.2` because the approved question text and answer keys were not changed.
- Internal approval is explicitly not represented as external accreditation or independent third-party SME endorsement.

See `sources/QUESTION_APPROVAL_POLICY.md` and `qa_assessment_evidence.py`.

## 2026.08.24.4 — learner-scoped analytics and release-coherence hardening

- Kept all 57 live exam answer keys, question text, certificate rules and the 40-scenario bank unchanged.
- Added a narrow local-storage scope layer for assessment analytics and exposure timing. The two analytics stores are now isolated by active learner profile on shared browser/device installations; other MouldMaster local-storage keys are not rewritten by this layer.
- Switching learner profiles now cancels any in-memory exam attempt before the active learner changes, preventing a started attempt from being graded into another learner's analytics/history.
- A single-profile installation conservatively migrates its old unscoped analytics into that learner's scope. Ambiguous unscoped analytics on a multi-profile installation are discarded rather than attributed to the wrong learner.
- A successful progress-backup import now clears assessment analytics because analytics are deliberately excluded from the progress-backup format. A confirmed factory reset also clears every scoped/unscoped assessment-analytics store.
- Updated the privacy/support pages to disclose learner-scoped analytics, exposure-based response timing, separate analytics export/reset behavior and public-support privacy warnings.
- Removed stale August 23 release numbers from public release documentation and made `support.html` synchronise its displayed release family from `version.json` when available.
- Added `assessment_storage_scope_version` = `2026.08.24.4` without changing `question_bank_version` or `content_version`.

## 2026.08.24.3 — final assessment hardening

- Kept the 57 live exam answer keys and the 40-scenario bank unchanged.
- Added an explicit 57-ID revision index and exposed the recorded per-question revision reason in the post-grade evidence panel. The 12 technical items changed during the deep review were individually identified as revision 2; subsequent 30 August question-bank work extends that same governance model to every live stable ID.
- Replaced learner-facing response-time interpretation with exposure-based timing: the timer starts when at least 55% of a question is visible or the learner directly interacts with it, and time while the document is hidden is excluded. Older whole-exam elapsed timing is retained only as legacy analytics data.
- The existing **Reset local analytics** control removes both the original assessment analytics store and the exposure-timing store, while preserving the original reset behavior.
- Added a separate research DOI freshness registry and scheduled resolver checks across research-bearing assessment/reference files. Resolver 404/410 results require human review; temporary publisher, access, rate-limit and network errors remain warnings.
- Bumped only `assessment_quality_version` to `2026.08.24.3`; `question_bank_version` and `content_version` remained `2026.08.24.2` at that release stage.

## 2026.08.24.2 — assessment quality suite

- Introduced stable question IDs independent of release version: `tech:<Level>:<zero-based-index>` and `reg:<Region>:<Level>:<zero-based-index>`.
- Added migration from older version-prefixed spaced-review IDs to the stable IDs. Existing review counts, stages and due dates are merged rather than discarded.
- Added device-local question analytics: attempts, selected distractors, correct/wrong/unanswered counts, response time, exam pass data and scenario selections. MouldMaster does not upload this analytics store.
- Added difficulty labels (Foundation, Applied, Diagnostic, Expert / Expert safety) and competency tags.
- Added a competency-balanced exam blueprint. A normal regional exam still contains 7 technical items plus 3 regional safety/compliance items; Compare All still contains 7 technical items plus all 9 regional items. The selector favours coverage across materials/rheology, machine/controls, tooling/thermal, process development, quality/statistics and troubleshooting, while regional items supply safety/compliance.
- Added per-question evidence/revision panels after grading with the exact cited source when one exists and a source-review freshness notice.
- Added automated near-duplicate and answer-leak risk reporting. These checks do not change an answer key automatically; they identify questions needing human assessment review.
- **Expanded shop-floor scenario drills from 16 to 40.** New cases cover hot runners, cooling restrictions, check-ring sealing, thermal degradation, venting/burns, reinforced weld lines, local flash, valve gates, pressure-curve features, vision domain shift, sensor service, robot delays, energy, overmoulding, insert temperature, microfeatures, foaming, recycled feedstock, tool wear, hot-runner leakage, startup equilibrium, model drift and cooling/warpage trade-offs.
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
7. Assessment analytics must remain learner-scoped and device-local unless a future privacy notice, architecture and explicit consent model deliberately change that boundary.
