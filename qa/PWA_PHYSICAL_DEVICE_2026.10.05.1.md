# MouldMaster physical PWA validation — 2026.10.05.1

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.10.05.1` public candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.10.05.1`
- retained pre-merge public candidate source commit: `f9492a898c08bbc4cec32345c72cd05f38313e0f`
- public-runtime fingerprint: `sha256:045ca0871408cdd91180790ee16b7f53da2f8f0c895008d061b663e01ce964ba`
- exact candidate build run: `37237955953` (`Pre-merge Public Candidate`)
- retained candidate artifact: `physical-pwa-candidate-f9492a898c08bbc4cec32345c72cd05f38313e0f`
- artifact id: `11316432308`
- artifact ZIP digest: `sha256:316929b642ccee86af07a6e19ccf931549c4c8ccb0f6c12ae7824b19638ef612`
- artifact retention expiry: `2027-01-02T21:54:31Z`

The retained candidate was built from exact pre-merge source commit `f9492a898c08bbc4cec32345c72cd05f38313e0f` by the governed Pages artifact builder and public-runtime fingerprint verifier. This is a **candidate rebind**, not physical-device evidence. Release `2026.10.05.1` incorporates the current navigation/mobile polish and governance hardening while preserving the existing physical-device evidence boundary. The prior release risk waiver is not carried forward; both physical platform rows are pending for this runtime. External evidence binds to this retained exact-head artifact, never to the mutable `preview` branch tip.

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