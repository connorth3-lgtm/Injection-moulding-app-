# MouldMaster physical PWA validation — 2026.09.18.5

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.09.18.5` public candidate. It does **not** authorize production and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.09.18.5`
- retained pre-merge public candidate source commit: `d86e85f94b5a91a04f48983543b05155da91ba84`
- public-runtime fingerprint: `sha256:0f23552b90e86c7c3d1d259bd9be7dd7d78bc7003af3536205f72d61d2264c0e`
- exact candidate build run: `35502553030` (`Pre-merge Public Candidate`)
- retained candidate artifact: `physical-pwa-candidate-d86e85f94b5a91a04f48983543b05155da91ba84`
- artifact id: `10602139631`
- artifact ZIP digest: `sha256:fd434d87abf9867a933648da11a1ba0a6a0ee6bcf8e424aae52302c6daa7d8c5`
- artifact retention expiry: `2026-10-20T09:31:45Z`

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
