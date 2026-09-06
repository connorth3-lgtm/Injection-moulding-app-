# MouldMaster 2026.09.06.23 physical-device execution packet

This packet is for the **next release job**. It does not authorize production publication by itself and it does not replace `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md` or the governed record in `data/pwa-physical-device-validation-v1.json`.

## Candidate identity

- Governed web release: `2026.09.06.23`
- Protected-main source at the UI freeze: `3e7144b68c5dfe79232cf2ba0180060f1395ffcc`
- Visual baseline contract: `qa/visual-regression-baseline.json`
- Required artifact: `physical-pwa-candidate-<HEAD_SHA>` from the successful Pages Release Readiness run for the exact protected-main candidate being tested.
- Required runtime identity: the `sha256:...` fingerprint reported by `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --print-fingerprint` for those exact bytes.

Do **not** substitute the public release-hold origin, an emulator, automated WebKit, a different source SHA, or a later learner-runtime build for this evidence.

## Devices

Run the governed PWA checklist on:

1. A physical Android phone using Chrome, installed in standalone mode.
2. A physical iPhone or iPad using Safari, installed in standalone mode.

Record model, OS version and browser version without personal or site-identifying information. Keep screenshots, logs and other detailed evidence outside the public repository.

## Learner-surface pass

On each device, exercise the same learner UI that is frozen by browser visual regression. The exact CSS regression viewports are `360×800`, `412×915`, `810×1080`, and `1440×900`; physical devices should use their real viewport rather than attempting to spoof those dimensions.

For every surface below, record `pass` or `fail` and a short non-sensitive observation:

| Surface | Required physical check |
| --- | --- |
| Home | Loads without bootstrap residue; Today’s focus and primary navigation are usable; no content is hidden behind system/PWA bars. |
| Learn | Learning hub opens, scrolls and exposes the current/continue action without overlap or clipped controls. |
| Practice | Practice hub opens and its primary choices remain reachable and readable. |
| Lesson | Current lesson opens at the top; lesson progress, content, notes and completion controls remain reachable; reopening the installed app returns to the persisted current lesson. |
| More | More modal opens, scrolls if required, traps no essential action behind safe areas, and closes predictably. |
| Assessment | A Beginner assessment starts; answer controls and question navigation are usable; grading shows the result and wrong-answer review. |
| Listen — expanded | Expand **Listen**; Play/Pause/Resume/Stop, Previous/Next and speed remain reachable; the panel does not make the underlying page or primary navigation unusable. Device-voice availability may differ by platform, but unsupported capability must be reported clearly rather than failing silently. |

## Release-critical behaviour pass

In addition to the general PWA checklist, exercise these `.23` learner-state boundaries on both platforms:

### Progress and resume

1. Open a lesson that is not the first lesson.
2. Add a short non-sensitive note and verify the saved state is shown.
3. Exit the installed PWA completely, relaunch it, and confirm the same current lesson and note are restored.
4. Complete the lesson and confirm the next lesson becomes current.
5. Relaunch again and confirm the new current lesson persists.

### Saved lesson

1. Bookmark a lesson.
2. Navigate away, relaunch the installed PWA, and confirm the bookmark survives local persistence.
3. Remove the bookmark and confirm that removal also survives relaunch.

This validates existing saved-lesson persistence only; richer saved-lesson discovery belongs to the post-`.23` learning-flow work.

### Search

1. Search for a known lesson title term.
2. Search for a known injection-moulding concept that appears in lesson/defect/glossary/standards content.
3. Open a result and confirm it routes to the intended surface.
4. Enter a clearly absent term and confirm the UI reports no matches without hanging or losing navigation.

This validates current search correctness only; relevance ranking, typo tolerance and intent quality belong to the post-`.23` learning-flow work.

### Assessment feedback

1. Intentionally answer at least one assessment question incorrectly.
2. Grade the assessment.
3. Confirm the result is readable, correct answers are not duplicated into the review list, and each wrong answer shows the learner answer, correct answer and source disclosure.

Personalized remediation belongs to the post-`.23` learning-flow work.

### Next-step guidance

1. Complete a lesson.
2. Confirm the next lesson is clearly identified and can be opened.
3. Confirm linked formative practice can be reached from a lesson where curriculum recommendations are available.

Adaptive “what should I do next?” recommendations belong to the post-`.23` learning-flow work.

## PWA lifecycle pass

Complete every platform-specific item in `qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md`, including:

- standalone installation;
- safe-area/fixed-navigation behavior;
- offline close/relaunch;
- offline reboot/relaunch;
- same-candidate update recovery;
- realistic storage-pressure/eviction handling.

A visual or learner-flow pass does not waive these lifecycle checks.

## Verdict

### PASS

A release verdict can move forward only when:

- both physical platform sections above pass against the exact candidate fingerprint;
- the general PWA physical-device checklist passes;
- detailed evidence remains private and only non-sensitive references are placed in the repository;
- `data/pwa-physical-device-validation-v1.json` is updated through the protected PR path with the exact tested fingerprint and current device metadata;
- `python qa_pwa_physical_device.py` passes; and
- `python tools/verify_pwa_physical_evidence.py --artifact .pages-dist --require-validated` passes against the same candidate bytes.

### FAIL

If any release-critical check fails, record the failing surface and device, keep `.23` unpromoted, and fix the smallest relevant behavior. A learner-runtime fix creates a new candidate and therefore requires a new exact runtime fingerprint and fresh physical evidence; do not attach `.23` evidence to changed bytes.

## After the physical verdict

Once the device gate is resolved, the next product work should improve learning flow rather than chrome, in this order:

1. progress/resume behavior;
2. search relevance and typo/intent handling;
3. saved-lesson discovery and resume entry points;
4. assessment remediation feedback; and
5. adaptive “what should I do next?” recommendations.

Those changes should intentionally advance the learner runtime instead of being folded into the `.23` validation candidate.
