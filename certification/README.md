# MouldMaster Academy — Certification & Accreditation Roadmap

Status: **repository preparation is advanced, but MouldMaster Academy is not yet accredited by NZQA or IACET and is not yet Microsoft Store certified**.

Current product baselines are recorded in `../version.json`. As of 2026-08-24:
- PWA / browser shell: `2026.08.24.1`
- Open Windows desktop: `2026.08.24.2`
- Training content: `2026.08.24.2`
- Audited question bank: `2026.08.24.2`
- Assessment quality / analytics hardening: `2026.08.24.3`
- Learner-scoped assessment storage: `2026.08.24.4`
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
- package identity is taken from the actual Partner Center product rather than fabricated in source
- Microsoft Store MSIX/AppX packages are re-signed by Microsoft after successful certification under Microsoft's current published process

The PWA remains a supported browser/installable-web lane and may still be assessed with PWABuilder, but Store metadata must describe the package actually submitted.

### Microsoft Store path

Repository-controlled preparation:
- [x] open Windows desktop source and reproducible build workflow
- [x] public privacy/support pages
- [x] release/security/assessment/source QA
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

## 3. NZQA pathway

### Fastest practical route — partner with an existing recognised provider

The preferred first route is to partner with an NZQA-recognised education provider and jointly develop/approve the appropriate learning product rather than representing MouldMaster itself as an approved provider.

Preparation evidence areas include:
- appropriate title and learning outcomes
- evidence of need and stakeholder support
- admission/RPL/credit and programme structure decisions
- assessment methods and completion requirements
- regular review for currency and content
- delivery appropriate to learners and delivery mode
- fair, valid and consistent assessment
- effective moderation
- suitable staff, facilities/resources and learner support
- review of delivery and learner outcomes

The exact NZQA product type, level, credits and approval route must be agreed with the recognised provider and checked against current NZQA rules at the time of application.

### Own-provider route

Becoming a recognised education provider is a separate organisational project. It requires legal/governance, financial, operational, learner-record, policy, management and quality-system evidence. Do not present repository preparation as provider registration or accreditation.

See:
- `NZQA_MICROCREDENTIAL_DRAFT.md`
- `PROVIDER_PARTNERSHIP_OUTREACH.md`
- `QUALITY_AND_ASSESSMENT_MANUAL.md`

## 4. IACET pathway

The repository contains an IACET readiness matrix, but Accredited Provider status is an external organisational approval.

Readiness work includes:
- eligible applicant legal entity
- organisational ownership of the quality system
- learning-needs and instructional-design controls
- measurable learning outcomes
- assessment and completion records
- programme evaluation
- records management
- continuous improvement
- evidence from a real operating/pilot cycle

Current IACET fees, standards and eligibility requirements must be rechecked directly with IACET before purchase or application. Only after IACET grants Accredited Provider status may the organisation claim IACET CEUs.

See `IACET_READINESS_MATRIX.md`.

## 5. Evidence pack in this repository

Preparation documents are evidence of internal readiness, not proof of external approval:
- `QUALITY_AND_ASSESSMENT_MANUAL.md`
- `NZQA_MICROCREDENTIAL_DRAFT.md`
- `IACET_READINESS_MATRIX.md`
- `MICROSOFT_STORE_SUBMISSION.md`
- `MICROSOFT_STORE_LISTING_COPY.md`
- `MICROSOFT_STORE_ASSET_CHECKLIST.md`
- `PROVIDER_PARTNERSHIP_OUTREACH.md`
- `../credentials/README.md`

## 6. External-action tracker

Repository-completable work and external/account/provider steps are separated in GitHub issue #5. Legacy Windows migration/retirement checks are tracked in issue #6.

## 7. Gating rule

No UI, certificate, marketing copy, Store listing or repository documentation may say **accredited**, **NZQA approved**, **IACET CEU**, **Microsoft certified**, **Microsoft Store certified**, **qualified**, or an equivalent external-approval claim until the relevant external body has actually granted that status.
