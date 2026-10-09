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

Every row is copied from the authoritative lesson and Book registries and carries a whole-lesson fingerprint, **manifest-metadata-only** Book chapter fingerprint, a **full published Book runtime source-inventory SHA-256** (`bookRuntimeFingerprint`), current Book publication version, and the sole candidate basis `course-level-overlap-only`. For each possible module the worklist now also exposes the Book manifest's **declared source IDs and claim classes** and the crosswalk's **course-overlap theme labels**, with an explicit `DECLARED ONLY` disclosure. For every declared source, JSON now includes the manifest's **issuer, title, HTTPS reference URL, published scope, declared check date and declared evidence state**; CSV carries the same references in a readable source-summary cell. These fields are copied from the Book's *previously declared manifest*, not re-fetched or attested, and do not replace checking the actual document and the exact passage. Modules without source IDs export an empty reference list rather than an invented citation. These are unverified source-review pointers, **not evidence that a particular claim is true, that a source is current, or that a Book passage matches the lesson**. A chapter with zero declared `sourceIds` remains an explicit empty source list for human review rather than quietly receiving invented citations. **No fuzzy title ranking or semantic equivalence is inferred.** All candidate modules for a canonical course are presented in original Book order: reviewers must select, reject, or identify an uncovered concept themselves.

The worklist now fails closed if a chapter refers to an unknown/duplicated Book manifest source seed, an undeclared claim class, or an absent/duplicated course-level theme. Source disclosures must have complete typed metadata, unambiguous HTTPS URLs without credentials/fragments, ISO check dates and a recognized **source-declaration-only** state; fabricated `approved` fields fail closed. It also checks the Book seed/claim-class registries, while treating declared URLs and classifications as *pointers to be verified by people*, not approvals.

The Book runtime fingerprint is derived from the authorization's pinned `runtimeIntegrity.gitBlobSha1ByFile` source inventory, **not from each chapter's full text individually**; it is intentionally conservative, invalidating prospective exact reviews after *any* published Book payload/source amendment. This source binding does not create human review or navigation approval. The command fails closed if that source inventory is absent/malformed, the canonical lesson or Book population changes unexpectedly, chapter IDs and crosswalk order differ, a course cannot be resolved, the Book publication authorization is unavailable, the independent Book SME status is no longer the currently tracked HOLD, or a public-link flag has been enabled.


### One-lesson human review preparation packet

For a human content owner investigating an individual **canonical lesson ID**, generate
an explicit **unreviewed** packet rather than manually reconciling many JSON rows:

```bash
python tools/new1_review_packet.py --lesson-id 1 > local-new1-lesson-1-review-prep.md
```


This read-only Markdown packet inherits the complete 120-lesson/46-Book integrity
checks from the discovery queue and shows the requested canonical lesson and
whole-lesson fingerprint, the current Book release/source inventory, **every
course-overlap candidate in Book order**, manifest state, declared source URLs,
declared applicability and check dates, and a checklist of actual passage,
source, competency and practice decisions a qualified author must make.
Chapters without references are flagged **NONE DECLARED**, not silently filled
with invented citations. Source text is rendered as inert escaped Markdown,
so injected HTML, headings or links in titles cannot impersonate an approval.
The packet rejects unknown/ambiguous lesson IDs, altered release provenance,
fake review states and invented reviewer fields.

**Important:** the packet never fills in reviewer conclusions or evidence,
does not edit the review contract, and cannot grant public navigation,
assessment credit or a qualification. Human authors must inspect actual
Book prose/lesson content (not titles, source IDs or the release fingerprint)
and retain their review decisions/evidence in the governed restricted process.
The generated local packet must not be committed as an accepted mapping or
distributed as evidence of Book SME or external-provider signoff.

## Human review workflow, still outstanding under #521

1. A qualified author opens the actual lesson content and the actual Book passage. A common course label is **discovery only**; it is not a reason to publish a link.
2. For each genuinely appropriate pair, independently assess exact instructional semantics, source/claim qualifications, applicability, diagrams and safety constraints, and capture a substantive rationale plus public-safe reviewer/evidence references.
3. Use `data/new1-semantic-link-review-v1.json` under the separately governed `qa_new1_semantic_link_review.py` contract. This worklist **never writes** `reviewedLinks`, cannot mark review accepted, and cannot set `approvedPublicLinks=true`.
4. A future authored mapping must separately link reviewed competencies and canonical practice activities; the current contract covers **only** exact lesson ↔ Book review candidates. A practice or competency mapping cannot be manufactured from shared course membership.
5. Only after independent content-owner and Book/curriculum SME review, canonical runtime navigation design, learner-scope and offline/deep-link testing, touch/iPad/200% visual acceptance, and the separate release-governance process can learner-facing links be considered.

**No runtime, certificate, question bank, machine/library rating, production root, release identity, service-worker cache, external HOLD or training-authority status is changed by this tool.**
