from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/mendeley-wave2-batch2-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_mendeley_wave2_batch2.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported batch2 contract schema")
need(len(x.get("sources", [])) == 3, "batch2 must contain exactly three audited sources")
expected = {
    "mendeley-c3pt29jt7c-v1": ("10.17632/c3pt29jt7c.1", "CC BY 4.0"),
    "mendeley-yxz2w7ctnh-v1": ("10.17632/yxz2w7ctnh.1", "CC BY 4.0"),
    "mendeley-ztkc87d6sr-v1": ("10.17632/ztkc87d6sr.1", "CC BY 4.0"),
}
for s in x["sources"]:
    need(s["datasetId"] in expected, f"unexpected source {s['datasetId']}")
    need((s["doi"], s["license"]) == expected[s["datasetId"]], f"source identity drifted for {s['datasetId']}")
rules = x["stage1Rules"]
need(rules["publisherMetadataOnly"] is True, "stage one must be metadata-only")
need(rules["downloadPublisherPayloads"] is False, "stage one cannot download publisher payloads")
need(rules["rawRowsOrArraysEmitted"] is False, "stage one cannot emit raw rows or arrays")
need(rules["countsAsFullyProfiledMeasuredDataset"] is False, "stage one cannot accept datasets")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "stage one cannot count samples")
text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "data.mendeley.com/public-api/datasets",
    "public-files/datasets",
    "rawPayloadDownloaded\": False",
    "rawPayloadsDownloaded\": False",
    "countsAsFullyProfiledMeasuredDataset\": False",
    "acceptedMeasuredTimeSeriesSamples\": 0",
    "publisher-record-no-files-exposed",
    "publisher-file-manifest-exposed",
]:
    need(marker in text, f"batch2 runner guard missing: {marker}")
need("urllib.request.urlopen" in text, "publisher metadata retrieval missing")
need(".read_excel" not in text and "pd.read_" not in text, "stage one must not parse source payloads")
print("MouldMaster Mendeley Wave 2 batch 2 metadata-only QA passed")
