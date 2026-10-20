from pathlib import Path
import json
import re
from collections import Counter

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
EXPECTED_KIND_COUNTS = {
    'direct-measurement': 36,
    'derived-feature': 5,
    'diagnostic-interpretation': 5,
    'measurement-integrity': 7,
    'quality-measurement': 5,
    'command-signal': 1,
    'state-signal': 1,
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

need(registry.get('schema') == 1, 'resolved sensor registry schema drifted')
need(registry.get('status') == 'accepted-rights-and-canonical-profile-gated-registry', 'resolved sensor registry status drifted')
need(registry.get('materializedOverlay') == 'data/sensor-machine-health-registry-v2.json', 'sensor overlay was not materialized before QA')
need(registry.get('materializedFromSourceBaseReviewed') == 26, 'source-reviewed sensor base count drifted')
need(registry.get('materializedFromBaseAccepted') == 23, 'rights/profile-gated base sensor count drifted')

need(overlay.get('schema') == 1 and overlay.get('status') == 'evidence-reviewed-overlay-with-rights-gates', 'sensor v2 overlay status/schema drifted')
need(overlay.get('baseRegistry') == 'data/sensor-machine-health-registry-v1.json', 'sensor v2 overlay base drifted')
os = overlay.get('summary') or {}
need(os.get('sourceReviewedBase') == 26 and os.get('sourceReviewedOverlay') == 55, 'source-reviewed sensor totals drifted')
need(os.get('acceptedBaseAfterRightsAndCanonicalProfileGates') == 23, 'accepted base sensor total drifted')
need(os.get('acceptedOverlayAfterRightsAndCanonicalProfileGates') == 37, 'accepted overlay sensor total drifted')
need(os.get('resolvedAccepted') == 60 and os.get('deferredSourceReviewedConcepts') == 21, 'resolved/deferred sensor totals drifted')
need(os.get('resolvedKindCounts') == EXPECTED_KIND_COUNTS, 'overlay resolved kind-count contract drifted')

pack_refs = overlay.get('packs') or []
need(len(pack_refs) == 5, f'expected five source-reviewed sensor packs, found {len(pack_refs)}')
source_reviewed_overlay = 0
for p in pack_refs:
    pack = load(ROOT / p['path'])
    rows = pack.get('entries') or []
    need(pack.get('schema') == 1 and pack.get('status') == 'accepted-evidence-reviewed-overlay-pack', f"{p['path']}: reviewed pack status/schema drifted")
    need(len(rows) == p.get('entries'), f"{p['path']}: manifest count mismatch")
    source_reviewed_overlay += len(rows)
need(source_reviewed_overlay == 55, 'source-reviewed sensor pack total drifted')
need(next(x for x in pack_refs if x['path'].endswith('sensor-machine-health-probayes-v2.json')).get('acceptance') == 'deferred-rights-blocked', 'ProBayes pack must remain explicitly rights-deferred')

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
need(support_boundary.get('countsTowardPeerReviewedResearchRecords') is False, 'machine-health support must not inflate peer-reviewed headline count')
need(support_boundary.get('simulationOnlyCannotSupportAcceptedDirectMeasurement') is True, 'simulation-only machine-health boundary missing')
need(support_boundary.get('universalThresholdsAllowed') is False, 'support registry universal-threshold boundary missing')
support_rows = support.get('studies') or []
need(len(support_rows) == 7, f'expected seven supporting machine-health studies, found {len(support_rows)}')
support_dois = set()
for i, row in enumerate(support_rows, 1):
    doi = str(row.get('doi', '')).strip().lower()
    need(DOI_RE.fullmatch(doi) is not None, f'machine-health support {i}: valid DOI missing')
    need(doi not in support_dois, f'duplicate supporting machine-health DOI: {doi}')
    support_dois.add(doi)
    need(str(row.get('publisherUrl', '')).startswith('https://'), f'machine-health support {i}: publisher URL missing')
    need(isinstance(row.get('measuredEvidence'), list) and row['measuredEvidence'], f'machine-health support {i}: measured evidence missing')
    bounded = str(row.get('boundedUse', '')).lower()
    need(len(bounded) >= 90 and ('not ' in bounded or 'remain' in bounded or 'specific' in bounded), f'machine-health support {i}: bounded use too weak')

primary_dois = set()
for p in primary_index.get('packs') or []:
    pack = load(ROOT / p['path'])
    rows = pack.get('entries') or []
    need(len(rows) == p.get('entries'), f"primary pack count mismatch while validating sensor evidence: {p['path']}")
    for row in rows:
        doi = str(row.get('doi', '')).strip().lower()
        need(DOI_RE.fullmatch(doi) is not None, f'primary measured DOI invalid: {doi}')
        need(doi not in primary_dois, f'duplicate primary DOI while validating sensor evidence: {doi}')
        primary_dois.add(doi)
need(len(primary_dois) == 70, f'effective primary evidence total must be 70, found {len(primary_dois)}')

concepts = registry.get('concepts') or []
summary = registry.get('summary') or {}
need(len(concepts) == 60, f'expected rights/profile-gated sensor/health count of 60, found {len(concepts)}')
need(summary.get('acceptedConcepts') == 60, 'resolved sensor summary total drifted')
need(summary.get('sourceReviewedBase') == 26 and summary.get('sourceReviewedOverlay') == 55, 'resolved source-reviewed totals drifted')
need(summary.get('baseAccepted') == 23 and summary.get('overlayAccepted') == 37, 'resolved accepted layer split drifted')
need(summary.get('deferredSourceReviewedConcepts') == 21, 'resolved deferred count drifted')
target_count = (targets.get('targets') or {}).get('sensor_machine_health_concepts', {}).get('currentAccepted')
need(target_count == 60, f'resolved sensor target mismatch: {target_count}')
need(targets.get('materializedOverlay') == 'data/content-scale-targets-overlay-v2.json', 'target overlay was not materialized before sensor QA')

ids = []
kind_counts = Counter()
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
    evidence = concept.get('evidence')
    need(isinstance(evidence, list) and evidence, f'{prefix}: evidence provenance missing')
    for ev in evidence:
        et = ev.get('type')
        eid = str(ev.get('id', '')).strip().lower()
        role = str(ev.get('role', '')).strip()
        need(eid and len(role) >= 10, f'{prefix}: evidence id/role missing')
        if et == 'dataset-profile':
            path = str(ev.get('path', '')).strip()
            need(path.startswith('data/public-benchmark-results/'), f'{prefix}: dataset evidence path outside accepted benchmark profiles')
            need((ROOT / path).exists(), f'{prefix}: dataset evidence profile missing: {path}')
            low = path.lower()
            need('probayes' not in low and 'skz-loki' not in low, f'{prefix}: rights-blocked dataset profile survived acceptance: {path}')
            need(not path.endswith('/scatimdata-v1.json') and not path.endswith('/cross-process-chain-v1.json'), f'{prefix}: stale profile alias survived materialization: {path}')
            dataset_profile_refs.add(path)
        elif et == 'primary-measured-study':
            need(eid in primary_dois, f'{prefix}: primary measured DOI not in effective registry: {eid}')
            primary_refs.add(eid)
        elif et == 'machine-health-study':
            need(eid in support_dois, f'{prefix}: machine-health DOI not in supporting registry: {eid}')
            support_refs.add(eid)
        else:
            raise AssertionError(f'{prefix}: unsupported evidence type {et}')

need(len(ids) == len(set(ids)), 'duplicate resolved sensor/machine-health concept id')
need(not any(x.startswith('sig-probayes-') for x in ids), 'ProBayes concepts must remain deferred pending rights')
for blocked_id in ['sig-nozzle-front-pressure-direct', 'sig-nozzle-back-pressure-direct', 'sig-nozzle-pressure-difference-derived']:
    need(blocked_id not in ids, f'{blocked_id}: SKZ LoKI concept must remain deferred pending rights')
need(dict(kind_counts) == EXPECTED_KIND_COUNTS, f'resolved sensor/health kind counts drifted: {dict(kind_counts)}')
need(summary.get('kindCounts') == dict(sorted(kind_counts.items())), 'resolved sensor kind summary drifted')
need(len(dataset_profile_refs) >= 7, 'resolved sensor/health registry needs broad canonical measured-dataset provenance')
need(len(primary_refs) >= 5, 'resolved sensor/health registry needs peer-reviewed primary-measured support')
need(len(support_refs) >= 4, 'resolved sensor/health registry needs supporting machine-health evidence')

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
        need(doi in support_dois and accepted, f'{doi}: supporting candidate resolution incomplete')

report = {
    'schema': 3,
    'source': str(REGISTRY.relative_to(ROOT)),
    'overlayRegistry': str(OVERLAY.relative_to(ROOT)),
    'sourceReviewedBaseConcepts': 26,
    'sourceReviewedOverlayConcepts': 55,
    'acceptedBaseConcepts': 23,
    'acceptedOverlayConcepts': 37,
    'resolvedAcceptedConcepts': 60,
    'deferredSourceReviewedConcepts': 21,
    'remainingToMinimum': 140,
    'kindCounts': dict(sorted(kind_counts.items())),
    'datasetProfileEvidenceFiles': sorted(dataset_profile_refs),
    'primaryMeasuredDois': sorted(primary_refs),
    'supportingMachineHealthDois': sorted(support_refs),
    'rightsBlockedConceptsCounted': 0,
    'missingCanonicalProfileConceptsCounted': 0,
    'duplicateConceptIds': 0,
    'universalThresholdsAllowed': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster sensor/machine-health QA passed (60 accepted; 21 source-reviewed concepts deferred by rights/canonical-profile gates)')
