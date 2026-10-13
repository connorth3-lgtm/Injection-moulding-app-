# MouldMaster 2026.10.13.1 — PR #623 52-surface visual-design approval

**Status: APPROVED VISUAL DESIGN for the exactly reviewed PR source, not release approval.**

## Owner decision

On 13 October 2026 (NZDT), the app owner replied **“I approve”** directly after receiving the actual complete **52-image screenshot PDF**, the **16 changed before/after pairs PDF**, the original PNG archive, and four per-viewport visual overviews for PR [#623](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/623).

The owner previously replied **“I approve this”** after viewing the standalone **Practice at 412×915** current-app screenshot. The subsequent reply to the all-pictures visual review request approves the other **15 changed comparisons**, with 36 comparisons already matching the old approved baseline within the original 12-pixel limit. It does **not** approve an unrelated unreviewed future change.

There are **four viewports × thirteen screen surfaces = 52 actual Chromium captures**: phone 360×800, phone 412×915, tablet 810×1080, desktop 1440×900; Home, Learn, Materials, Practice, Lesson, More, Assessment, Listen expanded, Listening, Book contents, Book materials, Book late, Book trace.

### Immutable source and evidence

| Field | Source-backed identity |
| --- | --- |
| Governed web release | `2026.10.13.1` |
| Exactly reviewed candidate SHA | `9a4b4776b171cf7cc413f6d67d351cd5207b9ee2` |
| [Mobile Browser QA run](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38334515939) | `38334515939` |
| [Retained visual evidence artifact](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38334515939/artifacts/11784248566) | `11784248566` |
| Artifact digest | `sha256:e46036d3b2186e8a289f16ee9494d557e523c0935d0a493b45bf447131d7ef0b` |
| Artifact expiry (UTC) | `2026-10-27T02:02:03Z` |
| Capture index | `visual-regression/review-manifest.json` in that exact artifact |
| Original 412×915 Practice PNG | `sha256:844bcfe9e4623d6d5e0c6ba55295f53ef39708cf0ac0c9bbb1e2694f65bc39c5` |
| 52 source PNG hash checks | **52 verified / 0 mismatches** against index `sha256.candidate` |
| Compared against older reference | `2026.10.11.11` at `10c21dd1c0f3132179c5532470c2847463ebcf4c` |
| Old reference differences | **16 exceeded 12 pixels; 36 did not** |
| Approved immutable reference | `visual-baseline/2026.10.13.1` pinned at `9a4b4776b171cf7cc413f6d67d351cd5207b9ee2` |
| Image pixel difference tolerance | **12 pixels**, unchanged |

The 16 changed captures are specifically **Practice, Lesson, More, Assessment at each of the four viewports**. Captures were not edited, hidden, masked, regenerated, redrawn, or substituted during the approval. The owner was shown the original images; comparison-review PDFs and overview sheets were only navigational aids. The CI artifact retains the untouched PNGs and SHA-256 index.

## Visual baseline promotion procedure

1. Confirm the owner-reviewed source SHA and all 52 candidate hashes in the retained CI capture index.
2. Create the **new separate immutable** ref `visual-baseline/2026.10.13.1` at exactly `9a4b4776b171cf7cc413f6d67d351cd5207b9ee2`, **before** modifying the branch's `qa/visual-regression-baseline.json`. A GitHub compare confirmed the new ref and source SHA are identical (zero differing commits/files).
3. Update the integration PR's screenshot manifest to the new release, exact source and immutable ref. Preserve **maxDiffPixels=12**, all **52** required captures, Playwright Chromium, deterministic seeded data and the separate, historic 2026.10.11.11 ref.
4. Run current **exact PR-head** Chromium visual, Chromium substantive, WebKit, cross-browser, reliability and all required status checks. A visual-design approval does not itself certify any CI result. No new application runtime design changes may be silently folded into this approval.

## Release and human-validation boundary

This is approval of the reviewed **visual design only**. The following remain independently **HOLD** until actual evidence is supplied and checked:

- A **successful** retained exact-source Pages candidate producer, source digest/fingerprint and signed-off release provenance; never treat an artifact from a failed workflow as a passing producer.
- Real iOS/iPadOS/Android physical PWA testing, real NVDA/VoiceOver and audible Android TTS.
- Windows package signing/certification, independent Book review of 46 governed modules, independent curriculum review of 120 lessons, consented learner/outcome evidence.
- Provider-controlled NZQA G1–G8 governance, production root, accreditation, and machine-control authority.

[Release-unblock tracker #624](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/624) and [PR #623](https://github.com/connorth3-lgtm/Injection-moulding-app-/pull/623) remain the audit trail. No artificial provider/human/device evidence, release bypass, deployment or protected-main merge is authorized by this visual acceptance.
