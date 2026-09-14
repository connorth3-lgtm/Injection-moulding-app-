# MouldMaster 2026.09.14.4 physical-device execution packet

This packet binds physical PWA validation to the exact current protected-main release candidate produced after External Validation Wave 1 governance merged.

It **does not authorize production by itself**. Physical iOS/iPadOS and Android checks must still be performed according to `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, and the governed evidence contract must remain truthful.

## Exact candidate identity

- Web release: `2026.09.14.4`
- Protected-main source SHA: `1c22697fab781e40548c950b84203d73e255a5fe`
- Pages Release Readiness run: `34806712586`
- Current runtime fingerprint: `sha256:b1aea83687ec9b6264b90fe30d8641225e56a7864c6c805881679d128b24e382`
- Physical candidate artifact: `physical-pwa-candidate-1c22697fab781e40548c950b84203d73e255a5fe`
- GitHub Actions artifact ID: `10332748938`
- Uploaded artifact ZIP SHA-256: `a71001d2e5d2f93a885719c8247baff3c8c7e6e5db13132ef6f4ec52c15d569e`
- Artifact size: `1045438` bytes
- Artifact retention configured by workflow: 30 days
- Public Pages state while validation is pending: production root **release hold**, exact current learner candidate exposed only under `/preview/`

The Pages build reported 144 public runtime assets before the hold wrapper and staged the same production candidate bytes for physical validation. The hold build then exposed the candidate under `/preview/` without changing its learner-runtime content. The runtime fingerprint is unchanged from the preceding candidate, but physical validation remains bound to this current protected-main source/artifact record rather than being inferred from CI equivalence.

## Why the previous device evidence cannot release this build

The existing governed device contract is bound to the earlier runtime fingerprint:

`sha256:3de533c64352b7c674c1a58eb7a14ecc51ba678464d047e6b1bd5294a9779b99`

The current candidate is:

`sha256:b1aea83687ec9b6264b90fe30d8641225e56a7864c6c805881679d128b24e382`

The release pipeline correctly detected the mismatch and kept production fail-closed. Do not copy the old Android or accepted-iOS-risk result onto this candidate.

## Physical execution

Use the exact artifact or a byte-identical HTTPS-served build and complete every applicable item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`.

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

## Book-specific physical checks

On both platforms, additionally exercise the current Book integration:

1. Open **Book** from the primary navigation.
2. Confirm the Book summary reports 46 governed chapters and all authorized chapters are visibly `Verified`.
3. Open at least one chapter from each of the eight parts and confirm content renders without a fail-closed error.
4. Exercise **Read Book** navigation and return-to-contents behavior.
5. Exercise **Listen to verified Book** where device speech synthesis is available; confirm it speaks the same visible governed text rather than a separate manuscript.
6. Disable connectivity after the candidate has fully installed/cached, relaunch, and confirm the Book manifest, authorization and chapter content remain available offline.
7. Restore connectivity and exercise the update/recovery path; confirm Book content is not left in a mixed old/new state.

These Book checks supplement, not replace, the standard physical PWA checklist.

## Automated live evidence already completed

Automated live validation is complete for this source deployment:

- Pages Release Readiness run `34806712586` passed and verified the stable release-hold deployment twice;
- MouldMaster Book Live Pages Validation run `34806814722` matched trusted `main` to the deployed Pages SHA and verified the live `/preview/` Book candidate;
- the live verifier confirmed release `2026.09.14.4`, 8 parts / 46 chapters, authorization counts `116 supported / 21 scoped-qualified / 0 hold / 0 conflict`, authored-draft non-self-promotion, and shared Read/Listen runtime markers.

This automated evidence does **not** substitute for the physical checks above.

## Updating the governed evidence

Only after all required checks genuinely pass on both platforms:

- set `data/pwa-physical-device-validation-v1.json` to a current-release validated state;
- bind its `runtimeFingerprint` to `sha256:b1aea83687ec9b6264b90fe30d8641225e56a7864c6c805881679d128b24e382` **only if the physically tested candidate still has that fingerprint**;
- record non-sensitive device/OS/browser metadata and evidence references;
- run the existing physical PWA QA and release verifier;
- submit the evidence change through the protected PR path.

If a later learner-facing build produces a different fingerprint, this packet becomes historical and a new release-specific physical test is required.
