# PR #638 — 2026.10.15.3 owner visual approval

**STATUS: OWNER VISUAL APPROVAL for the exact-source Learn, Practice and More redesign at `82b1677caecb50c95c5395166317132447851e5b`.** On 2026-10-16 (New Zealand date), directly after seeing the real-source comparison picture and being asked to approve those exact captured screens for an immutable new baseline, the owner answered **"I approve"**. This approval is scoped to **visual appearance of the redesigned app**, never to live equipment or external certification.

## What was displayed and reviewed
- The user was shown a contact-sheet image of actual `phone-412x915` **Learn, Practice and More** before/current/diff captures for the exact PR head, not an AI rendering. Earlier in the thread the user was linked to GitHub Actions' full original archive. **Do not claim the owner personally opened every raw screenshot**; source-level QA did verify the entire manifest.
- **Exact source SHA:** `82b1677caecb50c95c5395166317132447851e5b`. Runtime image archive: [Mobile Browser QA run 38789094072](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38789094072), **artifact ID `11998504802`**, artifact name `mobile-browser-chromium-visual`, ZIP digest **`sha256:51f62328b10c897818015e08ee574c9092cae7e999ceb649b7729325ccd105af`**.
- Manifest checked independently from downloaded ZIP: `candidateSourceSha=82b1677caecb50c95c5395166317132447851e5b`, `capturedSurfaces=52`, `expectedCaptures=52`, `visualOwnerApproved=false` *in the preapproval machine artifact* (correct: software must not preassign human approval). Four separately captured preview disclaimers remain supplemental.
- Immutable old release baseline: `visual-baseline/2026.10.13.3` at `352bf204ae77779d548bc77dcf8b0a63db2a84e1`; strictly unchanged. **52 unmasked** Playwright screenshots = four viewports (360×800, 412×915, 810×1080, 1440×900) × thirteen surfaces, unchanged **12-pixel limit**.
- **Exactly 12/52 new drift screens:** Learn, Practice and More at each viewport. Pixel counts:

| Viewport | Learn | Practice | More |
|---|---:|---:|---:|
| phone 360×800 | 100,262 | 132,633 | 49,890 |
| phone 412×915 | 152,215 | 194,315 | 83,404 |
| tablet 810×1080 | 421,654 | 499,153 | 206,204 |
| desktop 1440×900 | 501,771 | 598,240 | 127,858 |

- Remaining **40/52** screens were within strict 12px tolerance. No masking, screenshot omissions or threshold increases occurred.

## Successor locked visual baseline
- The new `visual-baseline/2026.10.15.3` was created *directly at the owner-reviewed source commit* `82b1677caecb50c95c5395166317132447851e5b`; GitHub compare reports **identical** (ahead=0, behind=0). Never amend/move this ref. Old `.13.3` baseline remains immutable at its old commit.
- `qa/visual-regression-baseline.json` points at `82b1677caecb50c95c5395166317132447851e5b` and this new ref, preserves exactly four viewports, 13 surfaces and maxDiffPixels=12.
- The approval applies **only to the approved source screenshot runtime**, not to future changes. Non-runtime manifest, review-document and test-timing fixes after this reviewed SHA must still pass new pixel checks against the approved reference.

## Release gating remains separate
- Rerun substantive Chromium, **WebKit** (including the Materials asynchronous guide readiness test), every 100-run reliability shard, and visual matrix on the new source.
- Acquire successful exact-head `Pre-merge Public Candidate` retained producer/run/artifact (old artifact from a failed run does **not** count), then bind its **real** source SHA, runtime fingerprint, digest, expiry and seven successor HOLD packet records using `tools/rebind_external_hold_candidate.py`. No fabrication or silent approval.
- Keep seven independent human/device/SME/NZQA streams **HOLD**, do not invite testers, and retain advisory-only/production-blocked safeguards. A green software check never establishes an actual physical, professional, site or accreditation review.
- Protected main requires all six exact-head checks and deliberate owner-authorized squash merge, followed by independent Pages SHA verification. There is **no merge authorization from this visual approval alone**.

**Note:** The initial Visual QA zip's `visualOwnerApproved=false` field remains correct as a provenance statement recorded *before* the owner's later approval; do not rewrite historical CI artifacts.
