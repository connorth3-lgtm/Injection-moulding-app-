# MouldMaster 2026.11.08.5 — external validation status

**STATUS: TECHNICAL CANDIDATE PASS — SOFTWARE-ONLY. All seven independent human, device, Windows distribution, SME, learner-outcome and NZQA/provider review streams remain **HOLD**.**

This release adds source-reviewed injection-moulding material grades from Japan, South Korea, Thailand, Singapore and the Philippines. The app catalogue now contains 394 exact grades, including 124 additions in this APAC update. Automated checks do not establish human, physical-device, provider, accreditation, signed-distribution or production approval.

**Technical candidate:** **PASS — software-only**

- Release: `2026.11.08.5`
- Source: `f7b703ad06fef540d7773458e0eff8202c253041`
- Runtime fingerprint: `sha256:5442547dec21641a8284e2644013609d041a5bb41dca33a5e85a5ec578e83eb9`
- Pre-merge Public Candidate run: `42507793793`
- Retained candidate artifact: `13628146324` (`physical-pwa-candidate-f7b703ad06fef540d7773458e0eff8202c253041`)
- Artifact digest: `sha256:53dbe966781563e25779a785a664efe5b768e550473fe47820f60cfd652aec45`
- Artifact expiry: `2027-02-06T18:00:46Z`

## Exact-source software checks

- Pre-merge Public Candidate run `42507793793` completed successfully and retained the exact-source artifact.
- Exact retained binding: run `42507793793`, artifact `13628146324`, source `f7b703ad06fef540d7773458e0eff8202c253041`, runtime fingerprint `sha256:5442547dec21641a8284e2644013609d041a5bb41dca33a5e85a5ec578e83eb9`.
- Mobile Browser QA run `42507793891` passed on source `f7b703ad06fef540d7773458e0eff8202c253041`. Chromium, WebKit, cross-browser, visual, reachability, and all five 100-run reliability shards passed.
- Question Quality 50-Pass run `42507794030` passed on source `f7b703ad06fef540d7773458e0eff8202c253041`.
- The 52-surface visual matrix passed 17 checks using the strict 12-pixel threshold. Visual artifact `13628221431` has digest `sha256:4f197945374c52730a2f5462ac86741eb86b097df701a2112c5cd98878e9fa1d`.
- These are automated software checks only. Human visual-owner review and every external validation remain separate.

## Release-specific review packets — all HOLD

- Accessibility / real assistive technology: `qa/ACCESSIBILITY_REAL_AT_2026.11.08.5.md` — HOLD
- Physical iOS/iPadOS and Android PWA: `qa/PWA_PHYSICAL_DEVICE_2026.11.08.5.md` — HOLD
- Windows distribution: `certification/WINDOWS_SIGNING_READINESS_2026.11.08.5.md` — HOLD
- Book SME: `qa/BOOK_SME_REVIEW_2026.11.08.5.md` — HOLD
- Curriculum SME: `qa/CURRICULUM_SME_REVIEW_2026.11.08.5.md` — HOLD
- Learner outcomes: `qa/LEARNER_PILOT_2026.11.08.5.md` — HOLD
- NZQA/provider G1–G8: `qa/NZQA_EXTERNAL_VALIDATION_2026.11.08.5.md` — HOLD

No tester invitation, signed distribution or production release is authorized by this technical PASS.
