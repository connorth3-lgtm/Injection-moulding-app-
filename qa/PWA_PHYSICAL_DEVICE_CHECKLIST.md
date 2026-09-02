# MouldMaster physical PWA validation checklist

Automated Chromium PWA lifecycle QA is a release gate, but it is **not** a substitute for physical-device validation. Record device/OS/browser/build and pass/fail evidence for each item before claiming physical mobile release validation.

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

## Release evidence
Record: release SHA, device model, OS version, browser version, installed/not-installed mode, test date, tester, failures, screenshots/video where useful, and whether each failure blocks distribution.

Do not mark physical PWA validation complete from Playwright viewport tests alone.
