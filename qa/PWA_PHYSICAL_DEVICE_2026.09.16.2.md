# MouldMaster physical PWA validation — 2026.09.16.2

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.09.16.2` candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.09.16.2`
- pre-merge candidate source commit: `5c4e5f303cc1835157fb53869e93ca94b66810c4`
- public-runtime fingerprint: `sha256:eb54931580479511c31ceec12019a4a31d9bcbe8847aabc1563f599266bc8d3a`
- exact candidate build run: `35157590109`
- retained candidate artifact: `physical-pwa-candidate-5c4e5f303cc1835157fb53869e93ca94b66810c4`
- artifact id: `10471772733`
- artifact ZIP digest: `sha256:7bb187fc2ff51ee804e8ad409e3ad5b05d659787a4311f782b3a5216151db1ca`
- artifact retention expiry: `2026-10-16T22:25:23Z`

The retained candidate was built from the polished pre-merge branch using the repository's production Pages artifact builder and exact public-runtime fingerprint verifier. It includes the canonical byte-bound Book runtime, Book-aware search, canonical learner-facing academic evidence links, release-versioned dynamic same-origin scripts, the balanced tablet/desktop Home workspace, progressive Book governance disclosure, compact desktop tool navigation and the quieter Read Aloud utility treatment. It is retained only for governed validation; it does **not** authorize the production Pages root. After merge, the protected-main Pages workflow must independently stage the byte-equivalent main candidate before any release decision. The runtime fingerprint is the byte-level acceptance key. This automated provenance is not physical-device evidence.

## Required iOS / iPadOS execution

Using a physical iPhone or iPad, Safari, and a trusted HTTPS origin serving byte-identical candidate content, complete every applicable item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, including install/standalone launch, safe-area/orientation behavior, representative Academy/Book/assessment/workspace use, offline close/relaunch, offline reboot, update recovery, storage-pressure recovery, learner reset, and separate process-evidence deletion.

## Required Android execution

Using a physical Android device and Chrome, complete the same governed matrix including install/standalone launch, system-bar clearance, representative feature use, offline restart/reboot, update recovery, storage-pressure recovery, and the separate learner/process-data deletion boundaries.

## Audit-fix regression focus

Additionally verify on physical devices that a normal learner backup still imports, an oversized or malformed backup fails closed without replacing existing state, Book evidence links open externally, Book search opens the intended chapter, Book chapter entry starts at the chapter heading, returning to contents restores the reader's prior position, the publication/review and accuracy/assurance disclosures remain operable and truthful, and the complete claim-trace disclosure remains readable without implying independent SME approval. On iPad/tablet widths also verify the Home workspace uses the available canvas without obscuring content, while phone Home remains lean. On desktop-width devices confirm specialist tools remain reachable through Practice/More despite the compact primary navigation.

## Evidence hygiene

Keep screenshots, device logs, learner/customer/site identifiers, raw process data, email addresses, filesystem paths and other sensitive evidence outside this public repository. Browser emulation, Playwright, desktop WebKit and service-worker automation do not count as physical-device evidence.

## Completion

Only after both platform rows genuinely pass: update `data/pwa-physical-device-validation-v1.json` with the exact runtime fingerprint and real device evidence; run the physical-device QA and exact-artifact verifier; submit through protected review; and bind any production publication decision to the protected-main artifact. Until then, `pwaPhysicalDevices.status` remains `hold`.
