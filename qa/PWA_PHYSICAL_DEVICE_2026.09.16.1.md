# MouldMaster physical PWA validation — 2026.09.16.1

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.09.16.1` candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.09.16.1`
- repair-branch source commit: `8c5b71cb8b39c9e7b425da03dc804772c953eb85`
- public-runtime fingerprint: `sha256:c0b4ac65d7701a231250262e43a6aca6bf6d479b4010ccbb30593346d00f4407`
- exact candidate build run: `35041121189`
- retained candidate artifact: `physical-pwa-candidate-8c5b71cb8b39c9e7b425da03dc804772c953eb85`
- artifact id: `10425530938`
- artifact ZIP digest: `sha256:ea02666f2d2b21534bdc453efc59c3586a8f655bfd9b5b050cb70596cbe52d23`
- artifact retention expiry: `2026-10-16T00:42:41Z`

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
