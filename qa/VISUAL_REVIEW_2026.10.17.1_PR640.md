# PR #640 — 2026.10.17.1 visual review PENDING (not owner-approved)

**STATUS: OWNER VISUAL APPROVAL NOT GIVEN. DO NOT CREATE OR MOVE `visual-baseline/2026.10.17.1` BEFORE EXPLICIT APPROVAL.**

## Verified automated evidence

- Draft source `cb4cbce6629eee4ed892f96ff075d7a1601ceb40`: [Mobile Browser QA 39009479584](https://github.com/connorth3-lgtm/Injection-moulding-app-/actions/runs/39009479584) reports substantive Chromium/WebKit, cross-browser, reachability and 500-run reliability success; visual lock still fails when compared to preceding approved source.
- Previous approved immutable ref `visual-baseline/2026.10.16.1` is pinned to `04628e13a6c9a9517bef22bae6c12a456896f299`, strict **52 screenshots / 12 differing pixels**, four viewports, thirteen surfaces. Do not replace it.
- A real focused Lesson 46 phone capture with the new in-lesson Cushion Stability question and an opened explanation was generated on an earlier source within PR #640, PNG SHA-256 `88f8f6aa00b1e509ef8f7e2cfa7f559ce7f247c13d07bb5f24296bcdcd4e2e3f`. This **is not an exact-head capture for future source changes**, and no owner approval has been granted.
- The owner specifically asked to combine the 32 teaching prompts into the existing main lessons; this is a design direction, **not approval of an unseen final screenshot**.

## Approval checklist

- [ ] Owner inspects actual new phone Lesson 46 and at least one other mapped lesson with the question opened; bottom fixed tabs and reading contrast reviewed.
- [ ] Current exact-source all-52 Chromium screenshots archived with full manifest, source SHA and screenshot hashes; preserve strict thresholds and old immutable baseline.
- [ ] Explicit owner acceptance of the specific changed layout captured; distinguish from earlier More/Practice approval.
- [ ] Immutable successor ref created at the exact **approved** capture source; new baseline metadata recorded and required QA rerun successfully.
- [ ] Successful protected current-source release producer, fingerprint and artifact bound; seven independent external workstreams still HOLD.
