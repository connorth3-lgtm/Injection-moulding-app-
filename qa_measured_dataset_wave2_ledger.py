from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
LEDGER=ROOT/'data/measured-dataset-wave2-ledger-v1.json'
PVT=ROOT/'data/public-benchmark-results/6k8fpbrd9s-v1.json'
PP_FOAM=ROOT/'data/public-benchmark-results/fhj5p7ww9v-v1.json'
HDPE_GNP=ROOT/'data/public-benchmark-results/4h98rz9f92-v3.json'
PMC=ROOT/'data/public-benchmark-results/pmc4753395-hdpe-cenosphere-v1.json'
AD_STGN=ROOT/'data/public-benchmark-results/ad-stgn-injection-moulding-v1-stage1.json'
NYLON12=ROOT/'data/public-benchmark-results/nylon12-gamma-8c8fjwcw86-v1.json'

def need(ok,msg):
    if not ok: raise AssertionError(msg)

x=json.loads(LEDGER.read_text())
need(x['schema']==1,'unsupported Wave 2 ledger schema')
need(x['version']=='2026.08.29.5','Wave 2 ledger version drifted')
need(x['baseWave']['fullyProfiledMeasuredDatasetFamilies']==5,'base fully-profiled count drifted')
need(x['baseWave']['acceptedMeasuredTimeSeriesSamples']==13929568,'base measured sample count drifted')
sources={s['datasetId']:s for s in x['sources']}
need(set(sources)=={'ad-stgn-injection-moulding-v1','mendeley-fhj5p7ww9v-v1','mendeley-6k8fpbrd9s-v1','mendeley-4h98rz9f92-v3','pmc4753395-hdpe-cenosphere-v1','mendeley-8c8fjwcw86-v1'},'Wave 2 source set drifted')

ad=sources['ad-stgn-injection-moulding-v1']; need(ad['state']=='publisher-record-no-files-exposed','AD-STGN blocker drifted'); need(ad['countsAsFullyProfiledMeasuredDataset'] is False,'blocked AD-STGN cannot count'); need(ad['acceptedMeasuredTimeSeriesSamples']==0,'blocked AD-STGN cannot add samples')
foam=sources['mendeley-fhj5p7ww9v-v1']; need(foam['state']=='accepted-profiled-restricted-noncommercial','PP foam state drifted'); need(foam['recordLevelMeasuredOutcomeValues']==96,'PP foam outcome count drifted'); need(foam['commercialReuseAllowed'] is False,'PP foam rights widened'); need(foam['acceptedMeasuredTimeSeriesSamples']==0,'PP foam cannot add time-series samples')
pvt=sources['mendeley-6k8fpbrd9s-v1']; need(pvt['state']=='accepted-profiled-material-characterization','pvT state drifted'); need(pvt['deliveredDirectPhysicalValueCells']==28590,'pvT direct count drifted'); need(pvt['materialCharacterizationTraceMeasurementCells']==6026,'pvT trace count drifted'); need(pvt['acceptedMeasuredTimeSeriesSamples']==0,'pvT cannot add process samples')
gnp=sources['mendeley-4h98rz9f92-v3']; need(gnp['state']=='accepted-profiled-record-level-injection-moulding','HDPE/GNP state drifted'); need(gnp['directMeasuredPropertyValues']==525,'HDPE/GNP direct count drifted'); need(gnp['derivedAverageValuesExcluded']==105,'HDPE/GNP derived exclusion drifted'); need(gnp['acceptedMeasuredTimeSeriesSamples']==0,'HDPE/GNP cannot add time-series samples')
pmc=sources['pmc4753395-hdpe-cenosphere-v1']; need(pmc['state']=='accepted-profiled-material-test-traces','PMC state drifted'); need(pmc['materialTestTraceValues']==142884,'PMC trace count drifted'); need(pmc['materialTestTracePointPairs']==71442,'PMC pair count drifted'); need(pmc['preHeaderNumericCellsExcluded']==20,'PMC pre-header exclusion drifted'); need(pmc['plotNumericCellsExcluded']==4,'PMC plot exclusion drifted'); need(pmc['theoreticalWorkbookValuesAccepted']==0,'PMC theoretical values cannot count'); need(pmc['acceptedMeasuredTimeSeriesSamples']==0,'PMC material traces cannot add process samples')
ny=sources['mendeley-8c8fjwcw86-v1']; need(ny['state']=='completed-no-acceptable-injection-trace','Nylon-12 terminal state drifted'); need(ny['countsAsFullyProfiledMeasuredDataset'] is False,'Nylon-12 cannot count'); need(ny['candidateInjectionMaterialTracePointPairs']==0,'Nylon-12 candidate trace count drifted'); need(ny['slsTensileTracePointPairsExcluded']==1359,'Nylon-12 SLS exclusion drifted'); need(ny['derivedBoxPlotPairedPointsExcluded']==72,'Nylon-12 derived exclusion drifted'); need(ny['mixedRouteStructuralPairedPointsExcluded']==26424,'Nylon-12 mixed-route exclusion drifted'); need(ny['acceptedMeasuredTimeSeriesSamples']==0,'Nylon-12 cannot add process samples'); need(ny['terminalReviewComplete'] is True,'Nylon-12 review must be terminal')

s=x['summary']; need(s['wave2SourcesReviewed']==6,'reviewed count drifted'); need(s['wave2FullyProfiledAccepted']==4,'accepted count drifted'); need(s['wave2PublisherPayloadBlocked']==1,'blocked count drifted'); need(s['wave2TerminalSemanticRejected']==1,'terminal semantic rejection count drifted'); need(s['effectiveFullyProfiledMeasuredDatasetFamilies']==9,'effective family count drifted'); need(s['effectiveAcceptedMeasuredTimeSeriesSamples']==13929568,'process sample total must remain unchanged'); need(s['wave2RecordLevelMeasuredOutcomeValues']==621,'record-level outcome count drifted'); need(s['wave2RecordLevelDerivedSummaryValuesExcluded']==105,'derived summary exclusion drifted'); need(s['wave2MaterialCharacterizationDirectPhysicalValues']==28590,'material direct count drifted'); need(s['wave2MaterialCharacterizationTraceMeasurementCells']==6026,'material characterization trace count drifted'); need(s['wave2MaterialTestTraceValues']==142884,'material test trace count drifted'); need(s['wave2MaterialTestTracePointPairs']==71442,'material test pair count drifted')
b=x['boundaries']; need(b['rawThirdPartyRowsOrFilesCommitted'] is False,'raw data boundary widened'); need(b['materialTestTraceValuesDoNotInflateInjectionProcessHighFrequencySampleMetric'] is True,'material-test/process metric boundary missing'); need(b['mixedManufacturingRouteEvidenceMustBeUnambiguousBeforeCounting'] is True,'mixed-route boundary missing')

p=json.loads(PVT.read_text()); need(p['profile']['deliveredDirectPhysicalValueCells']==28590,'pvT result drifted'); need(p['profile']['materialCharacterizationTraceMeasurementCells']==6026,'pvT result trace drifted'); need(p['acceptance']['countsAsFullyProfiledMeasuredDataset'] is True,'pvT lost acceptance')
f=json.loads(PP_FOAM.read_text()); need(f['profile']['recordLevelMeasuredOutcomeValues']==96,'PP foam result drifted'); need(f['acceptance']['commercialReuseAllowed'] is False,'PP foam committed rights widened')
g=json.loads(HDPE_GNP.read_text()); need(g['profile']['directMeasuredPropertyValues']==525,'HDPE/GNP result drifted'); need(g['profile']['derivedAverageValuesExcluded']==105,'HDPE/GNP derived exclusion drifted'); need(g['acceptance']['countsAsFullyProfiledMeasuredDataset'] is True,'HDPE/GNP lost acceptance')
m=json.loads(PMC.read_text()); need(m['profile']['materialTestTraceValues']==142884,'PMC committed trace count drifted'); need(m['profile']['sourceDeliveredStressStrainTracePointPairs']==71442,'PMC committed pair count drifted'); need(m['profile']['preHeaderNumericCellsExcluded']==20,'PMC committed pre-header exclusion drifted'); need(m['profile']['theoreticalWorkbookValuesAccepted']==0,'PMC committed theoretical count drifted'); need(m['acceptance']['countsAsFullyProfiledMeasuredDataset'] is True,'PMC lost acceptance'); need(m['acceptance']['acceptedInjectionProcessTimeSeriesSamplesAdded']==0,'PMC inflated process samples')
a=json.loads(AD_STGN.read_text()); need(a['acceptance']['countsAsFullyProfiledMeasuredDataset'] is False,'AD-STGN blocker drifted'); need(a['acceptance']['acceptedMeasuredTimeSeriesSamples']==0,'AD-STGN blocker inflated samples')
n=json.loads(NYLON12.read_text()); need(n['status']=='slide-context-profile-no-acceptable-injection-trace','Nylon-12 result status drifted'); need(n['semanticProfile']['candidateInjectionMaterialTracePointPairs']==0,'Nylon-12 result candidate count drifted'); need(n['semanticProfile']['slsTensileTracePointPairsExcluded']==1359,'Nylon-12 result SLS exclusion drifted'); need(n['semanticProfile']['derivedBoxPlotPairedPointsExcluded']==72,'Nylon-12 result derived exclusion drifted'); need(n['semanticProfile']['mixedRouteStructuralPairedPointsExcluded']==26424,'Nylon-12 result mixed-route exclusion drifted'); need(n['acceptance']['countsAsFullyProfiledMeasuredDataset'] is False,'Nylon-12 result cannot count')
print('MouldMaster Wave 2 measured-dataset ledger QA passed')
