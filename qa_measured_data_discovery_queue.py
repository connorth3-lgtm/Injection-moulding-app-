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
    'reportedCountsFromRelatedPublicationsRemainUnacceptedUntilPayloadRightsAndOverlapAreResolved',
    'cycleLevelFeatureRowsAreNotIntraCycleProcessWaveforms',
    'openAccessStatusDoesNotReplaceExplicitReuseLicense',
    'publisherMetadataCountsRemainUnacceptedUntilPayloadFilesAreProfiled',
]:
    need(rules.get(key) is True, f'discovery queue boundary missing: {key}')

active = q.get('activeDiscoveries')
resolved = q.get('resolvedPromotions')
screened = q.get('screenedOutDiscoveries')
need(isinstance(active, list) and len(active) == 6,
     f'expected six active measured-data discoveries, found {len(active) if isinstance(active, list) else "non-list"}')
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
    'mendeley-gtnb4j7bfx-production-v1',
    'zenodo-forinfpro-himd-20744054',
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

gtnb = by_id['mendeley-gtnb4j7bfx-production-v1']
need(gtnb.get('license') == 'CC BY 4.0', 'gtnb publisher licence must remain CC BY 4.0')
need(gtnb.get('status') == 'retrieval-blocked-publisher-no-file-entries', 'gtnb file-retrieval blocker drifted')
need(gtnb.get('role') == 'industrial-record-level-process-data-retrieval-review', 'gtnb role must remain record-level process data')
need('not assumed to represent one injection cycle' in gtnb.get('recordUnit', ''), 'gtnb production-record/cycle boundary missing')
need('or an intra-cycle waveform' in gtnb.get('recordUnit', ''), 'gtnb record/waveform boundary missing')
gtnb_scale = gtnb.get('scale', {})
need(gtnb_scale.get('injectionMoldingRecordsReportedByArticle') == 4502, 'gtnb reported injection-record count drifted')
need(gtnb_scale.get('blowMoldingRecordsReportedByArticle') == 1855, 'gtnb reported blow-record count drifted')
need(gtnb.get('source') == 'https://doi.org/10.17632/gtnb4j7bfx.1', 'gtnb Mendeley DOI drifted')
need(gtnb.get('relatedSource') == 'https://doi.org/10.3390/su17167445', 'gtnb associated article DOI drifted')
need('empty Files section' in gtnb.get('limitation', ''), 'gtnb empty-files blocker must remain explicit')

forinfpro = by_id['zenodo-forinfpro-himd-20744054']
need(forinfpro.get('license') is None, 'FORinFPRO must not acquire an inferred licence')
need(forinfpro.get('status') == 'payload-public-formal-license-and-semantics-unverified', 'FORinFPRO blocker status drifted')
need(forinfpro.get('publisherAccessStatus') == 'Dataset Open', 'FORinFPRO publisher access label drifted')
need(forinfpro.get('visibleCycleIds') == ['cycle_001'], 'FORinFPRO must not infer unobserved cycle IDs')
need(forinfpro.get('machine') == 'ENGEL V-Duo injection molding machine at the University of Augsburg Hybrid Injection Molding Cell',
     'FORinFPRO machine description drifted')
layout = forinfpro.get('sensorLayout', {})
need(layout.get('activePulseEchoUltrasonicSensors') == 4, 'FORinFPRO ultrasonic sensor count drifted')
need(layout.get('pressureTemperatureSensors') == 6, 'FORinFPRO pressure/temperature sensor count drifted')
need(layout.get('dielectricAnalysisSensors') == 2, 'FORinFPRO DEA sensor count drifted')
need(layout.get('reportedInMoldSensorsTotal') == 12, 'FORinFPRO total in-mold sensor count drifted')
files = forinfpro.get('publisherIndexedFiles', [])
need(len(files) == 3, f'FORinFPRO expected exactly three indexed files, found {len(files)}')
expected_files = {
    'cycle_001_machine_data.csv': 'd2a7d96d133f3d7b43a5089ad4bf0b09',
    'cycle_001_pt.csv': '40d8511c11e8e0575dc3930ddd258c19',
    'cycle_001_us_rms.csv': 'c767196cfd1b6dec0d09ed0a2dba2551',
}
need({str(x.get('name')): str(x.get('md5')) for x in files} == expected_files,
     'FORinFPRO indexed filenames/checksums drifted')
need('Open-access wording is therefore not substituted for an explicit reuse licence' in forinfpro.get('limitation', ''),
     'FORinFPRO open-access/licence boundary missing')
need('No additional cycle IDs are inferred' in forinfpro.get('limitation', ''),
     'FORinFPRO visible-cycle boundary missing')

k85 = by_id['github-k85-pressure-temperature-v1']
need(k85.get('license') is None, 'K85 mirror must not acquire an inferred licence')
need(k85.get('status') == 'public-mirror-rights-and-origin-unresolved', 'K85 rights/origin blocker drifted')
need(k85.get('scale', {}).get('testsPerCombinationReported') == 10, 'K85 repeated-test description drifted')
need(k85.get('scale', {}).get('processParameterCombinations') is None, 'K85 must not invent a combination count before workbook profiling')
k85_checks = k85.get('provenanceChecks', {})
need(k85_checks.get('repositoryDeclaredLicense') is None, 'K85 GitHub repository must remain explicitly unlicensed')
need(k85_checks.get('repositoryCreated') == '2024-03-19', 'K85 mirror repository creation date drifted')
need(k85_checks.get('earliestDataCommitMessage') == 'Molding Machine Free Access Data', 'K85 earliest data commit wording drifted')
need('not treated as an explicit reuse licence' in k85_checks.get('decision', ''), 'K85 access-versus-rights boundary missing')

aspoeck = by_id['aspoeck-costa-industrial-71016-v1']
need(aspoeck.get('status') == 'request-only-payload-not-public-company-data-rights-unresolved', 'Aspöck request/payload/rights blocker drifted')
need(aspoeck.get('role') == 'large-industrial-record-level-process-data-access-and-rights-review',
     'Aspöck must remain classified as record-level process data pending payload inspection')
need('not an intra-cycle process waveform' in aspoeck.get('recordUnit', ''),
     'Aspöck cycle-level versus waveform boundary missing from record unit')
scale = aspoeck.get('scale', {})
need(scale.get('thesisReportedInjectionCycles') == 71016, 'Aspöck thesis reported-cycle count drifted')
need(scale.get('journalReportedInjectionCyclesApprox') == 280000, 'Aspöck peer-reviewed approximate cycle count drifted')
need(scale.get('thesisReportedPiecesPerCycle') == 2, 'Aspöck thesis pieces-per-cycle report drifted')
need(scale.get('journalReportedSensorsPerCycle') == 264, 'Aspöck journal sensor/feature count drifted')
need(scale.get('journalReportedCandidateFeaturesAfterInitialReduction') == 47, 'Aspöck post-filter candidate-feature count drifted')
need(scale.get('journalReportedMachineCount') == 1, 'Aspöck single-machine description drifted')
need(scale.get('journalReportedApproxCycleSeconds') == 55, 'Aspöck approximate cycle duration drifted')
need('underlying company production-data reuse rights are not stated' in aspoeck.get('license', ''),
     'Aspöck publication/data licence boundary missing')
need('further inquiries can be directed to the corresponding author' in aspoeck.get('dataAvailability', ''),
     'Aspöck peer-reviewed request-only data availability statement missing')
need('no equality, containment, deduplication, or additive relationship is assumed' in aspoeck.get('reportedCountRelationship', ''),
     'Aspöck thesis/journal reported-count overlap boundary missing')
need('264 sensors each provide one reading per cycle' in aspoeck.get('measurementGranularity', ''),
     'Aspöck one-reading-per-cycle granularity missing')
need('not 264 within-cycle sampled waveforms' in aspoeck.get('measurementGranularity', ''),
     'Aspöck cycle-level values must not be inflated into waveform channels')
need(aspoeck.get('source') == 'https://doi.org/10.3390/polym18010032', 'Aspöck strongest peer-reviewed source drifted')
related_sources = aspoeck.get('relatedSources', [])
need(len(related_sources) == 2 and all(str(x).startswith('https://') for x in related_sources),
     'Aspöck related publication sources missing')

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

publisher_retrieval_blocked = sum(
    1 for item in active if str(item.get('status', '')).startswith('retrieval-blocked-publisher-')
)
public_payload_license_unverified = sum(
    1 for item in active if item.get('status') == 'payload-public-formal-license-and-semantics-unverified'
)

report = {
    'schema': 1,
    'source': str(QUEUE.relative_to(ROOT)),
    'activeDiscoveries': len(active),
    'resolvedPromotions': len(resolved),
    'screenedOutDiscoveries': len(screened),
    'directProcessNextIntake': 1,
    'countedAsIngested': 0,
    'countedInjectionCycles': 0,
    'publisherRetrievalBlockedDiscoveries': publisher_retrieval_blocked,
    'publicPayloadLicenseUnverifiedDiscoveries': public_payload_license_unverified,
    'gtnbReportedInjectionRecordsUnaccepted': gtnb_scale['injectionMoldingRecordsReportedByArticle'],
    'gtnbReportedBlowRecordsUnaccepted': gtnb_scale['blowMoldingRecordsReportedByArticle'],
    'forinfproVisibleCycleIds': forinfpro['visibleCycleIds'],
    'reportedUnacceptedInjectionCyclesThesis': scale['thesisReportedInjectionCycles'],
    'reportedUnacceptedInjectionCyclesJournalApprox': scale['journalReportedInjectionCyclesApprox'],
    'reportedJournalSensorsPerCycle': scale['journalReportedSensorsPerCycle'],
    'reportedCountsAssumedAdditive': False,
    'aspoeckClassifiedAsIntraCycleWaveforms': False,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured-data discovery queue QA passed (6 active zero-count discoveries; 2 publisher retrieval blockers; 1 public-payload licence blocker; gtnb 4,502 injection + 1,855 blow records remain metadata; FORinFPRO cycle_001 remains unaccepted; zero canonical count inflation)')
