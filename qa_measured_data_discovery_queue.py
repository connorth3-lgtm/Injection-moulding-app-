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
    'articleOrThesisLicenceDoesNotAutomaticallyLicenseUnderlyingThirdPartyProductionData',
    'publicMirrorAvailabilityDoesNotProveDatasetReuseRights',
]:
    need(rules.get(key) is True, f'discovery queue boundary missing: {key}')

active = q.get('activeDiscoveries')
resolved = q.get('resolvedPromotions')
screened = q.get('screenedOutDiscoveries')
need(isinstance(active, list) and len(active) == 4,
     f'expected four active measured-data discoveries, found {len(active) if isinstance(active, list) else "non-list"}')
need(isinstance(resolved, list) and len(resolved) == 4,
     f'expected four resolved promotions, found {len(resolved) if isinstance(resolved, list) else "non-list"}')
need(isinstance(screened, list) and len(screened) == 1,
     f'expected one screened-out discovery, found {len(screened) if isinstance(screened, list) else "non-list"}')

active_ids = [str(x.get('id', '')).strip() for x in active]
active_sources = [str(x.get('source', '')).strip() for x in active]
need(all(active_ids) and len(active_ids) == len(set(active_ids)), 'active discovery IDs must be present and unique')
need(all(s.startswith('https://') for s in active_sources) and len(active_sources) == len(set(active_sources)),
     'active discovery sources must be unique HTTPS locations')
for item in active:
    prefix = item['id']
    need(item.get('acceptedMeasuredTimeSeriesSamples') == 0, f'{prefix}: active discovery must remain zero-count')
    need(bool(str(item.get('role', '')).strip()), f'{prefix}: role missing')
    need(bool(str(item.get('recordUnit', '')).strip()), f'{prefix}: record unit missing')
    need(bool(str(item.get('status', '')).strip()), f'{prefix}: blocker status missing')
    need(isinstance(item.get('signals'), list) and item['signals'], f'{prefix}: signals missing')
    need(len(str(item.get('limitation', '')).strip()) >= 120, f'{prefix}: limitation too weak')
    need(item.get('lastPublicRecheck') == '2026-08-30', f'{prefix}: public recheck date drifted')

by_id = {x['id']: x for x in active}
expected_active = {
    'mendeley-ad-stgn-injection-line-v1',
    'github-k85-pressure-temperature-v1',
    'aspoeck-costa-industrial-71016-v1',
    'aisemo-accelerometer-state-recognition-v1',
}
need(set(by_id) == expected_active, f'active discovery set drifted: {sorted(by_id)}')

ad = by_id['mendeley-ad-stgn-injection-line-v1']
need(ad.get('canonicalDatasetId') == 'ad-stgn-injection-moulding-v1', 'AD-STGN canonical dataset ID drifted')
need(ad.get('role') == 'direct-process-data-next-intake', 'AD-STGN injection-line case must remain a direct next-intake candidate')
need(ad.get('status') == 'retrieval-blocked-publisher-no-files', 'AD-STGN retrieval blocker status drifted')
need(str(ad.get('license', '')).strip() == 'CC BY 4.0', 'AD-STGN expected verified CC BY 4.0 discovery')
need('cycles' not in ad.get('scale', {}), 'unprofiled AD-STGN queue item must not claim injection cycle count')
need(ad['scale'].get('normalTrainingSamples') == 88000, 'AD-STGN training-sample count drifted')
need(ad['scale'].get('normalValidationSamples') == 22614, 'AD-STGN validation-sample count drifted')
need(ad['scale'].get('continuousSensors') == 66 and ad['scale'].get('discreteControlActions') == 7,
     'AD-STGN sensor/control dimensions drifted')
need(ad.get('processStages') == ['clamping', 'injection', 'holding', 'cooling', 'ejection', 'robot pick/place'],
     'AD-STGN process-stage description drifted')
need('not assumed to equal one moulding cycle' in ad.get('recordUnit', ''), 'AD-STGN sample/cycle boundary missing')

k85 = by_id['github-k85-pressure-temperature-v1']
need(k85.get('license') is None, 'K85 mirror must not acquire an inferred licence')
need(k85.get('status') == 'public-mirror-rights-and-origin-unresolved', 'K85 rights/origin blocker drifted')
need(k85.get('scale', {}).get('testsPerCombinationReported') == 10, 'K85 repeated-test description drifted')
need(k85.get('scale', {}).get('processParameterCombinations') is None, 'K85 must not invent a combination count before workbook profiling')

aspoeck = by_id['aspoeck-costa-industrial-71016-v1']
need(aspoeck.get('status') == 'payload-not-public-company-data-rights-unresolved', 'Aspöck payload/rights blocker drifted')
need(aspoeck.get('scale', {}).get('reportedInjectionCycles') == 71016, 'Aspöck thesis reported-cycle count drifted')
need('underlying company production-data reuse rights not stated' in aspoeck.get('license', ''),
     'Aspöck thesis/data licence boundary missing')

accel = by_id['aisemo-accelerometer-state-recognition-v1']
need(accel.get('status') == 'request-only-underlying-data-not-public', 'accelerometer request-only status drifted')
need(accel.get('scale', {}).get('samplingFrequencyHz') == 100, 'accelerometer sampling frequency drifted')
need(accel.get('scale', {}).get('reportedInjectionMoldingMachines') == 5, 'accelerometer machine count drifted')
need(accel.get('scale', {}).get('reportedProducts') == 15, 'accelerometer product count drifted')

screened_ids = [str(x.get('id', '')).strip() for x in screened]
need(all(screened_ids) and len(screened_ids) == len(set(screened_ids)), 'screened-out discovery IDs must be unique')
peerj = screened[0]
need(peerj.get('id') == 'peerj-imm-api-sampling-2020', 'PeerJ instrumentation screen-out drifted')
need(peerj.get('decision') == 'exclude-from-measured-process-intake', 'PeerJ instrumentation decision drifted')
need(peerj.get('acceptedMeasuredTimeSeriesSamples') == 0, 'PeerJ non-production sampling must remain zero-count')
need('no injection-moulding production runs were performed' in peerj.get('reason', ''),
     'PeerJ no-production-run boundary missing')

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
need(not (set(active_ids) & set(screened_ids)), 'screened-out discoveries must not remain active')

report = {
    'schema': 1,
    'source': str(QUEUE.relative_to(ROOT)),
    'activeDiscoveries': len(active),
    'resolvedPromotions': len(resolved),
    'screenedOutDiscoveries': len(screened),
    'directProcessNextIntake': 1,
    'countedAsIngested': 0,
    'countedInjectionCycles': 0,
    'reportedUnacceptedInjectionCycles': aspoeck['scale']['reportedInjectionCycles'],
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured-data discovery queue QA passed (4 active zero-count discoveries; 1 false positive screened out; 4 promoted discoveries archived; zero canonical count inflation)')
