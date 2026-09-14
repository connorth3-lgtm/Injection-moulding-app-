# NZQA 2026 Micro-credential Evidence Matrix — MouldMaster Academy

Status: provider-readiness working document only. **This is not evidence of NZQA approval or accreditation.**

This matrix maps the MouldMaster preparation pack to the current **Micro-credential Approval and Accreditation Rules 2026** and **Qualification and Micro-credential Listing and Operational Rules 2026**. Final interpretation, application content, level, credits, title, ownership and delivery arrangements must be agreed with an eligible NZQA-recognised tertiary education organisation (TEO) and, where relevant, an Industry Skills Board (ISB).

Where DASS standards are proposed for formal assessment, the separate **Consent to Assess Against Standards on the Directory of Assessment and Skill Standards Rules 2026** and the applicable Consent and Moderation Requirements also apply. Curriculum mapping is not consent to assess.

## Current rule baseline

- 2026 micro-credential approval/accreditation rules commenced 19 January 2026.
- NZQCF micro-credentials are 1–40 credits.
- One credit represents 10 notional learning hours.
- Micro-credentials can be listed at any NZQCF level, based on best fit to level descriptors.
- Eligible providers apply through MyNZQA. ISBs may apply for listing/approval but not provider accreditation.
- Evidence of need and stakeholder support is required; where appropriate, relevant ISB support should be considered.
- Delivery, assessment, moderation, staffing/resources and learner-support capability must be demonstrated by the accredited provider.
- Formal assessment against DASS standards requires provider consent to assess and participation in the applicable national external moderation system.

## Approval criteria — content of the micro-credential

| 2026 criterion | MouldMaster evidence already available | Evidence still required / provider-owned | Status |
| --- | --- | --- | --- |
| Appropriate title and learning outcomes | Draft purpose, learner cohort and measurable outcomes in `NZQA_MICROCREDENTIAL_DRAFT.md`; 46-chapter governed Book map and ten draft outcomes in `../data/nzqa-education-readiness-v1.json` | Provider/industry validation of final title; NZQCF level mapping; final outcome wording; any standards to be included | Partial |
| Need and acceptability | Draft stakeholder plan, employer outreach pack, technical scope and workforce rationale | Formal needs analysis; employer/learner evidence; documented stakeholder support; relevant ISB engagement where appropriate | Gap |
| Requirements | Draft entry assumptions, assessment model, practical evidence concept and completion gate | Final admission criteria; RPL/credit recognition and transfer; structure; workload; assessment/reassessment; completion rules | Partial |
| Review | Version-controlled content, source freshness QA and change-control practices | Provider-approved review cycle, responsibilities, stakeholder review method, change governance and NZQA change-consent process | Partial |

## Accreditation criteria — provider capability

| 2026 criterion | MouldMaster contribution | Provider evidence required | Status |
| --- | --- | --- | --- |
| Delivery | Self-paced digital content, troubleshooting cases, practical-sign-off concept, offline-capable desktop/PWA | Approved delivery model; learner support; delivery-mode suitability; accessibility; facilities/workplace arrangements; staff responsibilities | Provider-owned |
| Assessment and moderation | Audited question bank, safety-critical pass gate, applied case model, draft practical evidence, `NZQA_ASSESSMENT_MODERATION_PLAN.md` | Approved assessment instruments; marking schedules; assessor competence; moderation system; reassessment rules; evidence retention | Provider-owned |
| Resources and staff capability | Technical content, source framework, quality draft, app delivery tooling | Named teaching/assessment staff; CV/competence evidence; facilities/resources; escalation/support arrangements | Provider-owned |
| Learner support and administration | Local progress/notes, backup, practical record concepts | Enrolment/identity; privacy and records; learner support; complaints/appeals; disability/access support; official achievement reporting | Provider-owned |

## Standards-based assessment route — separate external gate

The governed readiness contract currently uses the following Injection Moulding standards as **current context anchors**, checked against the NZQA domain on 2026-09-15:

| ID | Level | Credits | Title | Use in MouldMaster |
| --- | ---: | ---: | --- | --- |
| 252 | 1 | 4 | Perform process operations for injection moulding | entry process/safety context |
| 255 | 3 | 12 | Control and optimise the injection moulding production process | process-control/optimisation anchor |
| 27926 | 3 | 7 | Set up advanced moulds for injection moulding | advanced mould setup context |
| 29515 | 3 | 5 | Carry out routine service of injection moulding equipment | routine service context |
| 260 | 4 | 10 | Service and maintain a complex mould for injection moulding | complex mould-maintenance context |
| 9713 | 4 | 5 | Set and remove complex injection moulds | complex mould setup/removal context |

The domain page identifies **CMR 13** for these current standards. Before any recognised assessment, the provider must recheck the live standard/version and CMR and confirm:

- consent-to-assess scope includes the proposed standard/domain and level;
- assessor/teacher/verifier capability meets current requirements;
- required machine, mould, ancillary and workplace resources are available;
- practical evidence conditions can be met safely and lawfully;
- internal moderation is controlled;
- national external moderation obligations are understood and scheduled.

The following standards are explicitly excluded from current assessment mapping because the NZQA domain identifies them as expired: `253`, `254`, `256`, `257`, `258`, `259`, `27925`, `9712`.

A chapter-to-standard link in MouldMaster means **supporting knowledge or practice context only**. It does not assert that every outcome, evidence requirement, range statement, explanatory note, practical condition or CMR obligation has been satisfied.

## Governed 46-chapter learning map

`../data/nzqa-education-readiness-v1.json` and its byte-identical learning-data mirror map every governed Book chapter to ten draft learning outcomes and current standard context. The mapping remains `technical-review` and has `publicationEffect: none`.

The map deliberately keeps these evidence states separate:
- app/formative evidence;
- provider-controlled summative evidence;
- real workplace evidence;
- internal moderation evidence;
- national external moderation evidence.

Simulation is not workplace competence. A quiz pass is not consent to assess. App completion is not an NZQA result.

## Listing and operational evidence

Before an application is considered submission-ready, the provider/developer should have evidence for:

- final title and purpose
- intended learner group and entry requirements
- final NZQCF level
- final credit value and defensible notional-learning-hour calculation
- coherent learning outcomes
- delivery modes and locations
- assessment methods and completion requirements
- RPL / credit recognition and transfer rules
- formal stakeholder/industry need evidence
- review period and review responsibility
- developer and provider roles
- any standards included in the micro-credential
- official award-document wording and achievement-reporting process

## MouldMaster workload study template

Do **not** reverse-engineer credits from app screen time. For each outcome/component, record:

1. guided lesson time
2. independent reading/review
3. formative practice and retrieval practice
4. troubleshooting/case work
5. summative knowledge assessment
6. applied case assessment
7. practical workplace evidence and observation
8. feedback/reassessment time where applicable

Total notional hours ÷ 10 gives the proposed credit value, subject to provider validation and NZQA rules.

## Needs-analysis evidence target

Build an evidence set that can demonstrate an actual training need rather than product interest alone. Useful evidence includes:

- employer interviews on operator/setter/technician skill gaps
- supervisor observations of recurring troubleshooting/process-control weaknesses
- learner interviews or surveys
- recruitment/workforce evidence
- incident/quality/rework themes where organisations can share them lawfully and anonymously
- provider/assessor feedback on the proposed outcomes
- plastics/manufacturing industry-body feedback
- relevant ISB input where appropriate

For every stakeholder record: role, organisation, date, consent, need identified, affected outcomes, requested changes, willingness to pilot, permission to quote/name, and follow-up action.

## Submission readiness gate

Do not describe the concept as an NZQA micro-credential in marketing or certificates until the relevant approval/accreditation has actually been granted.

A provider discussion can be treated as application-ready only when:

- [ ] eligible provider/developer route is confirmed
- [ ] final title, level and credits are agreed
- [ ] needs/stakeholder evidence is documented
- [ ] learning outcomes are mapped to level descriptors
- [ ] assessment instruments and marking schedules are approved
- [ ] assessor/moderator capability is evidenced
- [ ] delivery/resources/learner support are controlled
- [ ] RPL/credit/completion rules are documented
- [ ] workload study supports the proposed credits
- [ ] pilot/evaluation plan is agreed
- [ ] review cycle and responsibilities are documented
- [ ] official record/achievement reporting route is confirmed
- [ ] if DASS standards are assessed, current consent-to-assess scope is confirmed
- [ ] if DASS standards are assessed, applicable CMR requirements are evidenced
- [ ] if DASS standards are assessed, national external moderation participation is controlled
- [ ] practical outcomes have real authorised workplace evidence where required

## Source baseline

Recheck the live NZQA rules immediately before any real submission or standards-based assessment:

- Micro-credential Approval and Accreditation Rules 2026
- Qualification and Micro-credential Listing and Operational Rules 2026
- Consent to Assess Against Standards on the Directory of Assessment and Skill Standards Rules 2026
- applicable Consent and Moderation Requirements (currently CMR 13 for the mapped Injection Moulding standards)
- NZQA Injection Moulding DASS domain and each selected standard/version
- NZQA micro-credential listing, approval and accreditation guidance
- MyNZQA micro-credential application instructions

Controlled detailed sources are recorded in `../sources/NZQA_READINESS_REGISTER.md`.
