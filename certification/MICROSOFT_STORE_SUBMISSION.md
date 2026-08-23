# Microsoft Store Submission — MouldMaster Academy PWA

Status: submission-preparation document. The app is **not yet Microsoft Store certified**.

## Preferred route
Package the live PWA for Microsoft Store distribution using PWABuilder/Store tooling, then submit through Microsoft Partner Center. A Store-distributed package is signed as part of the Microsoft Store distribution process.

## Existing PWA readiness
Current repository already includes:
- HTTPS GitHub Pages hosting
- `manifest.webmanifest`
- 192×192 and 512×512 icons
- `display: standalone`
- `start_url` and scope
- service worker/offline cache
- responsive mobile/desktop UI

## Pre-submission technical checks
- [ ] Live URL loads without console-fatal errors
- [ ] Manifest passes installability checks
- [ ] 192 and 512 icons display cleanly, including maskable crop
- [ ] Offline-first launch works after one successful online install
- [ ] App update does not delete learner progress
- [ ] External links open safely
- [ ] Back navigation behaves predictably
- [ ] Keyboard navigation is usable
- [ ] Visible focus states exist
- [ ] Colour contrast and zoom tested
- [ ] Reduced-motion preference respected
- [ ] No certificate text claims external accreditation
- [ ] Privacy policy and support contact pages are public
- [ ] Store age/content declarations reviewed

## Partner Center information that must come from the owner
These cannot be completed automatically from this repository:
- legal developer/publisher identity
- Microsoft Partner Center account
- tax/payment information if monetised
- publisher contact details
- support contact
- privacy-policy contact/entity
- Store territories/pricing decisions

## Draft Store listing
**Name:** MouldMaster Academy

**Short description:**
Injection moulding training from fundamentals through troubleshooting, scientific moulding, materials, statistics, automation and advanced process engineering.

**Long description:**
MouldMaster Academy is a guided injection moulding learning platform designed for operators, setters, technicians and engineers. Learn the moulding cycle, machine controls, material behaviour, mould design, process setup, defect troubleshooting, scientific moulding, capability, DOE, automation, sensors and advanced tooling through structured lessons, realistic cases and assessment.

Safety and process guidance is evidence-led: the app distinguishes setpoints from actuals, avoids universal production recipes, and points learners to current machine documentation, resin-grade supplier information, site procedures and applicable jurisdictional requirements. Certificates generated before external accreditation are learning-completion records only.

**Suggested category:** Education / Productivity (confirm during Partner Center submission)

## Suggested feature bullets
- Beginner-to-advanced injection moulding curriculum
- Realistic troubleshooting scenarios
- UK, US and New Zealand safety-reference modes
- Material Science learning track
- Spaced repetition and weak-area review
- Offline-capable installed PWA
- Practical supervisor sign-off learning record
- Assessment with safety-critical pass gate

## Screenshots to capture
1. Home/dashboard
2. Clear lesson-reading screen
3. Troubleshooting scenario
4. Material Science module
5. Assessment/debrief screen
6. Standards/safety-reference screen
7. Practical sign-off screen

Do not show personal learner information in Store screenshots.

## Package identity
Do not hard-code a final Store package identity in the web repository until Partner Center/PWABuilder generates or confirms the publisher/package identity.

## Direct-download signing alternative
If a separate EXE/MSIX continues to be distributed outside the Store, production builds should be signed using a trusted production code-signing method. Keep private signing keys/certificates out of GitHub. GitHub Actions should use a secure signing service or protected secret-based workflow, not a committed `.pfx` file.
