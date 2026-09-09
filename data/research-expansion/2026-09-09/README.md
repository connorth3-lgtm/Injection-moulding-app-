# MouldMaster full data audit — 2026-09-09

## Executive result

**Staged integration: PASS. Automatic canonical promotion: FAIL / intentionally blocked.**

The accumulated research is useful, but it must not be appended directly to canonical measured-data,
material-grade, assessment or validation counts. The app already has stronger governance records for
many of these sources, and those decisions take precedence.

### Baseline preserved

| Metric | Before | After staged integration |
|---|---:|---:|
| Canonical inventoried measured sources | 34 | 34 |
| Rights-executable measured sources | 21 | 21 |
| Fully profiled measured families | 17 | 17 |
| Accepted injection-process time-series values | 85,569,824 | 85,569,824 |
| Canonical assessment identities | 169 | 169 |
| Evidence-approved assessment identities | 157 | 157 |
| Measured-evidence assessment identities | 12 | 12 |
| Real MouldMaster learner rows | 0 | 0 |
| Independent blinded MouldMaster engineer labels | 0 | 0 |

The new evidence is staged as research candidates and validation support. It does not bypass any existing gate.

## Added research assets

- 75 dataset/source candidates
- 20 production/outcome case summaries
- 15 external expert/human/operational label sources
- 15 real learner datasets used only as out-of-domain psychometric proxies
- 70 assessment candidates
- 20 research material-characterisation candidates
- repaired provenance: **120/120 covered**

## Highest-priority findings

### HIGH — rights/access status needed reconciliation

The accumulated 75-source manifest contained **43 entries without an explicit licence field**.
Public availability is not treated as permission. Existing repository decisions already block or restrict several
sources for blank licences, mirror provenance, failed retrieval, embargoes, non-commercial terms or special formats.

**Action taken:** the 75 sources are integrated as discovery/candidate metadata only. Existing canonical rights
and retrieval records override prior `open_now` labels.

### HIGH — provenance was only 75% complete

The v5 evidence pack had 90 provenance rows for 120 case/label/learner/question artifacts.

Missing:
- LABEL-006..015
- LEARN-PROXY-006..015
- MDQ-061..070

**Action taken:** provenance is repaired to **120/120 = 100%**.

### HIGH — 40 assessment drafts cannot be committed as full content

The iGuzzini source is already governed as research/education scoped with raw redistribution disallowed.
The earlier question draft embedded exact source-row values in:
- 24 real-cycle classification items
- 16 pairwise measured-cycle items

**Action taken:** all 40 IDs/source links remain represented, but their stems/options/rationales are withheld and
`promotionStatus=blocked-source-rights`. The remaining 30 items are staged as uncalibrated human-review candidates.

### MEDIUM — source-family duplication

At least **20 of 75** research candidates are already represented in the repository's canonical
inventory/catalog/governance files. They are cross-walked and explicitly do **not** count as new independent families.

One exact source URL also appears under multiple scenario IDs:
`{"https://zenodo.org/records/15273503": ["MM-DATA-053", "MM-DATA-055"]}`.

### MEDIUM — material evidence is not exact-grade material truth

The 20 latest material sources contain useful DSC/TGA/DMA/rheology/mechanical evidence, but **0/20** currently
satisfy the app's exact commercial `material-grade-v2` schema as represented. They lack one or more required
manufacturer/grade lifecycle/source revision/retrieval/fingerprint/test-context fields.

**Action taken:** all 20 are staged as material research evidence only.

### MEDIUM — psychometrics remain uncalibrated

All 70 added assessment items remain uncalibrated. The 15 learner datasets are real educational telemetry, but
none are MouldMaster learner data.

**Action:** use them to test item-statistics/telemetry code only. Actual difficulty, discrimination and learner gains
must come from real MouldMaster users.

### MEDIUM — external expert labels are not MouldMaster expert validation

The 15 public label sources improve examples and protocol design. They do not replace blinded independent engineers
reviewing MouldMaster cases.

## Licensing / access controls

- Discovery entries with no explicit licence captured: **43**
- Explicit CC BY-NC 3.0 entries: **4** — MM-DATA-027, MM-DATA-030, MM-DATA-032, MM-DATA-061
- Embargoed entries: **2** — MM-DATA-023, MM-DATA-024
- Synthetic QA: MM-DATA-025 remains idea-mining only
- No third-party raw payload is added by this change

## Assessment audit

| Status | Count |
|---|---:|
| Total candidates | 70 |
| Full candidate content staged | 30 |
| Blocked due source-row rights | 40 |
| Psychometrically calibrated | 0 |
| Promoted to canonical bank by this change | 0 |

## Release impact

No release claim is strengthened automatically. The app remains an educational/diagnostic-learning resource,
not production-control authority. Real-site validation still requires authorised external site evidence and
independent engineering review.

## Automated checks to add/retain

1. Unique IDs across research artifact classes.
2. 100% provenance coverage.
3. Valid source/case links for every assessment item.
4. Blocked-rights items must contain no source-row-derived stem/options/rationale.
5. Learner proxies can never increment MouldMaster learner counts.
6. Public labels can never increment independent MouldMaster engineer-label counts.
7. Embargoed/non-commercial/missing-licence sources cannot enter raw redistribution paths.
8. Metadata-only research integration cannot change accepted measured-value counts.
9. Material research evidence cannot enter exact-grade catalog without v2 schema validation.
10. Independence counts must use overlap families, not URLs/records/scenarios.

## Conclusion

The data foundation is strong enough. The principal risks are now **governance, provenance, rights,
source independence, assessment leakage, and real-world validation**, not data volume. This integration preserves
the repository's existing conservative evidence model instead of inflating it.
