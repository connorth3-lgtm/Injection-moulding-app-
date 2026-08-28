from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
REGISTRY = ROOT / 'data' / 'sensor-machine-health-registry-v1.json'
TARGETS = ROOT / 'data' / 'content-scale-targets.json'
PRIMARY = ROOT / 'data' / 'primary-measured-evidence-registry-v1.json'
REPORT = ROOT / 'sensor-machine-health-report.json'

ALLOWED_KINDS = {
    'direct-measurement',
    'derived-feature',
    'diagnostic-interpretation',
    'measurement-integrity',
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing sensor/health dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


registry = load(REGISTRY)
targets = load(TARGETS)
primary_index = load(PRIMARY)

need(registry.get('schema') == 1, 'unsupported sensor/machine-health schema')
need(registry.get('status') == 'accepted-evidence-reviewed-registry', 'sensor/machine-health registry is not accepted')
policy = registry.get('policy') or {}
need(policy.get('signalIsEvidenceNotRootCause') is True, 'signal/root-cause boundary missing')
need(policy.get('sourceUnitsAndScaleMustBePreserved') is True, 'source unit/scale boundary missing')
need(policy.get('sensorLocationMustBePreservedWhereKnown') is True, 'sensor-location boundary missing')
need(policy.get('derivedFeaturesMustRemainDistinctFromDirectMeasurements') is True, 'direct/derived signal boundary missing')
need(policy.get('universalThresholdsAllowed') is False, 'universal signal thresholds must remain disallowed')
need(policy.get('crossMachineTransferRequiresValidation') is True, 'cross-machine validation boundary missing')

concepts = registry.get('concepts') or []
summary = registry.get('summary') or {}
need(len(concepts) == 26, f'expected first accepted sensor/health tranche of 26 concepts, found {len(concepts)}')
need(summary.get('acceptedConcepts') == len(concepts), 'sensor/health summary total drifted')

target_count = (targets.get('targets') or {}).get('sensor_machine_health_concepts', {}).get('currentAccepted')
need(target_count == len(concepts), f'sensor/health target ledger mismatch: {target_count} != {len(concepts)}')

# Resolve every primary-measured DOI once from the canonical packs.
primary_dois = set()
for p in primary_index.get('packs') or []:
    pack = load(ROOT / p['path'])
    rows = pack.get('entries') or []
    need(len(rows) == p.get('entries'), f"primary pack count mismatch while validating sensor evidence: {p['path']}")
    primary_dois.update(str(x.get('doi', '')).lower() for x in rows)

ids = []
kind_counts = {k: 0 for k in ALLOWED_KINDS}
dataset_profile_refs = set()
primary_refs = set()
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
    need(len(str(concept.get('unitsOrFeatureSemantics', '')).strip()) >= 30, f'{prefix}: units/feature semantics too weak')
    confounders = concept.get('failureAndConfounders')
    need(isinstance(confounders, list) and len(confounders) >= 3 and all(str(x).strip() for x in confounders), f'{prefix}: failure/confounder coverage too weak')
    boundary = str(concept.get('diagnosticUseBoundary', '')).strip()
    need(len(boundary) >= 80, f'{prefix}: diagnostic-use boundary too weak')
    low = boundary.lower()
    need('universal' in low or 'not ' in low or 'requires' in low or 'only' in low, f'{prefix}: bounded interpretation language missing')

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
        else:
            raise AssertionError(f'{prefix}: unsupported evidence type {et}')

need(len(ids) == len(set(ids)), 'duplicate sensor/machine-health concept id')
expected_kind_counts = {
    'direct-measurement': 20,
    'derived-feature': 3,
    'diagnostic-interpretation': 2,
    'measurement-integrity': 1,
}
need(kind_counts == expected_kind_counts, f'sensor/health kind counts drifted: {kind_counts}')
need(summary.get('directMeasurementConcepts') == kind_counts['direct-measurement'], 'direct measurement summary drifted')
need(summary.get('derivedFeatureConcepts') == kind_counts['derived-feature'], 'derived feature summary drifted')
need(summary.get('diagnosticInterpretationConcepts') == kind_counts['diagnostic-interpretation'], 'diagnostic interpretation summary drifted')
need(summary.get('measurementIntegrityConcepts') == kind_counts['measurement-integrity'], 'measurement integrity summary drifted')
need(len(dataset_profile_refs) >= 6, 'accepted sensor/health tranche needs broad measured-dataset provenance')
need(len(primary_refs) >= 5, 'accepted sensor/health tranche needs peer-reviewed primary-measured support')

report = {
    'schema': 1,
    'source': str(REGISTRY.relative_to(ROOT)),
    'acceptedConcepts': len(concepts),
    'kindCounts': kind_counts,
    'datasetProfileEvidenceFiles': sorted(dataset_profile_refs),
    'primaryMeasuredDois': sorted(primary_refs),
    'duplicateConceptIds': 0,
    'universalThresholdsAllowed': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(
    'MouldMaster sensor/machine-health QA passed '
    f"({len(concepts)} accepted concepts; {kind_counts['direct-measurement']} direct, "
    f"{kind_counts['derived-feature']} derived, {kind_counts['diagnostic-interpretation']} diagnostic, "
    f"{kind_counts['measurement-integrity']} integrity)"
)
