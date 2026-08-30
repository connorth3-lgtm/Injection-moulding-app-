from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
QUEUE = ROOT / 'data' / 'measured-data-discovery-queue-v1.json'
REPORT = ROOT / 'measured-data-discovery-queue-report.json'


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
    'alreadyPromotedFamiliesMustNotRemainActiveDiscoveries',
]:
    need(rules.get(key) is True, f'discovery queue boundary missing: {key}')

active = q.get('activeDiscoveries')
resolved = q.get('resolvedPromotions')
need(isinstance(active, list) and len(active) == 1,
     f'expected one active measured-data discovery, found {len(active) if isinstance(active, list) else "non-list"}')
need(isinstance(resolved, list) and len(resolved) == 4,
     f'expected four resolved promotions, found {len(resolved) if isinstance(resolved, list) else "non-list"}')

active_ids = [str(x.get('id', '')).strip() for x in active]
active_sources = [str(x.get('source', '')).strip() for x in active]
need(all(active_ids) and len(active_ids) == len(set(active_ids)), 'active discovery IDs must be present and unique')
need(all(s.startswith('https://') for s in active_sources) and len(active_sources) == len(set(active_sources)),
     'active discovery sources must be unique HTTPS locations')

ad = active[0]
need(ad.get('id') == 'mendeley-ad-stgn-injection-line-v1', 'AD-STGN must remain the sole active discovery')
need(ad.get('canonicalDatasetId') == 'ad-stgn-injection-moulding-v1', 'AD-STGN canonical dataset ID drifted')
need(ad.get('role') == 'direct-process-data-next-intake', 'AD-STGN injection-line case must remain a direct next-intake candidate')
need(ad.get('status') == 'retrieval-blocked-publisher-no-files', 'AD-STGN retrieval blocker status drifted')
need(str(ad.get('license', '')).strip() == 'CC BY 4.0', 'AD-STGN expected verified CC BY 4.0 discovery')
need(bool(str(ad.get('recordUnit', '')).strip()), 'AD-STGN record unit missing')
need(isinstance(ad.get('signals'), list) and ad['signals'], 'AD-STGN signals missing')
need(isinstance(ad.get('quality'), list) and ad['quality'], 'AD-STGN measured/supporting outcomes missing')
need(len(str(ad.get('limitation', '')).strip()) >= 120, 'AD-STGN limitation too weak')
need('cycles' not in ad.get('scale', {}), 'unprofiled AD-STGN queue item must not claim injection cycle count')
need(ad.get('acceptedMeasuredTimeSeriesSamples') == 0, 'AD-STGN metadata must remain zero-count until payload retrieval')
need(ad.get('lastPublicRecheck') == '2026-08-30', 'AD-STGN public recheck date drifted')
need(ad['scale'].get('normalTrainingSamples') == 88000, 'AD-STGN training-sample count drifted')
need(ad['scale'].get('normalValidationSamples') == 22614, 'AD-STGN validation-sample count drifted')
need(ad['scale'].get('continuousSensors') == 66 and ad['scale'].get('discreteControlActions') == 7,
     'AD-STGN sensor/control dimensions drifted')
need(ad.get('processStages') == ['clamping', 'injection', 'holding', 'cooling', 'ejection', 'robot pick/place'],
     'AD-STGN process-stage description drifted')
need('not assumed to equal one moulding cycle' in ad.get('recordUnit', ''), 'AD-STGN sample/cycle boundary missing')

expected_resolved = {
    'mendeley-pp-pvt-v1',
    'mendeley-im-pla-abs-mechanics-v1',
    'mendeley-release-coating-xps-v1',
    'mendeley-hsmed-tpm-im-v1',
}
resolved_ids = {str(x.get('formerDiscoveryId', '')).strip() for x in resolved}
need(resolved_ids == expected_resolved, f'resolved promotion set drifted: {sorted(resolved_ids)}')
canonical_ids = [str(x.get('canonicalDatasetId', '')).strip() for x in resolved]
need(all(canonical_ids) and len(canonical_ids) == len(set(canonical_ids)), 'resolved promotions need unique canonical dataset IDs')
for item in resolved:
    prefix = item['formerDiscoveryId']
    need(str(item.get('resolution', '')).startswith('promoted-profiled-'), f'{prefix}: resolution must be a profiled promotion')
    need(len(str(item.get('note', '')).strip()) >= 40, f'{prefix}: promotion note too weak')

need(not (set(active_ids) & resolved_ids), 'active discoveries must not also appear in resolved promotions')

report = {
    'schema': 1,
    'source': str(QUEUE.relative_to(ROOT)),
    'activeDiscoveries': len(active),
    'resolvedPromotions': len(resolved),
    'directProcessNextIntake': 1,
    'countedAsIngested': 0,
    'claimedInjectionCycles': 0,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured-data discovery queue QA passed (1 active retrieval-blocked discovery; 4 promoted discoveries archived; zero cycle-count inflation)')
