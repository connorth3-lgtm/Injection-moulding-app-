# Public real injection-moulding data benchmarks

Status: external benchmark register — first public measured benchmark completed; not a substitute for an authorised site pilot  
Reviewed: 2026-08-28

MouldMaster's synthetic process-data library is useful for teaching mechanisms, but measured external datasets can expose ingestion, missing-data, process/quality and evidence-ranking assumptions before a private site pilot is available. This register records candidate **real measured** datasets without copying third-party raw data into this repository.

A public dataset does not automatically establish a root cause, validated process window, production limit or safe setting change. MouldMaster must use only the claims and relationships supported by the source metadata/publication and must keep measured benchmark data distinct from MouldMaster-owned synthetic learning cases.

## Completed benchmark 1 — Data Model for Injection Molding and Blow Molding

- Publisher: Mendeley Data
- Version: 1
- Published: 2025-08-05
- DOI: `10.17632/gtnb4j7bfx.1`
- Licence: **CC BY 4.0**
- Context: industrial injection- and blow-moulding operations
- Associated peer-reviewed case study: `10.3390/su17167445`
- Source contract: `data/public-benchmark-contracts/gtnb4j7bfx-v1.json`
- Completed result: `data/public-benchmark-results/gtnb4j7bfx-v1.json`

The first real public benchmark was executed successfully on 2026-08-28 through the dedicated publisher-retrieval lane. MouldMaster retrieved the exact version-1 publisher workbook and did not commit or upload raw measured rows.

### Verified source and process split

- Publisher file: `modelo.xlsx`
- Worksheet: `nicky`
- File size: **4,843,621 bytes**
- SHA-256: `b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f`
- Source rows: **6,357**
- Injection-moulding rows profiled: **4,502**
- Blow-moulding rows excluded: **1,855**
- Blank/unclassified machine rows: **0**
- Separation field: source `Maquina` column
- Separation evidence: injection and blow prefixes produced the same 4,502/1,855 split reported by the associated paper

The exact workbook contains 33 Spanish-named columns spanning injection and blow-moulding variables. The source-specific adapter accepts the exact v1 workbook/sheet/schema, filters the proven injection records, removes seven blow-only fields, and maps the remaining **26/26 injection fields** to the canonical MouldMaster contract. Publisher drift fails closed rather than silently changing the benchmark.

### Missingness, zero handling and semantics

MouldMaster performed **no zero-filling** and **no unit conversion**. The 4,502 × 26 delivered injection subset contains no cells matching MouldMaster's missing-value tokens. This is recorded only as a property of the downloaded workbook: the associated study reports replacing nulls with zero during modelling preprocessing, so the benchmark does **not** claim that the original pre-publication source had no missing values and does not reverse-engineer zeros into missing values without evidence.

Observed zero counts are retained separately in the completion record, including 84 in `Pigment_Consumption` and 8 each in `Cycle_Time`, `Cooling_Time_Injection`, `Ejection_Time_Injection` and `Retention_Time_Injection`.

The published field names and workbook do not establish commanded/target-versus-actual semantics for all pressure, temperature, timing, speed, weight and consumption fields. Those semantics remain explicitly unresolved where source documentation does not establish them.

### What this completed benchmark validates

The completed run demonstrates that MouldMaster can:

- retrieve an exact licensed/version-pinned public measured source;
- fingerprint and verify the publisher container;
- inspect the real schema rather than infer it from metadata alone;
- prove and enforce injection-versus-blow process separation;
- normalize a source-specific Spanish schema to the canonical contract;
- preserve missing-value and zero semantics without silent rewriting;
- keep identifiers, derived quality metrics and physical process evidence conceptually separate;
- retain command/actual uncertainty instead of inventing semantics;
- emit aggregate profile/provenance evidence without raw record values;
- delete the publisher raw-data workspace before artifact upload;
- keep historical process values from becoming recommended setpoints or production limits.

It does **not** establish shot-level causality, intervention/recovery evidence, in-mould cavity-pressure or cavity-temperature traces, a validated process window, universal settings or an independently proven physical root cause. It is external measured-data **pathway evidence**, not completion of authorised site-pilot issue #50.

Issue #53 is closed as completed. The stronger real-site diagnostic validation remains open separately in issue #50.

## Reuse-ready candidate 2 — Preform injection molding analysis — Database

- Publisher: Mendeley Data
- Current registered version in this review: 2
- Published: 2025-04-04
- DOI: `10.17632/vc3k9tt5zj.2`
- Licence: **CC BY 4.0**
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
- Context: research hybrid injection moulding of continuous-glass-fibre PP organosheets with PP overmoulding on an ENGEL V-Duo

The public record describes synchronized machine process data, cavity pressure/temperature, ultrasound and dielectric-analysis measurements. Machine signals include injection pressure, screw position, injection speed, clamp force and temperatures. This makes the record particularly useful for reviewing MouldMaster's command/actual, time-series and in-mould-sensor evidence model once reuse rights are confirmed.

### Cross-process-chain dataset archive: injection moulding + screw driving

- Publisher: Zenodo
- Version: v1.1
- Published: 2025-10-01
- DOI: `10.5281/zenodo.17240390`

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

## Executable benchmark tooling

The repository provides two complementary paths for benchmark 1.

`tools/profile_public_benchmark.py` fingerprints and profiles a locally downloaded licensed CSV/TSV/TXT/XLSX source without writing raw rows to its JSON report. This remains useful for controlled local review.

The CI benchmark lane uses the exact-source Mendeley v1 adapter and public publisher endpoint. It verifies the exact file/sheet/schema, proves the 4,502/1,855 process split, normalizes the 26 injection fields, runs aggregate profiling and result QA, deletes `.benchmark-work`, and uploads only the aggregate JSON profile.

The synthetic fixture under `qa/fixtures/` remains fabricated schema-test data only; it is **not** a substitute for the completed measured run and is never relabelled as measured evidence.

## Benchmark acceptance checklist

Before any additional public benchmark is used in a MouldMaster analysis or regression test:

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

A suitable public dataset can validate parts of the **data pathway**: parsing, provenance, unit/missing-data handling, command-versus-actual uncertainty, grouping, process/quality relationships, evidence presentation and uncertainty language.

It does **not** by itself validate MouldMaster's full real troubleshooting workflow. Closing the real-pilot gap still requires an approved site/organisation dataset with enough baseline → fault/onset → controlled test or independently investigated cause → recovery/verification evidence to compare MouldMaster's ranked mechanism against a defensible engineering finding.

## Safety and production boundary

These datasets are research/benchmark evidence. No benchmark result authorises a production change, establishes a universal setpoint, overrides a validated process, or permits bypassing safeguards or hazardous-energy controls. Real changes remain subject to the exact machine, mould, resin grade, approved process/change control, site procedures and applicable safety/legal requirements.
