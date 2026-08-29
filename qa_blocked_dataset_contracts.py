from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
INVENTORY = ROOT / 'data' / 'measured-dataset-inventory-v1.json'
CONTRACT_DIR = ROOT / 'data' / 'public-benchmark-contracts'
REPORT = ROOT / 'blocked-dataset-contracts-report.json'

BLOCKED = {
    'probayes-main-v2': 'probayes-main-v2.json',
    'probayes-doptimal-v1': 'probayes-doptimal-v1.json',
    'skz-loki-v1': 'skz-loki-v1.json',
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing blocked dataset dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


inventory = load(INVENTORY)
by_id = {x['datasetId']: x for x in inventory['datasets']}
need(set(BLOCKED).issubset(by_id), 'blocked contract source missing from measured dataset inventory')

contract_summary = {}
for dataset_id, filename in BLOCKED.items():
    contract = load(CONTRACT_DIR / filename)
    need(contract.get('schema') == 1, f'{dataset_id}: unsupported contract schema')
    need(contract.get('datasetId') == dataset_id, f'{dataset_id}: contract ID drifted')
    need(contract.get('status') == 'blocked-rights-review', f'{dataset_id}: blocked contract status drifted')

    source = contract.get('source') or {}
    need(source.get('access') == 'open', f'{dataset_id}: contract must preserve public/open-access fact')
    need(source.get('license') is None, f'{dataset_id}: do not invent a dataset licence')
    need(source.get('automatedRetrievalAllowed') is False, f'{dataset_id}: automated retrieval must remain fail-closed')
    need(source.get('rawRedistributionAllowed') is False, f'{dataset_id}: raw redistribution must remain fail-closed')
    need('licen' in str(source.get('licenseEvidenceStatus', '')).lower(), f'{dataset_id}: licence evidence status missing')

    gate = contract.get('rightsGate') or {}
    need(gate.get('publicDownloadDoesNotEqualReusePermission') is True, f'{dataset_id}: public-download boundary missing')
    need(gate.get('rawFilesMustNotBeDownloadedByAutomationUntilLicenceIsExplicit') is True, f'{dataset_id}: raw retrieval gate missing')
    need(len(gate.get('requiredEvidence') or []) >= 2, f'{dataset_id}: rights-clearance requirements too weak')

    plan = contract.get('profilingPlanAfterRightsClearance') or []
    need(len(plan) >= 5, f'{dataset_id}: profiling plan too weak')
    need(len(str(contract.get('evidenceBoundary', ''))) >= 200, f'{dataset_id}: evidence boundary too weak')

    inv = by_id[dataset_id]
    need(inv.get('accessState') == 'public-download-license-review', f'{dataset_id}: inventory must remain licence-review')
    need(inv.get('license') is None, f'{dataset_id}: inventory licence must remain null')
    need(inv.get('automatedIngestionAllowed') is False, f'{dataset_id}: inventory automated ingestion must remain false')
    need(inv.get('rawRedistributionAllowedWithAttribution') is False, f'{dataset_id}: inventory raw redistribution must remain false')

    contract_summary[dataset_id] = {
        'status': contract['status'],
        'manifestFiles': len(contract.get('publisherFileManifest') or []),
        'automatedRetrievalAllowed': False,
    }

# Dataset-specific non-inflation rules.
skz = load(CONTRACT_DIR / BLOCKED['skz-loki-v1'])
need((skz.get('experimentContext') or {}).get('experiments') == 68, 'SKZ experiment count drifted')
need((skz.get('experimentContext') or {}).get('uniqueMachineSettings') == 17, 'SKZ setting count drifted')
need((skz.get('experimentContext') or {}).get('repeatsPerSetting') == 4, 'SKZ repeat count drifted')
need(len(skz.get('publisherFileManifest') or []) == 7, 'SKZ publisher manifest must contain seven files')
need(any('double-count' in x.lower() for x in skz.get('profilingPlanAfterRightsClearance') or []), 'SKZ CSV/Parquet duplicate-count guard missing')

pro_main = load(CONTRACT_DIR / BLOCKED['probayes-main-v2'])
ctx = pro_main.get('experimentContext') or {}
need(ctx.get('injectionMouldedParts') == 564 and ctx.get('experimentalPoints') == 47, 'ProBayes main counts drifted')
need(ctx.get('featuresPerPart') == 334 and ctx.get('dataSources') == 9, 'ProBayes main feature/source counts drifted')

pro_d = load(CONTRACT_DIR / BLOCKED['probayes-doptimal-v1'])
ctx = pro_d.get('experimentContext') or {}
need(ctx.get('injectionMouldedParts') == 303 and ctx.get('experimentalPoints') == 28, 'ProBayes d-optimal counts drifted')
need(ctx.get('featuresPerPart') == 396 and ctx.get('dataSources') == 9, 'ProBayes d-optimal feature/source counts drifted')

report = {
    'schema': 1,
    'blockedContractCount': len(BLOCKED),
    'datasetIds': sorted(BLOCKED),
    'contracts': contract_summary,
    'acceptedDatasetCountChanged': False,
    'acceptedMeasuredSampleCountChanged': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster blocked dataset contract QA passed (3 open-download sources remain fail-closed until explicit reuse rights are captured)')

