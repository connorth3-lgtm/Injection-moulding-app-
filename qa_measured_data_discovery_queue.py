from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
QUEUE = ROOT / 'data' / 'measured-data-discovery-queue-v1.json'
INVENTORY = ROOT / 'data' / 'measured-dataset-inventory-v1.json'
FORINFPRO = ROOT / 'data' / 'public-benchmark-contracts' / 'forinfpro-himd-v1.json'
REPORT = ROOT / 'measured-data-discovery-queue-report.json'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing discovery dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


def norm_source(value):
    return str(value or '').strip().lower().rstrip('/')


q = load(QUEUE)
inv = load(INVENTORY)
forinfpro_contract = load(FORINFPRO)
need(q.get('schema') == 1, 'unsupported discovery queue schema')
need(q.get('version') == '2026.08.30.7', 'discovery queue closeout version drifted')

rules = q.get('rules', {})
for key in [
    'queueDoesNotCountAsIngested',
    'timeSamplesAreNotInjectionCycles',
    'supportingMaterialDataAreNotProcessCycles',
    'simulationOutputsAreNotMeasuredProcessEvidence',
    'licenseMustTravelWithAnyPermittedDerivedUse',
    'alreadyPromotedFamiliesMustNotRemainActiveDiscoveries',
    'activeDiscoveryMustNotDuplicateCanonicalInventory',
    'articleOrThesisLicenceDoesNotAutomaticallyLicenseUnderlyingThirdPartyProductionData',
    'publicMirrorAvailabilityDoesNotProveDatasetReuseRights',
    'reportedCountsFromRelatedPublicationsRemainUnacceptedUntilPayloadRightsAndOverlapAreResolved',
    'cycleLevelFeatureRowsAreNotIntraCycleProcessWaveforms',
    'openAccessStatusDoesNotReplaceExplicitReuseLicense',
    'publisherMetadataCountsRemainUnacceptedUntilPayloadFilesAreProfiled',
]:
    need(rules.get(key) is True, f'discovery queue boundary missing: {key}')

active = q.get('activeDiscoveries')
managed = q.get('canonicalInventoryManagedSources')
resolved = q.get('resolvedPromotions')
screened = q.get('screenedOutDiscoveries')
need(isinstance(active, list) and len(active) == 4, f'expected four active discoveries, found {len(active) if isinstance(active, list) else "non-list"}')
need(isinstance(managed, list) and len(managed) == 2, f'expected two canonical-managed discoveries, found {len(managed) if isinstance(managed, list) else "non-list"}')
need(isinstance(resolved, list) and len(resolved) == 4, 'resolved promotion set size drifted')
need(isinstance(screened, list) and len(screened) == 1, 'screened-out discovery set size drifted')

active_ids = [str(x.get('id', '')).strip() for x in active]
active_sources = [norm_source(x.get('source')) for x in active]
expected_active = {
    'mendeley-ad-stgn-injection-line-v1',
    'github-k85-pressure-temperature-v1',
    'aspoeck-costa-industrial-71016-v1',
    'aisemo-accelerometer-state-recognition-v1',
}
need(set(active_ids) == expected_active, f'active discovery set drifted: {sorted(active_ids)}')
need(len(active_ids) == len(set(active_ids)), 'active discovery IDs must be unique')
need(all(x.startswith('https://') for x in active_sources), 'active discovery sources must be HTTPS')
need(len(active_sources) == len(set(active_sources)), 'active discovery sources must be unique')
for item in active:
    prefix = item['id']
    need(item.get('acceptedMeasuredTimeSeriesSamples') == 0, f'{prefix}: active discovery must remain zero-count')
    need(bool(str(item.get('role', '')).strip()), f'{prefix}: role missing')
    need(bool(str(item.get('recordUnit', '')).strip()), f'{prefix}: record unit missing')
    need(bool(str(item.get('status', '')).strip()), f'{prefix}: blocker status missing')
    need(isinstance(item.get('signals'), list) and item['signals'], f'{prefix}: signals missing')
    need(len(str(item.get('limitation', '')).strip()) >= 120, f'{prefix}: limitation too weak')
    need(item.get('lastPublicRecheck') == '2026-08-30', f'{prefix}: public recheck date drifted')

inventory_rows = inv.get('datasets') or []
need(len(inventory_rows) == 25, f'canonical base inventory size drifted: {len(inventory_rows)}')
inventory_by_id = {x.get('datasetId'): x for x in inventory_rows}
inventory_sources = {norm_source(x.get('source')) for x in inventory_rows}
need(not (set(active_sources) & inventory_sources), 'active discovery source duplicates a canonical inventory source')
active_canonical_ids = {x.get('canonicalDatasetId') for x in active if x.get('canonicalDatasetId')}
need(not (active_canonical_ids & set(inventory_by_id)), 'active discovery canonicalDatasetId duplicates base canonical inventory')

managed_by_former = {x.get('formerDiscoveryId'): x for x in managed}
need(set(managed_by_former) == {'mendeley-gtnb4j7bfx-production-v1', 'zenodo-forinfpro-himd-20744054'}, 'canonical-managed discovery set drifted')
need(not (set(active_ids) & set(managed_by_former)), 'canonical-managed source must not remain active')

gtnb = managed_by_former['mendeley-gtnb4j7bfx-production-v1']
need(gtnb.get('canonicalDatasetId') == 'mendeley-gtnb4j7bfx-v1', 'gtnb canonical dataset ID drifted')
gtnb_inv = inventory_by_id.get('mendeley-gtnb4j7bfx-v1')
need(gtnb_inv is not None, 'gtnb missing from canonical inventory')
need(gtnb_inv.get('accessState') == 'executed-open', 'gtnb canonical access state drifted')
need(gtnb_inv.get('license') == 'CC BY 4.0', 'gtnb canonical licence drifted')
need(gtnb_inv.get('automatedIngestionAllowed') is True, 'gtnb canonical executable flag drifted')
need(norm_source(gtnb.get('source')) == norm_source(gtnb_inv.get('source')), 'gtnb discovery/canonical source mismatch')
need(gtnb.get('state') == 'canonical-executed-record-level-benchmark', 'gtnb managed state drifted')

forinfpro = managed_by_former['zenodo-forinfpro-himd-20744054']
need(forinfpro.get('canonicalDatasetId') == 'forinfpro-himd-v1', 'FORinFPRO canonical dataset ID drifted')
need(forinfpro.get('accessState') == 'executed-open', 'FORinFPRO managed access state drifted')
need(forinfpro.get('license') == 'CC BY 4.0', 'FORinFPRO managed licence drifted')
need(forinfpro.get('acceptedMeasuredTimeSeriesSamples') == 162112, 'FORinFPRO managed accepted count drifted')
need(forinfpro.get('acceptedCountFormula') == '16 * 10132', 'FORinFPRO managed count formula drifted')
need(forinfpro_contract.get('datasetId') == 'forinfpro-himd-v1', 'FORinFPRO canonical contract ID drifted')
need(forinfpro_contract.get('status') == 'accepted-profiled-partially-semantic-resolved', 'FORinFPRO canonical contract status drifted')
need((forinfpro_contract.get('source') or {}).get('license') == 'CC BY 4.0', 'FORinFPRO canonical licence evidence drifted')
need((forinfpro_contract.get('rightsGate') or {}).get('status') == 'satisfied', 'FORinFPRO canonical rights gate drifted')
semantic = forinfpro_contract.get('semanticAcceptance') or {}
need(semantic.get('acceptedMeasuredTimeSeriesSamples') == 162112, 'FORinFPRO canonical accepted sample count drifted')
need(semantic.get('acceptedMeasuredChannels') == 16, 'FORinFPRO canonical accepted channel count drifted')
need(semantic.get('acceptedCountFormula') == '16 * 10132', 'FORinFPRO canonical semantic formula drifted')
need(forinfpro.get('state') == 'canonical-partially-semantic-resolved', 'FORinFPRO managed state drifted')

by_id = {x['id']: x for x in active}
ad = by_id['mendeley-ad-stgn-injection-line-v1']
need(ad.get('status') == 'retrieval-blocked-publisher-no-files', 'AD-STGN blocker drifted')
need(ad.get('license') == 'CC BY 4.0', 'AD-STGN licence drifted')
need(ad.get('scale', {}).get('normalTrainingSamples') == 88000, 'AD-STGN training scale drifted')
need(ad.get('scale', {}).get('normalValidationSamples') == 22614, 'AD-STGN validation scale drifted')

k85 = by_id['github-k85-pressure-temperature-v1']
need(k85.get('license') is None, 'K85 mirror must not acquire an inferred licence')
need(k85.get('status') == 'public-mirror-rights-and-origin-unresolved', 'K85 rights/origin blocker drifted')
need((k85.get('provenanceChecks') or {}).get('repositoryDeclaredLicense') is None, 'K85 repository must remain explicitly unlicensed')

aspoeck = by_id['aspoeck-costa-industrial-71016-v1']
scale = aspoeck.get('scale') or {}
need(aspoeck.get('status') == 'request-only-payload-not-public-company-data-rights-unresolved', 'Aspöck blocker drifted')
need(scale.get('thesisReportedInjectionCycles') == 71016, 'Aspöck thesis scale drifted')
need(scale.get('journalReportedInjectionCyclesApprox') == 280000, 'Aspöck journal scale drifted')
need(scale.get('journalReportedSensorsPerCycle') == 264, 'Aspöck journal feature count drifted')
need('not 264 within-cycle sampled waveforms' in aspoeck.get('measurementGranularity', ''), 'Aspöck waveform boundary missing')

accel = by_id['aisemo-accelerometer-state-recognition-v1']
need(accel.get('status') == 'request-only-underlying-data-not-public', 'AiSeMo request-only blocker drifted')
need(accel.get('scale', {}).get('samplingFrequencyHz') == 100, 'AiSeMo sampling frequency drifted')

resolved_ids = {str(x.get('formerDiscoveryId', '')).strip() for x in resolved}
need(resolved_ids == {
    'mendeley-pp-pvt-v1', 'mendeley-im-pla-abs-mechanics-v1',
    'mendeley-release-coating-xps-v1', 'mendeley-hsmed-tpm-im-v1'
}, 'resolved promotion set drifted')
need(not (set(active_ids) & resolved_ids), 'active discovery also appears as resolved promotion')
need(screened[0].get('id') == 'peerj-imm-api-sampling-2020', 'screened instrumentation false positive drifted')
need(screened[0].get('acceptedMeasuredTimeSeriesSamples') == 0, 'screened false positive cannot count')

report = {
    'schema': 2,
    'source': str(QUEUE.relative_to(ROOT)),
    'activeDiscoveries': len(active),
    'canonicalInventoryManagedSources': len(managed),
    'resolvedPromotions': len(resolved),
    'screenedOutDiscoveries': len(screened),
    'activeDiscoveryCanonicalCollisions': 0,
    'activeAcceptedMeasuredTimeSeriesSamples': 0,
    'forinfproCanonicalAcceptedMeasuredTimeSeriesSamples': 162112,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured-data discovery queue QA passed (4 genuine active zero-count discoveries; 2 sources reconciled to canonical inventory; no active/canonical collisions)')
