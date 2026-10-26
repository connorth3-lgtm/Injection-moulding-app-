# PR #667 — 2026.10.22.2 owner visual approval

**STATUS: OWNER APPROVED VISUAL BASELINE FOR EXACT SOURCE 7bac45d0b1426b9f13a4fdf8e8c893b2cb498795.** The owner replied “Approve” to the visual-baseline approval request after receiving the exact-source Mobile Browser QA artifact. This approval is limited to the presented design at that source.

## Reviewed provenance

- Exact candidate source: 7bac45d0b1426b9f13a4fdf8e8c893b2cb498795.
- Mobile Browser QA run: [40284054987](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/40284054987).
- Screenshot artifact: [12633960353](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/40284054987/artifacts/12633960353), artifact digest sha256:349970f20c4b7eb99e67ce226564b4fdcab68e503493b63d149027bdac8f4ec4.
- The artifact contains all 52 candidate captures and 52 baseline captures across four viewports and thirteen surfaces. The 104 PNG files were checked against the SHA256 values in the review manifest. The artifact ZIP digest matches GitHub's recorded digest.
- The prior approved baseline was release 2026.10.20.2 at source 83401a4bb217baa5c1a4acfa9181e7725e8098ac.
- Seventeen captures exceeded the strict 12-pixel comparison threshold. The differences are in Book contents, materials, trace, listen-expanded and listening views after the reviewed Book content changes. The existing artifact is preserved unchanged and continues to say visualOwnerApproved=false; this later exact-source approval is recorded here and in the baseline configuration.

## Immutable successor baseline

- Created visual-baseline/2026.10.22.2 at 7bac45d0b1426b9f13a4fdf8e8c893b2cb498795. GitHub comparison verified the ref is identical to that source commit.
- Preserve visual-baseline/2026.10.20.2 and earlier historical refs unchanged.
- Keep all 52 captures, four viewports, thirteen surfaces, Chromium, and strict maxDiffPixels=12. No masks, skipped surfaces, or relaxed threshold were added.

## Scope of approval

This is visual-design approval only. It does not approve merge, release, deployment, physical-device or assistive-technology validation, Book or curriculum SME review, learner outcomes, provider/NZQA review, Windows signing, accreditation, or production authority. Those independent evidence boundaries remain HOLD until genuine evidence is recorded under repository policy.
