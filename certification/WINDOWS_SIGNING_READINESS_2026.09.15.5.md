# Windows distribution/signing readiness — 2026.09.15.5

This packet governs the external Windows distribution work associated with MouldMaster web release `2026.09.15.5` at protected-main source commit `7fe353beb0f54b5b8f53851221738bb5c1a9bcfe`. The separately governed desktop release identity remains `2026.08.26.9` unless deliberately advanced through its own release process.

## What repository automation already proves

The normal Open Desktop Build and release QA on the `.4` source passed package construction, dependency-lock checks, generated integrity metadata, licence inventory, SBOM generation and product QA. The Store/MSIX workflow is also designed to fail closed unless the Partner Center identity variables are supplied.

Those automated results establish packaging readiness. They do **not** establish certificate possession, Microsoft Store approval, SmartScreen reputation, WACK success or launch on a physical Windows machine.

## External execution required

Before `data/release-external-validation-v1.json` can move `windowsDistribution.status` from `hold` to `validated` for this release:

1. Confirm the intended Partner Center product identity and configure `MM_STORE_IDENTITY_NAME`, `MM_STORE_PUBLISHER` and `MM_STORE_PUBLISHER_DISPLAY_NAME` as repository variables.
2. Run `.github/workflows/microsoft-store-msix.yml` from the intended exact source commit.
3. Retain the generated x64/arm64 package artifacts, source-commit record, SHA-256 hashes, licence inventory and SBOM.
4. Obtain signed/Store package provenance through the actual Microsoft distribution/signing path. Never commit private keys, PFX files, passwords, payment information or account secrets.
5. Install and launch the actual distributed package on a real supported Windows machine and retain a non-sensitive device/Windows-version reference.
6. Exercise the user-facing SmartScreen or Store reputation path that will actually be used for distribution.
7. Run Windows App Certification Kit (WACK) or the current Microsoft-equivalent validation against the exact package and retain a non-sensitive evidence reference.

## Governed public evidence shape

Only after those real external checks pass may `windowsDistribution.evidence` contain a release-bound object with:

- `release = 2026.09.15.5`;
- `testedAt`;
- `evidenceRef`;
- `packageSha256`;
- `signer`;
- `windowsVersion`;
- `deviceRef`;
- `checks.signature = pass`;
- `checks.physicalLaunch = pass`;
- `checks.smartscreenOrStore = pass`;
- `checks.packageValidation = pass`.

`tools/verify_release_external_validation.py` rejects a validated Windows claim without those fields/checks.

## Current disposition

**HOLD — external execution required.** Repository automation has not been relabelled as signing, Store, reputation, WACK or physical-machine evidence.