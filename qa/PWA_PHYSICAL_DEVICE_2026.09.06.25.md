# MouldMaster 2026.09.06.25 physical-device execution packet

This packet governs hands-on validation of the **2026.09.06.25** mobile-density release. It does not authorize production by itself and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or the governed record in `data/pwa-physical-device-validation-v1.json`.

The `.25` runtime changes mobile card density and deterministic app-view entry. Older `.24`/`.16` physical observations and fingerprints cannot be reused for this candidate.

## Candidate identity

- Governed web release: `2026.09.06.25`
- Reviewed learner-runtime baseline: `74a42f776e985d68fefb1992d696e2f49b13cc33`
- Visual baseline contract: `qa/visual-regression-baseline.json`
- PR-head QA lock: `a7dbb146951a8af55581bb74e59e686d375d95c6` before this documentation-only packet
- PR readiness build reported provisional public-runtime fingerprint `sha256:9f6aaba03c4272d0135422cea13f5dbd4011525aca0c6c1f703df19cf3034e37`; **do not use that PR fingerprint as production evidence**.
- The required physical candidate is the `physical-pwa-candidate-<PROTECTED_MAIN_SHA>` artifact retained by the successful **protected-main** Pages Release Readiness run after this PR is merged.
- The required runtime identity is the `sha256:...` value printed by `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --print-fingerprint` for that exact protected-main candidate.

PR builds validate readiness but do not stage the governed physical candidate. Merge is therefore allowed only to enter the release-hold/staging state; it is **not** production authorization. Do not substitute an emulator, automated WebKit, the PR artifact digest, the public release-hold root, an older source SHA, or a later learner-runtime build for the protected-main fingerprint.

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
| Materials | Opens at the top; chapter cards are content-sized on phones; chapter title, description, progress and Start/Resume action remain readable; scrolling naturally reveals later chapters instead of compressing four items into one screen. | pending | pending |
| Lesson | Opens at the top; reading content, notes, progress and completion controls remain reachable; no fixed-nav obstruction. | pending | pending |
| More | Modal/menu opens, scrolls and closes predictably; safe areas do not hide actions. | pending | pending |
| Assessment | Beginner assessment starts and completes; controls are usable; grading and wrong-answer feedback are readable. | pending | pending |
| Listen — expanded | Play/Pause/Resume/Stop, Previous/Next and speed controls remain reachable; expanded panel does not break page navigation. | pending | pending |

## Cross-view entry and navigation

This is release-critical for `.25`.

1. Scroll Learn well below the first screen.
2. Open Practice from bottom navigation and confirm Practice starts at the top.
3. Scroll Practice well below the first screen.
4. Open Learn and confirm Learn starts at the top.
5. Open Materials and confirm the Materials heading/first chapter begins at the intended top position rather than inheriting the previous page's scroll.
6. Repeat through Home, Lesson, Assessment and More where applicable.
7. Rotate portrait/landscape if supported and return to portrait; confirm no horizontal overflow or stranded controls.

Any stale-scroll entry, clipped top content, or hidden primary control is a **FAIL**.

## Mobile-density acceptance

On narrow phone hardware:

- Do **not** optimize for seeing chapters/cards 1, 2, 3 and 4 simultaneously.
- The preferred result is readable content, obvious progress/action and a natural cue that more content continues below.
- Interactive targets must remain at least 44 CSS px where the app's accessibility contract requires it.
- No card should retain a desktop minimum height that creates large empty space after mobile content is reduced.
- No description should be hidden if doing so leaves a title-only empty slab.

## Progress and resume

1. Open a lesson that is not lesson 1.
2. Add a short non-sensitive note.
3. Exit the installed PWA completely and relaunch.
4. Confirm the same current lesson and note are restored.
5. Complete the lesson and confirm the next lesson becomes current.
6. Relaunch and confirm the new current lesson persists.

## Saved lesson

1. Bookmark a lesson.
2. Navigate elsewhere, close the installed app and relaunch.
3. Confirm the bookmark persists.
4. Remove the bookmark, relaunch again and confirm removal persists.

## Search correctness

1. Search for a known lesson-title term.
2. Search for a known injection-moulding concept present in lesson/defect/glossary/standards content.
3. Open a result and confirm it routes to the intended surface.
4. Search for a clearly absent term and confirm a stable no-results state.

This validates current correctness only. Ranking, typo tolerance and intent improvements belong to the next learner-flow release.

## Assessment feedback

1. Intentionally answer at least one question incorrectly.
2. Grade the assessment.
3. Confirm the result is readable.
4. Confirm each wrong answer shows the learner answer, correct answer and source disclosure without duplicated correct-answer entries.

## Next-step guidance

1. Complete a lesson.
2. Confirm the next lesson is clearly identified and openable.
3. Where curriculum recommendations exist, confirm linked formative practice can be reached.

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
- same-candidate update recovery;
- realistic storage-pressure/eviction handling.

## Results template

Fill this privately during testing, then transfer only non-sensitive metadata to the governed JSON record.

### Android

- Device model: `_____`
- Android version: `_____`
- Chrome version: `_____`
- Installed mode: `standalone / fail`
- Runtime fingerprint shown for tested candidate: `sha256:_____`
- Learner surfaces: `pass / fail`
- Cross-view top entry: `pass / fail`
- Mobile density: `pass / fail`
- Progress/resume: `pass / fail`
- Saved lesson: `pass / fail`
- Search correctness: `pass / fail`
- Assessment feedback: `pass / fail`
- Next-step guidance: `pass / fail`
- Keyboard/input: `pass / fail`
- Offline restart: `pass / fail`
- Offline reboot: `pass / fail`
- Update recovery: `pass / fail`
- Storage pressure: `pass / fail`
- Non-sensitive evidence reference: `_____`

### iPhone/iPad

- Device model: `_____`
- iOS/iPadOS version: `_____`
- Safari version: `_____`
- Installed mode: `standalone / fail`
- Runtime fingerprint shown for tested candidate: `sha256:_____`
- Learner surfaces: `pass / fail`
- Cross-view top entry: `pass / fail`
- Mobile density: `pass / fail`
- Progress/resume: `pass / fail`
- Saved lesson: `pass / fail`
- Search correctness: `pass / fail`
- Assessment feedback: `pass / fail`
- Next-step guidance: `pass / fail`
- Keyboard/input: `pass / fail`
- Safe areas/navigation: `pass / fail`
- Offline restart: `pass / fail`
- Offline reboot: `pass / fail`
- Update recovery: `pass / fail`
- Storage pressure: `pass / fail`
- Non-sensitive evidence reference: `_____`

## PASS gate

Production may move forward only after:

- Android and iOS/iPadOS both pass against the **same exact protected-main runtime fingerprint**;
- the governed physical-device checklist passes;
- `data/pwa-physical-device-validation-v1.json` is updated through the protected PR path with the tested fingerprint and current non-sensitive device metadata;
- `python qa_pwa_physical_device.py` passes; and
- `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-validated` passes against the same public-runtime bytes.

## FAIL gate

If any release-critical physical check fails, keep `.25` on release hold and fix the smallest relevant learner-runtime behaviour. Any learner-runtime fix creates a new release candidate/fingerprint and requires fresh physical evidence.

## After `.25` physical approval

Start the next learner-flow release in this order:

1. progress/resume behaviour;
2. search relevance, typo tolerance and intent handling;
3. saved-lesson discovery and resume entry points;
4. assessment remediation feedback; and
5. adaptive “what should I do next?” recommendations.
