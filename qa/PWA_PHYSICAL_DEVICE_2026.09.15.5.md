# MouldMaster physical PWA validation — 2026.09.15.5

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.09.15.5` candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.09.15.5`
- repair-branch source commit: `afbfc2921fb1cba8ad9705ad821f9223546bda84`
- public-runtime fingerprint: `sha256:b6fca9536f77247e1e778639a7b24228e4fe43ef413fa6e6d025e8a788006f2e`
- exact candidate build run: `34931254705`
- retained candidate artifact: `physical-pwa-candidate-afbfc2921fb1cba8ad9705ad821f9223546bda84`
- artifact id: `10381038770`
- artifact ZIP digest: `sha256:cb84c59349536382c17609f5251b8efc40bef4624e9b3232353e185d6b57c796`
- artifact retention expiry: `2026-10-15T05:04:12Z`

The candidate was built with the repository's production Pages artifact builder but was **not published**. The runtime fingerprint is the byte-level acceptance key. This automated candidate provenance is not physical-device evidence.

## Required iOS / iPadOS execution

Using a physical iPhone or iPad, Safari, and a trusted HTTPS origin serving byte-identical candidate content, complete every applicable item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, including install/standalone launch, safe-area/orientation behavior, representative Academy/Book/assessment/workspace use, offline close/relaunch, offline reboot, update recovery, storage-pressure recovery, learner reset, and separate process-evidence deletion.

## Required Android execution

Using a physical Android device and Chrome, complete the same governed matrix including install/standalone launch, system-bar clearance, representative feature use, offline restart/reboot, update recovery, storage-pressure recovery, and the separate learner/process-data deletion boundaries.

## Audit-fix regression focus

Additionally verify on physical devices that a normal learner backup still imports, an oversized or malformed backup fails closed without replacing existing state, Book evidence links open externally, and the claim-trace disclosure remains readable without implying independent SME approval.

## Evidence hygiene

Keep screenshots, device logs, learner/customer/site identifiers, raw process data, email addresses, filesystem paths and other sensitive evidence outside this public repository. Browser emulation, Playwright, desktop WebKit and service-worker automation do not count as physical-device evidence.

## Completion

Only after both platform rows genuinely pass: update `data/pwa-physical-device-validation-v1.json` with the exact runtime fingerprint and real device evidence; run the physical-device QA and exact-artifact verifier; submit through protected review; and bind any production publication decision to the protected-main artifact. Until then, `pwaPhysicalDevices.status` remains `hold`.
