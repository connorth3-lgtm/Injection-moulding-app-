# New2 — Material Intelligence and release validation

Baseline: `main` squash merge `7382aa9b2e5c452bc452946d320289cffd9104e4`  
Learner-facing web release: `2026.09.29.20`

## Purpose

New2 turns the expanded exact-grade catalogue into stronger evidence-led engineering support without turning supplier data into production recipes.

The implementation keeps four boundaries explicit:

1. No material ranking or automatic substitution recommendation.
2. No inferred machine, hot-runner, mould, purge, drying or processing setpoints.
3. No staged grade enters runtime merely because its commercial identity is known.
4. Automated QA does not stand in for physical-device, human-SME, learner-pilot or accreditation validation.

## Material-change decision support

The Material Change Assistant now exposes:

- exact-grade identity and composition deltas;
- drying / moisture evidence;
- condition-aware flow / rheology evidence;
- shrinkage evidence;
- thermal processing guidance;
- per-grade evidence coverage;
- unresolved structured change flags;
- verification gates for identity/source control, material handling, machine/mould compatibility, dimensional verification and controlled trial evidence;
- primary-source traceability;
- verification actions that preserve the previous validated baseline.

The report remains informational. Site approval and production authorization remain external controlled decisions.

## Engineering knowledge graph

MouldMaster cases now preserve a linked local engineering context:

- exact material grade;
- machine / cell;
- mould / tool;
- product / assembly;
- part / component.

Stable local IDs are stored beside human-readable names and are persisted through the canonical learner-scoped IndexedDB engineering store. The store creates durable case links for each identified object.

The workspace exposes this context beside the evidence chain. When an exact catalogue grade is linked, it also reports the number of governed property, processing and source records attached to that grade.

Historical case retrieval uses these identities as evidence for relevance. Same exact grade, machine, mould, product and part increase similar-case relevance, while defect/evidence text and locally linked measured datasets remain additional signals. This is retrieval support only; similarity does not prove the same cause or authorize copying a previous process setting.

Case exports include the stable engineering-context IDs so a reviewed/exported evidence record remains traceable to the objects that were actually involved. Schema-4 case bundles can be restored as a new learner-owned case after bounded validation; restore never overwrites an existing canonical case.

## Promotion-readiness queue

Run:

```bash
python tools/material_catalog.py promotion-status
```

The report separates staged-only grades into:

- **evidence review candidates** — enough normalized evidence exists to justify semantic review;
- **blocked grades** — missing manufacturer-class sources, normalized observations, units, test methods, source IDs or applicability conditions.

A review candidate is **not** automatically promoted. Runtime publication still requires semantic review and an explicit provenance-stage change.

## Release verification

Post-merge verification for `7382aa9b...` must remain fail-closed. The expected automated evidence includes:

- Release QA
- Pages Release Readiness
- Mobile Browser QA
- Premium UI QA
- UX / Book endurance
- Physical PWA contract QA
- Measured Learning Production Gate
- Domain Foundation QA
- Health Program QA
- Deep Audit Governance
- Production Observability QA
- Open Desktop Build / release checks

The merged release is not considered fully externally validated solely because these workflows pass.

## External validation still requiring real-world evidence

The following cannot be completed by repository automation alone:

- physical iOS / iPadOS and Android validation;
- NVDA and VoiceOver validation on real supported platforms;
- independent human SME review of Academy lessons;
- independent human SME review of Book chapters;
- real-learner exploratory pilot and longitudinal follow-up;
- NZQA provider / consent / moderation / accreditation validation;
- signed Windows / Microsoft Store distribution validation where platform evidence is required;
- real production / maintenance datasets called out by the existing evidence-gap issues.

These items must remain explicit HOLDs until their evidence is attached to the relevant tracker.

## Definition of done for New2

New2 is merge-ready when:

- material staging semantic QA passes;
- promotion-readiness counts reconcile;
- Material Change Assistant browser tests cover evidence coverage, change flags and verification gates;
- existing safety/evidence boundaries remain present;
- required protected-branch checks are green;
- no manual/external validation item is falsely marked complete by automated evidence.
## Protected-check refresh

Final candidate synchronization for the 2026.09.29.20 New2 release; no runtime behavior is changed by this documentation-only commit.

## Closed-loop engineering evidence

The linked engineering context now has a dedicated learner-scoped evidence store. Each troubleshooting case can retain structured records for:

- controlled trials;
- dimensional / quality checks;
- defect observations;
- maintenance events;
- material lot / batch evidence;
- acceptance / release checks.

Each evidence record has its own stable ID, occurrence and record timestamps, source/reference identifier, type-specific completeness rules, optional material lot/batch, measurement and unit, method/measurement basis, result, acceptance state, acceptance basis where required, notes, revision lineage, and a snapshot of the case's material, machine, mould, product, part and cavity identities.

Evidence remains local to the learner profile unless explicitly exported. Evidence records themselves are append-only: corrections create revisions and withdrawals create retained void audit actions. Deleting the parent case still cascades its owned evidence because the whole case is being intentionally removed. Case export schema 4 includes links, structured evidence, and the evidence audit trail beside the stable engineering context; schema-3 exports remain compatibility imports and retain incomplete-evidence flags where they do not meet the current contract.

This closes the software evidence loop from manufacturer evidence → machine/mould actual context → product/part quality evidence while preserving the governance boundary: a recorded result does not by itself prove causation, define a universal process window, authorize a setting change, or replace human/site acceptance.


New evidence completeness and acceptance metadata remain evidence-management support only. An `accepted` record still does not constitute production authorisation unless the named site authority/process independently makes that decision.
