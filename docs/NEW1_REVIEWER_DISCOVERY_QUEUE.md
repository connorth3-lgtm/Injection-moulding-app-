# NEW1-03 — read-only lesson ↔ Book author discovery queue

**Status: non-production authoring aid. Exact lesson matches and public navigation remain HOLD.**

The repository already has a **120-lesson** canonical Academy curriculum, a **46-module** Book and a **12-course** thematic Book-to-Academy crosswalk. None of those course-level overlaps proves that a particular lesson has a reviewed equivalent Book passage, competency or practical assessment.

## Reproducible author-only commands

From the repository root:

```bash
python tools/new1_authoring_review_queue.py
python tools/new1_authoring_review_queue.py --csv > new1-review-worklist.csv
python tools/new1_authoring_review_queue.py --json > new1-review-worklist.json
```

These files are optional **local disposable reviewer aids** and must not be published as accepted learner mappings or ingested as a learner-progress backup. They contain no reviewer attestations, answer keys, assessment scores, learner identifiers or actual industrial data. CSV export prefixes possible spreadsheet-formula cells with a literal apostrophe so future lesson/Book titles cannot execute when opened in workbook software. Keep any real reviewers' private contact details/evidence in the appropriate restricted review process rather than public source.

Every row is copied from the authoritative lesson and Book registries and carries a whole-lesson fingerprint, **manifest-metadata-only** Book chapter fingerprint, a **full published Book runtime source-inventory SHA-256** (`bookRuntimeFingerprint`), current Book publication version, and the sole candidate basis `course-level-overlap-only`. **No fuzzy title ranking or semantic equivalence is inferred.** All candidate modules for a canonical course are presented in original Book order: reviewers must select, reject, or identify an uncovered concept themselves.

The Book runtime fingerprint is derived from the authorization's pinned `runtimeIntegrity.gitBlobSha1ByFile` source inventory, **not from each chapter's full text individually**; it is intentionally conservative, invalidating prospective exact reviews after *any* published Book payload/source amendment. This source binding does not create human review or navigation approval. The command fails closed if that source inventory is absent/malformed, the canonical lesson or Book population changes unexpectedly, chapter IDs and crosswalk order differ, a course cannot be resolved, the Book publication authorization is unavailable, the independent Book SME status is no longer the currently tracked HOLD, or a public-link flag has been enabled.

## Human review workflow, still outstanding under #521

1. A qualified author opens the actual lesson content and the actual Book passage. A common course label is **discovery only**; it is not a reason to publish a link.
2. For each genuinely appropriate pair, independently assess exact instructional semantics, source/claim qualifications, applicability, diagrams and safety constraints, and capture a substantive rationale plus public-safe reviewer/evidence references.
3. Use `data/new1-semantic-link-review-v1.json` under the separately governed `qa_new1_semantic_link_review.py` contract. This worklist **never writes** `reviewedLinks`, cannot mark review accepted, and cannot set `approvedPublicLinks=true`.
4. A future authored mapping must separately link reviewed competencies and canonical practice activities; the current contract covers **only** exact lesson ↔ Book review candidates. A practice or competency mapping cannot be manufactured from shared course membership.
5. Only after independent content-owner and Book/curriculum SME review, canonical runtime navigation design, learner-scope and offline/deep-link testing, touch/iPad/200% visual acceptance, and the separate release-governance process can learner-facing links be considered.

**No runtime, certificate, question bank, machine/library rating, production root, release identity, service-worker cache, external HOLD or training-authority status is changed by this tool.**
