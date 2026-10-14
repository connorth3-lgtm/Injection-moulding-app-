# MouldMaster 2026.10.15.1 — external validation staging index

**STATUS: TECHNICAL AUTOMATION PASS / SEVEN INDEPENDENT EXTERNAL HOLD STREAMS.** Retained exact-source [successful producer run 38616968698](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38616968698), source **397e0a024eb88f9636a8b161155c5dce6af6316b**, artifact **11920452430**, digest **sha256:d333d3123cc2efeac15cfa086224d589f10672ffa2be38b2f6acb5335e18d870**, expiry 2027-01-12T18:39:14Z, runtime fingerprint **sha256:ca0603729d78845b2551e15be74351abc75456932f9ac20b8394e730a81d2022**; 166/166 asset SHA256 and byte lengths verified. Older 2026.10.13.3 evidence is historical and was not reused for changed runtime bytes. All real physical/audio, AT, Windows signing, Book/curriculum SME, learner and provider G1–G8 evidence remains HOLD.

## Proposed successor changes

- **P1 privacy/race:** a Windows delayed-voice callback, or late device `onstart`, cannot begin or advertise one-screen Read Aloud once the learner's browser tab is hidden. Hidden during voice startup explicitly invalidates pending callbacks.
- **P1 navigation:** choosing an in-app view outside continuous Listening stops that mode's active audio, including programmatic router class changes. Switching away from the browser tab without leaving Listening may still allow background playback where the device permits it.
- **P2 public notice consistency:** privacy page retains historical original effective date and discloses the 15 October 2026 content update; release `published` now refers to the appropriate UTC day. Cache revision rotates to r19 to prevent mixed versions.
- **QA:** new deterministic real-source speech harnesses for hidden voice startup, late OS speech callbacks, user navigation and programmatic Listening hide. This is not proof of audible playback on physical hardware.

## Seven successor external HOLD workstreams

- `qa/ACCESSIBILITY_REAL_AT_2026.10.15.1.md` — **HOLD**; named human NVDA and VoiceOver actual-device evidence
- `qa/PWA_PHYSICAL_DEVICE_2026.10.15.1.md` — **HOLD**; physical iOS/iPadOS/Android audible speech, offline and update tests
- `certification/WINDOWS_SIGNING_READINESS_2026.10.15.1.md` — **HOLD**; separate signed Windows distribution
- `qa/BOOK_SME_REVIEW_2026.10.15.1.md` — **HOLD**; independent review of 46 governed Book modules
- `qa/CURRICULUM_SME_REVIEW_2026.10.15.1.md` — **HOLD**; independent review of 120 core lessons
- `qa/LEARNER_PILOT_2026.10.15.1.md` — **HOLD**; genuine consented learner outcomes and delayed transfer
- `qa/NZQA_EXTERNAL_VALIDATION_2026.10.15.1.md` — **HOLD**; provider-controlled G1–G8 evidence

## Hard merge/release gates

1. A strict 52-screenshot/12px visual comparison against immutable owner-approved `visual-baseline/2026.10.13.3`. If any visual surfaces differ, do not silently accept or repin: send current/reference/diff captures for explicit new owner approval and a new immutable baseline.
2. Successful exact-source Chromium and WebKit substantive tests, reachability, cross-browser checks, all five 100-run reliability shards, Read Aloud QA, Question Quality, release/docs/security checks and protected-main branch assurance.
3. DONE — successful exact-source new producer run 38616968698, retained artifact 11920452430, digest/expiry/fingerprint verified. Previous .3 producer is historical only.
4. Only after (1)-(3), rebind release-specific PENDING/HOLD packets to **actual** successful producer metadata and re-run every protected exact-head check before owner-authorized squash merge.
5. No physical iOS/Android, NVDA/VoiceOver, Windows signing, Book/curriculum SME, learner efficacy, NZQA/provider/accreditation, professional competence, machine-control or root-production authority is claimed.

**Publication:** the live `/preview/` remains the previous protected-main release until an independently checked post-merge Pages publisher verifies this successor. Tester invitations remain NO-SEND.
