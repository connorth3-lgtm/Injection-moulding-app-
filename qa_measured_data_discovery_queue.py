from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
QUEUE = ROOT / 'data' / 'measured-data-discovery-queue-v1.json'
REPORT = ROOT / 'measured-data-discovery-queue-report.json'

ALLOWED_ROLES = {
    'direct-process-data-next-intake',
    'supporting-material-physics-data',
    'supporting-injection-moulded-mechanical-data',
    'supporting-release-surface-chemistry-data',
    'supporting-production-engineering-data',
}


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing measured data discovery queue: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


q = load(QUEUE)
need(q.get('schema') == 1, 'unsupported discovery queue schema')
rules = q.get('rules', {})
for key in [
    'queueDoesNotCountAsIngested',
    'timeSamplesAreNotInjectionCycles',
    'supportingMaterialDataAreNotProcessCycles',
    'simulationOutputsAreNotMeasuredProcessEvidence',
    'licenseMustTravelWithAnyPermittedDerivedUse',
]:
    need(rules.get(key) is True, f'discovery queue boundary missing: {key}')

rows = q.get('discoveries')
need(isinstance(rows, list) and len(rows) == 5, f'expected five new measured-data discoveries, found {len(rows) if isinstance(rows, list) else "non-list"}')
ids = [str(x.get('id', '')).strip() for x in rows]
sources = [str(x.get('source', '')).strip() for x in rows]
need(all(ids) and len(ids) == len(set(ids)), 'discovery IDs must be present and unique')
need(all(s.startswith('https://') for s in sources) and len(sources) == len(set(sources)), 'discovery sources must be unique HTTPS locations')

role_counts = {r: 0 for r in ALLOWED_ROLES}
for d in rows:
    prefix = d['id']
    role = d.get('role')
    need(role in ALLOWED_ROLES, f'{prefix}: unsupported role {role}')
    role_counts[role] += 1
    need(str(d.get('license', '')).strip() == 'CC BY 4.0', f'{prefix}: expected verified CC BY 4.0 discovery')
    need(bool(str(d.get('recordUnit', '')).strip()), f'{prefix}: record unit missing')
    need(isinstance(d.get('signals'), list) and d['signals'], f'{prefix}: signals missing')
    need(isinstance(d.get('quality'), list) and d['quality'], f'{prefix}: measured/supporting outcomes missing')
    need(len(str(d.get('limitation', '')).strip()) >= 120, f'{prefix}: limitation too weak')
    need('cycles' not in d.get('scale', {}), f'{prefix}: unprofiled queue item must not claim injection cycle count')
    if role != 'direct-process-data-next-intake':
        need(d.get('status') in {'supporting-data-not-cycle-benchmark', 'profile-before-evidence-use'},
             f'{prefix}: supporting data must stay outside direct process benchmark lane')

by_id = {d['id']: d for d in rows}
ad = by_id['mendeley-ad-stgn-injection-line-v1']
need(ad.get('role') == 'direct-process-data-next-intake', 'AD-STGN injection-line case must remain a direct next-intake candidate')
need(ad.get('status') == 'ready-for-file-profile', 'AD-STGN status drifted')
need(ad['scale'].get('normalTrainingSamples') == 88000, 'AD-STGN training-sample count drifted')
need(ad['scale'].get('normalValidationSamples') == 22614, 'AD-STGN validation-sample count drifted')
need(ad['scale'].get('continuousSensors') == 66 and ad['scale'].get('discreteControlActions') == 7,
     'AD-STGN sensor/control dimensions drifted')
need(ad.get('processStages') == ['clamping', 'injection', 'holding', 'cooling', 'ejection', 'robot pick/place'],
     'AD-STGN process-stage description drifted')
need('not assumed to equal one moulding cycle' in ad.get('recordUnit', ''), 'AD-STGN sample/cycle boundary missing')

report = {
    'schema': 1,
    'source': str(QUEUE.relative_to(ROOT)),
    'discoveries': len(rows),
    'roleCounts': role_counts,
    'directProcessNextIntake': 1,
    'supportingMeasuredData': 4,
    'countedAsIngested': 0,
    'claimedInjectionCycles': 0,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured-data discovery queue QA passed (5 new CC BY discoveries; 1 direct next-intake + 4 supporting; zero cycle-count inflation)')
