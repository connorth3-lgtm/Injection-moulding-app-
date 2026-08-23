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

## Build prerequisites

- Windows 10/11 for Windows/MSIX packaging
- Node.js 22 LTS or the Node version pinned by the CI workflow
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
npm run qa
```

The integrity step hashes the exact MouldMaster PWA/training files that will be bundled into the desktop package. The desktop main process verifies those same hashes before opening a window. A missing or altered required file causes a fail-safe startup error rather than a bypass.

## Windows packages

```text
npm run dist:portable
npm run dist:nsis
npm run dist:msix
```

Unsigned local/test packages are not the public trust route. The preferred public Windows distribution is Microsoft Store submission, where the Store identity/publisher values must be replaced with the values assigned in Partner Center and the submitted package is certified/signed through Microsoft's process.

## MSIX identity

`package.json` deliberately contains development-safe placeholder identity metadata for the package name/publisher display name. Before Store submission, use the exact identity and publisher values assigned by Microsoft Partner Center. Do not invent a publisher certificate subject.

## Reproducibility

- Direct build dependencies are pinned to exact versions.
- `package-lock.json` is generated and committed by the dependency-lock workflow and subsequent builds use `npm ci`.
- GitHub Actions records the source commit used for every package.
- The generated integrity manifest records SHA-256 for the full bundled learning application.

Byte-for-byte reproducibility of signed Microsoft Store packages is not claimed because signing/timestamps and some packaging metadata are controlled externally. The unsigned source build should nevertheless be traceable to exact source, dependency lock and asset hashes.

## Security boundary

The training web application does not receive Node.js APIs. The Electron main process is the only privileged component. It serves only an allow-listed set of SHA-256-verified local assets on `127.0.0.1`, rejects webviews, denies renderer permission requests, and sends external HTTPS links to the system browser.

## Open-source dependency notice

Electron is distributed under the MIT licence and includes Chromium/Node components under their respective open-source licences. electron-builder is MIT-licensed. Generated dependency licence inventories must accompany releases; see the repository `THIRD_PARTY_NOTICES.md`.
