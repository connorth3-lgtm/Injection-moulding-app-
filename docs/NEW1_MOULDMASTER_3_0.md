# New1: MouldMaster 3.0 Digital Moulding Factory — five connected upgrades

**State, 9 October 2026:** one working development-only GitHub patch. This is not a deployed learner release, college learning-management system, machine-control product, validated physics simulator or accredited professional qualification.

## Try the integrated development workbench

From the root of this repository, run the local-only development server with the command:

    python3 -m http.server 8765 --bind 127.0.0.1

Then visit http://127.0.0.1:8765/tools/new1-academy-workbench.html

This local workbench uses the existing canonical six Virtual Apprenticeship cases/scorer, Book manifests and crosswalk, plus authored fictional four-cavity shot data. No new learner account, internet API, third-party publisher, manufacturing equipment or cloud cohort service is required. The workbench is excluded from the service-worker release graph and is not enabled on hosted Pages.

## Five actual development modules in one patch

| Pillar | Functional implementation | Deliberate limit |
| --- | --- | --- |
| 1. Virtual Factory | Four-cavity simulated training-cell evidence, 20 ordered shot rows over known-good, drift, fault and recovery, authored VA-02 shop-floor brief and four canonical reasoning decisions | The normalized part-mass index is fictional, not grams or a production tolerance; not a physics model or machine controller |
| 2. Engineering Encyclopaedia | Search/filter all 46 governed Book modules, inspect exact evidence statuses, primary-source identifiers and existing course-level crosswalk metadata; link to the original Book API when present | Not independently human-SME-verified; no copied, unreviewed full text or invented 250-chapter content |
| 3. Personal tutor | Interpret the existing four-dimension Virtual Apprenticeship score into targeted Book sections, explanations and a recommended next authored case | Not an independent answer key, psychometric outcome or general-purpose machine-diagnostic AI |
| 4. Structured apprenticeship | Five educational role tracks: operator, setter, process technician, troubleshooter and engineer. Each uses already-authored VA-01–06 investigations and reads existing attempt metadata when appropriately scoped | Formative attempts are not workplace competency records or certificates |
| 5. College/factory trainer | Local assignment JSON template builder with bounded known case IDs and level, and an anonymous four-step learner summary that requires explicit opt-in for each preparation | No person ID, automated trainer access, cloud data transmission, cohort accounts, unsupervised scoring or credential signing |

## Files and ownership

- src/experimental/new1-virtual-factory-case-one.js — original bridge to VA-02, MM_SPATIAL_TWIN, MMBook and learner-scoped MM_RUNTIME_V2 progress.
  - The concurrently improved Case One worksheet is preserved: it renders canonical VA-02 observations/prompts, offers step-level Book guidance, keeps ephemeral choices scoped to the active learner token, rejects untrusted choices and never writes an official case attempt.
- src/experimental/new1-academy-core.js — the five linked modules: validated authored cavity evidence, Book index, explainable tutor, formative pathway suggestions, assignment templates and explicit-consent summary.
- src/experimental/new1-academy-workbench.js — developer-only interactive UI using DOM text nodes; no HTML injection or learner profile writes.
- data/new1-factory-evidence-v1.json — twenty deterministic training rows with four individual cavity identities. Index values are author-selected and dimensionless, not measured data.
- data/new1-virtual-factory-case-one-v1.json — flagship VA-02 relationship contract.
- tools/new1-academy-workbench.html / .css — offline-capable when served locally; a development page, not part of the installable PWA.
- qa_new1_virtual_factory.cjs / qa_new1_academy.cjs — integrated Node tests wired into mandatory MouldMaster Release QA.

The first flagship experience links the existing Book concept to a fictional factory fault, then to canonical authored assessment choices, deterministic feedback, formative apprenticeship guidance and optional trainer assignments. No duplicate scoring authority, shadow learner database or machine setting generator is introduced.

## Canonical lesson → Book course-level discovery (developer-only)

The experimental academy can now answer `academy.lessonGuide(canonicalLesson, canonicalCourses)` using the existing `data/book-curriculum-crosswalk-v1.json`. It checks the numeric canonical lesson/course IDs against the supplied governed course registry, returns at most three related Book modules with their existing evidence state, and returns `unmapped` for an unknown or ambiguous course. No new crosswalk, lesson completion, hidden learner profile, certificate or production advice is generated.

**Semantic limit:** this is explicitly course-level thematic discovery. It is not an authored reviewed exact-lesson/chapter/competency mapping. Turning suggestions into public app links, saved learner progress or instructional claims requires the separate content-owner and Book/curriculum SME review, stable deep-link/offline behavior, and a new governed release. The current `.5` PWA remains unchanged.

## Broader 3.0 ambition, explicitly NOT achieved by this patch

250+ lessons/modules, a publisher-reviewed multi-volume Book, 1,000 independently validated diagnostics, 1,500 reviewed questions/scenarios, a multi-machine physics-backed cell, and institution-managed cohorts are long-range targets. The existing baseline remains **120 core lessons, 20 separate specialist lessons, 46 governed Book modules, and six VA investigations**.

## Requirements to activate New1 for app learners

1. Resolve real visible UI regressions #520, and separately audit dead core functions #519 and timing/stale compatibility #517 before adding another navigation destination.
2. Migrate only reviewed New1 modules into the canonical app-shell/runtime-data loading system, with keyboard/mobile/200%-zoom, iPad/Android, A-to-B learner isolation, offline/cache and real assistive-technology evidence. Keep formal assessment keys unchanged.
3. Increase the PWA web release and service-worker cache revision, regenerate governed runtime assets, build and retain the exact new candidate, and rebind *all* independent current-release validation packets to that actual SHA/fingerprint. Prior device/SME evidence cannot migrate silently.
4. Publish to the non-production preview only through protected-main release-hold governance and owner-approved merge. Verify actual hosted source SHA and invitation handoff #512 before any tester circulation.
5. Physical-device, real NVDA/VoiceOver, signed-Windows, Book SME, curriculum SME, learner-outcomes, NZQA/provider and any real-machine/production authority remain separate **HOLD** requirements. A scored virtual case is not proof of practical competence.

This work stays in the same reviewable New1 PR and does not fast-forward the old 5 October branches or bypass protected-main release protections.

## Data and consent boundaries

New1 does not create a learner store. When activated into a governed app, attempt indicators must use canonical Runtime V2 learner-scoped storage; local workbench uses a read-only stub. Its new training shots are synthetic and can never be passed off as real production logs. Trainer exports contain a template only. An anonymous performance summary includes the single current reviewed case and competency gaps, not free-text evidence, identifiers or automatic submissions; sharing outside the workbench remains voluntary and human-controlled.
