# MouldMaster Academy Open Desktop

This directory contains the normal open-source Windows desktop implementation for MouldMaster Academy and the replacement path for the legacy `MouldMasterAcademy.exe` launcher.

## Status

- Current desktop release: `2026.08.26.6`
- Source licence: Apache-2.0
- Desktop runtime: Electron 44.1.1
- Supported OS/architecture: Windows 10/11 64-bit
- Packaging: electron-builder
- Targets: portable EXE, NSIS installer, MSIX / Microsoft Store upload package
- Public open-source release lane: tagged GitHub Release with hashes/provenance/evidence
- Training assets: bundled from the repository and SHA-256 verified before launch
- Local application origin: loopback-only `127.0.0.1` server bound to a random port
- Node integration: disabled in renderer
- Context isolation: enabled
- Electron sandbox: enabled
- Renderer permissions: denied by default
- External HTTPS links: opened in the user's normal browser

The Electron 44 supported-platform decision and breaking-change review are recorded in `ELECTRON_44_SUPPORT.md`. The GitHub portable/NSIS validation lane is x64; the Microsoft Store MSIX lane packages x64 and arm64. Windows ia32 is not a supported MouldMaster target.

The legacy Windows executable is frozen as a recovery-only compatibility component. It is not the normal Windows release and must not be represented as fully open source. See `LEGACY_MIGRATION.md` and `REAL_WINDOWS_VALIDATION.md` for the final real-machine backup/import and persistence evidence required before deleting that frozen legacy component.

## Validation milestone

The open desktop package has passed the repository's Windows GitHub Actions build, security, SBOM, release, assessment, question-evidence and source-integrity gates. `.github/workflows/publish-open-desktop.yml` publishes a versioned tagged GitHub Release when `version.json` changes on `main`, and records the exact source commit and SHA-256 release hashes.

GitHub-hosted Windows validation does not prove a learner's specific hardware/storage migration. Before deleting the frozen legacy recovery launcher, run the checklist in `REAL_WINDOWS_VALIDATION.md` on a normal Windows 10/11 machine with an exported legacy learner backup. `scripts/verify-real-windows-release.ps1` verifies the downloaded executable against `SHA256SUMS.txt` and creates a local evidence skeleton without copying learner backup content into the repository.

## Build prerequisites

- Windows 10/11 64-bit for Windows/MSIX packaging
- Node.js 22.12.0 or newer for the current CI/MSIX toolchain
- npm

## Development

From `desktop/electron`:

```text
npm ci
npm start
```

## QA

```text
npm run integrity
npm run licenses
npm run sbom
npm run qa
```

The integrity step hashes the exact MouldMaster PWA/training files that will be bundled into the desktop package. The expected-hash manifest is packaged inside `app.asar`; the application assets remain under `resources/mouldmaster`. The desktop main process reads the trusted packaged manifest and verifies those external assets before opening a window. A missing or altered required file causes a fail-safe startup error rather than a bypass.

Electron embedded-ASAR-integrity and only-load-from-ASAR fuses are enabled for packaged builds, so alteration or side-loading of application code is checked before the trusted manifest is used. For unsigned portable builds this still does not substitute for trusted OS-level code signing if an attacker can replace the executable and package together. Microsoft Store signing and MSIX package-integrity enforcement provide the stronger public-distribution boundary for Store installs.

## Windows packages

```text
npm run dist:portable
npm run dist:nsis
npm run dist:msix
```

Portable and NSIS builds use the stable `electron-builder` version pinned in `package.json` and `package-lock.json`. MSIX support is isolated in `msix-toolchain/`, where `electron-builder@27.0.0-alpha.7` has its own committed lockfile and is invoked only through `scripts/run-msix-builder.cjs`. Do not silently change either packaging toolchain; run release QA and Windows validation when updating them.

The tagged GitHub Release is the transparent open-source distribution/testing lane. It includes a portable executable plus SHA-256 sums, source commit, integrity manifest, dependency licence inventory, CycloneDX SBOM and QA reports. It is unsigned unless explicitly stated otherwise.

Unsigned local/test packages are not the preferred public trust route. The preferred signed public Windows distribution is Microsoft Store submission, where the Store identity/publisher values must be the exact values assigned in Partner Center and the submitted package must pass Microsoft's certification/signing process.

## MSIX identity

Store package identity is intentionally **not** hard-coded in `package.json`. `.github/workflows/microsoft-store-msix.yml` requires three repository variables copied from Microsoft Partner Center before it will build a Store upload:

- `MM_STORE_IDENTITY_NAME` — Identity/Name
- `MM_STORE_PUBLISHER` — Identity/Publisher (normally a `CN=...` value)
- `MM_STORE_PUBLISHER_DISPLAY_NAME` — Publisher display name

Do not invent a publisher certificate subject or substitute the display name for the package Publisher value.

## Versioning

`version.json` is the repository release record. `desktop_release` is four-part (for example `2026.08.26.6`). `desktop_release_tag` and `desktop_release_url` identify the corresponding GitHub Release. npm `package.json` keeps the first three numeric components as its package version, while `build.buildNumber` and `build.buildVersion` carry the fourth Windows release component. QA rejects drift between these values. Windows artifacts use `${buildVersion}` so package filenames and Windows metadata retain the complete desktop release number. Local MSIX builds and the Store workflow both enable MSIX build-number propagation, so the manifest also retains the fourth component.

## Reproducibility

- Direct runtime/desktop build dependencies are pinned to exact versions.
- `package-lock.json` is committed and the Desktop Dependency Lock workflow proves it with `npm ci`; portable/NSIS builds also use `npm ci`.
- The isolated MSIX toolchain has its own exact committed lockfile and fail-closed version check.
- GitHub Actions records the source commit used for every package.
- The generated integrity manifest records SHA-256 for the full bundled learning application.
- The publish workflow refuses to reuse a desktop release tag for different source, requiring a version bump instead.

Byte-for-byte reproducibility of signed Microsoft Store packages is not claimed because signing/timestamps and some packaging metadata are controlled externally. Builds should nevertheless remain traceable to exact source, application dependency locks, asset hashes, and the explicitly selected MSIX builder version.

## Security boundary

The training web application does not receive Node.js APIs. The Electron main process is the only privileged component. It serves only the SHA-256-verified allow list on `127.0.0.1`, accepts only GET/HEAD requests, rejects webviews, denies renderer permission requests, and sends external HTTPS links to the system browser. The integrity manifest used for startup verification is read from inside the packaged application rather than from the external asset directory it verifies.

## Open-source dependency notice

Electron is distributed under the MIT licence and includes Chromium/Node components under their respective open-source licences. electron-builder is MIT-licensed. Generated dependency licence inventories must accompany releases; see the repository `THIRD_PARTY_NOTICES.md`.
