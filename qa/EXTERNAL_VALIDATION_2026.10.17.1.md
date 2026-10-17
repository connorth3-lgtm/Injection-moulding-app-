# MouldMaster 2026.10.17.1 — integrated core-lesson teaching / Android external-validation staging

**STATUS: TECHNICAL AUTOMATION FAIL / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** Draft PR #640 places the 32 optional unscored evidence-based questions within their relevant 120 core lessons rather than the Learn/Question Centre list. It preserves the 169 governed question bank. Substantive Chromium/WebKit, five 100-run shards, cross-browser and reachability passed on current draft source `cb4cbce6629eee4ed892f96ff075d7a1601ceb40`, but the stricter visual baseline detects new not-yet-approved changes; no successful accepted `2026.10.17.1` producer artifact or bound public runtime fingerprint exists.

## Seven independent release-specific HOLD packets

- `qa/ACCESSIBILITY_REAL_AT_2026.10.17.1.md` — **HOLD**, Real NVDA + VoiceOver review
- `qa/PWA_PHYSICAL_DEVICE_2026.10.17.1.md` — **HOLD**, Physical Android/iOS PWA
- `certification/WINDOWS_SIGNING_READINESS_2026.10.17.1.md` — **HOLD**, Signed Windows distribution
- `qa/BOOK_SME_REVIEW_2026.10.17.1.md` — **HOLD**, Independent Book SME
- `qa/CURRICULUM_SME_REVIEW_2026.10.17.1.md` — **HOLD**, Independent curriculum SME
- `qa/LEARNER_PILOT_2026.10.17.1.md` — **HOLD**, Human learner outcome pilot
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.17.1.md` — **HOLD**, NZQA/provider G1–G8

## Protected release acceptance

1. Present actual Android **Lesson 46** question/explanation captures (not only the top of Learn) to the owner; record explicit owner approval for the exact source shown, not this draft's future commits.
2. Preserve immutable historical `visual-baseline/2026.10.16.1` at `04628e13a6c9a9517bef22bae6c12a456896f299`. Only after new visual owner approval create an immutable `visual-baseline/2026.10.17.1` at the exact reviewed commit; all 52 surfaces, four viewports and 12-pixel maximum retained, no mask or exception.
3. Re-run six protected exact-head checks and obtain a **successful** genuine new Pre-merge Public Candidate producer; validate source SHA, public runtime fingerprint, real artifact ID/hash and expiration. Failed producer upload is not an accepted candidate.
4. Preserve independent iOS/Android PWA, real NVDA/VoiceOver, Book/curriculum SME, Windows signing, learner-outcome and NZQA/provider review as HOLD without inventing outcomes.
5. Do not merge/deploy/send tester invitations until owner authorization, genuine evidence and protected rules permit. Production remains educational/advisory only; no accredited competence, validated recipe or machine control.

The `2026.10.16.1` previously approved source/artifact and visual baseline are immutable historical records, **not** approval or acceptance for `2026.10.17.1`.
