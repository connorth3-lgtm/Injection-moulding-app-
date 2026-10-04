# MouldMaster physical PWA validation — 2026.10.05.1

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.10.05.1` public candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.10.05.1`
- retained pre-merge public candidate source commit: `4f31c0246d2c0e07253e7fe6f5d0de4b7681b843`
- public-runtime fingerprint: `sha256:b0d4f6a48fe0a7e5bdb795bf857482fbfa8640f28e036de224957fb0208bd52c`
- exact candidate build run: `37239085095` (`Pre-merge Public Candidate`)
- retained candidate artifact: `physical-pwa-candidate-4f31c0246d2c0e07253e7fe6f5d0de4b7681b843`
- artifact id: `11316224538`
- artifact ZIP digest: `sha256:68c82ab738deafee2eb9641f592ffb506aedd3e1ec92e0b496ba4cf3a590b661`
- artifact retention expiry: `2027-01-02T22:11:51Z`

The retained candidate was built from exact pre-merge source commit `4f31c0246d2c0e07253e7fe6f5d0de4b7681b843` by the governed Pages artifact builder and public-runtime fingerprint verifier. This is a **candidate rebind**, not physical-device evidence. Release `2026.10.05.1` incorporates the current navigation/mobile polish and governance hardening while preserving the existing physical-device evidence boundary. The prior release risk waiver is not carried forward; both physical platform rows are pending for this runtime. External evidence binds to this retained exact-head artifact, never to the mutable `preview` branch tip.

## Required iOS / iPadOS execution

Using a physical iPhone or iPad, Safari, and a trusted HTTPS origin serving byte-identical candidate content, complete every applicable item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, including install/standalone launch, safe-area/orientation behavior, representative Academy/Book/assessment/workspace use, offline close/relaunch, offline reboot, update recovery, storage-pressure recovery, learner reset, and separate process-evidence deletion.

## Required Android execution

Using a physical Android device and Chrome, complete the same governed matrix including install/standalone launch, system-bar clearance, representative feature use, offline restart/reboot, update recovery, storage-pressure recovery, and the separate learner/process-data deletion boundaries.

## Audit-fix regression focus

Additionally verify the Standards & readiness view opens, remains read-only, distinguishes current/superseded ISO and current/expired NZQA context, and keeps external approval/competence gates explicit. Also verify on physical devices that each affected Book chapter renders its worked example, tables/calculation steps and synthetic/non-universal/SME-HOLD boundaries coherently, and that a valid v3 learner backup imports, SHA-256 tampering plus oversized/malformed backups fail closed without replacing existing state, and legacy unverified backups disclose that boundary before import, Book evidence links open externally, Book search opens the intended chapter, Book chapter entry starts at the chapter heading, returning to contents restores the reader's prior position, the publication/review and accuracy/assurance disclosures remain operable and truthful, and the complete claim-trace disclosure remains readable without implying independent SME approval. On iPad/tablet widths also verify the Home workspace uses the available canvas without obscuring content, while phone Home remains lean. On desktop-width devices confirm specialist tools remain reachable through Practice/More despite the compact primary navigation.

## Evidence hygiene

Keep screenshots, device logs, learner/customer/site identifiers, raw process data, email addresses, filesystem paths and other sensitive evidence outside this public repository. Browser emulation, Playwright, desktop WebKit and service-worker automation do not count as physical-device evidence.

## Completion

Only after both platform rows genuinely pass: update `data/pwa-physical-device-validation-v1.json` with the exact runtime fingerprint and real device evidence; run the physical-device QA and exact-artifact verifier; submit through protected review; and bind any production publication decision to the protected-main artifact. Until then, `pwaPhysicalDevices.status` remains `hold`.