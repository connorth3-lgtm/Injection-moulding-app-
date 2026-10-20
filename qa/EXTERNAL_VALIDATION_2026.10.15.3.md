# MouldMaster 2026.10.15.3 — redesigned Learn external-validation staging

**STATUS: TECHNICAL AUTOMATION FAIL / ALL SEVEN INDEPENDENT EXTERNAL REVIEWS HOLD.** This release introduces a new Learn studio with source-owned Troubleshooting Arena, five canonical question modes and six separate unscored reflection prompts. The previous 2026.10.15.2 candidate f9de4baaa6421184b61c40ea1932015743b6a503 is historical and does not validate changed Learn runtime bytes.

## Release-specific independent HOLD streams

- `qa/ACCESSIBILITY_REAL_AT_2026.10.15.3.md` — **HOLD**, accessibility
- `qa/PWA_PHYSICAL_DEVICE_2026.10.15.3.md` — **HOLD**, pwaPhysicalDevices
- `certification/WINDOWS_SIGNING_READINESS_2026.10.15.3.md` — **HOLD**, windowsDistribution
- `qa/BOOK_SME_REVIEW_2026.10.15.3.md` — **HOLD**, bookSme
- `qa/CURRICULUM_SME_REVIEW_2026.10.15.3.md` — **HOLD**, curriculumSme
- `qa/LEARNER_PILOT_2026.10.15.3.md` — **HOLD**, learnerOutcomes
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.15.3.md` — **HOLD**, nzqaProvider

## Source and visual merge gates

1. Strict existing 52-screen / 12px visual baseline; redesigned Learn likely differs. A newly captured screenshot may be approved only after independent owner inspection of exact screenshots, not by rebasing or increasing tolerance.
2. New exact-head public-runtime artifact, SHA256-verified files, measured runtime fingerprint and successful canonical producer workflow.
3. Chromium, WebKit, reachability, question QA and five 100-run reliability shards plus all six protected exact-head checks must succeed.
4. Rebind each HOLD packet using only actual producer identity after it succeeds. Historical 2026.10.15.2 artifact cannot validate the new release.
5. Only owner-authorized squash merge and protected-main publication after visual approval and governed QA. No tester invitations until live Pages/issue #512 operator acceptance.

**No physical iOS/Android, real NVDA/VoiceOver, signed Windows, Book/curriculum SME, learner outcomes, NZQA/provider/accreditation, production-root or machine-control authority has been conferred.**
