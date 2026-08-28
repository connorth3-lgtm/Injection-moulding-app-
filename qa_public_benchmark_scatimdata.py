from pathlib import Path
import importlib.util
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "data/public-benchmark-contracts/scatimdata-avaps-v1.json"
RUNNER = ROOT / "tools/run_public_benchmark_scatimdata_avaps.py"
WORKFLOW = ROOT / ".github/workflows/public-benchmark-scatimdata-avaps.yml"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


for path in [CONTRACT, RUNNER]:
    need(path.exists(), f"missing AVAPS benchmark dependency: {path.relative_to(ROOT)}")

obj = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(obj.get("schema") == 1, "AVAPS contract schema drifted")
need(obj.get("datasetId") == "scatimdata-avaps", "AVAPS dataset ID drifted")
source = obj.get("source") or {}
need(source.get("repositoryCommit") == "7bd35941d75c97a3f276439377dc430ab47402be", "AVAPS source commit drifted")
need(source.get("license") == "CC BY 4.0", "AVAPS licence drifted")
need(source.get("peerReviewedCompanion") == "10.3390/polym15040978", "AVAPS companion DOI drifted")

archives = obj.get("archives") or []
need([a.get("name") for a in archives] == ["dataset1.zip", "dataset2.zip", "dataset3.zip"], "AVAPS archive set drifted")
need([a.get("expectedCycles") for a in archives] == [1167, 829, 1332], "AVAPS delivered-cycle expectations drifted")
need(sum(a.get("expectedCycles", 0) for a in archives) == 3328, "AVAPS cycle total drifted")
need(all(len(str(a.get("gitBlobSha1", ""))) == 40 for a in archives), "AVAPS Git blob fingerprint missing")
need(all(int(a.get("sizeBytes", 0)) > 5_000_000 for a in archives), "AVAPS archive sizes unexpectedly small")

mc = obj.get("measurementContract") or {}
need(mc.get("pointsPerSignalPerCycle") == 2049, "AVAPS point count drifted")
need(mc.get("signalsPerCycle") == 2, "AVAPS signal count drifted")
need(mc.get("timeSeriesValuesPerCycle") == 4098, "AVAPS time-series values/cycle drifted")
need(mc.get("sampleIntervalMilliseconds") == 6, "AVAPS sample interval drifted")
need(mc.get("expectedMeasuredTimeSeriesSamples") == 13_638_144, "AVAPS measured sample total drifted")
need(mc.get("expectedMeasuredTimeSeriesSamples") == mc.get("cycleCount") * mc.get("timeSeriesValuesPerCycle"), "AVAPS sample arithmetic does not reconcile")

p = subprocess.run([sys.executable, "-m", "py_compile", str(RUNNER)], capture_output=True, text=True)
need(p.returncode == 0, "AVAPS runner Python syntax error: " + (p.stderr or p.stdout))
runner = RUNNER.read_text(encoding="utf-8")
for marker in [
    "rawValuesEmitted",
    "rawPublisherFilesCommitted",
    "rawPublisherFilesUploadedAsArtifact",
    "safe_members",
    "sha256_file",
    "shutil.rmtree(workspace",
]:
    need(marker in runner, f"AVAPS runner boundary missing: {marker}")
for forbidden in ["git add", "git commit", "git push", "read_pickle", "pickle.load", "joblib.load"]:
    need(forbidden not in runner, f"AVAPS runner contains forbidden operation: {forbidden}")

if WORKFLOW.exists():
    wf = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        "MouldMaster Public Measured Benchmark — scatimdata AVAPS",
        "qa_public_benchmark_scatimdata.py",
        "run_public_benchmark_scatimdata_avaps.py",
        "actions/upload-artifact@v4",
        "rm -rf .benchmark-work",
    ]:
        need(marker in wf, f"AVAPS workflow missing marker: {marker}")
    for forbidden in ["*.zip", "*.csv", "publisher/**", ".benchmark-work/**"]:
        need(forbidden not in wf, f"AVAPS workflow must not upload raw measured data: {forbidden}")

print("MouldMaster scatimdata AVAPS benchmark QA passed (pinned 3-archive source; 3,328 cycles; 13,638,144 candidate measured time-series samples; raw-data boundaries enforced)")
