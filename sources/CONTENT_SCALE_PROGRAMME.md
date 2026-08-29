# MouldMaster content-scale programme

Reviewed: 2026-08-29  
Machine-readable targets: `data/content-scale-targets.json`  
Measured-data execution state: `data/measured-dataset-execution-ledger-v1.json`

## Hard targets

MouldMaster treats the following as explicit content-scale acceptance targets rather than informal aspirations:

| Area | Minimum | Preferred |
| --- | ---: | ---: |
| Fully profiled measured datasets | 30 | 50 |
| Measured time-series samples | 1,000,000 | 5,000,000 |
| Material profiles | 250 | 300 |
| Defect mechanisms | 300 | 400 |
| Sensor / machine-health concepts | 200 | 250 |
| Assessment / education items | 1,000 | 1,500 |
| Peer-reviewed research records | 1,500 | 2,000 |
| Primary measured studies | 800 | 1,000 |

The preferred measured-sample target is deliberately expressed as a multi-million benchmark so high-frequency pressure, temperature, position, velocity, current, force, ultrasound, acoustic and cycle-state traces can be represented without confusing cycle counts with sample counts.

## Truthfulness boundary

Scale does not override evidence quality.

- Synthetic process-data cases never count as measured datasets or measured samples.
- A dataset DOI or landing page never counts as a fully profiled dataset. The actual files must be lawfully obtained, fingerprinted, inspected and profiled.
- A search result or OpenAlex record is a discovery candidate, not a verified peer-reviewed or primary measured study.
- A generated material profile slot is not a completed grade profile until its exact grade/properties/source fields are reviewed.
- A generated defect pairing is only a hypothesis until the physical mechanism/evidence/test relationship is confirmed.
- A generated assessment item is not live and does not count until it passes the existing evidence approval, answer-key, duplicate/cue and assessment-quality controls.
- Structurally profiled numeric values do not enter the accepted measured-sample count while units, signal meanings, target/actual semantics, ordering or file parsing remain unresolved.

`qa_content_scale_targets.py` enforces accepted counts from the audited machine-readable registries rather than from prose summaries.

## Current accepted baseline

As of **2026-08-29**, the audited target ledger records:

- **7** fully profiled real measured dataset families accepted;
- **13,929,568** accepted measured time-series values;
- **20** real measured/data-bearing sources inventoried;
- **20** explicit base material profiles;
- **20** explicit base defect entries;
- **0** consolidated sensor/machine-health accepted count until a dedicated registry is reviewed;
- **157** evidence-gated keyed learner questions;
- **60** deduplicated publisher-verified peer-reviewed research records in the current master subset;
- **60** publisher-verified primary measured studies.

The accepted measured time-series total is **13,631,488** delivered AVAPS pressure/flow values plus **298,080** OpenMMS-T4G sensor values. The current **19,008** generated learning cycles remain synthetic and are intentionally excluded.

The seven accepted/profiled measured families are Mendeley `gtnb4j7bfx` v1, scatimdata/AVAPS, Sustainability 8102 supplement, ImPure/PASCOE, iGuzzini road lenses, OpenMMS-T4G and FORinFPRO-HIMD. Profile acceptance and measured-value acceptance remain separate: ImPure is profiled but its **2,376,696** numeric values remain outside the measured-sample total pending unit and analogue-channel definitions.

## Measured-dataset track

`data/measured-dataset-inventory-v1.json` inventories the 20 real measured/data-bearing sources. `data/measured-dataset-execution-ledger-v1.json` is the controlling one-by-one execution-state record. `data/content-scale-targets.json` carries the accepted headline counts.

Promotion to a fully profiled dataset requires a defensible source-specific record of:

1. exact source/version and access or licence terms;
2. lawful retrieval of the actual files;
3. file fingerprint and byte size;
4. schema, units and grouping inspection to the extent the source documentation permits;
5. distinction between commands/setpoints, actual measurements, derived values and labels;
6. material, machine, mould/process and quality context where the source provides it;
7. missingness/order/time-basis review;
8. explicit limitations and transfer boundaries.

A source can be fully profiled while some numeric fields remain non-counting when the unresolved semantics are explicitly bounded. The accepted measured-sample total is therefore independently gated.

### Remaining measured-data blockers

- **Cross-process chain** — archive downloaded and verified, but exact units/field meanings, actual-versus-target mapping and the lower-workpiece TXT preamble/chart format still need a source-specific parser before any values are counted.
- **ImPure/PASCOE** — define units and meanings for both analogue-input channels and the remaining sensor columns before its profiled numeric values can be promoted into the accepted measured-sample total.
- **Warwick demoulding** — export the five verified `.opju` projects through Origin/OriginPro before accepting trial/channel/sample counts.
- **RWTH PCR** — the publisher endpoint currently returns HTML instead of the advertised ZIP; obtain the real CC BY 4.0 archive and profile it.
- **ProBayes main, ProBayes D-optimal and SKZ LoKI** — obtain explicit dataset reuse licences/terms.
- **KAMP and Foxconn** — establish authoritative original distribution/reuse rights; mirror availability is not sufficient.
- **INQCIM** — obtain the files and author permission.
- **Bottle-cap dataset** — obtain owner authorization because the production dataset is confidential.
- **León process and defect datasets** — unavailable until **31 December 2027** unless released earlier; recheck access and rights at release time.

The detailed blocker rationale is kept in the execution ledger and summarized in `sources/MASTER_DATA_COMPILATION.md`.

## Research track

`tools/harvest_openalex_injection_moulding.py` provides a scalable discovery path toward 1,500–2,000 deduplicated research records. It searches across pressure, temperature, time series, sensors, quality prediction, defects, recycled materials, moisture/drying, micro-moulding, energy, machine health, fibre orientation and scientific-moulding topics.

The tool:

- deduplicates primarily by DOI;
- records title, year, type, venue, authors, open-access state and citation count;
- derives compact topic tags rather than copying paper text;
- identifies heuristic primary-measured candidates from title/abstract evidence;
- sets all verification fields false by default.

The separate `.github/workflows/research-registry-harvest.yml` can build and upload a 2,000-record candidate artifact for curation. Candidate counts do not change accepted target counts.

A primary-measured record is only promoted after review confirms that the study contains actual injection-moulding experimental or industrial measurements and records the measured signals/outcomes and study context. Reviews, simulation-only work and theory-only papers remain useful research records but do not enter the 800–1,000 measured-study count.

## Full-scale draft knowledge banks

`tools/generate_content_scale_drafts.py` generates four deterministic non-live draft banks:

- 260 material-profile slots;
- 320 defect-mechanism hypotheses;
- 220 sensor/machine-health concepts;
- 1,200 assessment/education drafts.

These counts deliberately span the requested scale while remaining outside accepted counts. `qa_content_scale_drafts.py` regenerates them in a temporary directory, checks exact counts and unique IDs, and fails if any generated record loses its draft-only status.

### Material promotion

A draft material slot needs an exact grade or explicitly bounded material class, filler/reinforcement identity where relevant, rheology/MFR evidence, moisture/drying handling, thermal behaviour, shrinkage/dimensional behaviour, degradation/compatibility cautions, processing-window provenance and source references.

No family-level generated record may invent a universal numeric processing window.

### Defect-mechanism promotion

Each accepted mechanism must connect:

`visible evidence -> physical mechanism -> likely causes -> distinguishing evidence/tests -> bounded response concepts -> material/tool/machine interactions`

The reviewer must reject draft pairings that are not physically applicable rather than filling the target with combinations that merely sound plausible.

### Sensor / machine-health promotion

Accepted concepts must define the measurement domain/location, units or feature semantics where applicable, calibration/reference needs, drift/failure/confounders and diagnostic interpretation. Derived features remain evidence, not automatic root-cause proof.

### Assessment promotion

Generated items are prompts for authoring only. Before acceptance they require learner-ready wording, answer/scoring logic, explanation, evidence mapping, safety classification where relevant, stable ID/revision information and the existing duplicate/cue/quality gates.

## Release QA

`.github/workflows/qa.yml` runs:

- `qa_content_scale_targets.py` — target definitions, accepted counts and non-counting rules;
- `qa_content_scale_drafts.py` — deterministic 260/320/220/1200 draft generation and draft-only boundary.

The target audit writes `content-scale-targets-report.json`, which is uploaded as a CI artifact alongside the existing process-data and measured-evidence reports.

## What cannot be truthfully manufactured in code

Two targets depend on external evidence rather than generation:

1. **30–50 fully profiled real datasets / millions of measured samples.** The project can discover and profile datasets, but measured rows cannot be invented or copied without lawful access and source-specific review.
2. **800–1,000 verified primary measured studies.** Search automation can find candidates at scale, but measured-study status must be evidence-reviewed before it is accepted.

This boundary is intentional. MouldMaster should reach the scale targets by building a large defensible evidence base, not by relabelling synthetic data, metadata or generated educational content.
