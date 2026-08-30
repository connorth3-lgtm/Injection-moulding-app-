from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/6k8fpbrd9s-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_6k8fpbrd9s_stage1.py"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

x = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(x.get("schema") == 1, "unsupported pvT contract schema")
need(x.get("datasetId") == "mendeley-6k8fpbrd9s-v1", "pvT dataset id drifted")
need(x.get("status") == "metadata-profile-candidate", "pvT stage-one status drifted")
s = x["source"]
need(s["datasetDoi"] == "10.17632/6k8fpbrd9s.1", "pvT DOI drifted")
need(s["license"] == "CC BY 4.0", "pvT licence drifted")
ctx = x["experimentContext"]
need(ctx["material"] == "polypropylene", "pvT material drifted")
need(ctx["measurementDevice"] == "piston-die pvT testing device", "pvT device drifted")
need(set(ctx["expectedDirectMeasurements"]) == {"pressure", "temperature", "specific volume"}, "pvT measurement semantics drifted")
need("not an injection-moulding cycle dataset" in ctx["injectionMouldingRelevance"], "pvT cycle boundary missing")
rules = x["stage1Rules"]
need(rules["publisherManifestFirst"] is True, "pvT manifest-first gate missing")
need(rules["downloadPayloads"] is False, "pvT stage one cannot download payloads")
need(rules["doNotCountAsInjectionMouldingCycleDataset"] is True, "pvT cycle exclusion missing")
need(rules["acceptedMeasuredTimeSeriesSamples"] == 0, "pvT cannot add samples in stage one")
need(rules["countsAsFullyProfiledMeasuredDataset"] is False, "pvT cannot be accepted before source profiling")
text = RUNNER.read_text(encoding="utf-8")
for marker in ["data.mendeley.com/public-api/datasets", "supportedStage2Files", "rawPayloadDownloaded\": False", "rawPayloadsDownloaded\": False", "acceptedMeasuredTimeSeriesSamples\": 0"]:
    need(marker in text, f"pvT runner guard missing: {marker}")
need("file_downloaded" not in text, "pvT stage one must not retrieve publisher payloads")
print("MouldMaster polypropylene pvT metadata-only stage-one QA passed")
