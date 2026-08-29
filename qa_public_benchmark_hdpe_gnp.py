from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/hdpe-gnp-4h98rz9f92-v3.json"
RUNNER = ROOT / "tools/run_public_benchmark_hdpe_gnp.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported HDPE/GNP contract schema")
need(x.get("datasetId") == "mendeley-4h98rz9f92-v3", "HDPE/GNP dataset id drifted")
need(x.get("status") == "public-open-profile-candidate", "HDPE/GNP contract status drifted")
s = x["source"]
need(s["datasetDoi"] == "10.17632/4h98rz9f92.3", "HDPE/GNP DOI drifted")
need(s["version"] == 3, "HDPE/GNP version drifted")
need(s["license"] == "CC BY 4.0", "HDPE/GNP licence drifted")
ctx = x["experimentContext"]
need(ctx["reportedExperimentalConditions"] == 35, "HDPE/GNP experiment count drifted")
need(ctx["measuredOutcomes"] == ["tensile modulus", "toughness", "hardness"], "HDPE/GNP outcomes drifted")
rules = x["acceptanceRules"]
need(rules["measuredMechanicalOutcomesMustBeSeparatedFromDerivedClassesAndPredictions"] is True, "measured/derived boundary missing")
need(rules["recordLevelNotHighFrequencyTimeSeries"] is True, "record-level boundary missing")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "HDPE/GNP cannot claim waveform samples")
text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "data.mendeley.com/public-api/datasets",
    "tensileModulus",
    "toughness",
    "hardness",
    "directMeasuredOutcomeCells",
    "selectedMeasuredTable",
    "recordLevelMeasuredOutcomeValues",
    "selected[\"directMeasuredOutcomeCells\"] == 105",
    "acceptedMeasuredTimeSeriesSamples\": 0",
    "rawRowsOrCellValuesUploadedAsArtifact\": False",
]:
    need(marker in text, f"HDPE/GNP runner guard missing: {marker}")
print("MouldMaster HDPE/GNP measured benchmark QA passed")
