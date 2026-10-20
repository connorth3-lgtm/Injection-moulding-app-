# Windows distribution/signing readiness — 2026.09.14

Release target: MouldMaster web `2026.09.14.4`; current desktop release identity remains governed separately in `version.json`.

## What the repository can prove automatically

The existing `.github/workflows/microsoft-store-msix.yml` already fails closed unless the three Microsoft Partner Center identity values are supplied as repository variables. It installs exact locked dependencies, verifies the locked MSIX builder, regenerates application integrity/licence/SBOM evidence, runs the desktop and product QA suite, builds x64 + arm64 Store packages, records the source commit and SHA-256 hashes, and uploads the package/evidence bundle.

These checks establish **packaging readiness**, not Microsoft/Store approval, certificate possession, SmartScreen reputation or successful execution on a physical Windows machine.

## External inputs still required

Before `data/release-external-validation-v1.json` can change `windowsDistribution.status` from `hold` to `validated`, collect all of the following for the release being claimed:

1. Partner Center product identity is reserved and the exact `MM_STORE_IDENTITY_NAME`, `MM_STORE_PUBLISHER` and `MM_STORE_PUBLISHER_DISPLAY_NAME` repository variables are configured.
2. Run the Store/MSIX workflow from the exact intended source commit and retain its package, source-commit, SHA-256, licence and SBOM artifacts.
3. Obtain signed/Store package provenance through the actual Microsoft distribution path or an approved signing path; do not commit private keys, PFX files, passwords or payment/account material.
4. Install/launch on a real supported Windows machine and record a non-sensitive device reference and Windows version.
5. Exercise the SmartScreen/Store reputation path actually intended for users.
6. Run Windows App Certification Kit (WACK) or the current equivalent package validation and retain the external evidence reference.

## Governed evidence shape

Only after the real external steps pass, `windowsDistribution.evidence` in `data/release-external-validation-v1.json` may contain a release-bound object with:

- `release`
- `testedAt`
- `evidenceRef`
- `packageSha256`
- `signer`
- `windowsVersion`
- `deviceRef`
- `checks.signature = pass`
- `checks.physicalLaunch = pass`
- `checks.smartscreenOrStore = pass`
- `checks.packageValidation = pass`

`tools/verify_release_external_validation.py` already rejects a validated claim without those fields/checks.

## Current disposition

**HOLD — external execution required.** The repository is ready to build and evidence a Store package, but this file does not claim that Partner Center identity, signing, physical launch, reputation or WACK evidence has been completed for the current release.
