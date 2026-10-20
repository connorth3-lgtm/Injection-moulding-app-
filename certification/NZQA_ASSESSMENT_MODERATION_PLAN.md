# NZQA assessment and moderation readiness plan — MouldMaster Academy

Status: **provider-readiness draft only**. This document does not establish NZQA approval, provider accreditation, consent to assess, moderation acceptance, learner achievement, workplace competence or authority to operate machinery.

Rule/source baseline checked: **2026-09-15**.

## 1. Two assessment lanes must stay separate

### Lane A — MouldMaster formative learning
Repository/app-controlled evidence may include:
- knowledge checks and retrieval practice;
- source-based explanations;
- troubleshooting cases;
- simulations and process-study interpretation;
- reflective notes and draft evidence records.

These records support learning and readiness. They are **not NZQA results** and are not evidence that a learner has met every requirement of a DASS standard.

### Lane B — provider-controlled recognised assessment
If a provider uses an approved micro-credential or assesses DASS standards, the provider must control:
- learner identity and enrolment;
- approved assessment instruments;
- assessment conditions;
- marking schedules and sufficiency rules;
- assessor judgement;
- reassessment rules;
- internal moderation;
- evidence retention;
- complaints/appeals;
- result reporting;
- consent to assess and national external moderation where standards are used.

MouldMaster may supply draft instruments and structured evidence fields, but it must not silently promote formative app records into Lane B.

## 2. Proposed evidence architecture

Each summative evidence item should carry, at minimum:

| Field | Purpose |
| --- | --- |
| learnerRef | provider-controlled learner identifier; avoid public PII |
| assessmentRef | controlled instrument/version identity |
| outcomeRef | learning outcome or standard outcome being assessed |
| standardRef | DASS standard ID when applicable |
| evidenceType | written, oral, observed practical, product/process record, third-party verification |
| contextRef | machine, mould, material, site or simulated context |
| collectedAt | assessment timing |
| assessorRef | authorised assessor identity in provider system |
| judgement | achieved/not achieved or provider-approved equivalent |
| judgementRationale | why evidence is sufficient/insufficient |
| moderationState | pre-moderated, internally moderated, external sample requested, externally moderated, action-required |
| moderationRef | link/reference to controlled moderation record |
| reassessmentRef | reference to prior/follow-up attempt if applicable |
| limitations | missing evidence, restricted scope or context limitations |
| retentionRef | provider-controlled evidence-retention location/reference |

Do not store sensitive workplace/customer data in public repository records.

## 3. Assessment design principles

Provider-approved assessment should be designed so that:
- evidence is valid for the stated outcome;
- evidence is sufficient, authentic and current where required;
- safety-critical decisions cannot be compensated for by unrelated high scores;
- practical outcomes are assessed practically when the standard/outcome requires performance;
- simulation is used only where the provider and applicable rules/standard permit it;
- generic MouldMaster examples are not treated as universal production settings;
- machine-, mould-, material-, site- and grade-specific controls remain authoritative;
- assessors can distinguish knowledge of a task from authorised competent performance of that task.

## 4. Practical workplace evidence

Where a final outcome requires workplace performance, collect direct evidence under authorised conditions, including **direct observation where required** by the outcome, standard or provider assessment design. Candidate evidence may include:
- identifying hazard zones, safeguards and escalation boundaries;
- identifying cycle phases and relevant machine actuals;
- retrieving approved machine/material/site documentation;
- recording a known-good process baseline;
- observing or supporting an authorised controlled process study;
- identifying tooling/cooling/maintenance evidence before intervention;
- interpreting a process trend or cavity-specific response;
- demonstrating correct escalation when a safeguard, isolation, competence or authority limit is reached.

A MouldMaster simulation or screenshot cannot by itself satisfy a real workplace-performance requirement.

## 5. Current Injection Moulding standards context

The governed mapping currently uses these standards as **current context anchors**, checked against the NZQA Injection Moulding domain on 2026-09-15:

- **252** — Perform process operations for injection moulding — Level 1, 4 credits
- **255** — Control and optimise the injection moulding production process — Level 3, 12 credits
- **27926** — Set up advanced moulds for injection moulding — Level 3, 7 credits
- **29515** — Carry out routine service of injection moulding equipment — Level 3, 5 credits
- **260** — Service and maintain a complex mould for injection moulding — Level 4, 10 credits
- **9713** — Set and remove complex injection moulds — Level 4, 5 credits

These references are not a claim that MouldMaster currently assesses them. A provider must recheck the current standard version, full standard text, CMR and consent scope before assessment use.

Expired standards explicitly excluded from current assessment mapping: `253`, `254`, `256`, `257`, `258`, `259`, `27925`, `9712`.

## 6. CMR 13 / consent-to-assess gate

For the current Injection Moulding standards listed in the governed contract, the NZQA domain page identifies **CMR 13**.

Before formal standards-based assessment, the provider must confirm:
1. the standard remains current;
2. CMR 13 remains applicable;
3. its consent-to-assess scope includes the standard/domain and level;
4. required assessor/teacher/verifier capability is in place;
5. required resources and practical access are available;
6. national external moderation obligations are understood and scheduled.

Repository QA may verify that these gates exist. It cannot satisfy them.

## 7. Internal moderation workflow

Suggested provider-controlled flow:
1. **instrument design** — outcome/standard requirements mapped to tasks and evidence;
2. **pre-assessment moderation** — independent reviewer checks validity, clarity, conditions and marking schedule;
3. **release** — controlled version approved for use;
4. **assessment** — authorised assessor collects evidence and records judgement;
5. **post-assessment sampling** — second reviewer checks judgement consistency and sufficiency;
6. **corrective action** — address assessor/instrument issues and re-evaluate affected decisions where necessary;
7. **record close-out** — retain moderation decision, actions, version and evidence references;
8. **national external moderation** — submit/participate as required by the relevant system when DASS standards are assessed.

## 8. Moderation record template

Suggested fields:
- moderationRef
- assessmentRef/version
- standardRef/outcomeRef
- moderatorRef
- moderationType (pre/post/external)
- sampleMethod
- sampleRefs
- validityFinding
- sufficiencyFinding
- consistencyFinding
- accessibility/fairnessFinding
- actionRequired
- actionOwner
- dueDate
- completionEvidence
- closedAt
- externalModerationRef where applicable

## 9. Assessor capability evidence

Provider evidence should identify:
- assessor qualifications/industry experience;
- current injection-moulding competence relevant to the standard/outcome;
- assessment-practice competence required by provider/CMR;
- machine/site induction and authority where practical assessment occurs;
- conflicts of interest;
- professional development/current-industry evidence;
- moderation participation.

MouldMaster learning history is not a substitute for provider evidence of assessor capability.

## 10. Reassessment and appeals

Provider policy should define:
- when reassessment is allowed;
- whether reassessment uses the same or an equivalent instrument;
- how prior feedback is controlled;
- maximum attempts or escalation, if any;
- how safety-critical failure is handled;
- how learners request review/appeal;
- who is independent of the original decision;
- evidence retention and result correction.

## 11. Privacy and evidence handling

Use provider-controlled references rather than public names/customer/site data. Do not commit:
- learner names or identifiers that expose identity;
- customer names;
- proprietary part drawings or specifications;
- raw production datasets without authorisation;
- private attachments;
- assessor signatures or credentials containing personal data.

Public MouldMaster artifacts should contain schemas, synthetic examples and non-sensitive references only.

## 12. Readiness decision

This plan can be marked **provider-review-ready** only when an eligible provider has reviewed it. It can be marked **assessment-approved** only through that provider's controlled process. Standards-based assessment additionally requires the provider's applicable **consent to assess** and participation in the required **national external moderation** system.

Current state: **technical-review / external gates HOLD**.
