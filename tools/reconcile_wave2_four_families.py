#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding='utf-8'))


def write(rel, obj):
    (ROOT / rel).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def replace_once(text, old, new):
    need(text.count(old) == 1, f'expected exactly one replacement for: {old[:80]}')
    return text.replace(old, new, 1)

# Verify the four audited result packages before changing canonical ledgers.
fhj = load('data/public-benchmark-results/fhj5p7ww9v-v1.json')
pvt = load('data/public-benchmark-results/6k8fpbrd9s-v1.json')
hdpe = load('data/public-benchmark-results/4h98rz9f92-v3.json')
pmc = load('data/public-benchmark-results/pmc4753395-hdpe-cenosphere-v1.json')
need(fhj.get('status') == 'completed-restricted-noncommercial-measured-benchmark', 'fhj status drifted')
need((fhj.get('profile') or {}).get('recordLevelMeasuredOutcomeValues') == 96, 'fhj measured outcome count drifted')
need((fhj.get('acceptance') or {}).get('countsAsFullyProfiledMeasuredDataset') is True, 'fhj acceptance drifted')
need((fhj.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, 'fhj must add zero process waveform values')
need(pvt.get('status') == 'completed-public-measured-material-characterization-benchmark', 'pvT status drifted')
need((pvt.get('profile') or {}).get('deliveredDirectPhysicalValueCells') == 28590, 'pvT direct physical count drifted')
need((pvt.get('acceptance') or {}).get('countsAsFullyProfiledMeasuredDataset') is True, 'pvT acceptance drifted')
need((pvt.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, 'pvT must add zero process waveform values')
need(hdpe.get('status') == 'completed-public-measured-record-level-benchmark', 'HDPE/GNP status drifted')
need((hdpe.get('profile') or {}).get('directMeasuredPropertyValues') == 525, 'HDPE/GNP measured property count drifted')
need((hdpe.get('acceptance') or {}).get('countsAsFullyProfiledMeasuredDataset') is True, 'HDPE/GNP acceptance drifted')
need((hdpe.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, 'HDPE/GNP must add zero process waveform values')
need(pmc.get('status') == 'accepted-profiled-material-test-traces', 'PMC material-test status drifted')
need((pmc.get('profile') or {}).get('materialTestTraceValues') == 142884, 'PMC material-test trace count drifted')
need((pmc.get('acceptance') or {}).get('countsAsFullyProfiledMeasuredDataset') is True, 'PMC acceptance drifted')
need((pmc.get('acceptance') or {}).get('acceptedInjectionProcessTimeSeriesSamplesAdded') == 0, 'PMC must add zero process waveform values')

# Canonical target ledger: family count increases, waveform count does not.
targets = load('data/content-scale-targets.json')
ft = targets['targets']['fully_profiled_measured_datasets']
mt = targets['targets']['measured_time_series_samples']
need(ft.get('currentAccepted') == 7 and ft.get('currentDiscovered') == 20, 'target baseline is not 7 accepted / 20 discovered')
need(mt.get('currentAccepted') == 66521519, 'waveform baseline drifted')
targets['version'] = '2026.08.30.2'
targets['reviewed'] = '2026-08-30'
ft['currentAccepted'] = 11
ft['currentDiscovered'] = 24
ft['notes'] = ('Eleven exact-source measured dataset families satisfy the profiling definition. The four Wave-2 additions are '
               'a 96-value CC BY-NC outcome workbook, a 28,590-cell polypropylene pvT characterization workbook, a 525-value '
               'HDPE/GNP record-level mechanical dataset, and 142,884 HDPE/cenosphere material-test trace values. These additions '
               'are measured evidence but are not injection-machine/cavity process waveforms, so the accepted process time-series '
               'total remains 66,521,519. Existing cross-process, ImPure, FORinFPRO and external blocker boundaries remain unchanged.')
write('data/content-scale-targets.json', targets)

# Canonical inventory: append four source families with rights/scope kept explicit.
inv = load('data/measured-dataset-inventory-v1.json')
rows = inv.get('datasets') or []
need(len(rows) == 20 and (inv.get('summary') or {}).get('datasets') == 20, 'inventory baseline is not 20 sources')
ids = {x.get('datasetId') for x in rows}
new_rows = [
    {
      'datasetId': 'mendeley-fhj5p7ww9v-v1',
      'title': 'Injection-moulded polypropylene composite/foam measured outcomes',
      'source': 'https://doi.org/10.17632/fhj5p7ww9v.1',
      'accessState': 'public-research-education-release',
      'license': 'CC BY-NC 3.0',
      'automatedIngestionAllowed': False,
      'restrictedAggregateProfilingAllowed': True,
      'rawRedistributionAllowedWithAttribution': False,
      'recordUnit': 'experimental condition/material measured outcome',
      'count': {'recordLevelMeasuredOutcomeValues': 96, 'acceptedMeasuredTimeSeriesSamples': 0},
      'signals': ['injection temperature and speed are process factors, not measured outcomes'],
      'quality': ['weight', 'flexural strength', 'flexural modulus'],
      'sampling': 'record-level source-reported outcomes across four material groups and eight experimental conditions; not raw replicate or waveform data',
      'overlapGroup': 'mendeley-fhj5p7ww9v-v1',
      'peerReviewedCompanion': None,
      'priority': 21,
      'statusNote': 'Exact CC BY-NC 3.0 workbook is fingerprinted and fully profiled. Ninety-six direct source-reported outcome cells are accepted for noncommercial education/research use; process-factor rows, deviation summaries and formulas are excluded, raw redistribution is not assumed, and zero injection-process waveform samples are added.'
    },
    {
      'datasetId': 'mendeley-6k8fpbrd9s-v1',
      'title': 'Polypropylene pressure-specific-volume-temperature material characterization',
      'source': 'https://doi.org/10.17632/6k8fpbrd9s.1',
      'accessState': 'public-open',
      'license': 'CC BY 4.0',
      'automatedIngestionAllowed': True,
      'rawRedistributionAllowedWithAttribution': True,
      'recordUnit': 'material-characterization physical value cell/trace coordinate',
      'count': {'deliveredNumericCells': 31817, 'deliveredDirectPhysicalValueCells': 28590, 'materialCharacterizationTraceMeasurementCells': 6026, 'acceptedMeasuredTimeSeriesSamples': 0},
      'signals': ['temperature', 'pressure', 'specific volume', 'time/piston-speed coordinates'],
      'quality': [],
      'sampling': 'ten figure-data sheets; material characterization rather than injection-cycle acquisition',
      'overlapGroup': 'mendeley-6k8fpbrd9s-v1',
      'peerReviewedCompanion': None,
      'priority': 22,
      'statusNote': 'Exact CC BY 4.0 workbook is SHA-256 matched and every numeric cell is role-classified. 28,590 physical temperature/pressure/specific-volume cells are accepted as polypropylene material-characterization evidence; coordinate cells and possible cross-figure reuse remain explicitly bounded, and zero injection-process waveform samples are added.'
    },
    {
      'datasetId': 'mendeley-4h98rz9f92-v3',
      'title': 'Injection-moulded HDPE/graphite nanoplatelet mechanical-property dataset',
      'source': 'https://doi.org/10.17632/4h98rz9f92.3',
      'accessState': 'public-open',
      'license': 'CC BY 4.0',
      'automatedIngestionAllowed': True,
      'rawRedistributionAllowedWithAttribution': True,
      'recordUnit': 'injection-moulding experiment measured mechanical-property replicate',
      'count': {'experimentalRows': 35, 'directMeasuredPropertyValues': 525, 'derivedAverageValuesExcluded': 105, 'acceptedMeasuredTimeSeriesSamples': 0},
      'signals': ['GNP percentage', 'injection temperature', 'injection pressure'],
      'quality': ['tensile modulus', 'hardness', 'toughness'],
      'sampling': '35 record-level injection-moulding experiments with direct replicate mechanical-property outcomes',
      'overlapGroup': 'mendeley-4h98rz9f92-v3',
      'peerReviewedCompanion': '10.1016/j.dib.2024.110987',
      'priority': 23,
      'statusNote': 'Exact CC BY 4.0 Raw Data.xlsx is SHA-256 matched. Fifteen direct replicate outcome columns provide 525 measured mechanical-property values across 35 injection-moulding experiments; derived averages, process inputs, identifiers and model files are excluded, and zero high-frequency process waveform samples are added.'
    },
    {
      'datasetId': 'pmc4753395-hdpe-cenosphere-v1',
      'title': 'Injection-moulded HDPE/cenosphere tensile-test traces',
      'source': 'https://doi.org/10.1016/j.dib.2016.01.058',
      'accessState': 'public-open',
      'license': 'CC BY 4.0',
      'automatedIngestionAllowed': True,
      'rawRedistributionAllowedWithAttribution': True,
      'recordUnit': 'material-test stress/strain trace value from injection-moulded specimen',
      'count': {'materialTestTraceValues': 142884, 'materialTestTracePointPairs': 71442, 'acceptedMeasuredTimeSeriesSamples': 0},
      'signals': ['tensile-test stress', 'tensile-test strain'],
      'quality': ['mechanical tensile response'],
      'sampling': 'paired stress/strain material-test traces from injection-moulded specimens; not injection-machine/cavity process waveforms',
      'overlapGroup': 'pmc4753395-hdpe-cenosphere-v1',
      'peerReviewedCompanion': '10.1016/j.dib.2016.01.058',
      'priority': 24,
      'statusNote': 'CC BY 4.0 supplementary package and nested measured workbook are fingerprinted. 142,884 physical tensile-test stress/strain values (71,442 point pairs) are accepted as material-test evidence; pre-header, plot and theoretical values are excluded, and zero injection-process waveform samples are added.'
    },
]
for row in new_rows:
    need(row['datasetId'] not in ids, f"inventory already contains {row['datasetId']}")
    rows.append(row)
inv['datasets'] = rows
summary = inv['summary']
summary['datasets'] = 24
summary['automatedIngestionAllowed'] = 13
summary['publicResearchEducationTerms'] = 2
inv['version'] = '2026.08.30.3'
inv['reviewed'] = '2026-08-30'
write('data/measured-dataset-inventory-v1.json', inv)

# Execution ledger: append the same four completed families.
exe = load('data/measured-dataset-execution-ledger-v1.json')
source_rows = exe.get('sources') or []
need(len(source_rows) == 20 and (exe.get('summary') or {}).get('total') == 20, 'execution-ledger baseline is not 20 sources')
source_ids = {x.get('datasetId') for x in source_rows}
exe_add = [
 {'priority':21,'datasetId':'mendeley-fhj5p7ww9v-v1','state':'accepted-profiled-restricted-noncommercial','action':'keep exact workbook fingerprint, 96 direct outcomes and noncommercial scope regression-pinned','reason':'CC BY-NC 3.0 exact workbook fully profiled; zero injection-process waveform samples'},
 {'priority':22,'datasetId':'mendeley-6k8fpbrd9s-v1','state':'accepted-profiled-material-characterization','action':'keep exact workbook fingerprint and full numeric-cell role classification regression-pinned','reason':'CC BY 4.0 polypropylene pvT source fully profiled; 28,590 direct physical cells; zero injection-process waveform samples'},
 {'priority':23,'datasetId':'mendeley-4h98rz9f92-v3','state':'accepted-profiled-record-level-injection-moulding','action':'keep exact Raw Data.xlsx fingerprint and replicate/derived separation regression-pinned','reason':'CC BY 4.0 injection-moulding source fully profiled; 525 direct measured property replicates; zero high-frequency process waveform samples'},
 {'priority':24,'datasetId':'pmc4753395-hdpe-cenosphere-v1','state':'accepted-profiled-material-test-traces','action':'keep measured-workbook fingerprint and stress/strain trace exclusions regression-pinned','reason':'CC BY 4.0 material-test source fully profiled; 142,884 stress/strain values; zero injection-process waveform samples'}
]
for row in exe_add:
    need(row['datasetId'] not in source_ids, f"execution ledger already contains {row['datasetId']}")
    source_rows.append(row)
exe['sources'] = source_rows
exe['version'] = '2026.08.30.1'
exe['reviewed'] = '2026-08-30'
exe['summary']['total'] = 24
exe['summary']['acceptedProfiled'] = 11
exe['summary']['acceptedRestrictedResearchEducation'] = 2
write('data/measured-dataset-execution-ledger-v1.json', exe)

# Fresh Wave-2 ledger: current main baseline, never the obsolete Wave-1 baseline.
wave2 = {
 'schema':1,'version':'2026.08.30.1','reviewed':'2026-08-30',
 'baseWave':{'fullyProfiledMeasuredDatasetFamilies':7,'acceptedMeasuredTimeSeriesSamples':66521519,'source':'data/content-scale-targets.json at post-PR-95 main baseline'},
 'sources':[
  {'priority':1,'datasetId':'ad-stgn-injection-moulding-v1','doi':'10.17632/6f9x8yg8nj.1','license':'CC BY 4.0','state':'publisher-record-no-files-exposed','countsAsFullyProfiledMeasuredDataset':False,'acceptedMeasuredTimeSeriesSamples':0,'resultPath':'data/public-benchmark-results/ad-stgn-injection-moulding-v1-stage1.json','nextAction':'recheck publisher file exposure; do not count reported sensors or samples until delivered files are exposed and profiled'},
  {'priority':2,'datasetId':'mendeley-fhj5p7ww9v-v1','doi':'10.17632/fhj5p7ww9v.1','license':'CC BY-NC 3.0','state':'accepted-profiled-restricted-noncommercial','countsAsFullyProfiledMeasuredDataset':True,'recordLevelMeasuredOutcomeValues':96,'acceptedMeasuredTimeSeriesSamples':0,'resultPath':'data/public-benchmark-results/fhj5p7ww9v-v1.json','useScope':'noncommercial-education-research-only','commercialReuseAllowed':False},
  {'priority':3,'datasetId':'mendeley-6k8fpbrd9s-v1','doi':'10.17632/6k8fpbrd9s.1','license':'CC BY 4.0','state':'accepted-profiled-material-characterization','countsAsFullyProfiledMeasuredDataset':True,'injectionMouldingCycleDataset':False,'deliveredNumericCells':31817,'deliveredDirectPhysicalValueCells':28590,'materialCharacterizationTraceMeasurementCells':6026,'acceptedMeasuredTimeSeriesSamples':0,'resultPath':'data/public-benchmark-results/6k8fpbrd9s-v1.json'},
  {'priority':4,'datasetId':'mendeley-4h98rz9f92-v3','doi':'10.17632/4h98rz9f92.3','license':'CC BY 4.0','state':'accepted-profiled-record-level-injection-moulding','countsAsFullyProfiledMeasuredDataset':True,'experimentalRows':35,'directMeasuredPropertyValues':525,'directMeasuredPropertyBreakdown':{'tensileModulus':175,'hardness':175,'toughness':175},'derivedAverageValuesExcluded':105,'acceptedMeasuredTimeSeriesSamples':0,'resultPath':'data/public-benchmark-results/4h98rz9f92-v3.json'},
  {'priority':5,'datasetId':'pmc4753395-hdpe-cenosphere-v1','doi':'10.1016/j.dib.2016.01.058','license':'CC BY 4.0','state':'accepted-profiled-material-test-traces','countsAsFullyProfiledMeasuredDataset':True,'materialTestStressTraceValues':71442,'materialTestStrainTraceValues':71442,'materialTestTracePointPairs':71442,'materialTestTraceValues':142884,'preHeaderNumericCellsExcluded':20,'plotNumericCellsExcluded':4,'theoreticalWorkbookValuesAccepted':0,'acceptedMeasuredTimeSeriesSamples':0,'resultPath':'data/public-benchmark-results/pmc4753395-hdpe-cenosphere-v1.json'},
  {'priority':6,'datasetId':'mendeley-8c8fjwcw86-v1','doi':'10.17632/8c8fjwcw86.1','license':'CC BY 4.0','state':'completed-no-acceptable-injection-trace','countsAsFullyProfiledMeasuredDataset':False,'slsTensileTracePointPairsExcluded':1359,'derivedBoxPlotPairedPointsExcluded':72,'mixedRouteStructuralPairedPointsExcluded':26424,'candidateInjectionMaterialTracePointPairs':0,'acceptedMeasuredTimeSeriesSamples':0,'resultPath':'data/public-benchmark-results/nylon12-gamma-8c8fjwcw86-v1.json','terminalReviewComplete':True}
 ],
 'summary':{'wave2SourcesReviewed':6,'wave2FullyProfiledAccepted':4,'wave2PublisherPayloadBlocked':1,'wave2TerminalSemanticRejected':1,'effectiveFullyProfiledMeasuredDatasetFamilies':11,'effectiveAcceptedMeasuredTimeSeriesSamples':66521519,'wave2RecordLevelMeasuredOutcomeValues':621,'wave2RecordLevelDerivedSummaryValuesExcluded':105,'wave2MaterialCharacterizationDirectPhysicalValues':28590,'wave2MaterialCharacterizationTraceMeasurementCells':6026,'wave2MaterialTestTraceValues':142884,'wave2MaterialTestTracePointPairs':71442,'wave2MaterialTestPreHeaderNumericCellsExcluded':20},
 'boundaries':{'rawThirdPartyRowsOrFilesCommitted':False,'metadataReportedSamplesDoNotCountWithoutDeliveredFiles':True,'restrictedNoncommercialRightsAreNotWidened':True,'recordLevelOutcomeValuesDoNotCountAsTimeSeriesSamples':True,'derivedRecordLevelSummaryValuesAreExcludedFromDirectMeasuredOutcomeCount':True,'materialCharacterizationCellCountsDoNotInflateInjectionCycleHighFrequencySampleMetric':True,'materialTestTraceValuesDoNotInflateInjectionProcessHighFrequencySampleMetric':True,'crossFigureMaterialCharacterizationReuseIsNotClaimedAsDeduplicatedExperiments':True,'mixedManufacturingRouteEvidenceMustBeUnambiguousBeforeCounting':True}
}
write('data/measured-dataset-wave2-ledger-v1.json', wave2)

# Patch inventory QA to the 24-source baseline and add exact Wave-2 guards.
p = ROOT / 'qa_measured_dataset_inventory.py'
t = p.read_text(encoding='utf-8')
t = replace_once(t, "len(rows) == 20", "len(rows) == 24")
t = replace_once(t, "list(range(1, 21))", "list(range(1, 25))")
t = replace_once(t, "summary.get('datasets') == 20", "summary.get('datasets') == 24")
t = replace_once(t, "summary.get('automatedIngestionAllowed') == automated == 10", "summary.get('automatedIngestionAllowed') == automated == 13")
anchor = "need(by_id['bottle-cap-7162-confidential']['accessState'] == 'confidential', 'bottle-cap confidentiality boundary drifted')\n"
insert = anchor + "\nneed(by_id['mendeley-fhj5p7ww9v-v1']['count'].get('recordLevelMeasuredOutcomeValues') == 96, 'Wave-2 restricted outcome count drifted')\nneed(by_id['mendeley-fhj5p7ww9v-v1'].get('license') == 'CC BY-NC 3.0' and by_id['mendeley-fhj5p7ww9v-v1'].get('automatedIngestionAllowed') is False, 'Wave-2 noncommercial boundary drifted')\nneed(by_id['mendeley-6k8fpbrd9s-v1']['count'].get('deliveredDirectPhysicalValueCells') == 28590, 'Wave-2 pvT physical-cell count drifted')\nneed(by_id['mendeley-4h98rz9f92-v3']['count'].get('directMeasuredPropertyValues') == 525, 'Wave-2 HDPE/GNP measured-property count drifted')\nneed(by_id['pmc4753395-hdpe-cenosphere-v1']['count'].get('materialTestTraceValues') == 142884, 'Wave-2 material-test trace count drifted')\nneed(all((by_id[x]['count'].get('acceptedMeasuredTimeSeriesSamples') or 0) == 0 for x in ['mendeley-fhj5p7ww9v-v1','mendeley-6k8fpbrd9s-v1','mendeley-4h98rz9f92-v3','pmc4753395-hdpe-cenosphere-v1']), 'Wave-2 additions must not inflate injection-process waveform samples')\n"
t = replace_once(t, anchor, insert)
t = t.replace("20 sources; 10 legally executable; 1 restricted educational profile", "24 sources; 13 legally executable; 2 restricted educational/noncommercial profiles")
p.write_text(t, encoding='utf-8')

# Patch content-scale QA counts and add explicit Wave-2 family guards.
p = ROOT / 'qa_content_scale_targets.py'
t = p.read_text(encoding='utf-8')
t = replace_once(t, "len(datasets) == 20", "len(datasets) == 24")
t = replace_once(t, "summary.get(\"automatedIngestionAllowed\") == 10", "summary.get(\"automatedIngestionAllowed\") == 13")
t = replace_once(t, "targets[\"fully_profiled_measured_datasets\"][\"currentAccepted\"] == 7", "targets[\"fully_profiled_measured_datasets\"][\"currentAccepted\"] == 11")
p.write_text(t, encoding='utf-8')

# Extend master compiler with the four non-waveform measured families as distinct classes.
p = ROOT / 'tools/compile_master_data.py'
t = p.read_text(encoding='utf-8')
anchor = '''        restricted_results[benchmark_id] = result\n\n    accepted_profiled = targets["targets"]["fully_profiled_measured_datasets"]["currentAccepted"]\n    need(len(benchmark_results) + len(restricted_results) == accepted_profiled == 7, "completed measured benchmark result count must match accepted profiled dataset count")\n    need(execution.get("summary", {}).get("acceptedProfiled") == accepted_profiled, "execution ledger accepted-profiled count drifted")\n    need(execution.get("summary", {}).get("acceptedRestrictedResearchEducation") == len(restricted_results) == 1, "restricted accepted measured-profile count drifted")\n'''
replacement = '''        restricted_results[benchmark_id] = result\n\n    specialized_specs = [\n        ("mendeley-6k8fpbrd9s-v1", "data/public-benchmark-contracts/6k8fpbrd9s-v1.json", "data/public-benchmark-results/6k8fpbrd9s-v1.json", "completed-public-measured-material-characterization-benchmark"),\n        ("mendeley-4h98rz9f92-v3", "data/public-benchmark-contracts/4h98rz9f92-v3.json", "data/public-benchmark-results/4h98rz9f92-v3.json", "completed-public-measured-record-level-benchmark"),\n        ("pmc4753395-hdpe-cenosphere-v1", "data/public-benchmark-contracts/pmc4753395-hdpe-cenosphere-v1.json", "data/public-benchmark-results/pmc4753395-hdpe-cenosphere-v1.json", "accepted-profiled-material-test-traces"),\n    ]\n    specialized_contracts = {}\n    specialized_results = {}\n    for benchmark_id, contract_path, result_path, expected_status in specialized_specs:\n        contract = load_json(contract_path)\n        result = load_json(result_path)\n        acceptance = result.get("acceptance") or {}\n        need(result.get("status") == expected_status, f"specialized measured benchmark status missing: {benchmark_id}")\n        need(acceptance.get("countsAsFullyProfiledMeasuredDataset") is True, f"specialized measured benchmark acceptance missing: {benchmark_id}")\n        specialized_contracts[benchmark_id] = contract\n        specialized_results[benchmark_id] = result\n\n    restricted_noncommercial_specs = [\n        ("mendeley-fhj5p7ww9v-v1", "data/public-benchmark-contracts/fhj5p7ww9v-v1.json", "data/public-benchmark-results/fhj5p7ww9v-v1.json"),\n    ]\n    restricted_noncommercial_contracts = {}\n    restricted_noncommercial_results = {}\n    for benchmark_id, contract_path, result_path in restricted_noncommercial_specs:\n        contract = load_json(contract_path)\n        result = load_json(result_path)\n        acceptance = result.get("acceptance") or {}\n        need(result.get("status") == "completed-restricted-noncommercial-measured-benchmark", f"restricted noncommercial benchmark status missing: {benchmark_id}")\n        need(acceptance.get("countsAsFullyProfiledMeasuredDataset") is True, f"restricted noncommercial acceptance missing: {benchmark_id}")\n        need(acceptance.get("useScope") == "noncommercial-education-research-only", f"restricted noncommercial scope drifted: {benchmark_id}")\n        need(acceptance.get("commercialReuseAllowed") is False, f"commercial reuse boundary drifted: {benchmark_id}")\n        restricted_noncommercial_contracts[benchmark_id] = contract\n        restricted_noncommercial_results[benchmark_id] = result\n\n    accepted_profiled = targets["targets"]["fully_profiled_measured_datasets"]["currentAccepted"]\n    need(len(benchmark_results) + len(restricted_results) + len(specialized_results) + len(restricted_noncommercial_results) == accepted_profiled == 11, "completed measured benchmark result count must match accepted profiled dataset count")\n    need(execution.get("summary", {}).get("acceptedProfiled") == accepted_profiled, "execution ledger accepted-profiled count drifted")\n    need(execution.get("summary", {}).get("acceptedRestrictedResearchEducation") == len(restricted_results) + len(restricted_noncommercial_results) == 2, "restricted accepted measured-profile count drifted")\n'''
t = replace_once(t, anchor, replacement)
return_anchor = '''        "restrictedBenchmarkContracts": restricted_contracts,\n        "restrictedBenchmarkResults": restricted_results,\n'''
return_repl = return_anchor + '''        "specializedMeasuredBenchmarkContracts": specialized_contracts,\n        "specializedMeasuredBenchmarkResults": specialized_results,\n        "restrictedNoncommercialBenchmarkContracts": restricted_noncommercial_contracts,\n        "restrictedNoncommercialBenchmarkResults": restricted_noncommercial_results,\n'''
t = replace_once(t, return_anchor, return_repl)
p.write_text(t, encoding='utf-8')

# Patch master compilation QA to the current source/family totals and verify new classes.
p = ROOT / 'qa_master_data_compile.py'
t = p.read_text(encoding='utf-8')
t = replace_once(t, "need(expected_profiled == 7, \"audited profiled-dataset baseline drifted\")", "need(expected_profiled == 11, \"audited profiled-dataset baseline drifted\")")
t = replace_once(t, '"measuredDatasetInventory": 20,', '"measuredDatasetInventory": 24,')
t = replace_once(t, '"automatedIngestionAllowedDatasets": 10,', '"automatedIngestionAllowedDatasets": 13,')
t = replace_once(t, 'need(inv["summary"]["datasets"] == 20, "compiled measured dataset inventory drifted")', 'need(inv["summary"]["datasets"] == 24, "compiled measured dataset inventory drifted")')
t = replace_once(t, 'need(inv["summary"]["automatedIngestionAllowed"] == 10, "compiled executable measured-source count drifted")', 'need(inv["summary"]["automatedIngestionAllowed"] == 13, "compiled executable measured-source count drifted")')
t = replace_once(t, 'need(ledger["summary"]["acceptedRestrictedResearchEducation"] == 1, "compiled restricted accepted profile count drifted")', 'need(ledger["summary"]["acceptedRestrictedResearchEducation"] == 2, "compiled restricted accepted profile count drifted")')
anchor = '''    restricted = measured.get("restrictedBenchmarkResults") or {}\n    need(set(restricted) == {"iguzzini-road-lenses"}, f"restricted accepted benchmark set drifted: {set(restricted)}")\n'''
insert = '''    specialized = measured.get("specializedMeasuredBenchmarkResults") or {}\n    need(set(specialized) == {"mendeley-6k8fpbrd9s-v1", "mendeley-4h98rz9f92-v3", "pmc4753395-hdpe-cenosphere-v1"}, f"specialized measured benchmark set drifted: {set(specialized)}")\n    need((specialized["mendeley-6k8fpbrd9s-v1"].get("profile") or {}).get("deliveredDirectPhysicalValueCells") == 28590, "compiled Wave-2 pvT count drifted")\n    need((specialized["mendeley-4h98rz9f92-v3"].get("profile") or {}).get("directMeasuredPropertyValues") == 525, "compiled Wave-2 HDPE/GNP count drifted")\n    need((specialized["pmc4753395-hdpe-cenosphere-v1"].get("profile") or {}).get("materialTestTraceValues") == 142884, "compiled Wave-2 material-test count drifted")\n\n    restricted_nc = measured.get("restrictedNoncommercialBenchmarkResults") or {}\n    need(set(restricted_nc) == {"mendeley-fhj5p7ww9v-v1"}, f"restricted noncommercial benchmark set drifted: {set(restricted_nc)}")\n    need((restricted_nc["mendeley-fhj5p7ww9v-v1"].get("profile") or {}).get("recordLevelMeasuredOutcomeValues") == 96, "compiled Wave-2 restricted outcome count drifted")\n    need((restricted_nc["mendeley-fhj5p7ww9v-v1"].get("acceptance") or {}).get("commercialReuseAllowed") is False, "compiled Wave-2 noncommercial boundary drifted")\n\n''' + anchor
t = replace_once(t, anchor, insert)
t = t.replace('20 measured datasets; 10 legally executable sources;', '24 measured datasets; 13 legally executable sources;')
p.write_text(t, encoding='utf-8')

# Dedicated current-baseline Wave-2 QA.
wave2_qa = '''from pathlib import Path\nimport json\n\nROOT = Path(__file__).resolve().parent\nWAVE = json.loads((ROOT / "data/measured-dataset-wave2-ledger-v1.json").read_text(encoding="utf-8"))\nTARGETS = json.loads((ROOT / "data/content-scale-targets.json").read_text(encoding="utf-8"))["targets"]\nINV = json.loads((ROOT / "data/measured-dataset-inventory-v1.json").read_text(encoding="utf-8"))\n\ndef need(ok, msg):\n    if not ok:\n        raise AssertionError(msg)\n\nneed(WAVE.get("schema") == 1, "Wave-2 ledger schema drifted")\nbase = WAVE.get("baseWave") or {}\nsummary = WAVE.get("summary") or {}\nneed(base.get("fullyProfiledMeasuredDatasetFamilies") == 7, "Wave-2 base family count drifted")\nneed(base.get("acceptedMeasuredTimeSeriesSamples") == 66521519, "Wave-2 base waveform count drifted")\nneed(summary.get("wave2FullyProfiledAccepted") == 4, "Wave-2 accepted family delta drifted")\nneed(summary.get("effectiveFullyProfiledMeasuredDatasetFamilies") == 11, "Wave-2 effective family count drifted")\nneed(summary.get("effectiveAcceptedMeasuredTimeSeriesSamples") == 66521519, "Wave-2 must not inflate process waveform count")\nneed(summary.get("wave2RecordLevelMeasuredOutcomeValues") == 621, "Wave-2 direct record-level outcome count drifted")\nneed(summary.get("wave2MaterialCharacterizationDirectPhysicalValues") == 28590, "Wave-2 material characterization count drifted")\nneed(summary.get("wave2MaterialTestTraceValues") == 142884, "Wave-2 material-test trace count drifted")\nneed(TARGETS["fully_profiled_measured_datasets"]["currentAccepted"] == 11, "target family count is not reconciled")\nneed(TARGETS["fully_profiled_measured_datasets"]["currentDiscovered"] == 24, "target discovered count is not reconciled")\nneed(TARGETS["measured_time_series_samples"]["currentAccepted"] == 66521519, "target process waveform count drifted")\nneed(INV["summary"]["datasets"] == 24 and INV["summary"]["automatedIngestionAllowed"] == 13, "Wave-2 inventory reconciliation drifted")\nby_id = {x["datasetId"]: x for x in INV["datasets"]}\nfor did in ["mendeley-fhj5p7ww9v-v1","mendeley-6k8fpbrd9s-v1","mendeley-4h98rz9f92-v3","pmc4753395-hdpe-cenosphere-v1"]:\n    need(did in by_id, f"missing Wave-2 inventory source: {did}")\n    need((by_id[did]["count"].get("acceptedMeasuredTimeSeriesSamples") or 0) == 0, f"{did} must add zero process waveform samples")\nneed(by_id["mendeley-fhj5p7ww9v-v1"]["automatedIngestionAllowed"] is False, "CC BY-NC source must remain non-automated under project policy")\nneed(by_id["mendeley-6k8fpbrd9s-v1"]["automatedIngestionAllowed"] is True, "pvT CC BY source should be executable")\nneed(by_id["mendeley-4h98rz9f92-v3"]["automatedIngestionAllowed"] is True, "HDPE/GNP CC BY source should be executable")\nneed(by_id["pmc4753395-hdpe-cenosphere-v1"]["automatedIngestionAllowed"] is True, "PMC CC BY source should be executable")\nprint("Wave-2 family ledger QA passed (7 -> 11 families; 24 inventoried sources; 13 executable; process waveform total unchanged at 66,521,519)")\n'''
(ROOT / 'qa_measured_dataset_wave2_ledger.py').write_text(wave2_qa, encoding='utf-8')

print('Wave-2 four-family canonical reconciliation prepared successfully')
