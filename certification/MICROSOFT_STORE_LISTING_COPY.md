# Microsoft Store Listing Copy — MouldMaster Academy

Status: Store-listing draft for the open Windows desktop/MSIX lane. MouldMaster Academy is not yet Microsoft Store certified.

Use this as the starting copy in Partner Center after the product name has been reserved. Do not add claims of NZQA/IACET accreditation or Microsoft certification unless formally granted later.

## Product name
MouldMaster Academy

Do not append a version number or date to the Store title.

## Short description
Guided injection moulding training from beginner to advanced, with troubleshooting practice, regional safety references and knowledge assessments.

## Full description
MouldMaster Academy is a guided learning platform for injection moulding knowledge and process-engineering development.

Learn from beginner foundations through advanced process engineering with structured lessons, troubleshooting scenarios, scientific-moulding concepts, material science, defect diagnosis, process capability, DOE, automation and tooling topics.

Key features include:
- structured beginner-to-advanced learning paths
- practical injection moulding examples and evidence-based troubleshooting
- UK, US and New Zealand machinery-safety reference modes
- defect-finding and troubleshooting scenarios
- material-science learning modules
- final knowledge assessments with safety-critical pass requirements
- spaced repetition for weak areas
- learner notes and progress tracking
- practical supervisor sign-off learning records
- offline-capable installed desktop learning after the application has been installed successfully

Important: MouldMaster Academy is an educational tool. Current in-app completion certificates are local learning records and are not NZQA qualifications, IACET CEUs, statutory licences or proof of legal competence. Production settings, machine access and safety decisions remain subject to the actual resin grade, machinery documentation, approved site procedures and applicable law.

## Feature bullets
1. Beginner-to-advanced injection moulding curriculum
2. Guided troubleshooting and defect diagnosis
3. UK / US / New Zealand safety-reference modes
4. Scientific moulding, capability and DOE learning
5. Material science from polymer basics to advanced behaviour
6. Spaced repetition and confidence-based review
7. Practical supervisor sign-off learning records
8. Offline-capable installed Windows learning

## Suggested category
Education

Secondary positioning: engineering / manufacturing training. Confirm the final category in Partner Center when the product is reserved.

## Suggested search terms
Use only terms that accurately describe the product. Suggested starting set:
- injection moulding
- injection molding
- plastics training
- process engineering
- scientific moulding
- molding defects
- polymer training

## Privacy URL
https://connorth3-lgtm.github.io/Injection-moulding-app-/privacy.html

## Support URL
https://connorth3-lgtm.github.io/Injection-moulding-app-/support.html

## Website
https://connorth3-lgtm.github.io/Injection-moulding-app-/

## Age / audience positioning
Professional and vocational education. No gambling, sexual content, user-generated social feed or designed violent content is part of the product.

Complete the official Partner Center age-rating questionnaire truthfully; do not infer or publish a final rating from this draft.

## Pricing / availability decision
Repository preparation does not choose commercial terms. The owner must select free/paid pricing, markets, discoverability and any publishing hold in Partner Center.

## Desktop screenshot set
Microsoft currently requires at least one screenshot and recommends four or more. For desktop, use PNG screenshots at least 1366×768 pixels; up to 10 desktop screenshots may be supplied. Keep each file below 50 MB.

Use actual application screenshots from the submitted build. Do not use synthetic/mock screenshots as certification evidence. Capture with a test learner account only and no real learner PII.

Recommended order:
1. Home / learning dashboard
2. Course / learning-path view
3. Lesson screen showing clear reading structure
4. Troubleshooting scenario
5. Defect Finder
6. Material Science
7. Assessment / debrief screen
8. Practical sign-off or certificate-status screen with clearly non-accredited wording

Keep important interface content in the top two-thirds of each screenshot because Store overlays can cover lower areas. Do not add extra marketing logos or promotional text onto screenshots.

See `MICROSOFT_STORE_ASSET_CHECKLIST.md` for the capture/QA checklist.

## Certification notes for Microsoft reviewer
MouldMaster Academy is an open-source Electron desktop application for injection moulding education. The submitted Store package is built from the repository's `desktop/electron/` source and bundles the MouldMaster learning application. Bundled application assets are checked against a SHA-256 integrity manifest before launch. The renderer runs without Node integration, with context isolation and Electron sandboxing enabled. Local application content is served only over a loopback `127.0.0.1` origin; external HTTPS references open in the user's normal browser.

The application provides local learner progress, notes and learning-completion records. It does not claim that its completion certificate is a regulated qualification, government certification, IACET CEU or proof of machine-specific workplace competence.

The repository's public privacy and support pages are listed above. Any owner/legal contact details required by Partner Center must be supplied from the actual developer account and must not be fabricated in source control.

## Current Store package baseline
- Open desktop release: `2026.08.26.4`
- Intended package route: MSIX / MSIX bundle / MSIX upload package
- Architecture workflow: x64 + arm64
- Store identity: supplied at workflow runtime from the exact Partner Center product values
- GitHub direct-download release: separate unsigned open-source testing/distribution lane, not Microsoft-certified

## Microsoft guidance used for this draft
Requirements should be rechecked immediately before submission. Current reference pages:
- https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/create-app-submission
- https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/screenshots-and-images
- https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/support-info
- https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/app-package-requirements
