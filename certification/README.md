# MouldMaster Academy — Certification & Accreditation Roadmap

Status: **preparation in progress — not yet accredited by NZQA or IACET, and not yet Microsoft Store certified**.

Current product baselines:
- PWA shell: `2026.08.23.10`
- Training content: `2026.08.23.5`
- Audited question bank: `2026.08.21.1`
- Windows recovery feed: `2026.08.21.1`

## 1. Software trust — preferred route

### Microsoft Store PWA
MouldMaster already has the core ingredients Microsoft requires for a Progressive Web App: HTTPS hosting, a web app manifest, installable icons, standalone display mode and a service worker/offline layer.

Preferred publishing path:
1. Create/verify a Microsoft Partner Center developer account.
2. Reserve the product name **MouldMaster Academy**.
3. Run the live PWA through PWABuilder using the GitHub Pages URL.
4. Fix any PWABuilder report-card action items.
5. Generate the Windows Store package.
6. Complete Store listing, privacy, age-rating, accessibility and product declarations.
7. Submit for Microsoft certification.
8. After approval, use the Microsoft Store as the primary Windows distribution route.

Why this route is preferred: Microsoft Store-distributed MSIX/PWA packages are signed by Microsoft after certification. This avoids relying on the current unsigned EXE for public distribution.

### Direct EXE/MSIX distribution
Keep as a secondary route only. Production direct-download binaries should use a trusted signing method such as Azure Artifact Signing or an OV code-signing certificate. Self-signed certificates are for development/testing only.

## 2. Training credential status

Until an external education/accreditation body approves the programme, MouldMaster certificates must continue to say **Certificate of Completion / local learning record** and must not claim:
- NZQA accreditation
- a New Zealand qualification or approved micro-credential
- IACET CEUs
- government certification
- statutory competence or authorisation to operate machinery

A practical supervisor sign-off is evidence for workplace learning; it is not a substitute for employer authorisation, machine-specific training, site procedures or legal duties.

## 3. NZQA pathway

### Fastest practical route — partner with an existing recognised provider
The preferred first route is to partner with an NZQA-recognised education provider (for example an NZQA-registered PTE) and jointly develop/approve an injection-moulding micro-credential.

Current 2026 NZQA micro-credential evidence areas include:
- appropriate title and learning outcomes
- evidence of need and stakeholder support
- admission, recognition of prior learning/credit, length and structure
- assessment methods and completion requirements
- regular review for currency and content
- delivery appropriate to learners and delivery mode
- fair, valid and consistent assessment
- effective moderation
- suitable staff, facilities/resources and learner support
- review of delivery and learner outcomes

Approved NZQCF micro-credentials are normally 1–40 credits. One credit represents 10 notional learning hours.

### Own-PTE route
This is a separate organisational project. It requires legal/governance information, financial and operational evidence, learner/academic record systems, policies, suitable management and evidence that the proposed training meets learner/community/stakeholder needs. Do not submit until the organisation and governance structure are settled.

## 4. IACET pathway

Target standard: **ANSI/IACET 1-2018 Standard for Continuing Education and Training**.

Readiness conditions include:
- applicant must be an eligible legal organisation/recognised sole proprietorship or governmental unit
- organisation must have operated under the applicable conditions for at least one year
- evidence-based policies, processes and records are required
- learning needs, instructional design, learning outcomes, assessment, records, evaluation and continuous improvement must be controlled as an organisational system

Current published 2026 IACET costs should be rechecked immediately before purchase/submission. IACET currently lists a USD 495 Standard/Application bundle and a separate initial application review fee.

Only after IACET grants Accredited Provider status may the organisation issue IACET CEUs.

## 5. Evidence pack in this repository

The following files are preparation documents, not proof of accreditation:
- `QUALITY_AND_ASSESSMENT_MANUAL.md`
- `NZQA_MICROCREDENTIAL_DRAFT.md`
- `IACET_READINESS_MATRIX.md`
- `MICROSOFT_STORE_SUBMISSION.md`
- `PROVIDER_PARTNERSHIP_OUTREACH.md`
- `../credentials/README.md`

## 6. Gating rule

No UI, certificate, marketing copy or store listing may say **accredited**, **NZQA approved**, **IACET CEU**, **certified by Microsoft**, **qualified**, or an equivalent claim until the relevant external body has actually granted that status.
