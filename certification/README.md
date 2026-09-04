# MouldMaster Academy — Certification & Accreditation Roadmap

Status: **repository preparation is advanced, but MouldMaster Academy is not yet accredited by NZQA or IACET and is not yet Microsoft Store certified**.

Current product baselines are recorded in `../version.json`. As of 2026-09-05:
- PWA / browser shell: `2026.09.05.1`
- Open Windows desktop: `2026.08.26.7`
- Training content: `2026.08.26.1`
- Audited question bank: `2026.08.30.1`
- Assessment quality / analytics hardening: `2026.08.24.3`
- Learner-scoped assessment storage: `2026.08.24.4`
- Assessment storage migration hardening: `2026.09.05.1`
- Question evidence approval: `2026.08.25.2`
- Legacy Windows recovery feed: `2026.08.21.1`

## 1. Software trust — Microsoft Store route

### Preferred Store package: open Electron/MSIX desktop

The preferred Microsoft Store route is now the source-backed Electron desktop implementation under `../desktop/electron/`, packaged through the gated `../.github/workflows/microsoft-store-msix.yml` workflow.

Why this route is preferred:
- repository-owned desktop source is public
- exact direct dependencies and npm lockfile are committed
- bundled learning assets are SHA-256 verified before launch
- Electron renderer privileges are restricted
- dependency licence inventory and CycloneDX SBOM are generated
- x64 + arm64 MSIX/MSIX bundle/MSIX upload packaging is automated
- the 157-question evidence-approval gate runs before packaging
- package identity is taken from the actual Partner Center product rather than fabricated in source
- Microsoft Store MSIX/AppX packages are re-signed by Microsoft after successful certification under Microsoft's current published process

The PWA remains a supported browser/installable-web lane and may still be assessed with PWABuilder, but Store metadata must describe the package actually submitted.

### Microsoft Store path

Repository-controlled preparation:
- [x] open Windows desktop source and reproducible build workflow
- [x] public privacy/support pages
- [x] release/security/assessment/source QA
- [x] question-evidence approval gate
- [x] Partner Center identity-gated Store workflow
- [x] Store listing draft
- [x] screenshot/asset checklist
- [x] certification claim gate

External/account steps:
1. Create or verify the Microsoft Partner Center developer account.
2. Reserve **MouldMaster Academy** as the Store product name.
3. Copy the exact Partner Center package identity values into the repository variables required by the Store workflow.
4. Complete real Windows validation and Windows App Certification Kit testing.
5. Run the Store MSIX workflow from the intended source commit.
6. Upload the package in Partner Center.
7. Complete pricing/availability, properties, age ratings, Store listing, privacy/support and any capability declarations.
8. Upload actual application screenshots with no learner PII.
9. Submit for Microsoft certification.
10. Only after Microsoft grants certification may the project describe that Store package as Microsoft Store certified/signed by Microsoft.

See:
- `MICROSOFT_STORE_SUBMISSION.md`
- `MICROSOFT_STORE_LISTING_COPY.md`
- `MICROSOFT_STORE_ASSET_CHECKLIST.md`

### Direct EXE/MSIX distribution

Direct-download builds remain a separate trust lane. The GitHub portable release is transparent/open-source distribution and testing, but it is not Microsoft Store certification. Production binaries distributed directly outside the Store should use an appropriate trusted signing method; private signing keys/certificates must never be committed to the repository.

## 2. Training credential status

Until an external education/accreditation body approves the programme, MouldMaster certificates must continue to say **Certificate of Completion / local learning record** and must not claim:
- NZQA accreditation
- a New Zealand qualification or approved micro-credential
- IACET CEUs
- government certification
- statutory competence or authorisation to operate machinery

A practical supervisor sign-off is evidence for workplace learning; it is not a substitute for employer authorisation, machine-specific training, approved site procedures or legal duties.

## 3. NZQA pathway — current 2026 rule baseline

The **Micro-credential Approval and Accreditation Rules 2026** and **Qualification and Micro-credential Listing and Operational Rules 2026** commenced on 19 January 2026.

Current baseline used by this repository:
- NZQCF micro-credentials are 1–40 credits
- one credit represents 10 notional learning hours
- micro-credentials can sit at any NZQCF level using best fit to the level descriptors
- approval requires an appropriate title/outcomes, evidence of need and stakeholder support, clear requirements and an effective review process
- accreditation requires provider capability for delivery, assessment/moderation, staffing/resources and learner support
- eligible TEOs apply through MyNZQA
- Industry Skills Boards (ISBs) can apply for listing/approval but not provider accreditation
- current vocational-education terminology uses Industry Skills Board (ISB)

### Preferred practical route — partner with an eligible provider

The preferred first route is to partner with an NZQA-recognised tertiary education organisation that can own the provider/accreditation responsibilities and submit through MyNZQA.

Repository preparation now includes:
- a rule-aligned draft purpose, learner cohort and outcomes
- assessment architecture and safety-critical knowledge gate
- practical workplace-evidence concept
- versioned curriculum and source/reference QA
- a 2026 approval/accreditation evidence matrix
- employer/provider outreach and needs-analysis prompts
- explicit provider-owned gaps for learner records, moderation, assessor competence, support, RPL/credit rules and official achievement reporting

The provider must still agree/control:
- final title and developer/provider roles
- NZQCF level and credit value
- defensible notional-learning-hour workload study
- admission/RPL/credit recognition and transfer
- final assessment instruments, reassessment rules and marking schedules
- assessor/moderator competence and moderation
- learner identity, enrolment, privacy, records, support, complaints and appeals
- delivery modes, sites, workplace evidence and resources
- review date/cycle and change governance
- official award/achievement-reporting process

### Need and stakeholder evidence

The application cannot rely on product interest alone. Evidence should show a real learner/employer/industry need and stakeholder support. Where appropriate, relevant ISB input should be considered.

Target evidence includes:
- employer interviews and supervisor feedback
- learner/workforce surveys
- recurring process/troubleshooting capability gaps
- provider/assessor review
- plastics/manufacturing industry feedback
- relevant ISB engagement where appropriate
- pilot/evaluation evidence

### Own-provider route

Becoming a recognised education provider is a separate organisational project. It requires legal/governance, financial, operational, learner-record, policy, management and quality-system evidence. Do not present repository preparation as provider registration or accreditation.

See:
- `NZQA_2026_EVIDENCE_MATRIX.md`
- `NZQA_MICROCREDENTIAL_DRAFT.md`
- `PROVIDER_PARTNERSHIP_OUTREACH.md`
- `QUALITY_AND_ASSESSMENT_MANUAL.md`

## 4. IACET pathway — current 2026 public baseline

IACET accreditation is **organisational accreditation** for providers of adult continuing education and training. IACET does not independently approve one MouldMaster course as an IACET course without the organisation becoming an Accredited Provider.

The public IACET eligibility baseline verified on 2026-08-24 requires an applicant to be a legally recognised eligible entity, have at least **one year in business**, have operated under the application conditions for at least **three months**, define the organisational unit responsible for CE/T, and be able to evidence compliant policies/processes in the application and accreditation interview.

IACET's current public accreditation pages still identify **ANSI/IACET 1-2018** as the operative CE/T Standard. Publicly described categories cover:
- Organization, Responsibility and Control
- Learning Environment and Support Systems
- Planning and Instructional Personnel
- Needs Analysis
- Learning Outcomes
- Content and Instructional Requirements
- Assessment of Learning Outcomes
- Awarding the IACET CEU and Maintaining Learner Records
- Evaluation of Learning Events

Current 2026 public cost/process checkpoint:
- Standard + Initial Application bundle: **USD 495**
- Initial Application Review Fee: **USD 4,845**
- Accredited Provider Annual Maintenance Fee: **USD 1,245**
- purchased application validity: one year
- typical review: approximately 3–4 months
- virtual accreditation interview by default
- ongoing annual reporting/maintenance and a five-year reaccreditation cycle after approval

Fees/process details must be rechecked directly with IACET immediately before purchase or payment.

### MouldMaster readiness boundary

Repository preparation can supply versioned instructional content, assessment QA, source controls, policy drafts, evidence structures and claim gates. IACET will require evidence that the **applicant organisation actually operates** the CE/T management system.

Priority external/organisational evidence includes:
- eligible legal entity and operating-history proof
- defined organisational CE/T unit and named accountable owner
- real needs-analysis records
- qualified instructional personnel/SME evidence
- controlled learning-event design records
- learner support/accessibility operation
- provider-controlled learner records/privacy/security
- real learner/event evaluations
- corrective actions and management review
- pilot/operating evidence showing policies are used in practice

The public CEU definition is **1 CEU = 10 contact hours**, but this arithmetic does not authorize MouldMaster to advertise IACET CEUs. Only after IACET grants Accredited Provider status may the organisation issue IACET CEUs, and then only through the accredited organisation's compliant learning-event and record processes.

Recommended sequence: verify legal/operating eligibility first, use IACET's free readiness resources, run a real operating/pilot cycle, close evidence gaps, then purchase the current Standard/application bundle for a clause-level self-audit when the organisation is genuinely ready.

See:
- `IACET_READINESS_MATRIX.md`
- `IACET_2026_HANDOFF.md`
- `QUALITY_AND_ASSESSMENT_MANUAL.md`

## 5. Evidence pack in this repository

Preparation documents are evidence of internal readiness, not proof of external approval:
- `QUALITY_AND_ASSESSMENT_MANUAL.md`
- `NZQA_2026_EVIDENCE_MATRIX.md`
- `NZQA_MICROCREDENTIAL_DRAFT.md`
- `IACET_READINESS_MATRIX.md`
- `IACET_2026_HANDOFF.md`
- `MICROSOFT_STORE_SUBMISSION.md`
- `MICROSOFT_STORE_LISTING_COPY.md`
- `MICROSOFT_STORE_ASSET_CHECKLIST.md`
- `PROVIDER_PARTNERSHIP_OUTREACH.md`
- `../credentials/README.md`

## 6. External-action tracker

Repository-completable work and external/account/provider steps are separated in GitHub issue #5. Legacy Windows migration/retirement checks are tracked in issue #6.

## 7. Gating rule

No UI, certificate, marketing copy, Store listing or repository documentation may say **accredited**, **NZQA approved**, **IACET CEU**, **Microsoft certified**, **Microsoft Store certified**, **qualified**, or an equivalent external-approval claim until the relevant external body has actually granted that status.