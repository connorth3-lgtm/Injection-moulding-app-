from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
LEDGER = ROOT / "data/measured-dataset-wave2-ledger-v1.json"
PVT = ROOT / "data/public-benchmark-results/6k8fpbrd9s-v1.json"
PP_FOAM = ROOT / "data/public-benchmark-results/fhj5p7ww9v-v1.json"
AD_STGN = ROOT / "data/public-benchmark-results/ad-stgn-injection-moulding-v1-stage1.json"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(LEDGER.read_text(encoding="utf-8"))
need(x["schema"] == 1, "unsupported Wave 2 ledger schema")
need(x["version"] == "2026.08.29.2", "Wave 2 ledger version drifted")
need(x["baseWave"]["fullyProfiledMeasuredDatasetFamilies"] == 5, "base fully-profiled count drifted")
need(x["baseWave"]["acceptedMeasuredTimeSeriesSamples"] == 13929568, "base measured sample count drifted")

sources = {s["datasetId"]: s for s in x["sources"]}
need(set(sources) == {"ad-stgn-injection-moulding-v1", "mendeley-fhj5p7ww9v-v1", "mendeley-6k8fpbrd9s-v1"}, "Wave 2 source set drifted")

ad = sources["ad-stgn-injection-moulding-v1"]
need(ad["state"] == "publisher-record-no-files-exposed", "AD-STGN blocker state drifted")
need(ad["countsAsFullyProfiledMeasuredDataset"] is False, "blocked AD-STGN source cannot count")
need(ad["acceptedMeasuredTimeSeriesSamples"] == 0, "blocked AD-STGN source cannot add samples")

foam = sources["mendeley-fhj5p7ww9v-v1"]
need(foam["state"] == "accepted-profiled-restricted-noncommercial", "PP foam acceptance state drifted")
need(foam["license"] == "CC BY-NC 3.0", "PP foam licence drifted")
need(foam["recordLevelMeasuredOutcomeValues"] == 96, "PP foam measured outcome count drifted")
need(foam["commercialReuseAllowed"] is False, "PP foam noncommercial restriction widened")
need(foam["acceptedMeasuredTimeSeriesSamples"] == 0, "PP foam record-level values cannot inflate samples")

pvt = sources["mendeley-6k8fpbrd9s-v1"]
need(pvt["state"] == "accepted-profiled-material-characterization", "pvT acceptance state drifted")
need(pvt["license"] == "CC BY 4.0", "pvT licence drifted")
need(pvt["injectionMouldingCycleDataset"] is False, "pvT material source cannot become a cycle dataset")
need(pvt["deliveredNumericCells"] == 31817, "pvT numeric cell count drifted")
need(pvt["deliveredDirectPhysicalValueCells"] == 28590, "pvT direct physical count drifted")
need(pvt["materialCharacterizationTraceMeasurementCells"] == 6026, "pvT trace count drifted")
need(pvt["acceptedMeasuredTimeSeriesSamples"] == 0, "pvT material traces cannot inflate injection-cycle sample metric")

s = x["summary"]
need(s["wave2SourcesReviewed"] == 3, "Wave 2 reviewed count drifted")
need(s["wave2FullyProfiledAccepted"] == 2, "Wave 2 accepted count drifted")
need(s["wave2PublisherPayloadBlocked"] == 1, "Wave 2 blocked count drifted")
need(s["effectiveFullyProfiledMeasuredDatasetFamilies"] == 7, "effective fully-profiled count drifted")
need(s["effectiveAcceptedMeasuredTimeSeriesSamples"] == 13929568, "effective sample count must remain unchanged")
need(s["wave2RecordLevelMeasuredOutcomeValues"] == 96, "record-level outcome count drifted")
need(s["wave2MaterialCharacterizationDirectPhysicalValues"] == 28590, "material direct physical count drifted")
need(s["wave2MaterialCharacterizationTraceMeasurementCells"] == 6026, "material trace count drifted")

b = x["boundaries"]
need(b["rawThirdPartyRowsOrFilesCommitted"] is False, "raw third-party data boundary widened")
need(b["materialCharacterizationCellCountsDoNotInflateInjectionCycleHighFrequencySampleMetric"] is True, "material/cycle metric boundary missing")
need(b["crossFigureMaterialCharacterizationReuseIsNotClaimedAsDeduplicatedExperiments"] is True, "deduplication caveat missing")

p = json.loads(PVT.read_text(encoding="utf-8"))
need(p["source"]["sha256"] == "14c056dd86e11cc47e1e97834174631f9dc0806442917a7149ddf5856dc9b11c", "pvT fingerprint drifted")
need(p["profile"]["deliveredNumericCells"] == 31817, "pvT committed result drifted")
need(p["profile"]["deliveredDirectPhysicalValueCells"] == 28590, "pvT committed direct-physical count drifted")
need(p["profile"]["materialCharacterizationTraceMeasurementCells"] == 6026, "pvT committed trace count drifted")
need(p["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is True, "pvT committed result lost acceptance")
need(p["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "pvT committed result inflated cycle samples")

f = json.loads(PP_FOAM.read_text(encoding="utf-8"))
need(f["profile"]["recordLevelMeasuredOutcomeValues"] == 96, "PP foam committed result drifted")
need(f["acceptance"]["commercialReuseAllowed"] is False, "PP foam committed rights widened")

a = json.loads(AD_STGN.read_text(encoding="utf-8"))
need(a["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False, "AD-STGN blocker result drifted")
need(a["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "AD-STGN blocker result inflated samples")

print("MouldMaster Wave 2 measured-dataset ledger QA passed")
