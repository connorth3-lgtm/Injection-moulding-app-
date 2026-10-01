# MouldMaster physical PWA validation — 2026.10.01.3

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.10.01.3` public candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.10.01.3`
- retained pre-merge public candidate source commit: `077d3ff1b484592fa03f4c4e8532b2c1d7cb5553`
- public-runtime fingerprint: `sha256:13b0f7631036134e3acc786806fe9eca547de62aa5b1d2c57c08d386cbe95010`
- exact candidate build run: `36803075482` (`Pre-merge Public Candidate`)
- retained candidate artifact: `physical-pwa-candidate-077d3ff1b484592fa03f4c4e8532b2c1d7cb5553`
- artifact id: `11136740498`
- artifact ZIP digest: `sha256:4dc9ddc82f8c9b5d4176ab257d0415a96ee2e55ff023342231a87f04a64f1fdc`
- artifact retention expiry: `2026-10-31T01:51:33Z`

The retained candidate was built from exact pre-merge source commit `077d3ff1b484592fa03f4c4e8532b2c1d7cb5553` by the governed Pages artifact builder and public-runtime fingerprint verifier. This is a **candidate rebind**, not physical-device evidence. Release `2026.10.01.3` incorporates the current navigation/mobile polish and governance hardening while preserving the existing physical-device evidence boundary. No earlier device evidence or risk waiver is relabelled for this runtime. Governance/QA-only commits after the retained source must remain byte-equivalent under `qa_release_validation_packets.py`.

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
