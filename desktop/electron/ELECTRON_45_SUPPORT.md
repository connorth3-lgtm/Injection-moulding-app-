# Electron 45 support boundary

MouldMaster Academy uses Electron `45.0.0` for the open Windows desktop runtime. This support review was recorded on 28 October 2026 against Electron's official 45.0.0 release notes and support schedule.

## Supported MouldMaster desktop scope

- Windows 10/11, 64-bit only.
- The GitHub portable/NSIS validation lane is x64.
- The Microsoft Store MSIX lane packages x64 and arm64.
- Windows ia32 is not a supported MouldMaster target.
- MouldMaster does not currently publish macOS or Linux desktop packages.

Electron 45 retains the platform boundary already adopted for Electron 44: it does not restore Windows ia32 or Linux armv7l artifacts, and the project continues to ship only its Windows 10/11 64-bit desktop targets.

## Electron 45 breaking-change review

Electron 45 removes the `events`, `timers`, and `url` shims and the `Buffer`, `setImmediate`, and `clearImmediate` globals from sandboxed preload scripts. The current desktop `BrowserWindow` does not configure a preload script, and the desktop source/scripts contain no sandboxed preload code or use of those removed globals.

Electron 45 reports screen, window, and tab capture requests as `display-capture`. MouldMaster has no screen-capture feature; `main.cjs` denies every permission request through `setPermissionRequestHandler` and its permission-check handler, so the changed permission label cannot grant a new capability.

Renderer-created windows remain denied by `setWindowOpenHandler`; allowed HTTPS links open in the system browser. The desktop renderer remains sandboxed, with Node integration disabled and context isolation enabled. No new privileged renderer path is introduced by Electron 45.

## Support window and validation

Electron's release schedule lists Electron 45 end of life as 27 April 2027 (tentative). The dependency-maintenance inventory records that date and is reviewed on a monthly cadence.

The runtime is exact-pinned in `desktop/electron/package.json` and resolved by its committed npm lockfile. The portable/NSIS builder is separately pinned to `electron-builder 26.18.0`; the isolated MSIX builder is exact-pinned to `electron-builder 27.0.0-alpha.11` in its own committed lockfile, and its version guard is checked by desktop dependency-lock and Store QA. Exact-head release QA, dependency-lock QA, open-desktop QA, Mobile Browser QA, and Windows package build checks must pass before merge.

Upstream references:

- https://www.electronjs.org/blog/electron-45-0
- https://www.electronjs.org/docs/latest/breaking-changes/
- https://releases.electronjs.org/release/v45.0.0
- https://releases.electronjs.org/schedule
