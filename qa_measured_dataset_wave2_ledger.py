from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
WAVE = json.loads((ROOT / "data/measured-dataset-wave2-ledger-v1.json").read_text(encoding="utf-8"))
EXT = json.loads((ROOT / "data/measured-dataset-wave2-extension-v1.json").read_text(encoding="utf-8"))
BASE_TARGETS = json.loads((ROOT / "data/content-scale-targets.json").read_text(encoding="utf-8"))["targets"]
BASE_INV = json.loads((ROOT / "data/measured-dataset-inventory-v1.json").read_text(encoding="utf-8"))


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(WAVE.get("schema") == 1, "Wave-2 ledger schema drifted")
need(WAVE["baseWave"]["fullyProfiledMeasuredDatasetFamilies"] == 7, "Wave-2 base family count drifted")
need(WAVE["baseWave"]["acceptedMeasuredTimeSeriesSamples"] == 66_521_519, "Wave-2 base waveform count drifted")
summary = WAVE["summary"]
need(summary["wave2SourcesReviewed"] == 12, "Wave-2 reviewed-source count drifted")
need(summary["wave2FullyProfiledAccepted"] == 7, "Wave-2 accepted-family delta drifted")
need(summary["effectiveFullyProfiledMeasuredDatasetFamilies"] == 14, "Wave-2 effective family count drifted")
need(summary["effectiveAcceptedMeasuredTimeSeriesSamples"] == 66_521_519, "Wave-2 must not inflate process waveform count")
need(summary["wave2RecordLevelMeasuredOutcomeValues"] == 1110, "Wave-2 direct record-level outcome count drifted")
need(summary["wave2MaterialCharacterizationDirectPhysicalValues"] == 28_590, "Wave-2 direct physical characterization count drifted")
need(summary["wave2MaterialCharacterizationTraceMeasurementCells"] == 84_482, "Wave-2 characterization trace total drifted")
need(summary["wave2MaterialTestTraceValues"] == 142_884, "Wave-2 material-test trace count drifted")

checkpoint = EXT["baseCheckpoint"]
need(checkpoint == {
    "mainCommit": "d9dc3c5e3e01adaf65e7072f340ccd0b8470bc6a",
    "inventoriedMeasuredSources": 25,
    "automatedIngestionAllowed": 14,
    "fullyProfiledMeasuredFamilies": 12,
    "acceptedInjectionProcessTimeSeriesValues": 66_521_519,
}, "Wave-2 extension must remain pinned to the landed 25/14/12 checkpoint")
need(EXT["delta"]["inventoriedMeasuredSources"] == 6, "Wave-2 inventory extension delta drifted")
need(EXT["delta"]["automatedIngestionAllowed"] == 5, "Wave-2 executable extension delta drifted")
need(EXT["delta"]["fullyProfiledMeasuredFamilies"] == 2, "Wave-2 family extension delta drifted")
need(EXT["delta"]["acceptedInjectionProcessTimeSeriesValues"] == 0, "Wave-2 extension must add zero process waveform values")
need(EXT["delta"]["acceptedMaterialCharacterizationTraceValues"] == 78_456, "XRD/XPS trace delta drifted")
need(EXT["effective"]["inventoriedMeasuredSources"] == 31, "effective inventory count drifted")
need(EXT["effective"]["automatedIngestionAllowed"] == 19, "effective executable count drifted")
need(EXT["effective"]["fullyProfiledMeasuredFamilies"] == 14, "effective family count drifted")
need(EXT["effective"]["acceptedInjectionProcessTimeSeriesValues"] == 66_521_519, "effective waveform total drifted")
need(EXT["effective"]["wave2MaterialCharacterizationTraceValues"] == 84_482, "effective Wave-2 trace total drifted")

need(BASE_TARGETS["fully_profiled_measured_datasets"]["currentAccepted"] == 12, "landed base checkpoint family count must remain immutable")
need(BASE_TARGETS["fully_profiled_measured_datasets"]["currentDiscovered"] == 25, "landed base checkpoint discovery count must remain immutable")
need(BASE_TARGETS["measured_time_series_samples"]["currentAccepted"] == 66_521_519, "landed base checkpoint waveform count drifted")
need(BASE_INV["summary"]["datasets"] == 25 and BASE_INV["summary"]["automatedIngestionAllowed"] == 14, "landed base inventory checkpoint drifted")

by_id = {x["datasetId"]: x for x in WAVE["sources"]}
need(by_id["mendeley-8c8fjwcw86-v1"]["countsAsFullyProfiledMeasuredDataset"] is True, "XRD family not promoted")
need(by_id["mendeley-8c8fjwcw86-v1"]["acceptedMaterialCharacterizationTraceValues"] == 6_588, "XRD trace count drifted")
need(by_id["mendeley-crmb7xjymg-v1"]["acceptedMaterialCharacterizationTraceValues"] == 71_868, "XPS trace count drifted")
need(by_id["mendeley-597jrsm9zm-v1"]["countsAsFullyProfiledMeasuredDataset"] is False, "597 documentation must remain non-counting")
need(by_id["mendeley-c3pt29jt7c-v1"]["externalWorkbookToken"] == "[1]PP6523_DIC!", "c3 external workbook blocker drifted")
need(by_id["mendeley-ztkc87d6sr-v1"]["state"] == "publisher-record-no-files-exposed", "ztkc payload blocker drifted")
need(by_id["strathclyde-rtim-tablets-v1"]["state"] == "retrieval-blocked-http", "Strathclyde retrieval blocker drifted")
for rec in WAVE["sources"]:
    need(rec.get("acceptedMeasuredTimeSeriesSamples", 0) == 0, f"Wave-2 source must not add process waveform samples: {rec['datasetId']}")

print("Wave-2 extension QA passed: base 25/14/12 checkpoint preserved; effective 31 inventoried / 19 executable / 14 fully profiled / 66,521,519 waveform values; XRD+XPS add 78,456 characterization trace values")
