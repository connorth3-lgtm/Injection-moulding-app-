# Microsoft Store Asset Checklist — MouldMaster Academy

Status: capture/QA plan for the open Windows desktop/MSIX Store submission. These are preparation assets only; they are not evidence of Microsoft certification.

Requirements refreshed against Microsoft Learn on 2026-08-24.

## Screenshot requirements

For the desktop Store listing:
- format: PNG
- minimum dimensions: 1366×768 pixels
- maximum file size: 50 MB per screenshot
- minimum count: 1 screenshot
- recommended count: 4 or more
- maximum desktop count: 10 screenshots

Use actual screenshots of the application build intended for submission. Do not use generated, composited or mock UI as certification evidence.

## Privacy and data handling

Before capture:
- create a test learner profile only
- use fictional/non-identifying learner names
- do not show real backup files, email addresses, employer records or learner notes
- do not show repository secrets, Partner Center identity values or private support information
- inspect certificate/sign-off screens for accidental personal data

After capture, review every image at full resolution for PII before adding it to the Store listing.

## Recommended desktop screenshot sequence

### 1. Home / learning dashboard
Purpose: establish the product and show the learning structure.

Check:
- app name visible
- no learner PII
- navigation legible
- no debug/devtools UI

### 2. Course / learning-path view
Purpose: show beginner-to-advanced progression.

Check:
- course/module titles legible
- progress values belong only to the test profile

### 3. Lesson reading screen
Purpose: show structured technical learning content.

Check:
- reading hierarchy is clear
- source/reference affordance is visible where useful
- no proprietary standards text is reproduced beyond repository policy

### 4. Troubleshooting scenario
Purpose: show interactive defect/process reasoning.

Check:
- scenario is not showing an unsafe universal production recipe
- safety/site-documentation caveats remain visible where relevant

### 5. Defect Finder
Purpose: show practical diagnostic learning.

Check:
- diagnostic language remains educational rather than guaranteed production advice

### 6. Material Science
Purpose: demonstrate technical breadth.

Check:
- resin/process statements do not imply universal grade-independent settings

### 7. Assessment / debrief
Purpose: show knowledge assessment and evidence-led feedback.

Check:
- use a completed/debrief state rather than exposing live unanswered exam references where the app intentionally withholds them
- safety-critical pass rules are represented accurately

### 8. Practical sign-off / certificate-status screen
Purpose: show learning-record functionality.

Check:
- visible wording makes clear that the current certificate is a learning-completion record
- do not show or imply NZQA approval, IACET CEUs, government qualification or Microsoft certification

## Visual framing rules

Microsoft notes that Store overlays can cover the lower part of screenshots. Keep important controls and text in the top two-thirds where practical.

Do not add:
- extra marketing logos
- fake Store badges
- "Microsoft certified" artwork
- promotional text overlays that are not part of the actual application UI
- fabricated ratings/reviews

Crop only to remove irrelevant operating-system chrome if desired; do not crop in a way that misrepresents application behavior.

## Store logos / artwork

The package already generates MSIX artwork from the open MouldMaster icon. Before submission:
- [ ] inspect generated Store/MSIX artwork at final resolution
- [ ] confirm no stretching or clipping
- [ ] confirm product name/icon branding is consistent with the reserved Store product
- [ ] upload any additional Store logos requested by Partner Center
- [ ] do not use Microsoft trademarks or certification marks without permission

## Capture acceptance checklist

For each screenshot:
- [ ] actual application build used
- [ ] PNG
- [ ] at least 1366×768
- [ ] below 50 MB
- [ ] no real learner PII
- [ ] no secrets/private account data
- [ ] no false accreditation/certification claim
- [ ] no devtools/error overlay
- [ ] key UI visible in top two-thirds
- [ ] caption, if used, accurately describes the screen

## Suggested captions

Keep captions factual and short. Examples:
- "Follow structured injection moulding learning paths from foundations to advanced process engineering."
- "Work through evidence-led troubleshooting scenarios and defect diagnosis."
- "Study material behaviour, scientific moulding, process capability and DOE concepts."
- "Review completed assessments with safety-critical pass requirements and learning feedback."

## Final asset handoff

Before Partner Center submission, place the approved local screenshot set in a private submission working folder or approved publisher-controlled asset store. Do not commit real learner screenshots or account-sensitive Partner Center exports to this public repository.

Record in the submission notes:
- capture date
- source commit/build version
- Windows version used for capture
- test-profile identifier (non-personal)
- reviewer initials/owner

## Microsoft source checked 2026-08-24

https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/screenshots-and-images
