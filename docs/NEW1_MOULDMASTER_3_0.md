# New1 / MouldMaster 3.0 — Digital Moulding Factory

**Status (9 October 2026): one GitHub development patch; not activated in the production or preview learner shell.** This is a proposed integrated programme, not a claim that the full academy, all proposed volumes, AI tutor, college system or 1,500 questions exist.

## One cohesive programme

MouldMaster already has a 120-lesson completion pathway, 20 optional specialist lessons, 46 governed Book modules grouped into 20 reader chapters, six Virtual Apprenticeship cases, Spatial Twin, Mission Control, Runtime V2 learner-scoped storage and formative assessments. The first flagship is an **end-to-end Virtual Factory case**, not a parallel simulator, Book, learner database or grading authority.

The user journey is **enter factory cell → inspect four-cavity baseline → observe cavity 4 mass drift → compare localized pressure/mass/thermal evidence → consult governed Book module → rank mechanisms → choose a discriminating measurement → propose one controlled response → verify all four cavities → reflect → receive targeted formative coaching**.

## Implemented as this development patch

- A tested, inert-by-default New1 integration adapter at src/experimental/new1-virtual-factory-case-one.js. It opens existing VA-02 through MM_VIRTUAL_APPRENTICESHIP, opens the existing Spatial Twin at the same case index, and opens the canonical Book module through MMBook.openChapter.
- A **single source-of-truth formative score**: recommendations and per-dimension tutor feedback derive from the existing Virtual Apprenticeship scoreReasoning function. No new keys, question answers or certificate cut-scores.
- An existing-learner progress reader uses only MM_RUNTIME_V2.storage and the existing Virtual Apprenticeship progress key. It never creates an unsupervised cohort database, changes progress or promotes attempted practice to workplace competence.
- A safe, DOM-created experimental entry card can be mounted later behind governed shell publication, with a clear training-only boundary.
- A machine-readable contract at data/new1-virtual-factory-case-one-v1.json and an executable Node regression test at qa_new1_virtual_factory.cjs. This patch wires the test into MouldMaster Release QA so the inactive integration cannot drift silently.

**Deliberate not-done:** The adapter is not added to runtime-domain-manifest, index, service-worker or generated packs. The current web release/cache and exact physical-device candidate provenance remain unchanged. No live or tester-visible New1 feature is claimed.

## Five connected upgrade pillars

1. **Virtual Factory:** build richer authored multi-machine/mould/material assignments around the existing Virtual Apprenticeship, Spatial Twin and synthetic process-data engine. Every scene clearly distinguishes authored direction from measured production physics.
2. **Engineering Encyclopaedia:** extend the governed Book by chapter and claim with diagrams, context, material/grade boundaries, primary sources and source maturity, rather than inserting unreviewed global setpoints.
3. **Personal engineering tutor:** deterministic evidence-step feedback now has a development prototype; any later adaptive recommendations must remain interpretable, opt-in where appropriate, local by default and separate from official answer keys.
4. **Structured apprenticeship:** operator, setter, technician, troubleshooter and engineer tracks will require worked evidence before *formative* advancement. An official certificate or professional competency determination still requires distinct human-led validation and moderation.
5. **Factory/college tools:** future trainer-authored assignments, supervised local cohorts and deliberately shared competency-gap reports must go through privacy, consent, data minimisation and human sign-off design; no cloud backend or trainer access is introduced here.

## Expansion targets (not implemented counts)

| Area | Long-range planning target |
| --- | --- |
| Curriculum | 250+ structured lessons/modules, preserving the current 120-lesson award pathway until independently reviewed |
| Book | Multi-volume, cross-linked, publisher-verified claims and exercises |
| Virtual factory | Multiple evidence-authored cells, materials, tools and fault contexts |
| Diagnostics | 1,000 independently reviewed training cases |
| Assessments | 1,500 reviewed questions/scenarios with quality, duplicate, sensitivity and moderation controls |
| Research | Claim → source → scope → evidence-maturity lineage |
| Progress | Single privacy-protected formative competency view based on canonical learner records |

## Promotion checklist — required before making the adapter learner-visible

1. Close or explicitly review confirmed UI defects **#520** (tablet five-tab wrap, duplicate Start mission CTA and retired achievement toast); investigate source/code debt **#519** and **#517** without blind deletion.
2. Integrate the single New1 adapter into the existing governed domain/asset graph, **not** a new app. Add return-to-Book/return-to-case navigation and cross-browser, 320–1440 px/200% zoom and keyboard/screen-reader tests, plus learner A/B isolation and offline tests.
3. Advance the web release and cache generation. Regenerate applicable manifests/packs deterministically. Produce a **new exact-runtime candidate** with truthful SHA and fingerprint and rebind all **HOLD** contracts and review packets without borrowing old physical-device evidence.
4. Review simulator educational claims, technical Book links, and human SME decisions. Maintain the distinct physical iOS/iPadOS + Android, real NVDA/VoiceOver, signed Windows, curriculum and Book SME, longitudinal learner, and NZQA/provider validation **HOLDs**.
5. Stage only via the protected-main release-hold workflow and verify the actual hosted non-production URL against its deployed source SHA before any voluntary tester invitation. Never automatically publish at the production root.
6. Never infer accredited training, workplace competency, validated digital-twin physics, production recipe or machine-control authority from a successful formative case.

**Related:** #521 New1 programme, #520 visible UI, #519 source duplication, #517 polish debt, #512 tester handoff. Historical 5 October New1 branches are not merge bases for this patch.
