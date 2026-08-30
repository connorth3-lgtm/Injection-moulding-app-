from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/fhj5p7ww9v-v1.json"
RESULT = ROOT / "data/public-benchmark-results/fhj5p7ww9v-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_fhj5p7ww9v.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported PP foam contract schema")
need(x.get("datasetId") == "mendeley-fhj5p7ww9v-v1", "PP foam dataset id drifted")
need(x.get("status") == "accepted-profiled-restricted-noncommercial", "PP foam accepted status drifted")
s = x["source"]
need(s["datasetDoi"] == "10.17632/fhj5p7ww9v.1", "PP foam DOI drifted")
need(s["license"] == "CC BY-NC 3.0", "PP foam licence drifted")
need(s["commercialReuseAllowed"] is False, "noncommercial restriction missing")
need(s["rawRedistributionAllowedUnderProjectPolicy"] is False, "raw redistribution must remain disabled")
need(s["expectedPublisherFile"] == "DATA - COST.xlsx", "publisher file identity drifted")
need(s["acceptedPublisherSha256"] == "1cf9f038f2f9b968c7a78787ce6f9c684d50108542002e491f5979357725ce5e", "accepted publisher hash drifted")
need(x["experimentContext"]["acceptedMeasuredOutcomeValues"] == 96, "PP foam accepted outcome count drifted")
rules = x["acceptanceRules"]
need(rules["measuredOutcomesMustBeSeparatedFromDerivedPercentages"] is True, "measured/derived boundary missing")
need(rules["processFactorsDeviationRowsAndFormulaComparisonsExcludedFromDirectMeasuredCount"] is True, "PP foam exclusion boundary missing")
need(rules["recordLevelNotHighFrequencyTimeSeries"] is True, "record-level boundary missing")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "record-level source cannot claim high-frequency samples")
need(rules["useScopeMustRemainNonCommercial"] is True, "noncommercial use scope missing")
need(x["acceptanceEvidence"]["workflowRunId"] == 33231197349, "PP foam acceptance run drifted")

result = json.loads(RESULT.read_text(encoding="utf-8"))
need(result["status"] == "completed-restricted-noncommercial-measured-benchmark", "PP foam result must remain completed")
need(result["source"]["sha256"] == s["acceptedPublisherSha256"], "PP foam contract/result hash mismatch")
need(result["source"].get("publisherSha256Matched") is True, "PP foam publisher hash match missing")
need(result["profile"]["recordLevelMeasuredOutcomeValues"] == 96, "PP foam result measured-outcome count drifted")
need(result["profile"]["acceptedMeasuredTimeSeriesSamples"] == 0, "PP foam result cannot add waveform samples")
need(result["acceptance"]["countsAsFullyProfiledMeasuredDataset"] is True, "PP foam result acceptance drifted")
need(result["acceptance"]["commercialReuseAllowed"] is False, "PP foam result cannot widen commercial rights")

text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "expectedPublisherFile",
    "publisherSha256",
    "MATERIAL_ROWS",
    "PROCESS_ROWS",
    "SPREAD_ROWS",
    "directMeasuredOutcomeCells",
    "recordLevelMeasuredOutcomeValues",
    "formulaCellsExcludedAsDerived",
    "acceptedMeasuredTimeSeriesSamples\": 0",
    "rawRowsOrCellValuesUploadedAsArtifact\": False",
]:
    need(marker in text, f"PP foam runner guard missing: {marker}")
need("recognized_sheets == 3 and total_direct == 96" in text, "exact 3-sheet / 96-outcome reconciliation gate missing")
need("commercialReuseAllowed\": False" in text, "runner must preserve noncommercial boundary")
print("MouldMaster PP foam accepted restricted measured benchmark QA passed")
