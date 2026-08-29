# MouldMaster master data compilation

MouldMaster has one auditable compilation lane for its structured injection-moulding data. The purpose is to make the repository's measured evidence, research, reference knowledge, learning data and draft banks easy to inspect together without collapsing different evidence states into one misleading headline count.

For measured-data status, the machine-readable sources of truth are `data/measured-dataset-execution-ledger-v1.json`, `data/measured-dataset-inventory-v1.json` and `data/content-scale-targets.json`. This document summarizes those records and must not independently redefine accepted counts.

## Outputs

`tools/compile_master_data.py` creates:

- `manifest.json` — summary counts, evidence boundaries and package map.
- `measured-data.json` — the measured-dataset inventory/discovery records, 50-pass measured-evidence register, 60-study publisher-verified primary-measured registry and packs, mechanism-promotion dossiers, and public benchmark contract/results.
- `research-evidence.json` — six Deep Dive v2 waves (600 evidence-discovery passes), programme targets, source-freshness metadata and, when supplied, the research-candidate registry.
- `app-data-sources.json` — canonical course/assessment runtime data plus SHA-256 fingerprinted snapshots of the repository's data-bearing reference, assessment, diagnostic, material, process-data and curriculum assets.
- `synthetic-process-data.json` — the corpus-wide QA summary for the 264 synthetic diagnostic cases / 19,008 generated cycles; measured rows remain zero.
- `draft-banks.json` — 260 material-profile drafts, 320 defect-mechanism drafts, 220 sensor/machine-health drafts and 1,200 assessment drafts, all explicitly non-live and non-counting until reviewed.
- `mouldmaster-all-data.json` — one combined JSON package containing all compiled sections above.

## Evidence boundaries

Compilation does not change evidence maturity or licensing:

1. Synthetic cases and generated cycles never become measured data.
2. A dataset DOI or metadata page is not a fully profiled dataset until the actual source files are lawfully obtained, fingerprinted and inspected.
3. OpenAlex/search results remain candidates until bibliographic identity, peer-review status and study type are verified.
4. Third-party raw files are not copied merely because metadata or a public mirror exist; the measured-dataset inventory's access/licence/redistribution fields remain controlling.
5. Paper-specific settings, model features, correlations and experimental optima do not become universal production setpoints, acceptance limits or production-change authority.
6. Structural profiling does not automatically promote numeric values into the accepted measured time-series count when units, channel meanings, target/actual semantics or file structure remain unresolved.

## Reconciled accepted snapshot

Reviewed against the machine-readable ledgers on **2026-08-29**:

- **20** real measured/data-bearing dataset records inventoried.
- **7** exact-source measured dataset families accepted/profiled: Mendeley `gtnb4j7bfx` v1, scatimdata/AVAPS, Sustainability 8102 supplement, ImPure/PASCOE, iGuzzini road lenses, OpenMMS-T4G and FORinFPRO-HIMD.
- **21,356,311** accepted measured time-series values: **13,631,488** from scatimdata/AVAPS, **298,080** from OpenMMS-T4G and **7,426,743** from the source-defined cross-process lower-workpiece actual signals.
- ImPure's **2,376,696** profiled numeric values remain outside the accepted time-series total until source units and analogue-channel semantics are established.
- Cross-process lower-workpiece data now contribute **7,426,743** accepted actual measured values from 4,989 source-conforming TXT files; the family remains only partially accepted because upper-workpiece engineering units are unresolved.
- iGuzzini contributes **18,863** accepted record-level measured process values under research/education-only terms, but **0** high-frequency time-series values.
- **60** unique publisher-verified peer-reviewed primary measured studies.
- **60** verified peer-reviewed research records in the current audited master subset (the same 60 primary-measured papers, not an additional 60 papers).
- **50** measured-evidence passes.
- **600** Deep Dive v2 evidence-discovery passes.
- **264** synthetic diagnostic cases / **19,008** generated cycles.
- **157** evidence-approved keyed learner items.
- **120** core lessons + **20** optional specialist lessons.
- Draft scale banks: **260 materials / 320 defects / 220 sensor-health concepts / 1,200 assessments**, none counted as accepted yet.

## Remaining measured-data blockers

These blockers do not reduce the secured baseline above; they define what is still needed before additional sources or values can be accepted.

- **Cross-process upper-workpiece definitions** — the lower TXT stream is now source-defined and accepted; authoritative engineering units for the upper-workpiece CSV still need to be established before the family can become fully profiled. Do not extrapolate lower units to the upper files without source evidence.
- **ImPure definitions** — establish units and meanings for both analogue-input channels and the remaining sensor columns before its profiled numeric values can enter accepted measured-sample totals.
- **Warwick export** — convert the five retrieved, SHA-256-verified `.opju` files using a validated Origin/OriginPro workflow before accepting trial, channel or sample counts.
- **RWTH archive** — the authoritative CC BY 4.0 publisher download currently returns a small HTML response instead of the advertised ZIP; obtain the real archive and then profile it.
- **ProBayes main, ProBayes D-optimal and SKZ LoKI** — obtain explicit dataset reuse licences/terms from the authoritative distribution records or rights holders before automated ingestion.
- **KAMP and Foxconn** — establish authoritative original distribution/reuse rights; public mirrors do not prove rights to the underlying manufacturing datasets.
- **INQCIM** — obtain the files and explicit data-use permission from the authors before profiling.
- **Bottle-cap dataset** — obtain owner authorization/data agreement because the underlying 7,162-cycle production dataset is confidential.
- **Two León datasets** — raw files remain embargoed until **31 December 2027**, unless the depositor releases them earlier; recheck access and rights before use.

The execution ledger remains controlling if any blocker state changes before this prose is updated.

## Compile locally

Repository data only:

```bash
python tools/compile_master_data.py --output-dir compiled-data
```

Full candidate-discovery build:

```bash
python tools/harvest_openalex_injection_moulding.py \
  --output compiled-input/research-master-candidates.json \
  --target 2000 \
  --per-query-pages 5

python tools/compile_master_data.py \
  --output-dir compiled-data \
  --research-candidates compiled-input/research-master-candidates.json
```

The 2,000-record candidate registry is generated as an artifact rather than committed as a verified corpus. `.github/workflows/master-data-compile.yml` rebuilds that layer, validates the compilation and uploads the complete `mouldmaster-master-data` package.

## QA

`qa_master_data_compile.py` compiles repository data into a temporary directory and verifies dataset/study counts, DOI deduplication, synthetic/measured separation, evidence-wave totals, curriculum totals, source-snapshot coverage, draft-bank boundaries and the combined output. `qa_content_scale_targets.py` separately reconciles the target ledger to the measured-data execution state and dedicated 60-study registry.
