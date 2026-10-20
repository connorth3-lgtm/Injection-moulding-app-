# MouldMaster 2026.10.20.7 — preview-release external validation HOLD

**STATUS: RETAINED EXACT-SOURCE TECHNICAL CANDIDATE / AUTOMATED SOFTWARE QA PASSED / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Release `2026.10.20.7` is bound to PR #662 source `ec3f46df3126e850132a90861299b3c089448d43`. The successful [Pre-merge Public Candidate run 39514093143](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39514093143) retained artifact `12306906235` (`physical-pwa-candidate-ec3f46df3126e850132a90861299b3c089448d43`), digest `sha256:1b7a3c78b065f9b7c1d801c37a0f3e73e9f2e93bf26ef21df74d093eb8ecc065`, expiry `2027-01-18T23:18:05Z`, and public-runtime fingerprint `sha256:d896fbc6aef16b5d1bb7bb711c9e7812e94d6b8a33d7ad98d2bcb4f638589c23`.

Verified exact-source software gates: Pre-merge Public Candidate run 39514093143; Read Aloud QA run 39514093064; Mobile Browser QA run 39514093109; Question Quality 50-Pass run 39514093078; Combined Learn Book QA run 39514093137; Physical PWA Contract QA run 39514093301; Windows Listen package run 39514093097; Measured Learning Production Gate run 39514093086. These results establish software checks only. The `preview` branch is non-publishing and does not deploy GitHub Pages.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.20.7.md` — **HOLD**, real NVDA + VoiceOver review
- `qa/PWA_PHYSICAL_DEVICE_2026.10.20.7.md` — **HOLD**, physical Android/iOS PWA and speaker validation
- `certification/WINDOWS_SIGNING_READINESS_2026.10.20.7.md` — **HOLD**, signed Windows distribution
- `qa/BOOK_SME_REVIEW_2026.10.20.7.md` — **HOLD**, independent Book SME
- `qa/CURRICULUM_SME_REVIEW_2026.10.20.7.md` — **HOLD**, independent curriculum SME
- `qa/LEARNER_PILOT_2026.10.20.7.md` — **HOLD**, human learner outcome pilot
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.20.7.md` — **HOLD**, NZQA/provider G1–G8

## Protected release acceptance

The exact-source candidate and automated software QA do not provide human, device, provider, accreditation, signed-distribution or production evidence. Keep all seven independent external streams **HOLD**. Real phone speaker output, installed-PWA/offline/update behavior, NVDA/VoiceOver, Book and curriculum SME review, learner outcomes, Windows signing, and provider G1–G8 evidence require genuine release-bound evidence. Production machine-control authority remains **NOT GRANTED**.

Source of truth: `data/release-external-validation-v1.json`; reviewer packets remain on HOLD until genuine evidence is recorded.
