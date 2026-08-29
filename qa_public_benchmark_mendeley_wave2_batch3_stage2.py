from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data/public-benchmark-results/mendeley-wave2-batch3-stage1.json"
RUNNER = ROOT / "tools/run_public_benchmark_mendeley_wave2_batch3_stage2.py"


def need(ok, msg):
    if not ok: raise AssertionError(msg)

x = json.loads(MANIFEST.read_text(encoding="utf-8"))
need(x["summary"]["publisherFileManifestExposed"] == 3, "all batch3 sources must expose files before stage2")
expected_counts = {"mendeley-8c8fjwcw86-v1":2,"mendeley-597jrsm9zm-v1":1,"mendeley-crmb7xjymg-v1":2}
for s in x["sources"]:
    need(s["datasetId"] in expected_counts, f"unexpected batch3 source {s['datasetId']}")
    need(len(s["apiFiles"]) == expected_counts[s["datasetId"]], f"file count drifted for {s['datasetId']}")
    for f in s["apiFiles"]: need(len(f["sha256"]) == 64, f"publisher SHA missing for {f['name']}")
text = RUNNER.read_text(encoding="utf-8")
for marker in ["publisher SHA mismatch", "profile_docx", "profile_pptx", "profile_pdf", "profile_vms", "profile_opju", "safeSemanticTextLabels", "rawPublisherFileCommitted\": False", "rawNumericValuesEmitted\": False", "acceptedMeasuredTimeSeriesSamples\": 0"]:
    need(marker in text, f"batch3 stage2 guard missing: {marker}")
need("sanitize_text" in text, "numeric sanitization missing")
need("<n>" in text, "numeric token redaction marker missing")
print("MouldMaster Wave 2 batch 3 structural QA passed")
