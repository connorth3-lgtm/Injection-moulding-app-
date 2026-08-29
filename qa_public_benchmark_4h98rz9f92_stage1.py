from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/4h98rz9f92-v3.json"
RUNNER = ROOT / "tools/run_public_benchmark_4h98rz9f92_stage1.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x["schema"] == 1, "unsupported HDPE/GNP contract schema")
need(x["datasetId"] == "mendeley-4h98rz9f92-v3", "HDPE/GNP dataset id drifted")
need(x["status"] == "metadata-profile-candidate", "HDPE/GNP stage-one state drifted")
s = x["source"]
need(s["datasetDoi"] == "10.17632/4h98rz9f92.3", "HDPE/GNP DOI drifted")
need(s["version"] == 3, "HDPE/GNP version drifted")
need(s["license"] == "CC BY 4.0", "HDPE/GNP licence drifted")
need(s["companionArticleDoi"] == "10.1016/j.dib.2024.110987", "HDPE/GNP companion article drifted")
ctx = x["experimentContext"]
need(ctx["process"] == "injection moulding", "HDPE/GNP process drifted")
need(ctx["paperReportedExperimentalRows"] == 35, "HDPE/GNP paper row count drifted")
need(ctx["directMeasuredOutcomes"] == ["tensile modulus", "toughness", "hardness"], "HDPE/GNP direct outcome boundary drifted")
rules = x["stage1Rules"]
need(rules["downloadPayloads"] is False, "HDPE/GNP stage one cannot download payloads")
need(rules["paperReportedRowsDoNotCountWithoutDeliveredFiles"] is True, "paper/delivered evidence boundary missing")
need(rules["directMeasurementsMustBeSeparatedFromDerivedAndModelOutputs"] is True, "direct/derived boundary missing")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "HDPE/GNP stage one cannot claim samples")
need(rules["countsAsFullyProfiledMeasuredDataset"] is False, "HDPE/GNP cannot be accepted at stage one")
text = RUNNER.read_text(encoding="utf-8")
for marker in ["data.mendeley.com/public-api/datasets", "folder_id=root", "likelyExperimentalFilesByName", "likelyDerivedOrSupportingFilesByName", "rawPayloadsDownloaded\": False", "acceptedMeasuredTimeSeriesSamples\":0"]:
    need(marker in text, f"HDPE/GNP runner guard missing: {marker}")
need("get(file_url" not in text, "stage-one runner must not retrieve publisher file payloads")
need("request_bytes(PAGE" in text, "metadata-only HTML link fallback missing")
print("MouldMaster HDPE/GNP metadata-only stage-one QA passed")
