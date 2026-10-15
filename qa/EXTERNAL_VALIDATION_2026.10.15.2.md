# MouldMaster 2026.10.15.2 — external-validation staging index

**STATUS: TECHNICAL AUTOMATION FAIL / SEVEN INDEPENDENT EXTERNAL HOLD STREAMS.** The Practice UI parity successor requires a new exact-head runtime producer. The prior 2026.10.15.1 candidate 397e0a024eb88f9636a8b161155c5dce6af6316b is historical only; it is not approval for changed runtime bytes. No candidate artifact has been verified for this release.

## Seven release-specific independent HOLD streams

- `qa/ACCESSIBILITY_REAL_AT_2026.10.15.2.md` — **HOLD** (accessibility)
- `qa/PWA_PHYSICAL_DEVICE_2026.10.15.2.md` — **HOLD** (pwaPhysicalDevices)
- `certification/WINDOWS_SIGNING_READINESS_2026.10.15.2.md` — **HOLD** (windowsDistribution)
- `qa/BOOK_SME_REVIEW_2026.10.15.2.md` — **HOLD** (bookSme)
- `qa/CURRICULUM_SME_REVIEW_2026.10.15.2.md` — **HOLD** (curriculumSme)
- `qa/LEARNER_PILOT_2026.10.15.2.md` — **HOLD** (learnerOutcomes)
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.15.2.md` — **HOLD** (nzqaProvider)

## Mandatory checks before review/merge

1. New successful exact-source producer, artifact digest and expiry, independent public-runtime fingerprint, validated manifest and verified browser/question checks.
2. Preserve the immutable 52-screen/12px visual baseline and require explicit approval for any mismatch.
3. Rebind all seven packets to verified successful metadata; never substitute previous-release technical or external approvals.
4. All protected exact-final-HEAD workflows must succeed before intentional owner squash merge.
5. Reconfirm Pages protected-main publication and run the separate issue #512 operator tester preflight. Invitations remain STOP / no-send.

**No real physical-device, assistive technology, signed Windows, human Book/curriculum SME, learner outcomes, NZQA/provider, production-root, accreditation or machine-control approval is implied.**
