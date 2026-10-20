# PR #642 — 2026.10.20.2 owner visual approval

**STATUS: OWNER VISUAL APPROVAL FOR THE PRESENTED PHONE COMPARISONS AT EXACT SOURCE 83401a4bb217baa5c1a4acfa9181e7725e8098ac.** The owner reviewed the current-versus-baseline phone screenshots for the integrated app and Book Read Aloud controls and replied **“I approve”** on 2026-10-20. This is visual-design approval only; it does not approve merge, release or deployment.

## Reviewed provenance

- **Exact reviewed source SHA:** `83401a4bb217baa5c1a4acfa9181e7725e8098ac`.
- **Mobile Browser QA run:** [39376648825](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39376648825).
- **Screenshot artifact:** 12243349813, ZIP digest `sha256:33dd404528cd6b506426daba9e7688882332b82e88281e7ce79c0f2f825d5ce2`.
- Artifact integrity was verified. All **52 candidate** and **52 baseline** PNG SHA256 values in the capture manifest were verified.
- Against prior release 2026.10.16.1, **9 captures** stayed within the strict prior threshold and **43 captures** exceeded it. The owner approved the presented app and Book Read Aloud phone comparisons for this exact source.

The original CI artifact correctly retains `visualOwnerApproved=false` because it was created before the owner replied. It was not altered; this later approval is recorded here and in the baseline configuration.

## Immutable successor baseline

- Created `visual-baseline/2026.10.20.2` directly at `83401a4bb217baa5c1a4acfa9181e7725e8098ac`; GitHub compare verified the ref is identical to that source commit. Do not move the branch.
- Preserve historical `visual-baseline/2026.10.16.1` at `04628e13a6c9a9517bef22bae6c12a456896f299` and `visual-baseline/2026.10.15.3` unchanged.
- Keep all **52 captures**, four viewports, thirteen surfaces, Chromium, and strict `maxDiffPixels=12`; no masks, skipped surfaces, or relaxed tolerance. Later source changes must pass the screenshot suite against the new baseline.

## Non-visual release acceptance remains HOLD

This approval does not certify a successful exact-source candidate producer, physical-device PWA or speech behavior, human NVDA/VoiceOver testing, SME/curriculum/provider/NZQA reviews, signing, learner/provider evidence, accreditation, production authority, or merge permission. A successful exact-source candidate and the required genuine external human/device evidence remain outstanding.