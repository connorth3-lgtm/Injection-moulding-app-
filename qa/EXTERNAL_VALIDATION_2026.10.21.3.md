# MouldMaster 2026.10.21.3 — Book-only Read Aloud and audio output diagnostic

**STATUS: RETAINED TECHNICAL CANDIDATE / EXACT-HEAD QUALITY CHECKS PENDING / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Read Aloud is available in the Book only; lessons, exams and generic page text are not narration sources. The existing **Test phone sound** control sends two short tones to check browser audio output. Use **Book Listen** to check speech. Browser tests cannot confirm audible output through physical headphones or Bluetooth.

## Retained exact-source technical candidate

- Source SHA: `cc3700bfa90348305cbf390babb8cf8f3d715493`
- Public-runtime fingerprint: `sha256:e126eeb5a329cad4a21cb604f3ef532116c57de9bca54aaae1359baac6306c08`
- Producer: [Pre-merge Public Candidate run 39638785407](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39638785407)
- Retained artifact: `12364230865`, digest `sha256:e5d672359453ae9b7e154bd53c40b5c59f4359f2f3ea23b3b72a33f93c70fafa`, expires `2027-01-19T16:53:10Z`

The exact-source [Read Aloud QA 39561155743](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39561155743), [Mobile Browser QA 39561155654](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39561155654), and [Question Quality 50-Pass 39561155711](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39561155711) passed. These checks confirm Book-only speech behavior and browser audio calls. They do not verify that a person can hear audio on physical headphones.

No tester invitation is authorized from this technical candidate. All seven external reviews remain HOLD.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.21.3.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.21.3.md` — **HOLD**, physical Android/iOS install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.21.3.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.21.3.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.21.3.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.21.3.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.21.3.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.

The Android recovery path preserves the sentence when its speech provider emits `synthesis-failed`; it exposes the text-to-speech engine/voice settings path and retries that sentence only after the learner taps Listen. It does not add remote narration or alter Book content.
