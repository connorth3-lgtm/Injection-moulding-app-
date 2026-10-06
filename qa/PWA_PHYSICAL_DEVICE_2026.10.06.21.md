# MouldMaster physical PWA validation — 2026.10.06.21

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.10.06.21` public candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.10.06.21`
- retained pre-merge public candidate source commit: `ea7a9fc46d3f7b95119c76606d9157457284d31f`
- public-runtime fingerprint: `sha256:b210eea89068c9d43b4c7cf8fcdd4a902e591dacad8ba9016575360f140511ce`
- exact candidate build run: `37417105826` (`Pre-merge Public Candidate`)
- retained candidate artifact: `physical-pwa-candidate-ea7a9fc46d3f7b95119c76606d9157457284d31f`
- artifact id: `11391857007`
- artifact ZIP digest: `sha256:371a44f43a0e268296effc5117f4531622b79638534efdfb47e72e145c00df11`
- artifact retention expiry: `2027-01-04T05:09:05Z`

The retained candidate was built from exact pre-merge source commit `ea7a9fc46d3f7b95119c76606d9157457284d31f` by the governed Pages artifact builder and public-runtime fingerprint verifier. This is a **candidate rebind**, not physical-device evidence. Release `2026.10.06.21` incorporates the current navigation/mobile polish and governance hardening while preserving the existing physical-device evidence boundary. The prior release risk waiver is not carried forward; both physical platform rows are pending for this runtime. External evidence binds to this retained exact-head artifact, never to the mutable `preview` branch tip.

## Required iOS / iPadOS execution

Using a physical iPhone or iPad, Safari, and a trusted HTTPS origin serving byte-identical candidate content, complete every applicable item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, including install/standalone launch, safe-area/orientation behavior, representative Academy/Book/assessment/workspace use, offline close/relaunch, offline reboot, update recovery, storage-pressure recovery, learner reset, and separate process-evidence deletion.

## Required Android execution

Using a physical Android device and Chrome, complete the same governed matrix including install/standalone launch, system-bar clearance, representative feature use, offline restart/reboot, update recovery, storage-pressure recovery, and the separate learner/process-data deletion boundaries.

## Audit-fix regression focus

Additionally verify the Standards & readiness view opens, remains read-only, distinguishes current/superseded ISO and current/expired NZQA context, and keeps external approval/competence gates explicit. Also verify on physical devices that the 20-reader-chapter contents and expandable 46-module index are coherent, and each affected governed module renders its worked example, tables/calculation steps and synthetic/non-universal/SME-HOLD boundaries coherently, and that a valid v3 learner backup imports, SHA-256 tampering plus oversized/malformed backups fail closed without replacing existing state, and legacy unverified backups disclose that boundary before import, Book evidence links open externally, Book search opens the intended chapter, Book chapter entry starts at the chapter heading, returning to contents restores the reader's prior position, the publication/review and accuracy/assurance disclosures remain operable and truthful, and the complete claim-trace disclosure remains readable without implying independent SME approval. On iPad/tablet widths also verify the Home workspace uses the available canvas without obscuring content, while phone Home remains lean; verify the Home Book/Keep Reading card, exact resume position, learner-profile isolation, reset-to-Open-Book behavior and fixed-navigation clearance. On desktop-width devices confirm specialist tools remain reachable through Practice/More despite the compact primary navigation.

## Evidence hygiene

Keep screenshots, device logs, learner/customer/site identifiers, raw process data, email addresses, filesystem paths and other sensitive evidence outside this public repository. Browser emulation, Playwright, desktop WebKit and service-worker automation do not count as physical-device evidence.

## Completion

Only after both platform rows genuinely pass: update `data/pwa-physical-device-validation-v1.json` with the exact runtime fingerprint and real device evidence; run the physical-device QA and exact-artifact verifier; submit through protected review; and bind any production publication decision to the protected-main artifact. Until then, `pwaPhysicalDevices.status` remains `hold`.