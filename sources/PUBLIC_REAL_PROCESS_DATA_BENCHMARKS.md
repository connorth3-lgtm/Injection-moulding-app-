# Public real injection-moulding data benchmarks

Status: external benchmark register — not a substitute for an authorised site pilot  
Reviewed: 2026-08-27

MouldMaster's synthetic process-data library is useful for teaching mechanisms, but measured external datasets can expose ingestion, missing-data, process/quality and evidence-ranking assumptions before a private site pilot is available. This register records candidate **real measured** datasets without copying third-party data into this repository.

A public dataset does not automatically establish a root cause, validated process window, production limit or safe setting change. MouldMaster must use only the claims and relationships supported by the source metadata/publication and must keep measured benchmark data distinct from MouldMaster-owned synthetic learning cases.

## Reuse-ready candidates with an explicit licence

### 1. Data Model for Injection Molding and Blow Molding

- Publisher: Mendeley Data
- Version: 1
- Published: 2025-08-05
- DOI: `10.17632/gtnb4j7bfx.1`
- Licence: **CC BY 4.0**
- Source: https://doi.org/10.17632/gtnb4j7bfx.1
- Context: industrial injection- and blow-moulding operations

The dataset description reports more than 30 production/process variables. Relevant injection-moulding fields include machine/product/material identifiers, injection and holding pressure, melt and mould temperature, cycle/cooling/ejection timing, injection velocity, cavity count, good/rejected quantities and flash-waste/defect quantities.

**Useful MouldMaster benchmark questions**
- Can the intake path distinguish physical/process evidence from identifiers and derived production metrics?
- Can quality/reject/flash relationships be explored without turning correlations into asserted mechanisms?
- Are units, missingness and order/run grouping preserved during preparation?
- Does the diagnostic-learning explanation distinguish what was measured from what would need an additional discriminating test?

**Limitations to record before use**
- A production-order record is not automatically a shot-resolved trace.
- Injection and blow-moulding records must not be pooled as though they were one process.
- A defect quantity does not itself prove the physical cause of that defect.
- Customer/product/machine identifiers must be reviewed before redistributing derived subsets.

### 2. Preform injection molding analysis — Database

- Publisher: Mendeley Data
- Current registered version in this review: 2
- Published: 2025-04-04
- DOI: `10.17632/vc3k9tt5zj.2`
- Licence: **CC BY 4.0**
- Source: https://doi.org/10.17632/vc3k9tt5zj.2
- Context: PET water-bottle preform injection moulding; data-driven process study

**Useful MouldMaster benchmark questions**
- Can the schema be mapped into the local intake/data-dictionary flow without inventing units or signals?
- Can MouldMaster clearly separate source features, predicted/derived relationships and independently established engineering findings?
- Which evidence expected by the MouldMaster real-pilot protocol is absent and therefore must remain an explicit uncertainty?

**Limitations to record before use**
- The dataset metadata is brief; inspect the actual files and associated study before assigning mechanism labels.
- Do not infer a controlled intervention/recovery sequence unless the source data actually preserve one.

## Strong inspection candidates — licence must be verified before reuse

These sources are valuable for schema/design review, but their current public record did not expose a sufficiently clear reusable licence in this review. Do not copy or redistribute their files in MouldMaster until the exact record/version rights are confirmed.

### FORinFPRO-HIMD — multimodal hybrid injection moulding

- Publisher: Zenodo
- Version: v1
- Published: 2026-06-18
- DOI: `10.5281/zenodo.20744054`
- Source: https://doi.org/10.5281/zenodo.20744054
- Context: research hybrid injection moulding of continuous-glass-fibre PP organosheets with PP overmoulding on an ENGEL V-Duo

The public record describes synchronized machine process data, cavity pressure/temperature, ultrasound and dielectric-analysis measurements. Machine signals include injection pressure, screw position, injection speed, clamp force and temperatures. This makes the record particularly useful for reviewing MouldMaster's command/actual, time-series and in-mould-sensor evidence model once reuse rights are confirmed.

### Cross-process-chain dataset archive: injection moulding + screw driving

- Publisher: Zenodo
- Version: v1.1
- Published: 2025-10-01
- DOI: `10.5281/zenodo.17240390`
- Source: https://doi.org/10.5281/zenodo.17240390

The public record describes injection-moulding time series with target and actual pressure, velocity and volume, experiment IDs linking process stages, material classifications and quality labels. It is a useful candidate for testing command-versus-actual handling and upstream/downstream quality reasoning once licence terms are confirmed.

## Embargoed records — metadata only until access changes

Do not build automated tests or redistribute files from an embargoed record merely because its metadata is public.

### Injection-molded plastic parts defect dataset

- Zenodo DOI: `10.5281/zenodo.20322729`
- Public metadata reviewed: 2026-08-27
- Current state in this review: **embargoed**
- Description: PP parts, images/segmentation/quantitative defect metrics under controlled process-parameter variation

### Injection-Molded Polypropylene Parts: Experimental Process Dataset

- Zenodo DOI: `10.5281/zenodo.20309380`
- Public metadata reviewed: 2026-08-27
- Current state in this review: **embargoed**
- Description: experimental PP process data with part weights, energy consumption and process parameters

Recheck the live record later rather than assuming the embargo or licence remains unchanged.

## Benchmark acceptance checklist

Before any public benchmark is used in a MouldMaster analysis or regression test:

1. Record the exact dataset title, DOI, version, retrieval date and licence.
2. Preserve required attribution and licence notices with any permitted derived copy.
3. Inspect the actual files; do not build field mappings from metadata alone.
4. Record units and distinguish commanded/target values from actual measured values.
5. Preserve missing values as missing; do not silently substitute zero.
6. Preserve shot/run/cavity/order grouping where the source provides it.
7. Identify which fields are direct measurements, derived metrics, labels or model outputs.
8. Keep source identifiers only where needed for traceability and permitted by the licence; alias operational identifiers in working exports when appropriate.
9. Do not label a correlation as a root cause unless the source study establishes that cause with suitable evidence.
10. Record absent discriminating evidence rather than fabricating a complete MouldMaster case.
11. Keep public benchmark results separate from the authorised site-pilot evidence tracked in issue #50.
12. Do not use benchmark findings as universal production recipes or machine/mould/material limits.

## What a public benchmark can and cannot validate

A suitable public dataset can validate parts of the **data pathway**: parsing, unit/missing-data handling, actual-versus-command separation, grouping, process/quality relationships, evidence presentation and uncertainty language.

It does **not** by itself validate MouldMaster's full real troubleshooting workflow. Closing the real-pilot gap still requires an approved site/organisation dataset with enough baseline → fault/onset → controlled test or independently investigated cause → recovery/verification evidence to compare MouldMaster's ranked mechanism against a defensible engineering finding.

## Safety and production boundary

These datasets are research/benchmark evidence. No benchmark result authorises a production change, establishes a universal setpoint, overrides a validated process, or permits bypassing safeguards or hazardous-energy controls. Real changes remain subject to the exact machine, mould, resin grade, approved process/change control, site procedures and applicable safety/legal requirements.
