# MouldMaster 2026.10.16.1 — Android layout repair external-validation staging

**STATUS: TECHNICAL AUTOMATION PASS / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This version updates the mobile More, Practice and navigation clearance. A real successful retained technical artifact 12030806569 was produced by exact-source run 38864931906 on e336f656351afa4eeaaae0940969bea881ae9b68 with fingerprint sha256:3677de439e76c94b69ebeef13dd92904cd6b30818b88a5434fcbe3755529ec27, digest sha256:957f7a0b2e16aab3fd4b59fe86706b637a440593081152748fc18c8332cd32e7, expiry 2027-01-14T07:04:41Z; Mobile Browser QA 38864931666 and Question Quality 38864931729 succeeded. This is software evidence only. The changed phone visuals were owner-approved only for actual source 04628e13a6c9a9517bef22bae6c12a456896f299, recorded in `qa/VISUAL_REVIEW_2026.10.16.1_PR639.md`.

## Release-specific independent HOLD streams

- `qa/ACCESSIBILITY_REAL_AT_2026.10.16.1.md` — **HOLD**, accessibility
- `qa/PWA_PHYSICAL_DEVICE_2026.10.16.1.md` — **HOLD**, pwaPhysicalDevices
- `certification/WINDOWS_SIGNING_READINESS_2026.10.16.1.md` — **HOLD**, windowsDistribution
- `qa/BOOK_SME_REVIEW_2026.10.16.1.md` — **HOLD**, bookSme
- `qa/CURRICULUM_SME_REVIEW_2026.10.16.1.md` — **HOLD**, curriculumSme
- `qa/LEARNER_PILOT_2026.10.16.1.md` — **HOLD**, learnerOutcomes
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.16.1.md` — **HOLD**, nzqaProvider

## Required release gates

1. Complete exact-head substantive Chromium/WebKit, question quality, reachability and 500-run reliability tests. Retain the strict 52-screen/12px comparison; retain the owner-approved immutable `visual-baseline/2026.10.16.1` at exact reviewed source `04628e13a6c9a9517bef22bae6c12a456896f299` and rerun strict screenshot QA.
2. Exact-source Pre-merge Public Candidate run 38864931906 and artifact 12030806569 completed successfully and are bound to the seven external HOLD packets. Verify the real live producer/artifact digest, expiry, public bytes and NZQA issue #619; do not treat technical retention as external approval.
3. Keep physical PWA, NVDA/VoiceOver, Windows signing, Book and curriculum SME, learner outcomes and NZQA/provider checks at HOLD until actual human/device evidence exists. Preserve the separate protected-main owner merge decision.
4. No tester invites, published change, validated recipe, machine-control, efficacy, signing or accreditation claim from this staging state.

The approved `2026.10.15.3` visual baseline and previously retained artifact remain immutable historical records, not approval for `2026.10.16.1`.
