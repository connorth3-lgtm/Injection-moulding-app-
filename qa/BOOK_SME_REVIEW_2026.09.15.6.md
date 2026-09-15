# MouldMaster Book SME review packet — 2026.09.15.6

This packet governs the **human** technical review of the 46-chapter MouldMaster Book for web release `2026.09.15.6` / Book manifest `2026.09.14.1`.

Automated evidence review, CI, browser tests and the Book publication authorization are necessary but are not a substitute for an independent experienced injection-moulding practitioner reviewing the teaching as a practitioner would use it.

## Scope

Review every chapter listed in `data/book-sme-review-v1.json`. Start with its `priorityChapters`, especially safety foundations, V/P transfer, gate seal, diagnostic method, short shot, flash, burns, warpage, black specks, cavity pressure, process monitoring and complex diagnostics.

For each chapter explicitly assess all six dimensions:

1. **Technical accuracy** — mechanisms and terminology are materially correct.
2. **Applicability and exclusions** — generic guidance does not masquerade as a grade/machine/mould/site recipe.
3. **Evidence fit** — cited evidence supports the statement being taught within the stated scope.
4. **Diagnostic uncertainty** — plausible mechanisms are not presented as guaranteed causes/fixes.
5. **Safety boundary** — machine/site/manufacturer safety instructions remain controlling.
6. **Practical use** — an experienced technician/engineer could use the wording without being nudged toward unsafe or unjustified action.

## Review record

Add one object per chapter to `data/book-sme-review-v1.json` only after a real human review. Use a non-sensitive reviewer reference, for example an internal review ticket or public professional identifier the reviewer has agreed to publish.

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
  "notes": "Optional public-safe summary only."
}
```

Any unresolved material objection keeps the chapter and top-level contract on **HOLD**. Do not record an approval from an AI review, automated source check, repository owner self-attestation presented as independent review, or a reviewer who did not inspect the chapter.

## Required challenge questions

For troubleshooting chapters, ask whether a learner could wrongly interpret the chapter as `symptom -> certain cause -> guaranteed fix`. If yes, the review fails until the wording is corrected.

For numeric/process-setting content, ask whether the number is universal. If the correct answer depends on grade, machine, mould, hot runner, product or site, the chapter must make that dependency visible and point back to controlling documentation or measurement.

For safety content, confirm that generic teaching never authorizes bypassing guards, interlocks, lockout/isolation requirements or manufacturer/site procedures.

## Completion rule

The Book SME status may become `validated` only when all 46 chapter IDs have one current human review, all required dimensions pass or have a documented resolution, and there is no unresolved safety or accuracy objection. Validation of the Book does **not** automatically validate the separate 120-lesson curriculum contract.
