# MouldMaster physical PWA validation — 2026.09.18.5

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.09.18.5` public candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.09.18.5`
- retained pre-merge public candidate source commit: `7fb966c1c0a373ea1598062a74481e736bcec38a`
- public-runtime fingerprint: `sha256:b0ce9f0b1b3dd34b1a672ac48272cc926b3f1014acd0e4bb4e374c0af0a46b9a`
- exact candidate build run: `35497938757` (`Pre-merge Public Candidate`)
- retained candidate artifact: `physical-pwa-candidate-7fb966c1c0a373ea1598062a74481e736bcec38a`
- artifact id: `10600807325`
- artifact ZIP digest: `sha256:f521e713682284a75c5fcae8a04a7aaf243a3528c44e22bb4fb235b699d2415b`
- artifact retention expiry: `2026-10-20T07:50:23Z`

The retained candidate was built from the exact PR head with the repository's production Pages artifact builder and public-runtime fingerprint verifier. It is a **candidate rebind**, not physical-device evidence. The learner-facing runtime deliberately advanced to release `2026.09.18.5` to publish 13 exact-byte-authorized Book evidence-enrichment sections and a read-only Standards & readiness surface for ISO 9001:2026 and NZQA readiness while preserving existing worked-case, backup-integrity and Book governance boundaries. No earlier device evidence is relabelled. Governance/QA-only commits after the retained source do not change the public runtime fingerprint and must remain byte-equivalent under `qa_release_validation_packets.py`.

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
