# MouldMaster assessment-system register

Reviewed: 24 August 2026  
Assessment bank version: `2026.08.24.2`  
System layer: `assessment-system-upgrade.js`

## Purpose

This register documents the controls added after the 100-pass audit and the question/answer deep dive. The objective is not to create more random questions. It is to make the bank measurable, traceable, difficulty-calibrated and resistant to silent quality drift.

## Current assessment inventory

- 30 technical certification questions: 10 Beginner, 10 Intermediate and 10 Advanced.
- 27 jurisdiction-specific safety/compliance questions: UK, US and New Zealand; 3 per level per jurisdiction.
- 57 total exam-bank questions.
- 8 core decision drills.
- 8 guided-training decision drills added by `training-upgrade.js` and deepened by `assessment-deep-dive.js`.
- 27 additional production scenarios added by `assessment-system-upgrade.js`.
- **43 total decision drills.**

Regional safety/compliance answer keys are unchanged by this system layer.

## Stable question identifiers and revisions

Exam questions have stable IDs independent of display order and answer-option shuffling:

- `tech-b-01` through `tech-b-10`
- `tech-i-01` through `tech-i-10`
- `tech-a-01` through `tech-a-10`
- `reg-uk-b-01` etc. for the 27 jurisdiction items

Revision history is separate from the stable ID. All 57 questions retain a revision-1 baseline dated 20 August 2026. The 12 technical questions changed by the 24 August deep dive carry revision 2 and an explicit reason for the change. Regional items remain revision 1 because no regional key/content correction was required in that deep dive.

Scenario IDs use `scn-01`, `scn-02`, etc. Existing guided-training scenarios deepened on 24 August carry revision 2; new scenarios start at revision 1.

The older spaced-review `mmId` remains available for backward compatibility, but the stable ID is the long-term content identity.

## Exam blueprint

Every generated exam still contains seven technical questions plus the required regional component. Technical selection is no longer a simple seven-of-ten random draw.

### Beginner

The seven technical questions guarantee at least:

- 2 process questions
- 1 machine question
- 1 materials question
- 1 tooling question
- 1 troubleshooting question
- 1 additional non-duplicate technical question

### Intermediate

The seven technical questions guarantee:

- 1 process question
- 2 troubleshooting questions
- 1 materials question
- 1 tooling question
- 1 machine question
- 1 quality/statistics question

### Advanced

The seven technical questions guarantee:

- 3 quality/statistics questions
- 1 process question
- 1 machine question
- 1 materials question
- 1 tooling question

Regional safety questions remain mandatory: three for a selected jurisdiction, or all nine regional questions in Compare All. The existing certificate rule remains at least 80% overall **and zero wrong safety-critical regional answers**.

## Difficulty calibration

Technical items carry one of `Foundation`, `Applied`, `Diagnostic` or `Expert`. Regional items carry `Applied safety`, `Diagnostic safety` or `Expert safety` according to level. The tag is assessment metadata; it is not used to reveal the answer before grading.

The progression is designed so Beginner checks core process understanding, Intermediate increasingly tests diagnostic discrimination, and Advanced focuses on interpretation under ambiguity, statistics, sensing and transfer decisions.

## Duplicate-concept control

Each technical item has a concept ID such as `gate-seal-evidence`, `shot-delivery-variation`, `doe-time-confounding` or `machine-process-transfer`. Blueprint selection refuses to select the same concept twice in one technical exam.

`qa_assessment_system.py` also checks for duplicate stable IDs, duplicate concept IDs within a level, duplicate option text and duplicate question stems.

## Answer-leak control

Release QA checks for severe answer cues including:

- a correct answer dramatically longer or shorter than all distractors;
- duplicated answer options;
- invalid or concentrated answer keys;
- explicit `Correct` wording inside answer options;
- incomplete option feedback;
- missing revision or competency metadata.

Mild length differences are reported as warnings rather than automatically rewriting technically correct wording. Severe cues fail CI.

## Local assessment analytics

MouldMaster now records assessment-learning signals in browser/device local storage under `mm_assessment_analytics_v1`:

- exam attempts;
- question seen/correct/wrong/omitted counts;
- selected-option counts, including distractor choices;
- approximate response interval for first selections;
- competency and difficulty performance;
- scenario choice/correctness counts;
- up to 100 recent exam-attempt summaries.

The Exams view shows local attempts, accuracy, approximate average response time, competency accuracy and low-performing questions once there is enough data.

**No analytics are transmitted to a server or third party.** The learner can clear them locally, and a confirmed MouldMaster reset removes the analytics store.

## Per-question evidence

After grading, every answer-review row can expand an **Evidence** panel. It shows:

- stable question ID;
- competency and calibrated difficulty;
- exact question source where one is already assigned;
- selected supporting authoritative/research links for technical topics;
- revision history.

Evidence appears only after grading so it does not leak the keyed answer during the assessment.

General references support mechanisms and methods. Material supplier data, machine/tool documentation, approved site procedures, applicable law and product-specific validation remain controlling for production decisions.

## Production-scenario expansion

The 27 new cases extend the drills into areas that were underrepresented in the original 16, including:

- hot-runner heater-duty drift and warm-up balance;
- sequential valve-gate imbalance and gate erosion;
- cooling-circuit fouling and conformal-cooling degradation;
- dryer display versus measured resin water content;
- regrind/PCR material variation and MFR limitations;
- non-return-valve behaviour and nozzle-to-cavity pressure loss;
- pressure-curve area versus peak pressure;
- robot timing and hot-part handling;
- vision domain shift and lighting changes;
- cavity-sensor noise after service;
- fibre-orientation warpage;
- DOE confirmation failure;
- pooled versus cavity-specific capability;
- measurement-fixture changes;
- overmould/insert interface problems;
- microfeature replication;
- energy-per-part drift;
- predictive-maintenance model domain shift;
- microcellular foam structure versus stiffness.

The scenarios are diagnosis exercises, not universal production-setting recipes.

## Source freshness

Critical standards/regulator pages used by assessment content are registered in `sources/source-freshness.json` and checked by `qa_source_freshness.py`.

- Release/desktop/Store QA verifies registry structure, HTTPS use and review age without requiring network access.
- `.github/workflows/source-freshness.yml` performs a weekly online marker check of the official pages.
- A 404/410 or a successful page response that no longer contains the expected status/identity markers fails the workflow.
- Temporary access restrictions such as 403/429 or transient network failures are surfaced as warnings rather than being misreported as content changes.

This monitoring is a change detector, not a substitute for human legal/standards review.

## Versioning

This release advances both `content_version` and `question_bank_version` to `2026.08.24.2`. Android/desktop binary release numbers remain unchanged because the desktop dependency/application binary version is not being changed by this content-only assessment upgrade.
