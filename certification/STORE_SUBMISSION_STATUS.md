# Microsoft Store Submission Status

This file is the handoff checkpoint for the MouldMaster Academy Microsoft Store route.

## Repository-complete as of 2026-08-24

- Open Windows desktop release: `2026.08.24.2`
- Source-backed Electron desktop package implemented
- x64 + arm64 Store workflow implemented
- MSIX bundle/upload generation configured
- Partner Center identity values are mandatory runtime inputs
- SHA-256, source commit, dependency licence inventory and CycloneDX SBOM evidence are generated
- Store listing copy is prepared
- Screenshot/asset requirements are documented
- Privacy and support URLs are public
- Store-specific QA is part of Release QA and the Store packaging workflow
- Premature Microsoft/NZQA/IACET approval claims are gated

## Next owner/external action

Create or verify the Microsoft Partner Center developer account and reserve the product name **MouldMaster Academy**.

Then provide the three exact Partner Center identity values through repository variables:
- `MM_STORE_IDENTITY_NAME`
- `MM_STORE_PUBLISHER`
- `MM_STORE_PUBLISHER_DISPLAY_NAME`

After those values exist, run `.github/workflows/microsoft-store-msix.yml` from the intended source commit and complete the remaining real-Windows/WACK/listing submission checks in `MICROSOFT_STORE_SUBMISSION.md`.

Do not put Partner Center passwords, payment information, private keys or private personal details in this repository.
