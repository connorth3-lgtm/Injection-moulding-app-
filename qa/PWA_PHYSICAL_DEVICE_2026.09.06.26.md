# MouldMaster 2026.09.06.26 physical-device execution packet

This packet governs hands-on validation of the **2026.09.06.26** PWA release-consistency release. It does not authorize production by itself and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or the governed record in `data/pwa-physical-device-validation-v1.json`.

The `.26` runtime changes service-worker update semantics so an older controlled document cannot receive governed bytes from a newer release generation. Because service-worker/runtime bytes changed, `.25`/`.16` physical observations and fingerprints cannot be reused for this candidate.

## Candidate identity

- Governed web release: `2026.09.06.26`
- Reviewed learner-runtime baseline: `7e125b037caa06e9e7c7309b5e98b24f15e8bd3e`
- PWA transition issue: `#251`
- PWA transition regression: `qa/pwa-two-release-transition.spec.js`
- Visual baseline contract: `qa/visual-regression-baseline.json` (the `.25` visual baseline remains the comparison reference because `.26` intentionally changes PWA lifecycle behavior, not learner UI presentation)
- The required physical candidate is the `physical-pwa-candidate-<PROTECTED_MAIN_SHA>` artifact retained by the successful **protected-main** Pages Release Readiness run after this release is intentionally merged.
- The required runtime identity is the `sha256:...` value printed by `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --print-fingerprint` for that exact protected-main candidate.

PR builds validate readiness but do not stage the governed physical candidate. A PR fingerprint, automated Chromium result, automated WebKit result, artifact digest, public release-hold root, older source SHA or older runtime fingerprint is not physical production evidence.

## Devices

Run the checklist on both:

1. A physical Android phone using Chrome, installed in standalone mode.
2. A physical iPhone or iPad using Safari, installed in standalone mode.

Record only non-sensitive device metadata: model, OS version, browser version and installed mode. Keep screenshots, logs, learner data and any site/customer information outside the public repository.

## Mandatory learner-surface pass

Use the device's real viewport. Do not spoof the automated regression dimensions.

| Surface | Required physical check | Android | iOS/iPadOS |
| --- | --- | --- | --- |
| Home | Opens at the top; Today’s focus and primary navigation are usable; no clipping behind status/PWA bars. | pending | pending |
| Learn | Opens at the top; cards are readable and content-driven; progress/resume action is obvious; no overlap/overflow. | pending | pending |
| Practice | Opens at the top; practice choices remain readable/content-sized; descriptions do not disappear into empty slabs. | pending | pending |
| Materials | Opens at the top; chapter title, description, progress and Start/Resume action remain readable; scrolling naturally reveals later chapters. | pending | pending |
| Lesson | Opens at the top; reading content, notes, progress and completion controls remain reachable; no fixed-nav obstruction. | pending | pending |
| More | Modal/menu opens, scrolls and closes predictably; safe areas do not hide actions. | pending | pending |
| Assessment | Beginner assessment starts and completes; controls are usable; grading and wrong-answer feedback are readable. | pending | pending |
| Listen — expanded | Play/Pause/Resume/Stop, Previous/Next and speed controls remain reachable; expanded panel does not break page navigation. | pending | pending |

## Cross-view entry and mobile density

1. Scroll Learn well below the first screen, open Practice from bottom navigation and confirm Practice starts at the top.
2. Scroll Practice well below the first screen, open Learn and confirm Learn starts at the top.
3. Open Materials and confirm its heading/first chapter begins at the intended top position.
4. Repeat through Home, Lesson, Assessment and More where applicable.
5. Rotate portrait/landscape if supported and return to portrait; confirm no horizontal overflow or stranded controls.
6. On narrow phones, prefer readable content, obvious progress/actions and natural scrolling rather than compressing every card into one screen.
7. Interactive targets must remain at least 44 CSS px where required by the accessibility contract.
8. No card should retain a desktop minimum height that creates large empty slabs after mobile content is reduced.

Any stale-scroll entry, clipped top content, hidden primary control or material overlap is a **FAIL**.

## PWA release-transition acceptance

This is release-critical for `.26` and must be exercised on real hardware in addition to the ordinary PWA lifecycle checklist.

### Complete update

1. Install and launch the exact reviewed candidate in standalone mode while online.
2. Confirm the current release loads normally and learner state is intact.
3. Exercise the normal update path with the same trusted HTTPS validation origin and a controlled previous/current release transition when the physical validation harness supports it.
4. If an older installed client is intentionally kept open while the next reviewed generation becomes available, confirm the open client remains internally coherent and does not visibly mix old shell state with newer governed JavaScript/JSON.
5. Close the old client completely, relaunch, and confirm the complete newer generation loads as one coherent release.
6. Remove connectivity, close and relaunch again, and confirm that same complete release opens offline.
7. Reboot the device while offline and confirm the installed app still relaunches without silently discarding local learner state.

If the available physical harness cannot safely stage two distinct release generations at one trusted HTTPS origin, record that limitation rather than fabricating a result. The ordinary same-candidate update-recovery checks in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` remain mandatory.

### Failed or incomplete update recovery

Where the physical validation harness can deliberately interrupt or fail an update without risking device/site data:

1. Begin from a complete installed candidate.
2. Interrupt the next update before all governed app files are available (for example by controlled network interruption in the test harness).
3. Confirm the app does not present a half-new/half-old release as successfully installed.
4. Confirm the previous complete release remains usable or the app fails clearly and recoverably.
5. Restore connectivity, allow the next complete update to finish, close/relaunch and confirm coherent recovery.

If controlled failure injection is not available on the physical harness, record it as `not exercised — harness limitation`; do not convert automated Chromium evidence into a physical pass.

## Progress, persistence and learner workflow

- Open a lesson that is not lesson 1, add a short non-sensitive note, close the installed PWA and relaunch; confirm lesson and note restore.
- Complete the lesson and confirm the next lesson becomes current; relaunch and confirm it persists.
- Bookmark a lesson, relaunch and confirm it persists; remove it, relaunch again and confirm removal persists.
- Search for a known lesson-title term and known moulding concept, open a result and confirm correct routing; verify a clearly absent term gives a stable no-results state.
- Intentionally answer at least one assessment question incorrectly, grade it and confirm learner answer, correct answer and source disclosure remain readable without duplication.
- Complete a lesson and confirm the next lesson is clearly identified/openable and linked formative practice is reachable where present.

## Keyboard and input behaviour

On each device:

1. Focus search and note inputs.
2. Type enough text to wrap where applicable.
3. Confirm the virtual keyboard does not permanently hide the active field, primary action or bottom navigation.
4. Dismiss the keyboard and confirm layout returns without stale offset or horizontal overflow.

## PWA lifecycle

Complete every applicable item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, including:

- standalone installation;
- safe-area/fixed-navigation clearance;
- close/relaunch while online;
- offline close/relaunch;
- offline reboot/relaunch;
- update recovery;
- realistic storage-pressure/eviction handling; and
- the `.26` transition checks above where the physical harness supports them.

## Results template

Fill this privately during testing, then transfer only non-sensitive metadata to the governed JSON record.

### Android

- Device model: `_____`
- Android version: `_____`
- Chrome version: `_____`
- Installed mode: `standalone / fail`
- Runtime fingerprint shown for tested candidate: `sha256:_____`
- Learner surfaces: `pass / fail`
- Cross-view top entry/mobile density: `pass / fail`
- Progress/resume/bookmark/search: `pass / fail`
- Assessment feedback/next step: `pass / fail`
- Keyboard/input: `pass / fail`
- Offline restart: `pass / fail`
- Offline reboot: `pass / fail`
- Complete update transition: `pass / fail / harness limitation`
- Failed-update recovery: `pass / fail / harness limitation`
- Storage pressure: `pass / fail`
- Non-sensitive evidence reference: `_____`

### iPhone/iPad

- Device model: `_____`
- iOS/iPadOS version: `_____`
- Safari version: `_____`
- Installed mode: `standalone / fail`
- Runtime fingerprint shown for tested candidate: `sha256:_____`
- Learner surfaces: `pass / fail`
- Cross-view top entry/mobile density: `pass / fail`
- Progress/resume/bookmark/search: `pass / fail`
- Assessment feedback/next step: `pass / fail`
- Keyboard/input/safe areas: `pass / fail`
- Offline restart: `pass / fail`
- Offline reboot: `pass / fail`
- Complete update transition: `pass / fail / harness limitation`
- Failed-update recovery: `pass / fail / harness limitation`
- Storage pressure: `pass / fail`
- Non-sensitive evidence reference: `_____`

## PASS gate

Production may move forward only after:

- Android and iOS/iPadOS both pass the mandatory governed checks against the **same exact protected-main runtime fingerprint**;
- the physical-device checklist passes;
- any unexercised optional failure-injection item is recorded accurately rather than inferred from automation;
- `data/pwa-physical-device-validation-v1.json` is updated through the protected PR path with the tested fingerprint and current non-sensitive device metadata;
- `python qa_pwa_physical_device.py` passes; and
- `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-validated` passes against the same public-runtime bytes.

## FAIL gate

If any mandatory release-critical physical check fails, keep `.26` on release hold and fix the smallest relevant runtime behaviour. Any learner-runtime fix creates a new release candidate/fingerprint and requires fresh physical evidence.

Automated two-release Chromium coverage proves the scripted update protocol only. It does not authorize production and does not replace physical Android/iOS PWA validation.
