# MouldMaster Academy Open Desktop

This directory contains the preferred open-source Windows desktop replacement for the legacy `MouldMasterAcademy.exe` launcher.

## Status

- Source licence: Apache-2.0
- Desktop runtime: Electron
- Packaging: electron-builder
- Targets: portable EXE, NSIS installer, MSIX / Microsoft Store upload package
- Training assets: bundled from the repository and SHA-256 verified before launch
- Local application origin: loopback-only `127.0.0.1` server bound to a random port
- Node integration: disabled in renderer
- Context isolation: enabled
- Electron sandbox: enabled
- Renderer permissions: denied by default
- External HTTPS links: opened in the user's normal browser

The legacy Windows executable remains a recovery-only component until this replacement has been built and tested on real Windows hardware.

## Validation milestone

The first clean Windows validation build is intentionally triggered from the current `main` source after the open-source, SBOM, MSIX, integrity and security gates were added. Do not promote the open desktop package into the Windows recovery feed until both GitHub Actions and a real Windows launch test have passed.

## Build prerequisites

- Windows 10/11 for Windows/MSIX packaging
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

Portable and NSIS builds use the stable `electron-builder` version pinned in `package.json` and `package-lock.json`. MSIX support is not present in that stable v26 line, so the `dist:msix` command and Store workflow invoke the exact `electron-builder@27.0.0-alpha.7` MSIX beta separately. Do not silently change either packaging version; run release QA and Windows validation when updating them.

Unsigned local/test packages are not the public trust route. The preferred public Windows distribution is Microsoft Store submission, where the Store identity/publisher values must be the exact values assigned in Partner Center and the submitted package must pass Microsoft's certification/signing process.

## MSIX identity

Store package identity is intentionally **not** hard-coded in `package.json`. `.github/workflows/microsoft-store-msix.yml` requires three repository variables copied from Microsoft Partner Center before it will build a Store upload:

- `MM_STORE_IDENTITY_NAME` — Identity/Name
- `MM_STORE_PUBLISHER` — Identity/Publisher (normally a `CN=...` value)
- `MM_STORE_PUBLISHER_DISPLAY_NAME` — Publisher display name

Do not invent a publisher certificate subject or substitute the display name for the package Publisher value.

## Versioning

`version.json` is the repository release record. `desktop_release` is four-part (for example `2026.08.24.1`). npm `package.json` keeps the first three numeric components as its package version, while `build.buildNumber` and `build.buildVersion` carry the fourth Windows release component. QA rejects drift between these values. Windows artifacts use `${buildVersion}` so package filenames and Windows metadata retain the complete desktop release number. Local MSIX builds and the Store workflow both enable MSIX build-number propagation, so the manifest also retains the fourth component.

## Reproducibility

- Direct runtime/desktop build dependencies are pinned to exact versions.
- `package-lock.json` is generated and committed by the dependency-lock workflow and portable/NSIS builds use `npm ci`.
- The MSIX builder beta is invoked by exact version in the local command and Store workflow; it is build tooling rather than packaged runtime code.
- GitHub Actions records the source commit used for every package.
- The generated integrity manifest records SHA-256 for the full bundled learning application.

Byte-for-byte reproducibility of signed Microsoft Store packages is not claimed because signing/timestamps and some packaging metadata are controlled externally. Builds should nevertheless remain traceable to exact source, application dependency lock, asset hashes, and the explicitly selected MSIX builder version.

## Security boundary

The training web application does not receive Node.js APIs. The Electron main process is the only privileged component. It serves only the SHA-256-verified allow list on `127.0.0.1`, accepts only GET/HEAD requests, rejects webviews, denies renderer permission requests, and sends external HTTPS links to the system browser. The integrity manifest used for startup verification is read from inside the packaged application rather than from the external asset directory it verifies.

## Open-source dependency notice

Electron is distributed under the MIT licence and includes Chromium/Node components under their respective open-source licences. electron-builder is MIT-licensed. Generated dependency licence inventories must accompany releases; see the repository `THIRD_PARTY_NOTICES.md`.
