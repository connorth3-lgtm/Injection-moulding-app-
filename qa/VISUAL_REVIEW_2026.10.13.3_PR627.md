# PR #627 — 2026.10.13.3 visual owner review

**STATUS: PENDING NEW OWNER VISUAL INSPECTION — NOT APPROVED, NOT MERGED.** User authorization to fix/merge audit issues is not proof of inspection of screenshots that did not exist at the time.

The changes requiring a new review are: (a) hosted-preview-only persistent `NON-PRODUCTION PREVIEW` label below the current screen subtitle; (b) the expanded Read Aloud controls on tablet/desktop moving into normal top-bar flow instead of overlaying Book paragraphs; (c) any incidental layout differences found by automated screenshots. Mobile bottom sheets remain collapsible and must be manually checked for safe area and focus.

The historical user-approved reference is `visual-baseline/2026.10.13.2` pinned to `602d597fa4575c9302e3ad9799fb3c58faa67965`. Do not move it, increase the **12 pixel** tolerance, mask regions, or skip the **52** screenshot matrix. The hosted preview header label only appears on the actual `/preview/` route; supplement ordinary local CI screenshots with a hosted/simulated-preview screenshot at mobile/tablet/desktop to review the label itself.

Once a complete exact-source Chromium screenshot artifact exists, review all before/candidate/diff screenshots exceeding the strict threshold; only then may the owner approve a newly named immutable `visual-baseline/2026.10.13.3` ref. If the runtime changes after the review, recapture and re-approve the affected images.

This screen approval is separate from new exact-source producer artifact verification and seven independent external human/device/provider HOLD streams, including physical audible speech and field offline testing.
