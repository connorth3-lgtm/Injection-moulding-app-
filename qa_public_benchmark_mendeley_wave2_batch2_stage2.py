from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data/public-benchmark-results/mendeley-wave2-batch2-stage1.json"
RUNNER = ROOT / "tools/run_public_benchmark_mendeley_wave2_batch2_stage2.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(MANIFEST.read_text(encoding="utf-8"))
by_id = {s["datasetId"]: s for s in x["sources"]}
for did, file_count in {"mendeley-c3pt29jt7c-v1": 1, "mendeley-yxz2w7ctnh-v1": 4}.items():
    need(did in by_id, f"missing stage1 source {did}")
    s = by_id[did]
    need(s["state"] == "publisher-file-manifest-exposed", f"{did} is not executable")
    need(len(s["apiFiles"]) == file_count, f"{did} publisher file count drifted")
    need(s["license"] == "CC BY 4.0", f"{did} licence drifted")
    for f in s["apiFiles"]:
        need(len(f["sha256"]) == 64, f"{did} missing publisher SHA")
text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "publisherSha256Matched",
    "rawPublisherFileCommitted\": False",
    "rawRowsOrNumericValuesEmitted\": False",
    "numericConstantCells",
    "formulaCells",
    "textLabels",
    "countsAsFullyProfiledMeasuredDataset\": False",
    "acceptedMeasuredTimeSeriesSamples\": 0",
]:
    need(marker in text, f"stage2 guard missing: {marker}")
need("load_workbook" in text, "workbook structural profiler missing")
need("publisher SHA mismatch" in text, "publisher fingerprint enforcement missing")
print("MouldMaster Mendeley Wave 2 batch 2 stage-two QA passed")
