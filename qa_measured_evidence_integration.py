from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
JS = ROOT / "measured-evidence-integration.js"
INDEX = ROOT / "index.html"
SW = ROOT / "service-worker.js"
CLOSEOUT = ROOT / "data/measured-data-collection-closeout-2026-08-30.json"
BATCH5 = ROOT / "data/measured-dataset-wave2-batch5-extension-v1.json"

def need(ok, msg):
    if not ok:
        raise AssertionError(msg)

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

js = JS.read_text(encoding="utf-8")
index = INDEX.read_text(encoding="utf-8")
sw = SW.read_text(encoding="utf-8")
closeout = load(CLOSEOUT)
batch5 = load(BATCH5)

expected_ids = {
    "mendeley-gtnb4j7bfx-v1",
    "scatimdata-avaps",
    "openmms-t4g",
    "cross-process-chain-17240390",
    "impure-pascoe-2022",
    "forinfpro-himd-v1",
    "iguzzini-road-lenses",
    "mendeley-fhj5p7ww9v-v1",
    "mendeley-6k8fpbrd9s-v1",
    "mendeley-4h98rz9f92-v3",
    "pmc4753395-hdpe-cenosphere-v1",
    "mendeley-8c8fjwcw86-v1",
    "mendeley-yxz2w7ctnh-v1",
    "mendeley-crmb7xjymg-v1",
    "mendeley-ypf95p4bs4-v1",
    "mendeley-ztkc87d6sr-v1",
    "zenodo-energy-20338544",
}
ids = re.findall(r"\bid:'([^']+)'", js)
need(len(ids) == 17, f"runtime registry must expose exactly 17 families, got {len(ids)}")
need(len(set(ids)) == 17, "runtime registry contains duplicate family ids")
need(set(ids) == expected_ids, f"runtime family set drifted: missing={sorted(expected_ids-set(ids))}, extra={sorted(set(ids)-expected_ids)}")

wave_counts = [int(x) for x in re.findall(r"\btimeSeries:(\d+)", js)]
need(len(wave_counts) == 17, "every runtime family must declare timeSeries count explicitly")
need(sum(wave_counts) == 85_569_824, f"runtime waveform total drifted: {sum(wave_counts)}")
need(sum(1 for x in wave_counts if x > 0) == 6, "exactly six fully profiled families should contribute process/mould waveform values")

canonical = closeout["canonicalEffectiveState"]
need(canonical == {
    "inventoriedMeasuredSources": 34,
    "rightsExecutableSources": 21,
    "fullyProfiledMeasuredFamilies": 17,
    "acceptedInjectionProcessTimeSeriesValues": 85_569_824,
}, "collection closeout canonical state drifted")
need(batch5["effective"]["fullyProfiledMeasuredFamilies"] == 17, "batch-5 effective family count drifted")
need(batch5["effective"]["acceptedInjectionProcessTimeSeriesValues"] == 85_569_824, "batch-5 waveform total drifted")

for token in [
    "CANONICAL={inventoried:34,rightsExecutable:21,fullyProfiled:17,timeSeriesValues:85569824}",
    "window.MM_MEASURED_EVIDENCE",
    "Canonical measured evidence",
    "Measured data behind this topic",
    "Browse all 17 measured families",
    "record-level",
    "material characterisation",
    "process waveform",
    "do not supply universal settings",
    "or override the validated machine/mould/material/site process",
]:
    need(token in js, f"missing measured-evidence runtime boundary/integration marker: {token}")

for surface in ["#lesson article.lesson-body", "diagnosticLabs", "processDataLabs", "mmMouldMasterWorkspace"]:
    need(surface in js, f"measured-evidence runtime is not integrated with required surface: {surface}")
need("/material.*lab/i" in js, "material-lab runtime hook missing")
need("function hasTopic" in js and "hasTopic(t,k)" in js, "token-safe short-topic matcher missing")
need("t.includes(k)" not in js, "ambiguous substring matcher must not be used directly for short technical tags")

restricted_ids = {"iguzzini-road-lenses", "mendeley-fhj5p7ww9v-v1", "mendeley-ztkc87d6sr-v1"}
for did in restricted_ids:
    pattern = re.compile(r"\{id:'" + re.escape(did) + r"'.*?restricted:true", re.S)
    need(pattern.search(js), f"restricted-use boundary missing for {did}")
need(js.count("restricted:true") == 3, "restricted family count drifted")
need("raw third-party" in js.lower(), "runtime scope must state raw third-party payload boundary")

need("./measured-evidence-integration.js" in index, "index runtime loader missing measured-evidence-integration.js")
need("./measured-evidence-integration.js" in sw, "offline CORE missing measured-evidence-integration.js")
release_qa = (ROOT / ".github/workflows/qa.yml").read_text(encoding="utf-8")
need("find . -maxdepth 1 -type f -name '*.js'" in release_qa, "Release QA filesystem JavaScript syntax gate missing")
need("python qa_measured_evidence_integration.py" in release_qa, "Release QA integration gate missing")

# Metadata-only safeguard: runtime may contain counts and labels, but no third-party row arrays or sampled signal arrays.
for forbidden in ["rawRows:[", "samples:[", "signalValues:[", "measurements:[["]:
    need(forbidden not in js, f"runtime must remain metadata-only; found forbidden raw-array marker {forbidden}")

report = {
    "schema": 1,
    "result": "pass",
    "runtimeFamilies": len(ids),
    "waveformContributingFamilies": sum(1 for x in wave_counts if x > 0),
    "acceptedInjectionProcessTimeSeriesValues": sum(wave_counts),
    "restrictedUseFamilies": len(restricted_ids),
    "surfaces": ["lesson", "diagnostic labs", "process-data diagnostics", "material labs", "Mould Master workspace"],
    "rawThirdPartyPayloadEmbedded": False,
}
(ROOT / "measured-evidence-integration-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster measured-evidence integration QA passed (17 canonical families; 85,569,824 process time-series values; metadata-only runtime evidence bridge)")
