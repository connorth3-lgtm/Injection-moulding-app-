# MouldMaster 2026.10.21.2 — Book-only Read Aloud and audio output diagnostic

**STATUS: EXACT-SOURCE SOFTWARE CANDIDATE VERIFIED / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Read Aloud is available in the Book only; lessons, exams and generic page text are not narration sources. The existing **Test phone sound** control sends two short tones to check browser audio output. Use **Book Listen** to check speech. Browser tests cannot confirm audible output through physical headphones or Bluetooth.

## Retained exact-source technical candidate

- Source SHA: `fdf41db87889509ff8f5c6d413abbe22ef13da80`
- Public-runtime fingerprint: `sha256:6d7db4fc14495110cdbd5478f692f132d24d0069b7371b2fcfa2cd5c39fdbb4e`
- Producer: [Pre-merge Public Candidate run 39561155553](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39561155553)
- Retained artifact: `12327523532`, digest `sha256:b729728047b4dd95bbf335a765b9dfbf6de81b18b224a89b24b43baa7a265a25`, expires `2027-01-19T07:19:19Z`

The exact-source [Read Aloud QA 39561155743](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39561155743), [Mobile Browser QA 39561155654](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39561155654), and [Question Quality 50-Pass 39561155711](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39561155711) passed. These checks confirm Book-only speech behavior and browser audio calls. They do not verify that a person can hear audio on physical headphones.

No tester invitation is authorized from this technical candidate. All seven external reviews remain HOLD.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.21.2.md` — **HOLD**, human NVDA and VoiceOver review.
- `qa/PWA_PHYSICAL_DEVICE_2026.10.21.2.md` — **HOLD**, physical Android/iOS install, update, offline behavior and audible Book speech.
- `certification/WINDOWS_SIGNING_READINESS_2026.10.21.2.md` — **HOLD**, signed Windows distribution, physical execution, reputation path and package validation.
- `qa/BOOK_SME_REVIEW_2026.10.21.2.md` — **HOLD**, independent review of all 46 governed Book modules.
- `qa/CURRICULUM_SME_REVIEW_2026.10.21.2.md` — **HOLD**, independent review of all 120 canonical lessons.
- `qa/LEARNER_PILOT_2026.10.21.2.md` — **HOLD**, longitudinal real-learner outcome evidence.
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.21.2.md` — **HOLD**, provider/NZQA evidence for G1–G8.

## Merge and release boundary

An owner-directed, protected squash merge integrates source only. It does not clear any external HOLD or authorize production release. The protected-main Pages workflow keeps the production root fail-closed while physical-device authorization is absent. Do not invite testers or make accreditation, efficacy, validated-production or automatic-machine-control claims from CI or artifact retention.

Source of truth for current candidate identity and external status: `data/release-external-validation-v1.json`.
