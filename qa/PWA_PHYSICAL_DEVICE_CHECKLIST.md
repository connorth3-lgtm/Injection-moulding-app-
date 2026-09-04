# MouldMaster physical PWA validation checklist

This checklist is the human execution companion to `data/pwa-physical-device-validation-v1.json`.

Automated Chromium/WebKit/service-worker tests are necessary but do not prove installed-PWA behaviour on physical mobile hardware. Do not mark the contract `validated` until both platform sections below have been completed against the exact public runtime fingerprint emitted by `tools/verify_pwa_physical_evidence.py`.

## Privacy and evidence handling

Keep detailed screenshots, device logs, learner data, customer/site identifiers, raw process data, email addresses, filesystem paths, backup content and other personal/proprietary evidence outside the public repository. Record only a non-sensitive `testerReference` and `evidenceReference` in the public contract.

Screen-reader conformance is governed separately by `data/accessibility-real-at-validation-v1.json`; this checklist does not replace that evidence.

## Before testing

1. Build the production-only Pages artifact with `python tools/build_pages_artifact.py`.
2. Run `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --print-fingerprint`.
3. Record that exact `sha256:...` fingerprint in the governed physical-device review record.
4. Install or update the public PWA from the matching deployment on both a physical iOS/iPadOS device and a physical Android device.
5. Record device model, OS version and browser version without adding a person, learner, customer or site identity.

## iOS / iPadOS

All checks must pass:

- Install from Safari and launch in standalone mode.
- Confirm safe-area navigation remains usable around notches/home indicators and orientation changes supported by the app.
- Confirm the workspace remains usable in portrait layout, including primary navigation and actionable controls.
- With connectivity removed after a successful online load, close and relaunch the installed PWA and verify the offline shell and governed core content open correctly.
- Reboot the device while offline, relaunch the installed PWA and verify the offline shell still opens without silently discarding local learner state.
- Restore connectivity, deploy/update to the same reviewed runtime under the normal update path, then verify update recovery does not leave a mixed-version shell/cache state.
- Exercise realistic storage pressure or browser storage eviction handling and confirm the app fails clearly/recoverably rather than claiming persisted state that no longer exists.

## Android

All checks must pass:

- Install from Chrome and launch in standalone mode.
- Confirm fixed navigation and primary actions remain clear of system bars and browser/PWA chrome across supported orientation/viewport changes.
- With connectivity removed after a successful online load, close and relaunch the installed PWA and verify the offline shell and governed core content open correctly.
- Reboot the device while offline, relaunch the installed PWA and verify the offline shell still opens without silently discarding local learner state.
- Restore connectivity, deploy/update to the same reviewed runtime under the normal update path, then verify update recovery does not leave a mixed-version shell/cache state.
- Exercise realistic storage pressure or browser storage eviction handling and confirm the app fails clearly/recoverably rather than claiming persisted state that no longer exists.

## Marking the contract validated

Only after every governed check passes on both platforms:

1. Change top-level `status` to `validated`.
2. Set `runtimeFingerprint` to the exact current public-runtime fingerprint.
3. Set `testedAt` to an ISO-8601 timestamp with timezone.
4. Set non-personal `testerReference` and non-sensitive `evidenceReference` values.
5. Set both platform statuses to `validated` and fill device/OS/browser metadata.
6. Set `installedMode` to `standalone` for both platforms.
7. Set every governed platform check to `pass`.
8. Run `python qa_pwa_physical_device.py`.
9. Build `.pages-dist` and run `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist`.

Validated evidence expires after the contract's `maxEvidenceAgeDays` window and fails closed if learner-facing public runtime bytes change. Source-SHA-only deployment metadata changes do not invalidate otherwise identical runtime evidence.
