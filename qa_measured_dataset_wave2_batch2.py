from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
LEDGER = ROOT / "data/measured-dataset-wave2-ledger-v1.json"
YXZ = ROOT / "data/public-benchmark-results/yxz2w7ctnh-v1.json"
DIC = ROOT / "data/public-benchmark-results/c3pt29jt7c-v1.json"
STAGE1 = ROOT / "data/public-benchmark-results/mendeley-wave2-batch2-stage1.json"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
need(ledger["version"] == "2026.08.29.4", "Wave 2 ledger version drifted")
s = ledger["summary"]
need(s["wave2SourcesReviewed"] == 7, "Wave 2 reviewed-source count drifted")
need(s["wave2FullyProfiledAccepted"] == 4, "Wave 2 accepted-source count drifted")
need(s["wave2PublisherPayloadBlocked"] == 3, "Wave 2 blocker count drifted")
need(s["effectiveFullyProfiledMeasuredDatasetFamilies"] == 9, "effective fully-profiled family count drifted")
need(s["effectiveAcceptedMeasuredTimeSeriesSamples"] == 13929568, "accepted waveform count must not change for record-level batch")
need(s["wave2RecordLevelMeasuredOutcomeValues"] == 1110, "Wave 2 record-level measured count drifted")
need(ledger["boundaries"]["duplicateWorksheetsAcrossPublisherFilesAreDeduplicatedBeforeCounting"] is True, "worksheet dedupe boundary missing")
need(ledger["boundaries"]["mixedManufacturingRoutesRequireExplicitInjectionMouldedIdentityBeforeCounting"] is True, "mixed-route boundary missing")
need(ledger["boundaries"]["externalWorkbookChartReferencesDoNotCountAsDeliveredMeasurements"] is True, "external-workbook boundary missing")

yxz = json.loads(YXZ.read_text(encoding="utf-8"))
need(yxz["status"] == "completed-profiled-record-level-injection-mechanical-testing", "PLA/ABS source is not accepted")
need(yxz["profile"]["directRecordLevelInjectionMeasuredValues"] == 489, "PLA/ABS direct count drifted")
need(yxz["profile"]["acceptedMeasuredTimeSeriesSamples"] == 0, "PLA/ABS cannot add waveform samples")
need(yxz["profile"]["duplicateWorksheetGroupsExcluded"] == 7, "PLA/ABS duplicate worksheet count drifted")
need(yxz["exclusions"]["impactSheetsBecauseManufacturingRouteIsNotExplicitlySeparated"] is True, "ambiguous impact exclusion missing")
need(yxz["retrieval"]["rawPublisherFilesCommitted"] is False, "raw PLA/ABS publisher files cannot be committed")

dic = json.loads(DIC.read_text(encoding="utf-8"))
need(dic["status"] == "retrieved-profile-blocked-external-dic-workbook-not-delivered", "DIC blocker state drifted")
need(dic["deliveredWorkbookProfile"]["chartCount"] == 20, "DIC chart count drifted")
need(dic["deliveredWorkbookProfile"]["externalWorkbookSheetDelivered"] is False, "missing DIC source workbook cannot be treated as delivered")
need(dic["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "DIC source must stay non-counting")
need(dic["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "DIC source cannot claim external chart samples")

stage1 = json.loads(STAGE1.read_text(encoding="utf-8"))
ztkc = next(x for x in stage1["sources"] if x["datasetId"] == "mendeley-ztkc87d6sr-v1")
need(ztkc["state"] == "publisher-record-no-files-exposed", "Nylon/SiC publisher blocker drifted")
need(ztkc["countsAsFullyProfiledMeasuredDataset"] is False, "Nylon/SiC cannot count without files")
need(ztkc["acceptedMeasuredTimeSeriesSamples"] == 0, "Nylon/SiC cannot claim samples")
print("MouldMaster Wave 2 batch 2 evidence QA passed")
