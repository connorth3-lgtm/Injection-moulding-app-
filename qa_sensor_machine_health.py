from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
REGISTRY = ROOT / 'data' / 'sensor-machine-health-registry-v1.json'
OVERLAY = ROOT / 'data' / 'sensor-machine-health-registry-v2.json'
SUPPORT = ROOT / 'data' / 'machine-health-supporting-evidence-v1.json'
CANDIDATES = ROOT / 'data' / 'sensor-machine-health-candidate-queue-v1.json'
RESOLUTIONS = ROOT / 'data' / 'sensor-machine-health-candidate-resolution-v2.json'
TARGETS = ROOT / 'data' / 'content-scale-targets.json'
PRIMARY = ROOT / 'data' / 'primary-measured-evidence-registry-v1.json'
REPORT = ROOT / 'sensor-machine-health-report.json'

ALLOWED_KINDS = {
    'direct-measurement', 'derived-feature', 'diagnostic-interpretation',
    'measurement-integrity', 'quality-measurement', 'command-signal', 'state-signal',
}
ALLOWED_CANDIDATE_STATUSES = {
    'publisher-verified-candidate-dedup-pending',
    'supporting-machine-health-candidate-scope-review-required',
    'existing-primary-study-sensor-concept-review-pending',
}
DOI_RE = re.compile(r'^10\.\d{4,9}/\S+$', re.I)


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing sensor/health dependency: {path.relative_to(ROOT).as_posix()}')
    return json.loads(path.read_text(encoding='utf-8'))


registry = load(REGISTRY)
overlay = load(OVERLAY)
support = load(SUPPORT)
candidate_queue = load(CANDIDATES)
resolution = load(RESOLUTIONS)
targets = load(TARGETS)
primary_index = load(PRIMARY)

need(registry.get('schema') == 1 and registry.get('status') == 'accepted-evidence-reviewed-registry', 'resolved sensor registry status/schema drifted')
need(registry.get('materializedOverlay') == 'data/sensor-machine-health-registry-v2.json', 'sensor overlay was not materialized before QA')
need(registry.get('materializedFromBaseAccepted') == 26, 'historical sensor baseline count drifted')
need(overlay.get('schema') == 1 and overlay.get('status') == 'accepted-evidence-reviewed-overlay', 'sensor v2 overlay status/schema drifted')
need(overlay.get('baseRegistry') == 'data/sensor-machine-health-registry-v1.json', 'sensor v2 overlay base drifted')
pack_refs = overlay.get('packs') or []
need(len(pack_refs) == 5, f'expected five sensor v2 packs, found {len(pack_refs)}')
overlay_rows = []
for p in pack_refs:
    pack = load(ROOT / p['path'])
    need(pack.get('schema') == 1 and pack.get('status') == 'accepted-evidence-reviewed-overlay-pack', f"{p['path']}: overlay pack status/schema drifted")
    rows = pack.get('entries') or []
    need(len(rows) == p.get('entries'), f"{p['path']}: overlay pack count mismatch")
    overlay_rows.extend(rows)
need(len(overlay_rows) == 55, f'expected second sensor tranche of 55 concepts, found {len(overlay_rows)}')
need((overlay.get('summary') or {}).get('baseAccepted') == 26, 'sensor overlay base count drifted')
need((overlay.get('summary') or {}).get('overlayAccepted') == 55, 'sensor overlay tranche count drifted')
need((overlay.get('summary') or {}).get('resolvedAccepted') == 81, 'sensor overlay resolved count drifted')

policy = registry.get('policy') or {}
need(policy.get('signalIsEvidenceNotRootCause') is True, 'signal/root-cause boundary missing')
need(policy.get('sourceUnitsAndScaleMustBePreserved') is True, 'source unit/scale boundary missing')
need(policy.get('sensorLocationMustBePreservedWhereKnown') is True, 'sensor-location boundary missing')
need(policy.get('derivedFeaturesMustRemainDistinctFromDirectMeasurements') is True, 'direct/derived boundary missing')
need(policy.get('universalThresholdsAllowed') is False, 'universal thresholds must remain disallowed')
need(policy.get('crossMachineTransferRequiresValidation') is True, 'cross-machine validation boundary missing')

support_boundary = support.get('countingBoundary') or {}
need(support.get('schema') == 1 and support.get('status') == 'peer-reviewed-machine-health-supporting-evidence', 'support registry status/schema drifted')
need(support_boundary.get('countsTowardPrimaryMeasuredStudies') is False, 'machine-health support must not inflate primary measured count')
need(support_boundary.get('countsTowardPeerReviewedResearchRecords') is False, 'machine-health support must not silently inflate peer-reviewed headline count')
need(support_boundary.get('simulationOnlyCannotSupportAcceptedDirectMeasurement') is True, 'simulation-only machine-health boundary missing')
need(support_boundary.get('universalThresholdsAllowed') is False, 'support registry universal-threshold boundary missing')
support_rows = support.get('studies') or []
need(len(support_rows) == 7, f'expected seven supporting machine-health studies, found {len(support_rows)}')
support_dois = []
for i, row in enumerate(support_rows, 1):
    prefix = f"machine-health support {i} ({row.get('doi', 'missing-doi')})"
    doi = str(row.get('doi', '')).strip().lower()
    need(DOI_RE.fullmatch(doi) is not None, f'{prefix}: valid DOI missing')
    support_dois.append(doi)
    need(str(row.get('publisherUrl', '')).startswith('https://'), f'{prefix}: publisher URL missing')
    need(isinstance(row.get('measuredEvidence'), list) and row['measuredEvidence'], f'{prefix}: measured evidence missing')
    bounded = str(row.get('boundedUse', '')).lower()
    need(len(bounded) >= 90 and ('not ' in bounded or 'remain' in bounded or 'specific' in bounded), f'{prefix}: bounded use too weak')
need(len(support_dois) == len(set(support_dois)), 'duplicate DOI inside supporting machine-health registry')
support_doi_set = set(support_dois)

primary_dois = set()
for p in primary_index.get('packs') or []:
    pack = load(ROOT / p['path'])
    rows = pack.get('entries') or []
    need(len(rows) == p.get('entries'), f"primary pack count mismatch while validating sensor evidence: {p['path']}")
    primary_dois.update(str(x.get('doi', '')).lower() for x in rows)

concepts = registry.get('concepts') or []
summary = registry.get('summary') or {}
need(len(concepts) == 81, f'expected resolved sensor/health count of 81, found {len(concepts)}')
target_count = (targets.get('targets') or {}).get('sensor_machine_health_concepts', {}).get('currentAccepted')
need(target_count == len(concepts), f'resolved sensor target mismatch: {target_count} != {len(concepts)}')
need(targets.get('materializedOverlay') == 'data/content-scale-targets-overlay-v2.json', 'target overlay was not materialized before sensor QA')

ids = []
kind_counts = {k: 0 for k in ALLOWED_KINDS}
dataset_profile_refs = set()
primary_refs = set()
support_refs = set()
for i, concept in enumerate(concepts, 1):
    prefix = f"sensor concept {i} ({concept.get('id', 'missing-id')})"
    cid = str(concept.get('id', '')).strip()
    need(cid.startswith('sig-'), f'{prefix}: stable signal id missing')
    ids.append(cid)
    need(concept.get('status') == 'accepted-evidence-reviewed', f'{prefix}: concept not accepted')
    kind = concept.get('kind')
    need(kind in ALLOWED_KINDS, f'{prefix}: unsupported kind {kind}')
    kind_counts[kind] += 1
    need(bool(str(concept.get('modality', '')).strip()), f'{prefix}: modality missing')
    need(len(str(concept.get('measurementLocationOrDomain', '')).strip()) >= 40, f'{prefix}: measurement location/domain too weak')
    unit_semantics = str(concept.get('unitsOrFeatureSemantics', '')).strip()
    need(len(unit_semantics) >= 10 and any(ch.isalpha() for ch in unit_semantics), f'{prefix}: units/feature semantics too weak')
    confounders = concept.get('failureAndConfounders')
    need(isinstance(confounders, list) and len(confounders) >= 3 and all(str(x).strip() for x in confounders), f'{prefix}: failure/confounder coverage too weak')
    boundary = str(concept.get('diagnosticUseBoundary', '')).strip()
    need(len(boundary) >= 80, f'{prefix}: diagnostic-use boundary too weak')
    low = boundary.lower()
    bounded_tokens = ('universal', 'not ', 'cannot', 'requires', 'require ', 'only', 'unless', 'may arise', 'specific', 'must remain', 'do not')
    need(any(token in low for token in bounded_tokens), f'{prefix}: bounded interpretation language missing')
    evidence = concept.get('evidence')
    need(isinstance(evidence, list) and evidence, f'{prefix}: evidence provenance missing')
    for ev in evidence:
        et = ev.get('type')
        eid = str(ev.get('id', '')).strip()
        role = str(ev.get('role', '')).strip()
        need(eid and len(role) >= 10, f'{prefix}: evidence id/role missing')
        if et == 'dataset-profile':
            path = str(ev.get('path', '')).strip()
            need(path.startswith('data/public-benchmark-results/'), f'{prefix}: dataset evidence path outside accepted benchmark profiles')
            need((ROOT / path).exists(), f'{prefix}: dataset evidence profile missing: {path}')
            dataset_profile_refs.add(path)
        elif et == 'primary-measured-study':
            doi = eid.lower()
            need(doi in primary_dois, f'{prefix}: primary measured DOI not in canonical registry: {eid}')
            primary_refs.add(doi)
        elif et == 'machine-health-study':
            doi = eid.lower()
            need(doi in support_doi_set, f'{prefix}: machine-health DOI not in supporting registry: {eid}')
            support_refs.add(doi)
        else:
            raise AssertionError(f'{prefix}: unsupported evidence type {et}')

need(len(ids) == len(set(ids)), 'duplicate resolved sensor/machine-health concept id')
expected_kind_counts = {
    'direct-measurement': 50,
    'derived-feature': 8,
    'diagnostic-interpretation': 6,
    'measurement-integrity': 9,
    'quality-measurement': 6,
    'command-signal': 1,
    'state-signal': 1,
}
need(kind_counts == expected_kind_counts, f'resolved sensor/health kind counts drifted: {kind_counts}')
need(summary.get('acceptedConcepts') == 81, 'resolved sensor summary total drifted')
need(summary.get('kindCounts') == dict(sorted(kind_counts.items())), 'resolved sensor kind summary drifted')
need(len(dataset_profile_refs) >= 11, 'resolved sensor/health registry needs broad measured-dataset provenance')
need(len(primary_refs) >= 5, 'resolved sensor/health registry needs peer-reviewed primary-measured support')
need(len(support_refs) >= 4, 'resolved sensor/health registry needs promoted supporting machine-health evidence')

need(candidate_queue.get('schema') == 1 and candidate_queue.get('status') == 'candidate-queue-not-counted-as-accepted', 'candidate queue counting boundary missing')
cb = candidate_queue.get('boundary') or {}
need(cb.get('candidateIsNotAccepted') is True and cb.get('productionSettingsDerived') is False, 'candidate queue boundary drifted')
candidate_rows = candidate_queue.get('candidates') or []
need(len(candidate_rows) == 6, f'expected six historical sensor candidates, found {len(candidate_rows)}')
candidate_dois = []
for i, row in enumerate(candidate_rows, 1):
    doi = str(row.get('doi', '')).strip().lower()
    need(DOI_RE.fullmatch(doi) is not None, f'sensor candidate {i}: DOI missing')
    candidate_dois.append(doi)
    need(row.get('status') in ALLOWED_CANDIDATE_STATUSES, f'sensor candidate {i}: unsupported status')
need(len(candidate_dois) == len(set(candidate_dois)), 'duplicate DOI inside historical sensor candidate queue')

need(resolution.get('schema') == 1 and resolution.get('status') == 'candidate-resolution-snapshot', 'candidate resolution schema/status drifted')
rb = resolution.get('boundary') or {}
need(rb.get('resolutionDoesNotInflatePrimaryMeasuredCount') is True, 'candidate resolution primary-count boundary missing')
res_rows = resolution.get('resolutions') or []
need(len(res_rows) == len(candidate_rows), 'candidate resolution row count drifted')
need({str(x.get('doi', '')).lower() for x in res_rows} == set(candidate_dois), 'candidate resolution DOI set differs from historical queue')
resolved_ids = set(ids)
for row in res_rows:
    doi = str(row['doi']).lower()
    out = str(row.get('outcome', ''))
    accepted = row.get('acceptedConceptIds') or []
    need(all(x in resolved_ids for x in accepted), f'{doi}: candidate resolution references non-accepted concept')
    if doi == '10.1016/j.engfailanal.2022.106118':
        need(not accepted and 'forensics-only' in out, 'corrosion forensics must not be misrepresented as online sensor evidence')
    elif doi == '10.3390/app12031410':
        need(doi in primary_dois and 'existing-primary-study' in out, 'moisture candidate must reuse the existing primary identity')
    else:
        need(doi in support_doi_set and accepted, f'{doi}: supporting candidate resolution incomplete')

report = {
    'schema': 2,
    'source': str(REGISTRY.relative_to(ROOT)),
    'overlayRegistry': str(OVERLAY.relative_to(ROOT)),
    'supportingEvidenceRegistry': str(SUPPORT.relative_to(ROOT)),
    'candidateResolution': str(RESOLUTIONS.relative_to(ROOT)),
    'baseAcceptedConcepts': 26,
    'overlayAcceptedConcepts': 55,
    'resolvedAcceptedConcepts': 81,
    'remainingToMinimum': 119,
    'kindCounts': kind_counts,
    'datasetProfileEvidenceFiles': sorted(dataset_profile_refs),
    'primaryMeasuredDois': sorted(primary_refs),
    'supportingMachineHealthDois': sorted(support_refs),
    'duplicateConceptIds': 0,
    'universalThresholdsAllowed': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(
    'MouldMaster sensor/machine-health QA passed '
    f"(26 baseline + 55 overlay = {len(concepts)} accepted concepts; "
    f"{kind_counts['direct-measurement']} direct, {kind_counts['derived-feature']} derived, "
    f"{kind_counts['diagnostic-interpretation']} diagnostic, {kind_counts['quality-measurement']} quality, "
    f"{kind_counts['measurement-integrity']} integrity, {kind_counts['command-signal']} command, {kind_counts['state-signal']} state)"
)
