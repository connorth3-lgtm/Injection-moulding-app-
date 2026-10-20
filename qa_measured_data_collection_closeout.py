from pathlib import Path
import json
import runpy

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
CLOSEOUT = DATA / 'measured-data-collection-closeout-2026-08-30.json'
QUEUE = DATA / 'measured-data-discovery-queue-v1.json'
INVENTORY = DATA / 'measured-dataset-inventory-v1.json'
BATCH5 = DATA / 'measured-dataset-wave2-batch5-extension-v1.json'
CONTENT_SCALE = DATA / 'content-scale-targets.json'
RESULTS = DATA / 'public-benchmark-results'
FORINFPRO = DATA / 'public-benchmark-contracts' / 'forinfpro-himd-v1.json'
TERMINAL_REPORT = ROOT / 'remaining-dataset-terminal-states-report.json'
REPORT = ROOT / 'measured-data-collection-closeout-report.json'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def load(path):
    need(path.exists(), f'missing collection-closeout dependency: {path.relative_to(ROOT)}')
    return json.loads(path.read_text(encoding='utf-8'))


closeout = load(CLOSEOUT)
queue = load(QUEUE)
inv = load(INVENTORY)
batch5 = load(BATCH5)
scale_targets = load(CONTENT_SCALE)
forinfpro = load(FORINFPRO)

need(closeout.get('schema') == 1, 'unsupported collection-closeout schema')
need(closeout.get('version') == '2026.08.30.1', 'collection-closeout version drifted')
need(closeout.get('reviewed') == '2026-08-30', 'collection-closeout review date drifted')
need(closeout.get('status') == 'collection-phase-closed-current-public-and-authorized-scope', 'collection phase must remain explicitly closed for current scope')
need('without claiming that no future dataset can be published or released' in closeout.get('scope', ''), 'closeout scope must not claim permanent global completeness')

base = closeout.get('baseCheckpoint') or {}
inv_summary = inv.get('summary') or {}
need(base.get('inventoriedMeasuredSources') == 25 == inv_summary.get('datasets'), 'base inventoried-source checkpoint drifted')
need(base.get('rightsExecutableSources') == 14 == inv_summary.get('automatedIngestionAllowed'), 'base executable-source checkpoint drifted')
scale_measured = ((scale_targets.get('targets') or {}).get('measured_time_series_samples') or {})
scale_profiled = ((scale_targets.get('targets') or {}).get('fully_profiled_measured_datasets') or {})
need(base.get('fullyProfiledMeasuredFamilies') == 12 == scale_profiled.get('currentAccepted'), 'base fully-profiled checkpoint drifted')
need(base.get('acceptedInjectionProcessTimeSeriesValues') == 66521519 == scale_measured.get('currentAccepted'), 'base measured time-series checkpoint drifted')

effective = closeout.get('canonicalEffectiveState') or {}
batch_effective = batch5.get('effective') or {}
need(effective.get('inventoriedMeasuredSources') == 34 == batch_effective.get('inventoriedMeasuredSources'), 'effective inventory total drifted')
need(effective.get('rightsExecutableSources') == 21 == batch_effective.get('automatedIngestionAllowed'), 'effective executable total drifted')
need(effective.get('fullyProfiledMeasuredFamilies') == 17 == batch_effective.get('fullyProfiledMeasuredFamilies'), 'effective fully-profiled total drifted')
need(effective.get('acceptedInjectionProcessTimeSeriesValues') == 85569824 == batch_effective.get('acceptedInjectionProcessTimeSeriesValues'), 'effective waveform total drifted')
need((batch5.get('boundaries') or {}).get('rawThirdPartyRowsOrFilesCommitted') is False, 'batch-5 raw-payload boundary drifted')

active_ids = [x.get('id') for x in queue.get('activeDiscoveries') or []]
need(active_ids == closeout.get('activeDiscoveryIds'), 'closeout active discovery list must exactly match governed queue order')
need(len(active_ids) == 4 and len(set(active_ids)) == 4, 'closeout requires four unique active zero-count discoveries')
need(all((x.get('acceptedMeasuredTimeSeriesSamples') == 0) for x in queue.get('activeDiscoveries') or []), 'active discoveries must remain zero-count')

managed = queue.get('canonicalInventoryManagedSources') or []
managed_closeout = closeout.get('canonicalInventoryManagedFormerDiscoveries') or []
need(len(managed) == 2 == len(managed_closeout), 'canonical-managed former discovery count drifted')
need({x.get('formerDiscoveryId') for x in managed} == {x.get('formerDiscoveryId') for x in managed_closeout}, 'canonical-managed former discovery set drifted')
need(all(x.get('acceptedAdditionalValuesFromCloseout') == 0 for x in managed_closeout), 'closeout must not add values from already-canonical former discoveries')

for_entry = next(x for x in managed_closeout if x.get('canonicalDatasetId') == 'forinfpro-himd-v1')
for_semantic = forinfpro.get('semanticAcceptance') or {}
need(for_entry.get('alreadyAcceptedMeasuredTimeSeriesSamples') == 162112, 'FORinFPRO closeout carried count drifted')
need(for_semantic.get('acceptedMeasuredTimeSeriesSamples') == 162112, 'FORinFPRO canonical accepted count drifted')
need(for_semantic.get('acceptedMeasuredChannels') == 16, 'FORinFPRO canonical channel count drifted')
need(for_semantic.get('acceptedCountFormula') == '16 * 10132', 'FORinFPRO canonical count formula drifted')
need((forinfpro.get('rightsGate') or {}).get('status') == 'satisfied', 'FORinFPRO rights gate must remain satisfied')
need((forinfpro.get('source') or {}).get('license') == 'CC BY 4.0', 'FORinFPRO canonical licence drifted')

# Re-run the existing terminal-state audit so this closeout is valid standalone as well as in CI.
runpy.run_path(str(ROOT / 'qa_remaining_dataset_terminal_states.py'), run_name='__main__')
terminal = load(TERMINAL_REPORT)
need(terminal.get('result') == 'pass', 'remaining dataset terminal-state audit did not pass')
need(terminal.get('terminalContractsChecked') == 14, 'terminal contract coverage drifted')
need(terminal.get('rightsBlocked') == 3, 'rights-blocked terminal count drifted')
need(terminal.get('mirrorRightsBlocked') == 2, 'mirror-rights terminal count drifted')
need(terminal.get('embargoed') == 2, 'embargoed terminal count drifted')
need(terminal.get('requestOnly') == 1, 'request-only terminal count drifted')
need(terminal.get('confidential') == 1, 'confidential terminal count drifted')
need(terminal.get('specialFormatExport') == 1, 'special-format terminal count drifted')

future = closeout.get('futureGates') or {}
expected_categories = {
    'publisherPayloadOrDelivery': 4,
    'rightsOrOriginalProvenance': 6,
    'requestOnlyOrOwnerResponse': 3,
    'semanticExpansionOfAlreadyAcceptedFamilies': 3,
    'specialFormatExport': 1,
    'confidentialAuthorization': 1,
    'embargo': 2,
}
need(set(future) == set(expected_categories), f'future-gate categories drifted: {sorted(future)}')
for category, count in expected_categories.items():
    need(len(future.get(category) or []) == count, f'{category}: expected {count} closeout entries')

all_future = [x for category in expected_categories for x in future[category]]
future_ids = [x.get('id') for x in all_future]
need(all(future_ids) and len(future_ids) == len(set(future_ids)), 'future-gate dataset IDs must be unique')
need(all(x.get('acceptedAdditionalValuesWhileBlocked') == 0 for x in all_future), 'every unresolved future gate must contribute zero additional values')
need(sum(expected_categories.values()) == 20 == len(all_future), 'future-gate entry total drifted')

expected_states = {
    'ad-stgn-injection-moulding-v1': 'publisher-record-no-files-exposed',
    'rwth-pcr-2025-v1': 'retrieval-blocked-non-archive-response',
    'mendeley-c3pt29jt7c-v1': 'retrieved-profile-blocked-external-dic-workbook-not-delivered',
    'strathclyde-rtim-tablets-v1': 'retrieval-blocked-http',
    'probayes-main-v2': 'blocked-rights-review',
    'probayes-doptimal-v1': 'blocked-rights-review',
    'skz-loki-v1': 'blocked-rights-review',
    'kamp-injection-7996': 'blocked-mirror-rights',
    'foxconn-competition-16600': 'blocked-mirror-rights',
    'github-k85-pressure-temperature-v1': 'public-mirror-rights-and-origin-unresolved',
    'aspoeck-costa-industrial-71016-v1': 'request-only-payload-not-public-company-data-rights-unresolved',
    'aisemo-accelerometer-state-recognition-v1': 'request-only-underlying-data-not-public',
    'inqcim-2500-request': 'blocked-request-only',
    'cross-process-chain-17240390': 'profiled-scope-limited-semantic-review',
    'impure-pascoe-2022': 'accepted-profiled-partially-semantic-resolved',
    'forinfpro-himd-v1': 'accepted-profiled-partially-semantic-resolved',
    'warwick-demoulding': 'retrieved-special-format-needs-origin-export',
    'bottle-cap-7162-confidential': 'blocked-confidential',
    'leon-process-20309380': 'blocked-embargo',
    'leon-defects-20322729': 'blocked-embargo',
}
need(set(future_ids) == set(expected_states), 'future-gate dataset set drifted')
for item in all_future:
    need(item.get('state') == expected_states[item['id']], f"{item['id']}: closeout state drifted")

for item in future['embargo']:
    need(item.get('notBefore') == '2027-12-31', f"{item['id']}: embargo date drifted")

ad = load(RESULTS / 'ad-stgn-injection-moulding-v1-stage1.json')
need(ad.get('status') == expected_states['ad-stgn-injection-moulding-v1'], 'AD-STGN publisher-payload state mismatch')
need((ad.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, 'AD-STGN metadata cannot count')
need((ad.get('acceptance') or {}).get('publisherPayloadObtained') is False, 'AD-STGN payload possession boundary drifted')

rwth = load(RESULTS / 'rwth-pcr-2025-v1.json')
need(rwth.get('status') == expected_states['rwth-pcr-2025-v1'], 'RWTH closeout state mismatch')
need((rwth.get('acceptance') or {}).get('countsAsFullyProfiledMeasuredDataset') is False, 'RWTH cannot count before archive delivery')

c3pt = load(RESULTS / 'c3pt29jt7c-v1.json')
need(c3pt.get('status') == expected_states['mendeley-c3pt29jt7c-v1'], 'c3pt closeout state mismatch')
need((c3pt.get('deliveredWorkbookProfile') or {}).get('externalWorkbookSheetDelivered') is False, 'c3pt missing-external-workbook gate drifted')
need((c3pt.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, 'c3pt cannot count missing DIC arrays')

strath = load(RESULTS / 'strathclyde-rtim-tablets-v1.json')
need(strath.get('status') == expected_states['strathclyde-rtim-tablets-v1'], 'Strathclyde closeout state mismatch')
need(all(x.get('httpStatus') == 403 for x in (strath.get('retrieval') or {}).get('attempts') or []), 'Strathclyde HTTP-block audit drifted')
need((strath.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, 'Strathclyde inaccessible workbook cannot count')

terminal_noncount = closeout.get('terminalNonCounting') or []
need(len(terminal_noncount) == 1 and terminal_noncount[0].get('id') == 'mendeley-597jrsm9zm-v1', 'terminal documentation-only closeout set drifted')
need(terminal_noncount[0].get('acceptedMeasuredTimeSeriesSamples') == 0, 'documentation-only source must remain zero-count')
docs = load(RESULTS / '597jrsm9zm-v1.json')
need(docs.get('status') == terminal_noncount[0].get('state'), '597jrsm9zm terminal state mismatch')
need((docs.get('acceptance') or {}).get('acceptedMeasuredTimeSeriesSamples') == 0, '597jrsm9zm documentation-only source cannot count')

collection = closeout.get('collectionDecision') or {}
need(collection.get('repoAutomatableCollectionWorkRemaining') == 0, 'current-scope repo collection must be explicitly closed')
need(collection.get('activeZeroCountDiscoveries') == 4, 'active zero-count discovery closeout count drifted')
need(collection.get('canonicalInventoryManagedFormerDiscoveries') == 2, 'canonical-managed closeout count drifted')
need(collection.get('knownTerminalDocumentationOnlySources') == 1, 'terminal documentation-only closeout count drifted')
need(collection.get('unresolvedSourcesContributeZeroAdditionalValuesUntilGateResolution') is True, 'fail-closed unresolved-value rule missing')
need(collection.get('futurePromotionRequiresNewEvidenceOrExternalStateChange') is True, 'future-promotion boundary missing')
need(len(collection.get('reopenTriggers') or []) == 7, 'closeout reopen-trigger coverage drifted')

safety = closeout.get('safetyBoundaries') or {}
for key in [
    'rawThirdPartyNumericPayloadCommitted',
    'fabricatedOrInferredMeasurementsAccepted',
    'metadataOrPublicationCountsTreatedAsPossessedPayload',
    'embargoedPayloadRetrievedEarly',
    'confidentialPayloadClaimedPossessedWithoutAuthorization',
    'mirrorAvailabilityTreatedAsReusePermission',
    'unresolvedFieldSemanticsCounted',
]:
    need(safety.get(key) is False, f'closeout safety boundary drifted: {key}')

report = {
    'schema': 1,
    'status': closeout['status'],
    'baseCheckpoint': base,
    'canonicalEffectiveState': effective,
    'activeZeroCountDiscoveries': len(active_ids),
    'canonicalInventoryManagedFormerDiscoveries': len(managed_closeout),
    'futureGateEntries': len(all_future),
    'externalOrTechnicalGateEntries': len(all_future) - len(future['semanticExpansionOfAlreadyAcceptedFamilies']),
    'semanticExpansionGateEntries': len(future['semanticExpansionOfAlreadyAcceptedFamilies']),
    'terminalDocumentationOnlySources': len(terminal_noncount),
    'acceptedAdditionalValuesFromCloseout': 0,
    'repoAutomatableCollectionWorkRemaining': 0,
    'result': 'pass',
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('MouldMaster measured-data collection closeout QA passed (current public/authorized collection scope closed; effective state 34/21/17/85,569,824; 4 active zero-count discoveries; 20 fail-closed future gates; zero closeout count inflation)')
