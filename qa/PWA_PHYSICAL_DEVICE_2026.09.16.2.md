# MouldMaster physical PWA validation — 2026.09.16.2

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.09.16.2` candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.09.16.2`
- pre-merge candidate source commit: `5d7808a1cae6e256d633553061c6ac1652f237e2`
- public-runtime fingerprint: `sha256:f3195f0e8aa5585bb5ee8fa957a2d65efb8a9ac003e181a1d48fe7438fa7f122`
- exact candidate build run: `35058788000`
- retained candidate artifact: `physical-pwa-candidate-5d7808a1cae6e256d633553061c6ac1652f237e2`
- artifact id: `10431443080`
- artifact ZIP digest: `sha256:f5e16827f6593338a8b76dfca9eb3459826377b715e60ec3bcad9879630a8255`
- artifact retention expiry: `2026-10-16T05:15:28Z`

The retained candidate was built by the protected-main Pages workflow using the repository's production Pages artifact builder. The workflow confirmed that existing physical-device evidence belongs to different runtime bytes, kept the production root on **HOLD**, retained this exact candidate artifact for physical testing, and deployed the same governed learner runtime only under the explicitly non-production `/preview/` path. The runtime fingerprint is the byte-level acceptance key. This automated provenance is not physical-device evidence.

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
