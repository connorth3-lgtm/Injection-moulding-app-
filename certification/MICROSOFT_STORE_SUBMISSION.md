# Microsoft Store Submission — MouldMaster Academy

Status: submission-preparation document. The app is **not yet Microsoft Store certified**.

Requirements below were refreshed against Microsoft Learn on 2026-08-24. Recheck Partner Center and Microsoft Store policy immediately before the real submission because submission fields and policy can change.

## Active Store route

Use the repository's open Electron desktop implementation under `desktop/electron/` and the gated `.github/workflows/microsoft-store-msix.yml` workflow to produce the Store package.

The active Store route is the **open Electron/MSIX desktop package**, not the PWA wrapper. The PWA remains a supported browser/installable-web lane and can still be evaluated separately with PWABuilder, but Store metadata and certification notes must describe the package actually being submitted.

Current open desktop baseline: `2026.08.25.1`.

## What Microsoft currently requires

A Partner Center app submission normally covers:
- pricing and availability
- product properties/capabilities
- age ratings
- package upload and package-related settings
- at least one completed Store listing language
- submission options and any certification notes

At least one screenshot is required for a Store listing; Microsoft recommends four or more. Desktop screenshots must be PNG and at least 1366×768 pixels. Microsoft currently permits up to 10 desktop screenshots and a maximum file size of 50 MB per screenshot.

For Microsoft Store distribution of MSIX/AppX packages, Microsoft states that the package does **not** need a CA-trusted publisher signature before submission; after successful certification the Store re-signs the package with a Microsoft certificate. This is different from direct EXE/MSI distribution, which requires the publisher to sign the installer.

Microsoft recommends running the Windows App Certification Kit before submission and testing on real Windows hardware.

## Repository readiness already completed

- [x] HTTPS public PWA/site hosting exists
- [x] Public privacy page exists
- [x] Public support page exists
- [x] Open Electron Windows source exists under Apache-2.0-compatible repository policy
- [x] Direct desktop dependencies are version-pinned and lockfile-controlled
- [x] Bundled application assets are SHA-256 verified before desktop launch
- [x] Electron renderer has Node integration disabled, context isolation enabled and sandbox enabled
- [x] Renderer permissions are denied by default and webviews are blocked
- [x] External HTTPS references open in the system browser
- [x] Local app content is served from loopback-only `127.0.0.1`
- [x] Dependency licence inventory is generated
- [x] CycloneDX SBOM is generated
- [x] GitHub Windows CI builds the portable open desktop package
- [x] Tagged open desktop release lane is configured for `desktop-v2026.08.25.1`
- [x] Store workflow builds x64 + arm64 MSIX, MSIX bundle and MSIX upload output
- [x] Store workflow preserves the four-part desktop release version
- [x] Store workflow enforces package integrity
- [x] Store workflow runs the 133-question evidence-approval QA gate
- [x] Store workflow refuses to build without exact Partner Center identity values
- [x] Release and assessment QA prevent premature external-accreditation claims
- [x] Store listing copy and screenshot plan are prepared in the repository

## Partner Center identity gate

The final Store identity must come from the product reserved in Microsoft Partner Center. These values must never be guessed:
- `Identity/Name` → repository variable `MM_STORE_IDENTITY_NAME`
- `Identity/Publisher` → repository variable `MM_STORE_PUBLISHER`
- `PublisherDisplayName` → repository variable `MM_STORE_PUBLISHER_DISPLAY_NAME`

Do not substitute a friendly publisher name for the `Identity/Publisher` certificate subject. Copy all three values exactly from Partner Center.

## Pre-submission technical checklist

### Source/release provenance
- [x] MouldMaster Release QA is configured for desktop release `2026.08.25.1`
- [x] Open Desktop Build is configured for desktop release `2026.08.25.1`
- [x] Question evidence approval is a required package gate
- [ ] Confirm the final `2026.08.25.1` release workflow is green on the exact intended source commit
- [ ] Record the exact commit selected for Store submission
- [ ] Confirm the Store workflow is run from that same intended source commit

### Real Windows validation
- [ ] Launch the published open desktop package on a normal Windows 10 or Windows 11 machine
- [ ] Confirm learner progress persists across close/reopen
- [ ] Confirm offline launch works after successful installation/first launch as designed
- [ ] Confirm keyboard navigation and visible focus are usable
- [ ] Confirm 100%/200% zoom remains usable where applicable
- [ ] Confirm reduced-motion preference is respected
- [ ] Confirm external HTTPS references open in the system browser
- [ ] Confirm no renderer permission prompt is unexpectedly exposed
- [ ] Run the Windows App Certification Kit on the intended Store package/build

### Legacy learner migration boundary
- [ ] Export an existing learner backup from the legacy runtime
- [ ] Import into the open desktop runtime
- [ ] Confirm intended learner profile/progress/notes/history are present
- [ ] Confirm certificates/pass state are not incorrectly trusted through import

See `../desktop/electron/LEGACY_MIGRATION.md`.

### Store package build
- [ ] Reserve the product in Partner Center
- [ ] Set all three exact Partner Center identity repository variables
- [ ] Run `.github/workflows/microsoft-store-msix.yml` from the intended source commit
- [ ] Confirm x64 + arm64 package creation succeeds
- [ ] Confirm `.msixbundle` is produced
- [ ] Confirm `.msixupload` is produced
- [ ] Confirm `Identity/Name` in the package matches Partner Center exactly
- [ ] Confirm `Identity/Publisher` matches Partner Center exactly
- [ ] Confirm `PublisherDisplayName` matches Partner Center exactly
- [ ] Confirm package version matches `version.json` `desktop_release`
- [ ] Confirm `SHA256SUMS-STORE.txt` and `SOURCE_COMMIT.txt` match the package set being submitted
- [ ] Keep generated integrity, dependency-licence and SBOM evidence with the submission archive

### Store listing
- [ ] Confirm product name reservation: **MouldMaster Academy**
- [ ] Paste/review `MICROSOFT_STORE_LISTING_COPY.md`
- [ ] Select final category
- [ ] Choose markets/territories
- [ ] Choose free/paid pricing and discoverability
- [ ] Complete the official age-rating questionnaire truthfully
- [ ] Supply the public privacy page where required
- [ ] Supply support contact/page information
- [ ] Capture real-app screenshots according to `MICROSOFT_STORE_ASSET_CHECKLIST.md`
- [ ] Upload at least one valid screenshot; target four or more desktop screenshots
- [ ] Check that screenshots contain no real learner PII
- [ ] Add Store logos/artwork required by the package/listing UI
- [ ] Review any capability declarations shown by Partner Center
- [ ] Add reviewer notes if special navigation/testing context will help certification

## Owner/account information still required

These cannot be completed automatically from the repository:
- active Microsoft Partner Center developer account
- reserved Store product
- exact Partner Center package identity values
- legal developer/publisher identity
- regulatory contact/address details Partner Center requires for the selected account/markets
- tax/payment information if applicable
- private/public support contact information where account policy requires it
- Store territories/pricing/discoverability decisions
- answers to the live Partner Center age-rating and policy declarations
- final submission action and Microsoft's certification decision

## Signing boundary

### Microsoft Store MSIX
Do not purchase or commit a `.pfx` merely to satisfy Store MSIX signing. Microsoft currently states that MSIX/AppX packages submitted through the Store are re-signed with a Microsoft certificate after certification.

### Direct download outside the Store
A separate direct-download EXE/MSIX distribution has a different trust boundary. Production direct-download packages should use an appropriate trusted signing method. Private keys/certificates must not be committed to GitHub.

## Screenshot and listing assets

Use:
- `MICROSOFT_STORE_LISTING_COPY.md`
- `MICROSOFT_STORE_ASSET_CHECKLIST.md`

Only actual application screenshots from a test profile should be used for Store evidence. Do not fabricate Microsoft certification screenshots or use generated/mock UI as proof that the application passed Store review.

## Packaging toolchain

Portable/NSIS packaging uses the stable lockfile-pinned `electron-builder` v26 dependency. MSIX support is currently supplied by the exact `electron-builder@27.0.0-alpha.7` beta in the Store workflow because the MSIX target is not available in the pinned v26 stable lane.

The Store workflow currently builds x64 + arm64 and requests:
- MSIX package output
- MSIX bundle creation
- MSIX upload package creation
- four-part build-number propagation
- package-integrity enforcement
- minimum Windows version `10.0.19041.0`

Any change to the Store packaging toolchain or manifest-generation behavior requires a new packaging/QA validation pass.

## Microsoft sources checked 2026-08-24

- Create an MSIX app submission: https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/create-app-submission
- Screenshots/images: https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/screenshots-and-images
- Privacy/support information: https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/support-info
- Package requirements/signing: https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/app-package-requirements
- Certification process: https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/app-certification-process

## Claim gate

Before Microsoft grants certification, do not say the application is Microsoft certified, Microsoft approved, Store certified or signed by Microsoft. Repository builds and GitHub Releases remain separate from Microsoft Store certification.
