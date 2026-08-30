from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
EXT = json.loads((ROOT / "data/measured-dataset-wave2-batch5-extension-v1.json").read_text(encoding="utf-8"))
ZEN = json.loads((ROOT / "data/public-benchmark-results/zenodo-energy-20338544-v1.json").read_text(encoding="utf-8"))
CONTRACT = json.loads((ROOT / "data/public-benchmark-contracts/zenodo-energy-20338544-v1.json").read_text(encoding="utf-8"))
AD = json.loads((ROOT / "data/public-benchmark-results/ad-stgn-injection-moulding-v1-stage1.json").read_text(encoding="utf-8"))
PROFILER = (ROOT / "tools/profile_zenodo_energy_20338544.py").read_text(encoding="utf-8")


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(EXT["delta"]["inventoriedMeasuredSources"] == 2, "batch-5 inventory delta drifted")
need(EXT["delta"]["fullyProfiledMeasuredFamilies"] == 1, "batch-5 family delta drifted")
need(EXT["delta"]["acceptedInjectionProcessTimeSeriesValues"] == 19_048_305, "batch-5 waveform delta drifted")
need(EXT["effective"]["acceptedInjectionProcessTimeSeriesValues"] == 85_569_824, "batch-5 waveform reconciliation drifted")

need(ZEN["schema"] == 2 and ZEN["status"] == "completed-public-measured-timeseries-benchmark", "Zenodo energy completed status drifted")
need(ZEN["source"]["doi"] == "10.5281/zenodo.20338544", "Zenodo energy DOI drifted")
need(ZEN["source"]["accessStatus"] == "open" and ZEN["source"]["license"].lower() == "cc-by-4.0", "Zenodo energy rights drifted")
need(ZEN["rawProductionFilesAccepted"] == 2 and ZEN["rawProductionRowsAccepted"] == 1_269_887, "Zenodo accepted production stream boundary drifted")
need(ZEN["acceptedMeasuredTimeSeriesSamples"] == 19_048_305, "Zenodo accepted scalar count drifted")
need(len(ZEN["measurementSemantics"]["directInstrumentReportedPhysicalChannels"]) == 15, "Zenodo direct channel count drifted")
need(set(ZEN["measurementSemantics"]["derivedOrAggregateExcludedFromScalarLedger"]) == {"A_PF","B_PF","C_PF","TOTAL_ACT_POWER","TOTAL_APRT_POWER","TOTAL_CURRENT"}, "Zenodo derived/aggregate exclusion drifted")
need(ZEN["measurementSemantics"]["testDatasetExcludedFromScalarLedger"] is True, "Zenodo overlap/test exclusion drifted")
need(ZEN["rawSourceRowsCommitted"] is False and ZEN["rawSourceFilesCommitted"] is False, "Zenodo raw-data boundary drifted")
need(CONTRACT["measurementBoundary"]["acceptedMeasuredTimeSeriesSamples"] == ZEN["acceptedMeasuredTimeSeriesSamples"], "Zenodo contract/result count mismatch")

expected = {
    "feb_production.csv": ("3b2daf123be817b271529b909e19edc5", "8a728a72f7fd4cf3821f244db0b31410bd27da0ca1997fc766673d044cf9da4c", 816925),
    "mar_production.csv": ("12dd28a9e8a12ed734c3ca4398f93d1b", "26ea166c06180969e64e4055996b2609b9f13efa45080b7d674a546abb1d8d36", 452962),
    "test_dataset.csv": ("2a19cfa6f2fc569723e3ad8d78d8e418", "259d7cfa903320cb5a2d51c816771f07b0b39a701d2a1b4bde8bfb491fee5fee", 2901),
}
for f in ZEN["files"]:
    md5, sha, rows = expected[f["name"]]
    need((f["md5"], f["sha256"], f["table"]["rows"]) == (md5, sha, rows), f"Zenodo fingerprint/row drift: {f['name']}")
for marker in ["DIRECT_PHASE_CHANNELS", "DERIVED_OR_AGGREGATE_CHANNELS", "EXPECTED_SHA256", "EXPECTED_ROWS", "promotion_ready", "testDatasetExcludedFromScalarLedger", "acceptedMeasuredTimeSeriesSamples"]:
    need(marker in PROFILER, f"Zenodo profiler guard missing: {marker}")

need(AD["status"] == "publisher-record-no-files-exposed", "AD-STGN live blocker state drifted")
need(AD["source"]["license"] == "CC BY 4.0", "AD-STGN licence drifted")
need(AD["publisherEvidence"]["publicRootFilesReturned"] == 0 and AD["publisherEvidence"]["publicFilesWithoutFolderReturned"] == 0, "AD-STGN no-files evidence drifted")
need(AD["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is False and AD["acceptance"]["acceptedMeasuredTimeSeriesSamples"] == 0, "AD-STGN metadata must remain non-counting")
need(AD["retrieval"]["rawPublisherFilesDownloaded"] is False, "AD-STGN must not imply publisher payload possession")

print("MouldMaster Wave-2 batch-5 source QA passed: Zenodo 19,048,305 direct values accepted; AD-STGN retained as zero-value publisher-payload blocker")
