# PR #626 — Book narration visual review for proposed web release 2026.10.13.2

**STATUS: OWNER VISUAL APPROVAL — SIX BOOK COUNTER DIFFERENCES ONLY; PROTECTED CI/RELEASE STILL HOLD.** On 2026-10-13 NZDT, after the assistant presented the six actual Book-progress before/after visual comparisons and explicitly asked whether to approve them for a new baseline, the owner responded **“I approve.”** This is a narrowly scoped visual decision, not approval of any unrelated screenshots, real-device audio, human evidence or bypass of the unchanged 12-pixel gate. PR #626 remains unmerged.

## Exact evidence and provenance

- **Candidate screenshot source:** `602d597fa4575c9302e3ad9799fb3c58faa67965` (includes the Android/iOS stale-queue single-scan repair; any later runtime change requires a fresh visual review; metadata-only commits require verified matching public-runtime fingerprint).
- **Candidate Mobile Browser QA run:** [38355787572](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38355787572) — **Chromium visual job FAILED** on six approved screenshot comparisons; the parent workflow was subsequently cancelled as a newer documentation-only commit advanced the PR head. The 52 completed captures and signed manifest remain actual evidence from this source, but neither the cancelled workflow nor its retained screenshots constitute a successful producer.
- **Retained visual review artifact:** [11792713708](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/38355787572/artifacts/11792713708); ZIP digest `sha256:9c5b913a0b09b85a80b4937de6f0b2b06363453f2e2173aa1bbf6053af6595f3`; expires 2026-10-27T06:22:02Z.
- **Manifest:** `visual-regression/review-manifest.json` inside the retained artifact; `candidateSourceSha=602d597...`, `baselineSourceSha=9a4b477...`, `expectedCaptures=52`, `capturedSurfaces=52`, `maxDiffPixels=12`, `visualOwnerApproved=false`. The 104 candidate/baseline PNG files were SHA-256 checked against the manifest, zero mismatches.
- **Prior immutable approved baseline:** `visual-baseline/2026.10.13.1`, exact source `9a4b4776b171cf7cc413f6d67d351cd5207b9ee2`. **Do not move or replace this ref**.

## Every visual difference exceeding 12 pixels

| Capture | Prior progress | New progress | Pixelmatch differences | Review finding |
| --- | --- | --- | ---: | --- |
| phone-360x800 / listen-expanded | 1 / 43 | 1 / 23 | 28 | Only the visible reading-unit count differs |
| phone-412x915 / listen-expanded | 1 / 43 | 1 / 23 | 28 | Only the visible reading-unit count differs |
| tablet-810x1080 / listen-expanded | 1 / 45 | 1 / 23 | 38 | Only the visible reading-unit count differs |
| tablet-810x1080 / listening | 1 / 170 | 1 / 149 | 34 | Only the visible reading-unit count differs |
| desktop-1440x900 / listen-expanded | 1 / 45 | 1 / 23 | 38 | Only the visible reading-unit count differs |
| desktop-1440x900 / listening | 1 / 170 | 1 / 149 | 34 | Only the visible reading-unit count differs |

**46 of 52 comparisons meet the prior 12-pixel lock.** The latest image-bytes audit verified all 104 baseline/candidate PNG SHA-256 digests against the manifest, with zero mismatches. Three additional images varied compared to an older in-progress capture but match the approved baseline inside the existing lock on this exact run. In the prior run 38351591257 there was also a tablet assessment discrepancy; it **did not recur** in the more recent complete 52-capture artifact above. Do not treat the previous intermittent assessment screenshot as a deliberately approved change.

The intended Book code correction chooses `#mmBookView [data-mm-book-reader]` or its visible Contents ahead of scenario and exam text. It therefore changes the actual counted speaking units. Altering the new count to match the old screenshot would reintroduce misleading feedback and conceal an important Book-specific behavior change.

## Owner's scoped decision and controlled baseline promotion

- [x] **Owner approval:** Six visible Book progress-counter changes approved in this conversation on 2026-10-13 NZDT after the screenshot comparison sheet was presented. Approval is for the six differences listed above **only**, on exact reviewed candidate source `602d597fa4575c9302e3ad9799fb3c58faa67965`, CI visual run **38355787572**, retained screenshot artifact **11792713708**.
- [x] **Evidence integrity:** All **52** viewport/surface image pairs were captured in that retained visual artifact; 46 comparisons stayed within the existing 12-pixel tolerance, six recorded the approved counter-only differences; all **104** baseline/candidate PNG hashes matched the manifest. This reports automated image-bytes integrity, not a claim that a human individually opened every PNG in the ZIP.
- [x] **Immutable reference:** Created `visual-baseline/2026.10.13.2` at exact reviewed source `602d597fa4575c9302e3ad9799fb3c58faa67965`, verified with GitHub compare (`identical`, 0 ahead, 0 behind) **before** updating the baseline manifest. The prior `visual-baseline/2026.10.13.1` is untouched.
- [x] **Strict visual manifest:** `qa/visual-regression-baseline.json` points only to the new exact pinned reference; all four viewports, 13 surfaces, and `maxDiffPixels=12` remain unchanged. `qa_release_docs.py` adds a special exact-source guard so the owner approval cannot be stretched to a later runtime redesign.
- [ ] **Fresh exact-head CI and release candidate:** rerun visual Chromium + substantive Chromium/WebKit/cross/reliability + question quality, obtain a successful exact-runtime retained public candidate producer and independently verify its provenance. No retrospective run becomes PASS from this owner's screenshot approval.

**Reviewer scope:** The approved progress counts are expected to change from 1/43 or 1/45 to 1/23 on expanded Book Listen; and from 1/170 to 1/149 on the tablet/desktop Book Listening capture. No additional shift, obscured control, cropped body or other visual change is authorised.

## Separate provenance and human/device HOLDs

The currently staged 2026.10.13.2 external contracts intentionally say `technicalAutomation: fail` and do **not** assert an accepted producer. A failed candidate workflow may upload a genuine artifact yet **still not have a successful QA-gated producer**. Do not promote technical status until successful producer, artifact, fingerprint and exact-head QA are verified. All seven independent human/device/provider streams stay **HOLD**, including actual audible iOS/Android speech. The non-production preview must remain on the previously merged release until protected merge and live Pages verification; the production root remains separately held.
