from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/fhj5p7ww9v-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_fhj5p7ww9v.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported PP foam contract schema")
need(x.get("datasetId") == "mendeley-fhj5p7ww9v-v1", "PP foam dataset id drifted")
need(x.get("status") == "restricted-noncommercial-profile-candidate", "PP foam profile status drifted")
s = x["source"]
need(s["datasetDoi"] == "10.17632/fhj5p7ww9v.1", "PP foam DOI drifted")
need(s["license"] == "CC BY-NC 3.0", "PP foam licence drifted")
need(s["commercialReuseAllowed"] is False, "noncommercial restriction missing")
need(s["rawRedistributionAllowedUnderProjectPolicy"] is False, "raw redistribution must remain disabled")
need(s["expectedPublisherFile"] == "DATA - COST.xlsx", "publisher file identity drifted")
rules = x["acceptanceRules"]
need(rules["measuredOutcomesMustBeSeparatedFromDerivedPercentages"] is True, "measured/derived boundary missing")
need(rules["recordLevelNotHighFrequencyTimeSeries"] is True, "record-level boundary missing")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "record-level source cannot claim high-frequency samples")
need(rules["useScopeMustRemainNonCommercial"] is True, "noncommercial use scope missing")

text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "expectedPublisherFile",
    "publisherSha256",
    "measuredOutcomeColumns",
    "derivedOutcomeColumns",
    "recordLevelMeasuredValues",
    "acceptedMeasuredTimeSeriesSamples\": 0",
    "rawRowsOrCellValuesUploadedAsArtifact\": False",
]:
    need(marker in text, f"PP foam runner guard missing: {marker}")
need("commercialReuseAllowed\": False" in text, "runner must preserve noncommercial boundary")
print("MouldMaster PP foam restricted measured benchmark QA passed")
