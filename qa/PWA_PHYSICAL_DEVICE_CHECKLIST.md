# MouldMaster physical PWA validation checklist

This checklist is the human execution companion to `data/pwa-physical-device-validation-v1.json`.

Automated Chromium/WebKit/service-worker tests are necessary but do not prove installed-PWA behaviour on physical mobile hardware. Do not mark the contract `validated` until both platform sections below have been completed against the exact public runtime fingerprint emitted by `tools/verify_pwa_physical_evidence.py`.

## Privacy and evidence handling

Keep detailed screenshots, device logs, learner data, customer/site identifiers, raw process data, email addresses, filesystem paths, backup content and other personal/proprietary evidence outside the public repository. Record only a non-sensitive `testerReference` and `evidenceReference` in the public contract.

Screen-reader conformance is governed separately by `data/accessibility-real-at-validation-v1.json`; this checklist does not replace that evidence.

## Before testing

1. For a pending protected-`main` release, download the `physical-pwa-candidate-<HEAD_SHA>` artifact from the latest successful **MouldMaster Pages Release Readiness** run. It contains the exact `.pages-dist` candidate built from that protected-main SHA, is retained for 30 days, and is never selected by `actions/deploy-pages`. If that artifact is unavailable, rebuild the production-only Pages artifact locally with `python tools/build_pages_artifact.py` from the exact protected-main SHA.
2. Obtain the runtime fingerprint either from `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --print-fingerprint` or from the **Report exact public-runtime fingerprint for physical-device validation** step in the same Pages Release Readiness workflow.
3. Confirm the candidate artifact name identifies the protected-main SHA you intend to test and record that exact `sha256:...` fingerprint in the governed physical-device review record. Do not reuse a candidate or fingerprint from a different learner-facing runtime.
4. Serve those exact `.pages-dist` bytes from a trusted HTTPS test origin suitable for installation on physical devices. Do not use the public release-hold Pages origin as the learner runtime while validation is pending.
5. Install or update that matching candidate on both a physical iOS/iPadOS device and a physical Android device.
6. Record device model, OS version and browser version without adding a person, learner, customer or site identity.
7. Confirm the tested runtime fingerprint still matches the release candidate immediately before changing the public contract to `validated`.

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

1. Reconfirm the runtime fingerprint from the exact candidate you physically tested.
2. Change top-level `status` to `validated`.
3. Set `runtimeFingerprint` to that exact current public-runtime fingerprint.
4. Set `testedAt` to an ISO-8601 timestamp with timezone.
5. Set non-personal `testerReference` and non-sensitive `evidenceReference` values.
6. Set both platform statuses to `validated` and fill device/OS/browser metadata.
7. Set `installedMode` to `standalone` for both platforms.
8. Set every governed platform check to `pass`.
9. Run `python qa_pwa_physical_device.py`.
10. Build `.pages-dist` and run `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-validated`.
11. Submit the evidence-contract change through the protected PR path; do not bypass the production-readiness workflow.

Validated evidence expires after the contract's `maxEvidenceAgeDays` window and fails closed if learner-facing public runtime bytes change. Source-SHA-only deployment metadata changes do not invalidate otherwise identical runtime evidence.
