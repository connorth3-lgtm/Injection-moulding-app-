from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
INVENTORY = ROOT / 'data' / 'measured-dataset-inventory-v1.json'
RIGHTS_REVIEW = ROOT / 'data' / 'measured-dataset-rights-review-2026-08-29.json'
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
rights = load(RIGHTS_REVIEW)
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

need(by_id['su13148102-supplement']['count'].get('columns') == 45, 'Sustainability delivered 45-column schema correction drifted')
need(by_id['openmms-t4g']['count'].get('rows') == 29808 and by_id['openmms-t4g']['count'].get('measuredSignalColumns') == 10, 'OpenMMS completed source dimensions drifted')
ig = by_id['iguzzini-road-lenses']
need(ig.get('accessState') == 'public-research-education-release', 'iGuzzini restricted access state drifted')
need(ig.get('restrictedAggregateProfilingAllowed') is True, 'iGuzzini educational aggregate profiling gate missing')
need(ig.get('automatedIngestionAllowed') is False, 'iGuzzini restricted release must not become unrestricted automated ingestion')
need(ig.get('rawRedistributionAllowedWithAttribution') is False, 'iGuzzini raw redistribution must remain disabled')
need(ig['count'].get('recordLevelMeasuredProcessValues') == 18863, 'iGuzzini delivered record-level measured value count drifted')

impure_count = by_id['impure-pascoe-2022']['count']
need(impure_count.get('publisherFilesTotalMB') == 18.7, 'ImPure current publisher file-set size drifted')
need(impure_count.get('zenodoCumulativeDownloadTrafficMB') == 605.2, 'ImPure cumulative Zenodo traffic metric drifted')
need('dataVolumeMB' not in impure_count, 'do not conflate ImPure download traffic with dataset size')

inq = by_id['inqcim-2500-request']
need(inq.get('source') == 'https://doi.org/10.3390/polym14173551', 'INQCIM corrected article DOI drifted')
need(inq.get('peerReviewedCompanion') == '10.3390/polym14173551', 'INQCIM corrected companion DOI drifted')
need('upon request' in inq.get('statusNote', '').lower(), 'INQCIM request-only evidence boundary missing')

need(by_id['leon-process-20309380']['overlapGroup'] == by_id['leon-defects-20322729']['overlapGroup'], 'León process and defects records must share one manufacturing-campaign overlap group')

# Rights promotion is explicit and narrow: only RWTH moved from review to executable.
rights_rows = rights.get('sources') or []
need((rights.get('summary') or {}).get('sourcesReviewed') == len(rights_rows) == 5, 'waveform rights-review source count drifted')
need((rights.get('summary') or {}).get('unblockedForAutomatedIngestion') == 1, 'waveform rights-review promotion count drifted')
need((rights.get('summary') or {}).get('remainBlockedForRights') == 4, 'waveform rights-review blocked count drifted')
rights_by_id = {x.get('datasetId'): x for x in rights_rows}
need(set(rights_by_id) == {'rwth-pcr-2025', 'skz-loki-v1', 'impure-pascoe-2022', 'forinfpro-himd-v1', 'cross-process-chain-17240390'}, 'waveform rights-review source set drifted')
need(rights_by_id['rwth-pcr-2025'].get('decision') == 'executable-license-confirmed', 'RWTH rights decision drifted')
need(rights_by_id['rwth-pcr-2025'].get('license') == 'CC BY 4.0', 'RWTH rights licence drifted')
need(by_id['rwth-pcr-2025'].get('accessState') == 'public-open', 'RWTH access state must reflect confirmed open licence')
need(by_id['rwth-pcr-2025'].get('license') == 'CC BY 4.0', 'RWTH inventory licence drifted')
need(by_id['rwth-pcr-2025'].get('automatedIngestionAllowed') is True, 'RWTH must be legally executable after CC BY 4.0 confirmation')
need(by_id['rwth-pcr-2025'].get('rawRedistributionAllowedWithAttribution') is True, 'RWTH attribution reuse boundary drifted')
need('publications.rwth-aachen.de' in str(by_id['rwth-pcr-2025'].get('licenseEvidence', '')), 'RWTH authoritative licence evidence missing')
need('248-byte HTML' in by_id['rwth-pcr-2025'].get('statusNote', ''), 'RWTH actual source-retrieval blocker missing from inventory')
for blocked_id in ['skz-loki-v1', 'impure-pascoe-2022', 'forinfpro-himd-v1', 'cross-process-chain-17240390']:
    need(rights_by_id[blocked_id].get('decision') == 'blocked-no-explicit-license', f'{blocked_id}: rights decision drifted')
    need(rights_by_id[blocked_id].get('automatedIngestionAllowed') is False, f'{blocked_id}: rights review must remain fail-closed')
    need(by_id[blocked_id].get('accessState') == 'public-download-license-review', f'{blocked_id}: inventory must remain in licence review')
    need(by_id[blocked_id].get('license') is None, f'{blocked_id}: do not invent a dataset licence')
    need(by_id[blocked_id].get('automatedIngestionAllowed') is False, f'{blocked_id}: must remain non-executable without explicit data licence')

need(by_id['leon-process-20309380']['accessState'] == 'embargoed', 'León process dataset must remain embargoed')
need(by_id['leon-defects-20322729']['accessState'] == 'embargoed', 'León defect dataset must remain embargoed')
need('2027-12-31' in by_id['leon-process-20309380']['statusNote'], 'León process embargo end date missing')
need('2027-12-31' in by_id['leon-defects-20322729']['statusNote'], 'León defect embargo end date missing')
need(by_id['cross-process-chain-17240390']['count'].get('injectionCycles') is None,
     'cross-process injection cycle count must remain unknown until archive enumeration')
need('screw-driving' in by_id['cross-process-chain-17240390']['statusNote'],
     'cross-process source must explicitly prevent downstream operations being counted as moulding cycles')
need(by_id['foxconn-competition-16600']['accessState'] == 'public-mirror-rights-unresolved', 'Foxconn mirror rights boundary drifted')
need(by_id['kamp-injection-7996']['accessState'] == 'public-mirror-rights-unresolved', 'KAMP mirror rights boundary drifted')
need(by_id['inqcim-2500-request']['accessState'] == 'request-only', 'INQCIM access boundary drifted')
need(by_id['bottle-cap-7162-confidential']['accessState'] == 'confidential', 'bottle-cap confidentiality boundary drifted')

summary = inv.get('summary', {})
need(summary.get('datasets') == 20, 'inventory summary dataset count drifted')
need(summary.get('automatedIngestionAllowed') == automated == 7, f'automated-ingestion count drifted: {automated}')
need(summary.get('rightsOrAccessReviewRequired') == state_counts['public-download-license-review'] == 6, 'licence-review count drifted')
need(state_counts['embargoed'] == summary.get('embargoed') == 2, 'embargoed count drifted')
need(state_counts['request-only'] == summary.get('requestOnly') == 1, 'request-only count drifted')
need(state_counts['confidential'] == summary.get('confidential') == 1, 'confidential count drifted')
need(state_counts['public-mirror-rights-unresolved'] == summary.get('publicMirrorRightsUnresolved') == 2, 'public mirror count drifted')
need(state_counts['public-research-education-release'] == summary.get('publicResearchEducationTerms') == 1, 'research/education terms count drifted')

report = {
    'schema': 3,
    'source': str(INVENTORY.relative_to(ROOT)),
    'rightsReviewSource': str(RIGHTS_REVIEW.relative_to(ROOT)),
    'datasetCount': len(rows),
    'accessStateCounts': state_counts,
    'automatedIngestionAllowed': automated,
    'restrictedAggregateProfiled': 1,
    'knownCountsChecked': len(EXPECTED_KNOWN_COUNTS),
    'rightsReviewSources': rights_review,
    'waveformRightsSourcesReviewed': len(rights_rows),
    'waveformRightsSourcesUnblocked': 1,
    'metadataCorrections': ['impure-file-size-vs-download-traffic', 'inqcim-doi', 'sustainability-delivered-columns', 'leon-overlap-group'],
    'rawRowsCommittedToRepository': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured dataset inventory QA passed (20 sources; 7 legally executable; 1 restricted educational profile; 6 direct licence-review sources; corrected ImPure/INQCIM metadata; remaining rights/access/embargo/mirror boundaries enforced)')
