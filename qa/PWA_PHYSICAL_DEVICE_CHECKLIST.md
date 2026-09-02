# MouldMaster physical PWA validation checklist

Automated Chromium PWA lifecycle QA is a release gate, but it is **not** a substitute for physical-device validation. Production Pages deployment must not claim physical mobile validation unless the structured evidence gate passes for the exact public runtime bytes.

## Prepare the exact candidate

1. Build the production-only public artifact:

   ```bash
   python3 tools/build_pages_artifact.py
   ```

2. Print the stable runtime fingerprint:

   ```bash
   python3 tools/verify_pwa_physical_evidence.py --print-fingerprint --artifact .pages-dist
   ```

   The fingerprint excludes only `deployment.json` and `pages-manifest.json`, whose source-SHA metadata changes when evidence is committed. It includes the actual public runtime/assets, so evidence remains valid only while those deployed bytes are unchanged.

3. Serve **that exact `.pages-dist` candidate** over trusted HTTPS to the physical devices. Do not substitute a different branch, cached deployment, or locally edited runtime.

4. Copy `qa/pwa-physical-validation.example.json` to `qa/pwa-physical-validation.json`, record the fingerprint and real device/browser versions, and change a check to `pass` only after it was exercised successfully.

5. Verify the evidence locally:

   ```bash
   python3 tools/verify_pwa_physical_evidence.py --artifact .pages-dist --evidence qa/pwa-physical-validation.json
   ```

The verifier requires both platforms, every required check to pass, no unresolved failures, matching runtime bytes, and evidence no more than 30 days old.

## iPhone / iPad Safari

- Add to Home Screen and launch in standalone mode.
- Confirm Home, Course, Practice and More navigation with safe-area insets.
- Confirm Mould Master Workspace, Process Data and Due Reviews remain usable in portrait.
- Load once online, force-close, enable airplane mode and relaunch offline.
- Reboot device while offline and relaunch.
- Restore connectivity and verify an updated build replaces the old service worker/cache without losing learner progress.
- Exercise low-storage/site-data removal behavior and confirm the app explains recovery rather than implying data is retained.
- Verify VoiceOver focus order, control names, form labels and meaningful image alternatives on Home, lesson, assessment and Workspace flows.

## Android Chrome

- Install the PWA and launch standalone.
- Confirm fixed navigation does not cover the last actionable control at 360–412 px widths.
- Load once online, force-stop, enable airplane mode and relaunch offline.
- Reboot while offline and relaunch.
- Restore connectivity and verify update/recovery behavior.
- Exercise storage pressure/site-data clearing and confirm saved local data loss/recovery messaging is accurate.
- Verify TalkBack focus order, control names and state announcements on Home, lesson, assessment and Workspace flows.

## Public evidence rules

Record only release-validation metadata: runtime fingerprint, test timestamp, non-personal tester reference, device model, OS version, browser version, pass/fail states and non-sensitive notes.

Do **not** commit learner names, customer/site identifiers, raw process data, email addresses, private screenshots/video or other personal/site-sensitive information. Keep any sensitive supporting media outside the public repository and reference it only through an internal/non-personal evidence identifier if needed.

Do not mark physical PWA validation complete from Playwright viewport tests alone. If `qa/pwa-physical-validation.json` is absent, stale, for different runtime bytes, or contains a failed/pending required check, the production deployment gate must fail closed.
