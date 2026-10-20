from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/iguzzini-road-lenses-v1.json"
RESULT = ROOT / "data/public-benchmark-results/iguzzini-road-lenses-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_iguzzini.py"

def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported iGuzzini contract schema")
need(x.get("datasetId") == "iguzzini-road-lenses", "iGuzzini dataset id drifted")
need(x.get("status") == "accepted-restricted-profile", "iGuzzini promoted status drifted")
s = x["source"]
need(s["pinnedCommit"] == "41b8f392923d37b50b5098ed918dd2f0de1bc328", "iGuzzini source commit drifted")
need(s["gitBlobSha"] == "1ca731e1e80451f6ebf857f3db69bc9f4566d073", "iGuzzini blob drifted")
need(s["sizeBytes"] == 127056, "iGuzzini source size drifted")
need(s["peerReviewedCompanion"] == "10.3390/info13060272", "iGuzzini paper DOI drifted")
need(s["standardOpenDataLicense"] is False, "do not invent standard open-data licence")
need(s["rawRedistributionAllowed"] is False, "restricted terms must not become raw redistribution")
need(s["automatedAggregateProfilingAllowedForResearchEducation"] is True, "educational aggregate profiling gate missing")
ctx = x["experimentContext"]
need(ctx["publisherReportedRows"] == 1451, "reported iGuzzini row count drifted")
need(ctx["publisherReportedProcessFeatures"] == 13, "reported iGuzzini feature count drifted")
need(ctx["reportedClassCountSum"] == 1446, "reported class-count sum drifted")
need(ctx["reportedClassCountDiscrepancy"] == 5, "1451 vs class-count discrepancy must stay explicit")
need(ctx["deliveredQualityClasses"] == {"1": 370, "2": 406, "3": 310, "4": 365}, "delivered iGuzzini quality counts drifted")
need(ctx["recordLevelMeasuredProcessValues"] == 18863, "delivered iGuzzini record-level process values drifted")
rules = x["acceptanceRules"]
need(rules["recordLevelNotHighFrequencyTimeSeries"] is True, "iGuzzini record-level boundary missing")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "iGuzzini cannot claim high-frequency samples")
need(rules["rawRowsCommittedOrArtifacted"] is False, "raw rows cannot be retained")
need(rules["useScopeMustRemainResearchEducationOnly"] is True, "restricted-use scope missing")

result = json.loads(RESULT.read_text(encoding="utf-8"))
need(result.get("status") == "accepted-restricted-profile", "committed iGuzzini result status drifted")
need((result.get("acceptance") or {}).get("countsAsFullyProfiledMeasuredDataset") is True, "iGuzzini result acceptance missing")
need((result.get("acceptance") or {}).get("acceptedMeasuredTimeSeriesSamples") == 0, "iGuzzini result cannot inflate time-series samples")
need((result.get("source") or {}).get("rawRedistributionAllowed") is False, "iGuzzini committed result widened raw rights")
need((result.get("profile") or {}).get("deliveredQualityCounts") == {"1": 370, "2": 406, "3": 310, "4": 365}, "iGuzzini committed class reconciliation drifted")

text = RUNNER.read_text(encoding="utf-8")
for marker in ["git_blob_sha", "raw.githubusercontent.com", "sep=\";\"", "deliveredQualityCounts", "recordLevelMeasuredProcessValues", "acceptedMeasuredTimeSeriesSamples\": 0", "research-and-education-only", "rawRowsUploadedAsArtifact\": False"]:
    need(marker in text, f"iGuzzini runner guard missing: {marker}")
print("MouldMaster iGuzzini restricted-use benchmark QA passed (accepted exact-source educational profile; raw redistribution remains disabled)")
