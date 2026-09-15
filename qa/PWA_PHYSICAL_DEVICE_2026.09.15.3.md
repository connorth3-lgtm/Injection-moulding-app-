# MouldMaster 2026.09.15.3 physical-device execution packet

This packet binds hands-on physical PWA validation to the exact protected-main candidate created by the assessment-foundation runtime-pack release.

It **does not authorize production by itself**. Physical iOS/iPadOS and Android checks must be genuinely performed according to `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, and the governed record in `data/pwa-physical-device-validation-v1.json` must remain truthful.

## Exact candidate identity

- Web release: `2026.09.15.3`
- Protected-main source SHA: `727e37e13840d2b0efb5b392d037cf51e3ad3e75`
- MouldMaster Release QA run: `34920540425` — passed
- Physical PWA Contract QA run: `34920540405` — passed structurally and retained exact-runtime HOLD
- Pages Release Readiness run: `34920540389` — passed with release-hold deployment
- Current runtime fingerprint: `sha256:a690c249a23f85580b8f76edd0d8afca5b6275857288e01d894bb988feef94e9`
- Physical candidate artifact: `physical-pwa-candidate-727e37e13840d2b0efb5b392d037cf51e3ad3e75`
- GitHub Actions artifact ID: `10377109313`
- Uploaded artifact digest: `sha256:2c2390c7ad4fd7df20079c447bf1b0d764d478c2f55b3537ced1a5bd1833ce10`
- Artifact size: `1040938` bytes
- Artifact expiry recorded by GitHub Actions: `2026-10-15T02:17:52Z`
- Public Pages state while validation is pending: production root **release hold**; the production artifact was not uploaded for deployment

The Pages workflow retained the exact production-only candidate for physical testing, built and uploaded the release-hold artifact instead of the production artifact, deployed the hold, and verified that the hold remained stable after the live race window.

## Why existing physical evidence cannot release this candidate

The current governed physical-device evidence is bound to the earlier runtime fingerprint:

`sha256:3de533c64352b7c674c1a58eb7a14ecc51ba678464d047e6b1bd5294a9779b99`

The `2026.09.15.3` candidate is:

`sha256:a690c249a23f85580b8f76edd0d8afca5b6275857288e01d894bb988feef94e9`

The protected-main Physical PWA Contract QA explicitly detected this mismatch and retained the release HOLD. Do not copy, relabel or infer the earlier Android result or accepted iOS risk onto this candidate.

## What changed in this candidate

The learner runtime now replaces eight directly injected assessment-foundation scripts with one deterministic classic-script pack:

1. `assessment-100-pass.js`
2. `assessment-deep-dive.js`
3. `assessment-answer-cue-fix.js`
4. `assessment-storage-scope.js`
5. `assessment-quality-suite.js`
6. `assessment-stable-review-bridge.js`
7. `assessment-analytics-ui.js`
8. `assessment-final-hardening.js`

The pack preserves the historical execution order without minification, rewriting or semantic transformation. Because bootstrap/public runtime bytes changed, physical installed-PWA validation is still required even though browser, WebKit, Release QA and desktop CI passed.

## Physical execution

Use the exact retained artifact, or a byte-identical HTTPS-served build, and complete every applicable item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`.

### iOS / iPadOS — required

- install from Safari and launch standalone;
- safe-area navigation and supported orientation changes;
- portrait workspace usability and primary controls;
- offline close/relaunch;
- offline reboot/relaunch without silently losing local learner state;
- online update recovery without mixed-version shell/cache state;
- realistic storage-pressure/eviction recovery.

### Android — required

- install from Chrome and launch standalone;
- fixed navigation/system-bar clearance;
- offline close/relaunch;
- offline reboot/relaunch without silently losing local learner state;
- online update recovery without mixed-version shell/cache state;
- realistic storage-pressure/eviction recovery.

## Assessment-pack regression focus

On both platforms, additionally verify the runtime boundary changed by this release:

1. Start an assessment at each learner level and confirm questions render normally after installation and after a cold relaunch.
2. Complete at least one technical and one regional/safety-critical item and confirm answer review, rationale and feedback remain associated with the selected question.
3. Confirm stable question/spaced-review identity survives a close/relaunch and does not migrate to a different question because of the packed bootstrap.
4. Switch learner profiles and verify assessment analytics/timing/history remain learner-scoped with no cross-profile carry-over.
5. Exercise assessment reset/cleanup and verify it removes the governed assessment state without clearing unrelated learner state.
6. Run an installed-PWA offline assessment after the candidate has been fully cached; confirm the packed assessment foundation is available offline and no standalone retired assessment source is requested.
7. Restore connectivity and exercise the normal update/recovery path; confirm there is no mixed old/new assessment runtime.

## Book-specific physical checks

The current Book remains part of the same governed installed runtime. On both platforms:

1. Open **Book** from primary navigation.
2. Confirm all 46 governed chapters are reachable and the learner-facing evidence wording does not imply independent human SME approval.
3. Confirm the **Independent human SME review** state remains governed separately. For this release the contract remains HOLD with `0/46` approved unless legitimate human review evidence has subsequently changed it.
4. Exercise Read Book and, where available, Listen behavior.
5. After a fully cached online session, relaunch offline and confirm Book content remains available; unavailable external SME status must fail closed rather than infer approval.

These checks supplement, not replace, the standard physical PWA checklist or independent Book SME review.

## Automated evidence already completed

For protected-main source `727e37e13840d2b0efb5b392d037cf51e3ad3e75`:

- MouldMaster Release QA run `34920540425` completed successfully;
- Physical PWA Contract QA run `34920540405` confirmed the physical evidence structure is valid but rejected exact-runtime authorization because the old evidence fingerprint does not match this candidate;
- Pages Release Readiness run `34920540389` skipped production artifact upload, uploaded/deployed the release-hold artifact, and passed live hold stability verification;
- PR validation for the exact merged source lineage passed Mobile Browser QA, WebKit substantive learner regressions, Question Quality, Open Desktop Build and the external-validation boundary.

This automated evidence does **not** substitute for hands-on device checks, real assistive-technology validation, independent SME review, Windows signing/reputation validation, or learner-outcome evidence.

## Updating the governed physical evidence

Only after all required checks genuinely pass on both platforms:

- reconfirm that the tested candidate fingerprint is exactly `sha256:a690c249a23f85580b8f76edd0d8afca5b6275857288e01d894bb988feef94e9`;
- update `data/pwa-physical-device-validation-v1.json` with the truthful current-release state, non-sensitive device/OS/browser metadata, timestamp and evidence references;
- run `python qa_pwa_physical_device.py`;
- build the production-only Pages candidate and run `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-validated` (or the governed accepted-risk mode only if that policy is legitimately applicable and recorded);
- submit the evidence change through the protected PR path.

If any later learner-facing change produces a different runtime fingerprint, this packet becomes historical and that new fingerprint requires its own physical validation. Do not advance runtime bytes merely to update this packet.
