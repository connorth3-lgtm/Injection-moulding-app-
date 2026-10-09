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

### Read the actual Book sections alongside the exact canonical lesson

The one-lesson preparation packet identifies potential Book modules, but titles
and bibliographic declarations cannot substitute for **reading the actual
passages**. Qualified reviewers can now inspect one exact candidate at a time:

```bash
python tools/new1_review_packet.py --lesson-id 1 > local-new1-lesson-1-review-prep.md
python tools/new1_passage_inspection.py --lesson-id 1 --chapter-id what-injection-moulding-is > local-new1-lesson-1-book-inspection.md
```


The second command prints the **complete canonical lesson record** and
**all actual authored Book section texts** (with numbered section headings
and content hashes) for the specified Book candidate. It includes exact
chapter provenance, the declared authored-chapter scope, source IDs and
review-status disclaimers. Both inputs are local repository content only;
no external sources are fetched or independently checked.

This inspection **fails closed** if the selected module is not even in the
lesson's original course-overlap worklist, the lesson fingerprint differs,
the Book release/source inventory changes, the manifest chapter metadata
differs, the authored source files do not match their **published Git blob
SHA-1s**, or any of the 46 authored chapters are missing, duplicated,
reordered or lack required passage structure. It covers the three
publication-pinned authored chapter batches; other publication files retain
their separate governance checks. All untrusted prose is HTML-escaped
inside inert Markdown preformatted blocks so a forged heading or HTML link
in a source file cannot impersonate a human attestation.

The output is a **local reading aid**, not a completed source/copyright
verification or professional process instruction. The exact lesson↔Book
pair, passage interpretation, evidence applicability, chapter scope,
competency and practical exercise links **remain UNREVIEWED**. Do not
commit review outputs as approved evidence or expose them to learners.
The tool cannot edit the authoritative semantic-link review contract,
issue credentials, award credit or activate learner routes.

### Audit manifest vs actual authored Book source declarations (no automatic repair)

The manifest's `sourceIds` are a *manifest-level declaration*. The
46 byte-pinned, technically authored chapters may declare additional or
different source IDs in their **actual chapter content**. A manifest-only
source list is therefore **not** a complete picture of what the authoring
draft cites. For instance, the manifest lists no seeds for
`what-injection-moulding-is`, while the source-pinned authored text cites
`ISO-294-1-2017` and `ASTM-D3641-24`. This is an **authoring-registry
difference**, not by itself a defect, verification or evidence approval.

From the repository root, reviewers can generate a non-public difference
report, select a Book module, or export the fully structured read-only JSON:

```bash
python tools/new1_book_source_alignment.py > local-book-source-differences.md
python tools/new1_book_source_alignment.py --chapter-id what-injection-moulding-is
python tools/new1_book_source_alignment.py --json > local-book-source-differences.json
```


The tool verifies the Book manifest, evidence registry and all three authored
chapter batches against the currently authorized **exact Git blob SHA-1 bytes**.
It checks the unique source-ID declarations across the five source registries,
with no invented references, and reports manifest-only, authored-only and
common IDs for all 46 modules. Declared titles, issuers, URLs, dates, scopes
and states are shown solely as **pointers for human verification**. Its
course-level candidate counts are **not** reviewed lesson matches. Invalid
or duplicate source records, unknown source IDs, malformed declarations,
stale bytes, forged public-link status, incomplete Book or curriculum coverage
and crosswalk provenance drift fail closed. CSV/learner/runtime material is
neither produced nor edited.

**Required human follow-up:** qualified content owners must resolve any
meaningful publication-manifest versus authored source discrepancies in the
appropriate upstream governance process, inspect and independently check the
actual references for the *specific claim*, and determine which exact
Book passages legitimately reinforce which canonical lessons. Rewriting
the Book source IDs, review registry or authorized content-release inventory
from these diagnostics is **not permitted automatically**. All human
semantic approvals, practice/competency ties and public navigation remain HOLD.

## Human review workflow, still outstanding under #521

1. A qualified author opens the actual lesson content and the actual Book passage. A common course label is **discovery only**; it is not a reason to publish a link.
2. For each genuinely appropriate pair, independently assess exact instructional semantics, source/claim qualifications, applicability, diagrams and safety constraints, and capture a substantive rationale plus public-safe reviewer/evidence references.
3. Use `data/new1-semantic-link-review-v1.json` under the separately governed `qa_new1_semantic_link_review.py` contract. This worklist **never writes** `reviewedLinks`, cannot mark review accepted, and cannot set `approvedPublicLinks=true`.
4. A future authored mapping must separately link reviewed competencies and canonical practice activities; the current contract covers **only** exact lesson ↔ Book review candidates. A practice or competency mapping cannot be manufactured from shared course membership.
5. Only after independent content-owner and Book/curriculum SME review, canonical runtime navigation design, learner-scope and offline/deep-link testing, touch/iPad/200% visual acceptance, and the separate release-governance process can learner-facing links be considered.

**No runtime, certificate, question bank, machine/library rating, production root, release identity, service-worker cache, external HOLD or training-authority status is changed by this tool.**
