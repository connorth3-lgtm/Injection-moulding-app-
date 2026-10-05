# MouldMaster Book deep peer review — 2026.10.06.1

## Review basis

This review covers the governed MouldMaster Book candidate for web release `2026.10.06.1`, including the 20-reader-chapter architecture, all 46 governed modules, 18 worked engineering cases, 8 instructional diagrams, evidence-enrichment layers, publication authorization and independent-SME boundary.

This is repository-controlled peer/technical review. It is **not** independent human SME approval, learner-outcome validation, accreditation, physical-device validation or production authorization.

## Overall verdict

The Book is now structurally a book rather than a list of 46 short learner pages: 20 reader-facing chapters compose the 46 governed modules without deleting their claim/source/SME identities. The reader layer adds no separate technical claims or status authority.

The Book remains **external HOLD**. The remaining HOLD is primarily human validation and live repository policy, not an unresolved internal publication architecture defect.

## What improved in this release

- Consolidated 46 governed modules into 20 reader-facing chapters.
- Preserved every governed module ID exactly once for claim, evidence, SME and curriculum traceability.
- Added substantial explanatory depth to process fundamentals, cycle logic, polymer structure, rheology, plasticising, warpage, DOE, capability, process monitoring, dimensional stability, multi-cavity processing and complex diagnostics.
- Added an exact-byte editorial-expansion review binding the 12 changed modules to their complete existing governed claim inventories.
- Kept independent human SME status at HOLD.
- Kept reader grouping structural-only: it cannot promote publication, evidence, SME, accreditation or production status.
- Rebound the current release to a fresh retained exact-head candidate while leaving accessibility, physical-device, curriculum-SME, Book-SME, learner-outcome, Windows and NZQA/provider evidence on HOLD.
- Replaced a brittle worked-case release-date magic constant with relational release invariants.

## Reader architecture judgement

Twenty reader chapters is preferable to 46 learner-facing chapters.

The 46 IDs remain valuable as governance modules. They are appropriately granular for:
- claim inventories;
- source anchoring;
- human SME sign-off;
- worked-case and diagram ownership;
- curriculum mapping;
- targeted corrections and future source updates.

The 20 reader chapters provide the pedagogical layer. The correct hierarchy is:

`20 reader chapters -> 46 governed modules -> governed claims -> evidence sources`.

Deleting or physically merging the 46 governed IDs would reduce traceability without improving learner experience.

## Instructional depth

The Book is materially deeper than the prior handbook-like draft, but instructional density is still uneven. The nominal reader-chapter target is about 1,000 words, with a working range of 850–1,400 where evidence supports the additional teaching.

That target is deliberately **editorial, not a release gate**. Word-count padding would be worse than a shorter evidence-complete chapter.

Future expansion should prioritise:
1. diagnostic method;
2. filling and boundary defects;
3. weld-line interpretation;
4. cooling/release;
5. process baseline and documentation;
6. cavity-pressure/monitoring;
7. dimensional stability and reinforced-material behaviour;
8. advanced thin-wall/multi-cavity/high-performance processing.

Expansion should follow the pattern:
`mechanism -> measurement -> worked interpretation -> common trap -> discriminating evidence -> what would change the conclusion`.

## Technical accuracy posture

Strong.

The Book consistently preserves distinctions that are often blurred in practical training:
- machine injection pressure is not automatically cavity pressure;
- controller command is not measured cavity state;
- transfer is a process boundary, not a universal percentage;
- gate-seal studies establish system-specific response, not a universal hold time;
- capability requires stability and credible measurement;
- DOE statistics do not replace physical plausibility;
- correlations and alarm events do not automatically prove causation;
- defect appearance does not uniquely identify mechanism;
- pseudonymisation/anonymisation and local/process/learner evidence boundaries remain separate.

No new universal process setpoints, machine-control authority or validated production recipes were introduced by the depth expansion.

## Pedagogical strengths

The strongest instructional assets remain the worked engineering cases. They force assumptions, units, interpretation and boundaries to be visible rather than hiding them behind a final number.

The Book is most effective when it teaches the learner how to update a hypothesis from evidence. This should remain the editorial centre of gravity.

The Material Data Atlas is correctly retained as a reference appendix rather than used to inflate narrative chapters.

## Remaining internal risks

### 1. Uneven depth

Some reader chapters remain substantially shorter than the nominal target when only core module prose is counted. This is acceptable for the current release because the target is not a correctness gate, but it is the largest remaining editorial-quality opportunity.

### 2. Runtime complexity

The Book still operates inside a highly defensive runtime with exact-byte authorization, source/runtime mirrors, service-worker atomicity and compatibility loading. The controls are effective, but maintainability depends on keeping one canonical source -> packaged runtime -> verifier path.

The new reader architecture deliberately avoids creating a second content authority.

### 3. Terminology migration

Legacy governance fields still use `chapterIds` for the 46 review units. New learner-facing and review-packet wording calls them governed modules. A future schema migration may rename this field, but doing so now would create unnecessary compatibility churn. The semantic distinction is explicitly documented instead.

## Remaining external blockers

These cannot be completed by repository automation and must remain HOLD:

1. **Independent Book SME review** — 0/46 governed module reviews are independently approved.
2. **Real assistive-technology validation** — NVDA/Firefox, NVDA/Chromium, VoiceOver/macOS Safari and VoiceOver/iOS Safari still require human execution of the 12 governed tasks.
3. **Physical PWA validation** — real iOS/iPadOS and Android install/update/offline evidence is still required for this exact release candidate.
4. **Learner outcome evidence** — no longitudinal real-learner efficacy/psychometric evidence exists for this release.
5. **NZQA/provider validation** — provider-owned evidence and moderation/assessment gates remain external HOLD.
6. **Windows distribution evidence** — signing, physical launch and reputation/package validation remain external HOLD.
7. **Live main ruleset enforcement** — the repository target policy still requires native server-side application and independent latest-head human approval.

## Release recommendation

Keep the product on **HOLD for external/governance evidence**.

Internally, the Book architecture is now suitable for continued professional editorial development:
- reader structure is coherent;
- module traceability is preserved;
- expanded text is byte-bound to existing governed claims;
- publication and external-validation boundaries fail closed;
- the new release has a retained exact-head public candidate.

Do not remove the HOLD until the external evidence above exists for the exact governed release.
