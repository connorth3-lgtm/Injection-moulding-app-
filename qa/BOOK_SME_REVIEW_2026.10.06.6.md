# MouldMaster Book SME review packet — 2026.10.06.6

This packet governs the **human** technical review of MouldMaster Book content release `2026.10.06.4`: 20 reader-facing chapters composed from 46 governed review modules, bound to learner web release `2026.10.06.6` / Book manifest `2026.09.14.1`.

Automated evidence review, CI, browser tests and the Book publication authorization are necessary but are not a substitute for an independent experienced injection-moulding practitioner reviewing the teaching as a practitioner would use it.

## Scope

Review every governed module ID listed in `data/book-sme-review-v1.json`. The contract retains the legacy field name `chapterIds`; those 46 IDs are the claim/source/SME review units underneath the 20 reader-facing chapters in `data/book-reader-architecture-v2.json`. For the chapters with governed worked examples (26 worked cases in total), the chapter review must also inspect the complete worked example listed in `data/book-worked-engineering-cases-v1.json`, including arithmetic/reasoning, assumptions, units, evidence fit, synthetic-data labeling and non-universal boundaries. Start with its `priorityChapters`, especially safety foundations, V/P transfer, gate seal, diagnostic method, short shot, flash, burns, warpage, black specks, cavity pressure, process monitoring and complex diagnostics.

For the ten chapters listed in `enrichmentChapterIds`, the reviewer must also inspect all current evidence-enrichment sections in `data/book-evidence-enrichment-v2.json`, including source fit, case-specific numerical context, uncertainty, non-universal boundaries and the ISO 9001:2026 quality-record section where applicable.

For each governed module explicitly assess all six dimensions:

1. **Technical accuracy** — mechanisms and terminology are materially correct.
2. **Applicability and exclusions** — generic guidance does not masquerade as a grade/machine/mould/site recipe.
3. **Evidence fit** — cited evidence supports the statement being taught within the stated scope.
4. **Diagnostic uncertainty** — plausible mechanisms are not presented as guaranteed causes/fixes.
5. **Safety boundary** — machine/site/manufacturer safety instructions remain controlling.
6. **Practical use** — an experienced technician/engineer could use the wording without being nudged toward unsafe or unjustified action.

## Review record

Add one object per governed module to `data/book-sme-review-v1.json` only after a real human review. Use a non-sensitive reviewer reference, for example an internal review ticket or public professional identifier the reviewer has agreed to publish.

Each record should contain:

```json
{
  "chapterId": "vp-transfer",
  "reviewedAt": "2026-09-15T00:00:00+12:00",
  "reviewerReference": "non-sensitive-reference",
  "dimensions": {
    "technicalAccuracy": "pass",
    "applicabilityAndExclusions": "pass",
    "evidenceFit": "pass",
    "diagnosticUncertainty": "pass",
    "safetyBoundary": "pass",
    "practicalUse": "pass"
  },
  "conclusion": "approved",
  "evidenceRef": "non-sensitive-review-record",
  "reviewedWorkedCaseIds": ["worked-vp-transfer-v1"],
  "reviewedDiagramIds": ["diagram-vp-transfer-v1"],
  "reviewedEvidenceEnrichment": true,
  "notes": "Optional public-safe summary only."
}
```

For each governed module, record the exact governed worked-case and diagram IDs actually reviewed. For chapters listed in `enrichmentChapterIds`, set `reviewedEvidenceEnrichment` to `true` only after all governed enrichment sections in that chapter were inspected. Empty arrays are valid where the chapter owns no governed worked case or diagram.

Where a governed module owns a governed worked case or instructional diagram, list that exact ID in the review record. For chapters in `enrichmentChapterIds`, set `reviewedEvidenceEnrichment` to `true` only after all governed enrichment sections have been reviewed. Any unresolved material objection keeps the governed module and top-level contract on **HOLD**. Do not record an approval from an AI review, automated source check, repository owner self-attestation presented as independent review, or a reviewer who did not inspect the chapter.

## Required challenge questions

For troubleshooting chapters, ask whether a learner could wrongly interpret the chapter as `symptom -> certain cause -> guaranteed fix`. If yes, the review fails until the wording is corrected.

For all 26 governed worked engineering cases, independently recompute or otherwise verify the calculation/reasoning and confirm the case-level evidence anchors fit the stated claim. Review all 21 governed instructional diagrams for mechanism accuracy, labels, accessibility text, non-scale boundaries and consistency with the owning module.

For numeric/process-setting content, ask whether the number is universal. If the correct answer depends on grade, machine, mould, hot runner, product or site, the chapter must make that dependency visible and point back to controlling documentation or measurement.

For safety content, confirm that generic teaching never authorizes bypassing guards, interlocks, lockout/isolation requirements or manufacturer/site procedures.

## Completion rule

The Book SME status may become `validated` only when all 46 governed module IDs have one current human review, all required dimensions pass or have a documented resolution, and there is no unresolved safety or accuracy objection. Validation of the Book does **not** automatically validate the separate 120-lesson curriculum contract.

## Editorial expansion scope

For the 37 modules covered by the current editorial-expansion review, confirm the revised prose remains inside the claim IDs and exact reviewed bytes recorded in `data/book-editorial-expansion-review-v1.json`. Also review the 20-chapter composition in `data/book-reader-architecture-v2.json` for misleading transitions or scope bleed between adjacent governed modules.

## 2026.10.06.6 Keep Reading / Home integration emphasis

Book technical content is now content release `2026.10.06.4` after the 100-pass editorial and teaching remediation; independent human SME approval remains unchanged on HOLD. Confirm the Home **Book / Keep Reading** entry does not blur the distinction between learner navigation state and governed technical authority, and that the learner-facing phrase **Source evidence reviewed** cannot reasonably be mistaken for independent human SME approval.
