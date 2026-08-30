from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
WAVE = json.loads((ROOT / "data/measured-dataset-wave2-ledger-v1.json").read_text(encoding="utf-8"))
TARGETS = json.loads((ROOT / "data/content-scale-targets.json").read_text(encoding="utf-8"))["targets"]
INV = json.loads((ROOT / "data/measured-dataset-inventory-v1.json").read_text(encoding="utf-8"))

def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

need(WAVE.get("schema") == 1, "Wave-2 ledger schema drifted")
base = WAVE.get("baseWave") or {}
summary = WAVE.get("summary") or {}
need(base.get("fullyProfiledMeasuredDatasetFamilies") == 7, "Wave-2 base family count drifted")
need(base.get("acceptedMeasuredTimeSeriesSamples") == 66521519, "Wave-2 base waveform count drifted")
need(summary.get("wave2FullyProfiledAccepted") == 4, "Wave-2 accepted family delta drifted")
need(summary.get("effectiveFullyProfiledMeasuredDatasetFamilies") == 11, "Wave-2 effective family count drifted")
need(summary.get("effectiveAcceptedMeasuredTimeSeriesSamples") == 66521519, "Wave-2 must not inflate process waveform count")
need(summary.get("wave2RecordLevelMeasuredOutcomeValues") == 621, "Wave-2 direct record-level outcome count drifted")
need(summary.get("wave2MaterialCharacterizationDirectPhysicalValues") == 28590, "Wave-2 material characterization count drifted")
need(summary.get("wave2MaterialTestTraceValues") == 142884, "Wave-2 material-test trace count drifted")
need(TARGETS["fully_profiled_measured_datasets"]["currentAccepted"] == 11, "target family count is not reconciled")
need(TARGETS["fully_profiled_measured_datasets"]["currentDiscovered"] == 24, "target discovered count is not reconciled")
need(TARGETS["measured_time_series_samples"]["currentAccepted"] == 66521519, "target process waveform count drifted")
need(INV["summary"]["datasets"] == 24 and INV["summary"]["automatedIngestionAllowed"] == 13, "Wave-2 inventory reconciliation drifted")
by_id = {x["datasetId"]: x for x in INV["datasets"]}
for did in ["mendeley-fhj5p7ww9v-v1","mendeley-6k8fpbrd9s-v1","mendeley-4h98rz9f92-v3","pmc4753395-hdpe-cenosphere-v1"]:
    need(did in by_id, f"missing Wave-2 inventory source: {did}")
    need((by_id[did]["count"].get("acceptedMeasuredTimeSeriesSamples") or 0) == 0, f"{did} must add zero process waveform samples")
need(by_id["mendeley-fhj5p7ww9v-v1"]["automatedIngestionAllowed"] is False, "CC BY-NC source must remain non-automated under project policy")
need(by_id["mendeley-6k8fpbrd9s-v1"]["automatedIngestionAllowed"] is True, "pvT CC BY source should be executable")
need(by_id["mendeley-4h98rz9f92-v3"]["automatedIngestionAllowed"] is True, "HDPE/GNP CC BY source should be executable")
need(by_id["pmc4753395-hdpe-cenosphere-v1"]["automatedIngestionAllowed"] is True, "PMC CC BY source should be executable")
print("Wave-2 family ledger QA passed (7 -> 11 families; 24 inventoried sources; 13 executable; process waveform total unchanged at 66,521,519)")
