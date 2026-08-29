from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/mendeley-wave2-batch3-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_mendeley_wave2_batch3.py"


def need(ok, msg):
    if not ok: raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported batch3 contract schema")
need(len(x.get("sources", [])) == 3, "batch3 must contain exactly three sources")
expected = {
    "mendeley-8c8fjwcw86-v1": ("10.17632/8c8fjwcw86.1", "CC BY 4.0"),
    "mendeley-597jrsm9zm-v1": ("10.17632/597jrsm9zm.1", "CC BY-NC 3.0"),
    "mendeley-crmb7xjymg-v1": ("10.17632/crmb7xjymg.1", "CC BY 4.0"),
}
for s in x["sources"]:
    need(s["datasetId"] in expected, f"unexpected batch3 source {s['datasetId']}")
    need((s["doi"], s["license"]) == expected[s["datasetId"]], f"source identity drifted for {s['datasetId']}")
r = x["stage1Rules"]
need(r["publisherMetadataOnly"] is True, "stage1 must remain metadata-only")
need(r["downloadPublisherPayloads"] is False, "stage1 cannot download source payloads")
need(r["rawRowsOrArraysEmitted"] is False, "stage1 cannot emit raw evidence")
need(r["countsAsFullyProfiledMeasuredDataset"] is False, "stage1 cannot accept datasets")
need(r["acceptedMeasuredTimeSeriesSamples"] == 0, "stage1 cannot claim samples")
need(r["mixedManufacturingRoutesMustBeSeparatedBeforeAcceptance"] is True, "mixed-route boundary missing")
need(r["restrictedNoncommercialRightsMustRemainRestricted"] is True, "noncommercial boundary missing")
text = RUNNER.read_text(encoding="utf-8")
for marker in ["data.mendeley.com/public-api/datasets", "public-files/datasets", "rawPayloadDownloaded\": False", "rawPayloadsDownloaded\": False", "countsAsFullyProfiledMeasuredDataset\": False", "acceptedMeasuredTimeSeriesSamples\": 0"]:
    need(marker in text, f"batch3 runner guard missing: {marker}")
need("pd.read_" not in text and "load_workbook" not in text, "metadata-only stage cannot parse source payloads")
print("MouldMaster Mendeley Wave 2 batch 3 metadata QA passed")
