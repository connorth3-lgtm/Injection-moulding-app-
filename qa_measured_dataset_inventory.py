from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
INVENTORY = ROOT / 'data' / 'measured-dataset-inventory-v1.json'
REPORT = ROOT / 'measured-dataset-inventory-report.json'

ALLOWED_STATES = {
    'executed-open',
    'public-open',
    'public-download-license-review',
    'public-research-education-release',
    'public-repo-license',
    'public-mirror-rights-unresolved',
    'embargoed',
    'request-only',
    'confidential',
}
EXECUTABLE_STATES = {'executed-open', 'public-open', 'public-repo-license'}
NONEXECUTABLE_STATES = ALLOWED_STATES - EXECUTABLE_STATES
EXPECTED_KNOWN_COUNTS = {
    'mendeley-gtnb4j7bfx-v1': ('injectionRecords', 4502),
    'scatimdata-avaps': ('cycles', 3328),
    'su13148102-supplement': ('rows', 955),
    'probayes-main-v2': ('cycles', 564),
    'probayes-doptimal-v1': ('cycles', 303),
    'skz-loki-v1': ('cycles', 68),
    'iguzzini-road-lenses': ('samples', 1451),
    'kamp-injection-7996': ('rows', 7996),
    'foxconn-competition-16600': ('cycles', 16600),
    'bottle-cap-7162-confidential': ('cycles', 7162),
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing measured dataset inventory dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


inv = load(INVENTORY)
need(inv.get('schema') == 1, 'unsupported measured dataset inventory schema')
rules = inv.get('rules', {})
for key in [
    'publicMetadataDoesNotEqualReusableRawData',
    'paperAndCompanionDatasetShareOverlapGroup',
    'downstreamOperationsDoNotCountAsInjectionCycles',
    'partBatchCycleAndTimeSampleMustRemainDistinct',
    'embargoedRequestOnlyConfidentialAndRightsUnresolvedAreNotExecutable',
]:
    need(rules.get(key) is True, f'measured dataset boundary missing: {key}')
need(rules.get('rawRowsCommittedToRepository') is False, 'third-party measured raw rows must not be claimed committed')

rows = inv.get('datasets')
need(isinstance(rows, list) and len(rows) == 20, f'expected 20 measured dataset records, found {len(rows) if isinstance(rows, list) else "non-list"}')
ids = [str(x.get('datasetId', '')).strip() for x in rows]
need(all(ids), 'dataset ID missing')
need(len(ids) == len(set(ids)), 'duplicate dataset ID in measured inventory')
priorities = [x.get('priority') for x in rows]
need(sorted(priorities) == list(range(1, 21)), f'priorities must be unique 1..20: {priorities}')

state_counts = {s: 0 for s in ALLOWED_STATES}
automated = 0
rights_review = 0
for i, d in enumerate(rows, 1):
    prefix = f'dataset {i} ({d.get("datasetId", "missing")})'
    state = d.get('accessState')
    need(state in ALLOWED_STATES, f'{prefix}: invalid access state {state}')
    state_counts[state] += 1
    source = str(d.get('source', '')).strip()
    need(source.startswith('https://'), f'{prefix}: source must use HTTPS')
    need(bool(str(d.get('title', '')).strip()), f'{prefix}: title missing')
    need(bool(str(d.get('recordUnit', '')).strip()), f'{prefix}: record unit missing')
    need(bool(str(d.get('sampling', '')).strip()), f'{prefix}: sampling description missing')
    need(bool(str(d.get('overlapGroup', '')).strip()), f'{prefix}: overlap group missing')
    need(isinstance(d.get('signals'), list), f'{prefix}: signals must be a list')
    need(isinstance(d.get('quality'), list), f'{prefix}: quality must be a list')
    need(isinstance(d.get('count'), dict), f'{prefix}: count must be an object preserving record-unit semantics')
    need(len(str(d.get('statusNote', '')).strip()) >= 50, f'{prefix}: status note too weak')

    can_ingest = d.get('automatedIngestionAllowed') is True
    if can_ingest:
        automated += 1
        need(state in EXECUTABLE_STATES, f'{prefix}: automated ingestion enabled for non-executable access state')
        need(bool(str(d.get('license', '')).strip()), f'{prefix}: automated ingestion requires explicit licence/terms')
    else:
        need(state in NONEXECUTABLE_STATES or state in EXECUTABLE_STATES,
             f'{prefix}: unexpected access state for non-automated source')

    if state in {'public-download-license-review', 'public-mirror-rights-unresolved'}:
        rights_review += 1
        need(not can_ingest, f'{prefix}: rights-unresolved source cannot be automatically ingested')
    if state in {'embargoed', 'request-only', 'confidential'}:
        need(not can_ingest, f'{prefix}: inaccessible source cannot be automatically ingested')
    if state == 'public-research-education-release':
        need(not d.get('rawRedistributionAllowedWithAttribution'), f'{prefix}: research/education terms must not be widened into redistribution rights')

by_id = {d['datasetId']: d for d in rows}
for did, (field, value) in EXPECTED_KNOWN_COUNTS.items():
    need(by_id[did]['count'].get(field) == value, f'{did}: verified count drifted for {field}')

need(by_id['leon-process-20309380']['accessState'] == 'embargoed', 'León process dataset must remain embargoed')
need(by_id['leon-defects-20322729']['accessState'] == 'embargoed', 'León defect dataset must remain embargoed')
need('2027-12-31' in by_id['leon-process-20309380']['statusNote'], 'León process embargo end date missing')
need('2027-12-31' in by_id['leon-defects-20322729']['statusNote'], 'León defect embargo end date missing')
need(by_id['cross-process-chain-17240390']['count'].get('injectionCycles') is None,
     'cross-process injection cycle count must remain unknown until archive enumeration')
need('downstream screw-driving' in by_id['cross-process-chain-17240390']['statusNote'],
     'cross-process source must explicitly prevent downstream operations being counted as moulding cycles')
need(by_id['foxconn-competition-16600']['accessState'] == 'public-mirror-rights-unresolved', 'Foxconn mirror rights boundary drifted')
need(by_id['kamp-injection-7996']['accessState'] == 'public-mirror-rights-unresolved', 'KAMP mirror rights boundary drifted')
need(by_id['inqcim-2500-request']['accessState'] == 'request-only', 'INQCIM access boundary drifted')
need(by_id['bottle-cap-7162-confidential']['accessState'] == 'confidential', 'bottle-cap confidentiality boundary drifted')

summary = inv.get('summary', {})
need(summary.get('datasets') == 20, 'inventory summary dataset count drifted')
need(summary.get('automatedIngestionAllowed') == automated == 6, f'automated-ingestion count drifted: {automated}')
need(summary.get('rightsOrAccessReviewRequired') == 7, 'licence-review count drifted')
need(state_counts['embargoed'] == summary.get('embargoed') == 2, 'embargoed count drifted')
need(state_counts['request-only'] == summary.get('requestOnly') == 1, 'request-only count drifted')
need(state_counts['confidential'] == summary.get('confidential') == 1, 'confidential count drifted')
need(state_counts['public-mirror-rights-unresolved'] == summary.get('publicMirrorRightsUnresolved') == 2, 'public mirror count drifted')
need(state_counts['public-research-education-release'] == summary.get('publicResearchEducationTerms') == 1, 'research/education terms count drifted')

report = {
    'schema': 1,
    'source': str(INVENTORY.relative_to(ROOT)),
    'datasetCount': len(rows),
    'accessStateCounts': state_counts,
    'automatedIngestionAllowed': automated,
    'knownCountsChecked': len(EXPECTED_KNOWN_COUNTS),
    'rightsReviewSources': rights_review,
    'rawRowsCommittedToRepository': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured dataset inventory QA passed (20 sources; 6 executable; rights/access/embargo/mirror boundaries enforced)')
