# MouldMaster master data compilation

MouldMaster now has one auditable compilation lane for its structured injection-moulding data. The purpose is to make the repository's measured evidence, research, reference knowledge, learning data and draft banks easy to inspect together without collapsing different evidence states into one misleading headline count.

## Outputs

`tools/compile_master_data.py` creates:

- `manifest.json` — summary counts, evidence boundaries and package map.
- `measured-data.json` — the measured-dataset inventory/discovery records, 50-pass measured-evidence register, 60-study publisher-verified primary-measured registry and packs, mechanism-promotion dossiers, and the completed public benchmark contract/result.
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

## Reconciled accepted snapshot

The compilation uses the dedicated audited registries as the source of truth:

- **20** real measured/data-bearing dataset records inventoried.
- **1** exact-source public measured dataset fully executed/profiled by MouldMaster.
- **0** measured time-series samples promoted into the hard-target count so far; the **19,008** learning cycles remain synthetic.
- **60** unique publisher-verified peer-reviewed primary measured studies.
- **60** verified peer-reviewed research records in the current audited master subset (the same 60 primary-measured papers, not an additional 60 papers).
- **50** measured-evidence passes.
- **600** Deep Dive v2 evidence-discovery passes.
- **264** synthetic diagnostic cases / **19,008** generated cycles.
- **157** evidence-approved keyed learner items.
- **120** core lessons + **20** optional specialist lessons.
- Draft scale banks: **260 materials / 320 defects / 220 sensor-health concepts / 1,200 assessments**, none counted as accepted yet.

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

`qa_master_data_compile.py` compiles repository data into a temporary directory and verifies dataset/study counts, DOI deduplication, synthetic/measured separation, evidence-wave totals, curriculum totals, source-snapshot coverage, draft-bank boundaries and the combined output. `qa_content_scale_targets.py` separately reconciles the target ledger to the completed measured benchmark and dedicated 60-study registry.
