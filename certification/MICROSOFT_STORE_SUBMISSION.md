# Microsoft Store Submission — MouldMaster Academy

Status: submission-preparation document. The app is **not yet Microsoft Store certified**.

## Preferred route

Use the repository's open Electron desktop implementation and the gated `.github/workflows/microsoft-store-msix.yml` workflow to produce the MSIX bundle/upload package, then submit it through Microsoft Partner Center. The Store identity values must come from the reserved Partner Center product; they are deliberately not invented or hard-coded into the application source.

The PWA remains a valid browser/installable-web distribution lane. PWABuilder may be evaluated as an alternative Store route if the project later chooses to distribute the PWA rather than the Electron desktop wrapper, but it is not the active Store packaging workflow in this repository.

## Existing application readiness

Current repository already includes:
- HTTPS GitHub Pages hosting for the PWA
- `manifest.webmanifest`
- 192×192 and 512×512 icons
- service worker/offline cache
- responsive mobile/desktop UI
- an open Electron Windows wrapper
- SHA-256 verification of bundled application assets
- Electron renderer sandboxing and permission denial
- embedded ASAR integrity/only-load-from-ASAR hardening
- dependency licence inventory and CycloneDX SBOM generation
- a Windows MSIX build workflow using Partner Center identity values

## Pre-submission technical checks

- [ ] MouldMaster Release QA is green for the exact source commit
- [ ] Open Desktop Build is green for the exact source commit
- [ ] Portable Windows package launches on real Windows 10/11 hardware
- [ ] Learner progress survives ordinary app update/relaunch testing
- [ ] MSIX x64 and arm64 package creation succeeds
- [ ] `.msixbundle` / `.msixupload` is created successfully
- [ ] Package manifest Identity/Name exactly matches Partner Center
- [ ] Package manifest Identity/Publisher exactly matches Partner Center
- [ ] PublisherDisplayName exactly matches Partner Center
- [ ] MSIX version matches `version.json` `desktop_release`
- [ ] Store package-integrity enforcement is present
- [ ] External HTTPS links open safely in the system browser
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
- Microsoft Partner Center account and reserved product
- exact Identity/Name value → repository variable `MM_STORE_IDENTITY_NAME`
- exact Identity/Publisher value → repository variable `MM_STORE_PUBLISHER`
- exact PublisherDisplayName → repository variable `MM_STORE_PUBLISHER_DISPLAY_NAME`
- legal developer/publisher identity
- tax/payment information if monetised
- publisher/support/privacy contact details
- Store territories/pricing decisions

Do not substitute a friendly publisher name for the Identity/Publisher certificate subject. Copy all three package-identity values exactly from Partner Center.

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
- Offline-capable installed application
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

## Package identity and version

The final Store identity is supplied only at workflow runtime from Partner Center repository variables. `package.json` does not contain a fabricated Store publisher identity.

`version.json` is the release record. The Electron package keeps a valid three-component npm version and uses `buildNumber` / `buildVersion` for the fourth Windows component. The Store workflow enables `msix.setBuildNumber`, so a desktop release such as `2026.08.24.1` becomes the Windows package version `2026.8.24.1`. Repository QA rejects version drift.

## Packaging toolchain

Portable/NSIS packaging uses the stable, lockfile-pinned electron-builder v26 dependency. MSIX support is currently supplied by the exact `electron-builder@27.0.0-alpha.7` beta in the Store workflow because the MSIX target is not available in v26. Any change to that beta version requires a new Store packaging validation pass.

## Direct-download signing alternative

If a separate EXE/MSIX continues to be distributed outside the Store, production builds should be signed using a trusted production code-signing method. Keep private signing keys/certificates out of GitHub. GitHub Actions should use a secure signing service or protected secret-based workflow, not a committed `.pfx` file.
