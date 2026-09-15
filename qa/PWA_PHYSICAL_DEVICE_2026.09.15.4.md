# MouldMaster physical PWA validation — 2026.09.15.4

This packet governs hands-on physical-device validation of the exact MouldMaster web release `2026.09.15.4` candidate. It does **not** authorize production by itself and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or `data/pwa-physical-device-validation-v1.json`.

## Exact candidate

- web release: `2026.09.15.4`
- protected-main source commit: `f83daaf5b597afc4ef7c1c8ae2653bd7bf67040b`
- public-runtime fingerprint: `sha256:36cb9bbc8acd664ea7b72bd32ad06f75defd0d2019c6879039c87e7d4c45ebf8`
- Pages Release Readiness run: `34923733290`
- retained candidate artifact: `physical-pwa-candidate-f83daaf5b597afc4ef7c1c8ae2653bd7bf67040b`
- artifact id: `10379530204`
- artifact ZIP digest: `sha256:f394da228df59b5e5e3358164722bdd4fbed12eee46133648be2a7ca548e1154`
- artifact retention expiry: `2026-10-15T03:07:29Z`

The runtime fingerprint is the byte-level acceptance key. `deployment.json` and `pages-manifest.json` are excluded from that stable fingerprint because source-SHA-only metadata must not invalidate otherwise identical learner-facing bytes.

## Required iOS / iPadOS execution

On a physical iPhone or iPad using Safari and a trusted HTTPS test origin serving the exact retained candidate:

1. Confirm the candidate fingerprint before testing.
2. Install the PWA and launch it in standalone mode.
3. Verify safe-area navigation, portrait workspace use and supported orientation changes.
4. Complete representative Academy, Book, assessment and evidence-workspace interactions.
5. After one successful online load, remove connectivity, close the app and relaunch; the shell and governed core content must remain usable.
6. Reboot while offline and relaunch; local learner state must not be silently discarded.
7. Restore connectivity and exercise normal update recovery; no mixed-version shell/cache state may remain.
8. Exercise realistic storage-pressure/eviction behavior and confirm failure is explicit and recoverable.
9. Verify learner reset affects learner state only and does not falsely claim deletion of saved process evidence.
10. Verify saved process evidence can be deleted through its separate governed deletion path.

## Required Android execution

On a physical Android device using Chrome and the same exact candidate boundary:

1. Confirm the candidate fingerprint before testing.
2. Install the PWA and launch it in standalone mode.
3. Verify fixed navigation/actions remain clear of system bars and PWA chrome across supported viewport/orientation changes.
4. Complete representative Academy, Book, assessment and evidence-workspace interactions.
5. After one successful online load, remove connectivity, close the app and relaunch; the shell and governed core content must remain usable.
6. Reboot while offline and relaunch; local learner state must not be silently discarded.
7. Restore connectivity and exercise normal update recovery; no mixed-version shell/cache state may remain.
8. Exercise realistic storage-pressure/eviction behavior and confirm failure is explicit and recoverable.
9. Verify learner reset and process-evidence deletion remain separate and accurately labelled.

## Evidence hygiene

Keep screenshots, device logs, learner/customer/site identifiers, raw process data, email addresses, filesystem paths and other sensitive evidence outside this public repository. The public contract may contain only non-sensitive tester/evidence references plus device/OS/browser metadata.

Browser emulation, Playwright, desktop WebKit, user-agent spoofing and service-worker automation do not count as physical-device evidence.

## Completion

Only after both platform rows genuinely pass:

1. Update `data/pwa-physical-device-validation-v1.json` with the exact runtime fingerprint, timezone-aware test time, non-sensitive evidence references, device/OS/browser metadata, standalone mode and every governed check marked `pass`.
2. Run `python qa_pwa_physical_device.py`.
3. Run `python tools/build_pages_artifact.py` and then `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-validated`.
4. Submit the evidence change through a protected PR.
5. After merge, verify Pages selects the production artifact and passes exact live plus race-window validation.

Until those steps are supported by real device evidence, `data/release-external-validation-v1.json` must keep `pwaPhysicalDevices.status = hold`.