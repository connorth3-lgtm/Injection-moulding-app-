from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
INVENTORY = ROOT / 'data' / 'measured-dataset-inventory-v1.json'
REPORT = ROOT / 'measured-dataset-inventory-report.json'

ALLOWED_STATES = {
    'executed-open', 'executed-open-profiled', 'executed-open-ccby',
    'profiled-rejected-measured', 'public-open', 'public-download-license-review',
    'public-research-education-release', 'public-repo-license',
    'public-mirror-rights-unresolved', 'embargoed', 'request-only', 'confidential',
}
EXECUTABLE_STATES = {
    'executed-open', 'executed-open-profiled', 'executed-open-ccby',
    'profiled-rejected-measured', 'public-open', 'public-repo-license',
}
BLANK_LICENCE_PROFILE_STATES = {'executed-open-profiled'}
EXPECTED_KNOWN_COUNTS = {
    'mendeley-gtnb4j7bfx-v1': ('injectionRecords', 4502),
    'scatimdata-avaps': ('cycles', 3328),
    'su13148102-supplement': ('rows', 955),
    'probayes-main-v2': ('cycles', 564),
    'probayes-doptimal-v1': ('cycles', 303),
    'skz-loki-v1': ('cycles', 68),
    'iguzzini-road-lenses': ('samples', 1451),
    'impure-pascoe-2022': ('cycles', 307),
    'forinfpro-himd-v1': ('cycles', 1),
    'cross-process-chain-17240390': ('injectionCycles', 15686),
    'hdpe-gnp-v3': ('experiments', 35),
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
need(isinstance(rows, list) and len(rows) >= 20, 'measured dataset inventory unexpectedly small')
ids = [str(x.get('datasetId', '')).strip() for x in rows]
need(all(ids), 'dataset ID missing')
need(len(ids) == len(set(ids)), 'duplicate dataset ID in measured inventory')
priorities = [x.get('priority') for x in rows]
need(sorted(priorities) == list(range(1, len(rows) + 1)), f'priorities must be unique 1..{len(rows)}')

state_counts = {s: 0 for s in ALLOWED_STATES}
automated = 0
rights_review = 0
for i, d in enumerate(rows, 1):
    prefix = f'dataset {i} ({d.get("datasetId", "missing")})'
    state = d.get('accessState')
    need(state in ALLOWED_STATES, f'{prefix}: invalid access state {state}')
    state_counts[state] += 1
    need(str(d.get('source', '')).startswith('https://'), f'{prefix}: source must use HTTPS')
    for field in ['title', 'recordUnit', 'sampling', 'overlapGroup']:
        need(bool(str(d.get(field, '')).strip()), f'{prefix}: {field} missing')
    need(isinstance(d.get('signals'), list), f'{prefix}: signals must be a list')
    need(isinstance(d.get('quality'), list), f'{prefix}: quality must be a list')
    need(isinstance(d.get('count'), dict), f'{prefix}: count must preserve record-unit semantics')
    note = str(d.get('statusNote', '')).strip()
    need(len(note) >= 50, f'{prefix}: status note too weak')

    can_ingest = d.get('automatedIngestionAllowed') is True
    if can_ingest:
        automated += 1
        need(state in EXECUTABLE_STATES, f'{prefix}: automated profiling enabled for non-executable access state')
        licence = str(d.get('license') or '').strip()
        if not licence:
            need(state in BLANK_LICENCE_PROFILE_STATES, f'{prefix}: blank licence only allowed for explicitly profiled open records')
            need(d.get('rawRedistributionAllowedWithAttribution') is False, f'{prefix}: blank-licence source cannot claim raw redistribution rights')
            lower = note.lower()
            need(('blank' in lower or 'displays no licence' in lower or 'no licence' in lower) and 'redistribution' in lower,
                 f'{prefix}: blank-licence profiling/redistribution boundary not documented')
    if state in {'public-download-license-review', 'public-mirror-rights-unresolved'}:
        rights_review += 1
        need(not can_ingest, f'{prefix}: rights-unresolved source cannot be automatically ingested')
    if state in {'embargoed', 'request-only', 'confidential'}:
        need(not can_ingest, f'{prefix}: inaccessible source cannot be automatically ingested')
    if state == 'public-research-education-release':
        need(d.get('rawRedistributionAllowedWithAttribution') is False, f'{prefix}: research/education terms must not be widened')
    if state == 'profiled-rejected-measured':
        need(can_ingest and 'reject' in note.lower(), f'{prefix}: measured rejection must remain explicit/reproducible')

by_id = {d['datasetId']: d for d in rows}
for did, (field, value) in EXPECTED_KNOWN_COUNTS.items():
    need(did in by_id, f'missing known measured source: {did}')
    need(by_id[did]['count'].get(field) == value, f'{did}: verified count drifted for {field}')

need(by_id['probayes-main-v2']['accessState'] == 'executed-open-profiled' and by_id['probayes-main-v2']['license'] is None,
     'ProBayes main blank-licence profiled boundary drifted')
need(by_id['probayes-main-v2']['rawRedistributionAllowedWithAttribution'] is False, 'ProBayes main raw redistribution boundary drifted')
need(by_id['skz-loki-v1']['accessState'] == 'executed-open-profiled' and by_id['skz-loki-v1']['license'] is None,
     'SKZ blank-licence profiled boundary drifted')
need((by_id['skz-loki-v1']['count'] or {}).get('acceptedPhysicalScalarSamples') == 36_000_000, 'SKZ direct pressure count drifted')
for did in ['probayes-doptimal-v1', 'impure-pascoe-2022', 'forinfpro-himd-v1', 'cross-process-chain-17240390', 'hdpe-gnp-v3']:
    need(by_id[did]['accessState'] == 'executed-open-ccby', f'{did}: CC BY execution state drifted')
    need('CC' in str(by_id[did].get('license') or '').upper(), f'{did}: CC licence metadata missing')
need((by_id['cross-process-chain-17240390']['count'] or {}).get('screwDrivingFilesExcluded') == 14882,
     'cross-process downstream screw-driving exclusion drifted')
need((by_id['cross-process-chain-17240390']['count'] or {}).get('lowerStaticMissingTraceReferences') == 7,
     'cross-process lower static/archive discrepancy drifted')
need('downstream screw-driving' in by_id['cross-process-chain-17240390']['statusNote'],
     'cross-process source must explicitly exclude downstream screw-driving evidence')
need(by_id['warwick-demoulding']['count'].get('acceptedTrials') == 0 and by_id['warwick-demoulding']['count'].get('originProjectFiles') == 5,
     'Warwick OPJU adapter-required boundary drifted')
need(by_id['pet-preform-v2']['accessState'] == 'profiled-rejected-measured', 'PET preform rejection drifted')
need(by_id['leon-process-20309380']['accessState'] == by_id['leon-defects-20322729']['accessState'] == 'embargoed', 'León embargo drifted')
need('2027-12-31' in by_id['leon-process-20309380']['statusNote'] and '2027-12-31' in by_id['leon-defects-20322729']['statusNote'], 'León embargo date missing')
need(by_id['foxconn-competition-16600']['accessState'] == by_id['kamp-injection-7996']['accessState'] == 'public-mirror-rights-unresolved', 'public mirror rights boundary drifted')
need(by_id['inqcim-2500-request']['accessState'] == 'request-only', 'INQCIM request-only boundary drifted')
need(by_id['bottle-cap-7162-confidential']['accessState'] == 'confidential', 'bottle-cap confidentiality boundary drifted')

summary = inv.get('summary', {})
need(summary.get('datasets') == len(rows), 'inventory summary dataset count drifted')
need(summary.get('automatedIngestionAllowed') == automated, f'automated-ingestion summary drifted: {automated}')
need(summary.get('rightsOrAccessReviewRequired') == rights_review, f'rights-review summary drifted: {rights_review}')
need(state_counts['embargoed'] == summary.get('embargoed'), 'embargoed summary drifted')
need(state_counts['request-only'] == summary.get('requestOnly'), 'request-only summary drifted')
need(state_counts['confidential'] == summary.get('confidential'), 'confidential summary drifted')
need(state_counts['public-mirror-rights-unresolved'] == summary.get('publicMirrorRightsUnresolved'), 'public mirror summary drifted')
need(state_counts['public-research-education-release'] == summary.get('publicResearchEducationTerms'), 'research/education summary drifted')

report = {
    'schema': 4,
    'source': str(INVENTORY.relative_to(ROOT)),
    'datasetCount': len(rows),
    'accessStateCounts': state_counts,
    'automatedIngestionAllowed': automated,
    'knownCountsChecked': len(EXPECTED_KNOWN_COUNTS),
    'rightsReviewSources': rights_review,
    'blankLicenceProfiledOpenSources': sum(1 for d in rows if d.get('automatedIngestionAllowed') is True and not d.get('license')),
    'rawRowsCommittedToRepository': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f'MouldMaster measured dataset inventory QA passed ({len(rows)} sources; {automated} reproducibly profileable; {rights_review} rights-review)')
