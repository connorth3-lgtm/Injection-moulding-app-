# NEW1-03 — exact lesson ↔ Book semantic review boundary

**Status: HOLD · governing web source `2026.10.09.6` · no public New1 navigation activation.**

This is the next preparatory step for [#521](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/521), following the merged `.6` shell/core safeguards. The existing `data/book-curriculum-crosswalk-v1.json` describes **course-level thematic reinforcement**, not individual reviewed lesson equivalence or competency. Its suggestions may help authors discover source material, but are **not** approved learner-facing progress, certificates, assessment scores, skill ratings or production instruction.

The new `data/new1-semantic-link-review-v1.json` is a distinct **review-pending** registry. `qa_new1_semantic_link_review.py` checks the authoritative **120 canonical lessons** extracted read-only from frozen `MouldMaster_Core_App.html`, **46 Book modules** in the Book manifest, the existing 12-course thematic crosswalk and the currently authorized Book content release. Approved public linking is hard-disabled.

## Requirements before any exact link can be proposed

Each prospective lesson/Book pair needs a current whole-lesson SHA-256 fingerprint, manifest-chapter SHA-256 fingerprint, **Book published-runtime source-inventory SHA-256 fingerprint** (`bookRuntimeFingerprint`), authoritative course name, exact Book publication release, a dated real reviewer reference, an evidence reference and a substantive explanation of **why that exact lesson needs this exact section**. Missing/duplicate/unknown lessons, changed fingerprints, unsupported cross-course suggestions, malformed dates and forged completion/score fields are rejected. Even a well-shaped record **does not attest** that an independent human actually reviewed it; evidence legitimacy is still assessed separately.

The chapter fingerprint covers **manifest metadata**, not all Book prose or claims. The additional `bookRuntimeFingerprint` binds an authored review to the **entire published Book runtime-integrity inventory**, including source blob identities of authored Book passages, reader composition, evidence and SME records. A change to any inventoried Book source invalidates previously recorded exact-link reviews even if the chapter manifest metadata and Book release version remain unchanged. This deliberately conservative fingerprint is **not a per-chapter prose hash or proof of content accuracy**; actual published files are independently checked by the Book integrity gate. Before release, content owners and appropriate SMEs must review actual Book passages, uncertainty, diagrams, competencies and learner-navigation semantics, not just these hashes.

## Explicitly outstanding

1. Author actual lesson-to-Book mappings, competency links and a governed practice activity reference. **None is invented or automatically filled**.
2. Review real Book passages and the 120-lesson curriculum; keep Book SME / curriculum SME approval independent.
3. Implement contextual `Continue in Book`, `Try practice`, and `Return to lesson` navigation in the canonical shell only after content owner review. Do not enable the development workbench as a second account/progress store.
4. Test deep links, offline refresh/restart, A→B→A learner-scoped state, small screens, keyboard, 200% zoom and real AT/devices, then bump the runtime/cache release, retain a real candidate and govern release-specific HOLD evidence.

This patch changes no learner-facing runtime bytes, service-worker assets, grades, diagnostic authorities, certificates or production settings. Its protected CI gate ensures that future attempts to silently activate links or declare synthetic course suggestions to be reviewed exact mappings fail closed.
