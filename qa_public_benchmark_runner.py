from pathlib import Path
import importlib.util
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / "tools"
RUNNER = TOOLS / "run_public_benchmark_gtnb4j7bfx.py"
PROFILER = TOOLS / "profile_public_benchmark.py"
WORKFLOW = ROOT / ".github/workflows/public-benchmark-gtnb4j7bfx.yml"
RELEASE_WORKFLOW = ROOT / ".github/workflows/qa.yml"
CONTRACT = ROOT / "data/public-benchmark-contracts/gtnb4j7bfx-v1.json"


def need(ok, message):
    if not ok:
        raise AssertionError(message)


for path in [RUNNER, PROFILER, WORKFLOW, RELEASE_WORKFLOW, CONTRACT]:
    need(path.exists(), f"public benchmark dependency missing: {path.relative_to(ROOT)}")

p = subprocess.run([sys.executable, "-m", "py_compile", str(RUNNER), str(PROFILER)], capture_output=True, text=True)
need(p.returncode == 0, "public benchmark Python syntax error: " + (p.stderr or p.stdout))

sys.path.insert(0, str(TOOLS))
spec = importlib.util.spec_from_file_location("mm_public_benchmark_runner", RUNNER)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
need(module.DOI == "10.17632/gtnb4j7bfx.1", "runner DOI drifted")
need(module.DATASET_VERSION == "1", "runner dataset version drifted")
need(module.LICENSE == "CC BY 4.0", "runner licence drifted")
need(contract["dataset"]["doi"] == module.DOI, "runner/contract DOI mismatch")
need(str(contract["dataset"]["version"]) == module.DATASET_VERSION, "runner/contract version mismatch")
need(contract["dataset"]["license"] == module.LICENSE, "runner/contract licence mismatch")

headers = [
    "Machine", "Injection_Pressure", "Retention_Pressure", "Injection_Speed",
    "Pressure_Blown", "Blown_Air_Flow", "Cycle_Time",
]
rows = [
    ["I-01", "1000", "500", "80", "", "", "20"],
    ["I-02", "1100", "550", "82", "", "", "21"],
    ["S-01", "", "", "", "80", "120", "25"],
]
source = {
    "path": Path("mixed.csv"),
    "publisher_file_id": "fixture",
    "publisher_filename": "mixed.csv",
    "sha256": "0" * 64,
    "size_bytes": 1,
}
candidate = module.candidate_record(source, Path("mixed.csv"), None, headers, rows)
selected, method = module.select_injection_candidate([candidate])
need(method == "documented-machine-prefix-row-filter", "mixed-process table did not use documented machine partition")
need(len(selected["rows"]) == 2, "blow-moulding row was not excluded")
need(selected["machine_partition_counts"]["blow_rows_excluded"] == 1, "excluded blow-row count missing")

inj_headers = ["Machine", "Injection_Pressure", "Retention_Pressure", "Injection_Speed", "Melt_Temp", "Cycle_Time"]
inj = module.candidate_record(source, Path("injection.csv"), None, inj_headers, [["I-01", "1", "2", "3", "4", "5"]])
selected, method = module.select_injection_candidate([inj])
need(method == "schema-isolated", "injection-only table selection drifted")

mapping = module.canonical_mapping(["Injection pressure", "Melt Temp", "Cycle-Time"], contract)
present = {x["canonical_name"] for x in mapping if x["present"]}
need({"Injection_Pressure", "Melt_Temp", "Cycle_Time"} <= present, "canonical header normalization drifted")

try:
    module.assert_report_safe({"raw_values_emitted": False, "missing_value_policy": {"zero_fill_performed": False}, "rows": []})
except RuntimeError:
    pass
else:
    raise AssertionError("raw-row report guard failed open")

workflow = WORKFLOW.read_text(encoding="utf-8")
for marker in [
    "MouldMaster Public Measured Benchmark",
    "python qa_public_benchmark_runner.py",
    "run_public_benchmark_gtnb4j7bfx.py",
    "qa_public_benchmark_result.py",
    "benchmark-results/gtnb4j7bfx-v1-profile.json",
    "rm -rf .benchmark-work",
    "if-no-files-found: error",
]:
    need(marker in workflow, f"public benchmark workflow missing marker: {marker}")
for forbidden in [
    ".benchmark-work/**",
    "publisher/**",
    "*.csv",
    "*.xlsx",
]:
    need(forbidden not in workflow, f"workflow must not upload raw measured files: {forbidden}")

release = RELEASE_WORKFLOW.read_text(encoding="utf-8")
need("pull_request:" in workflow and "runner-qa:" in workflow, "public benchmark runner QA must run on pull requests")
need("public-measured-benchmark:" in workflow and "github.event_name != 'pull_request'" in workflow, "publisher retrieval must stay separate from PR-only regression QA")
need("python qa_process_data_local_intake.py" in release, "primary Release QA lost real-data intake coverage")

runner_text = RUNNER.read_text(encoding="utf-8")
for marker in [
    "raw values not emitted",
    "zero_fill_performed",
    "mixed injection/blow table",
    "documented-machine-prefix-row-filter",
    "shutil.rmtree(work_dir",
]:
    need(marker in runner_text, f"runner boundary missing: {marker}")
for forbidden in ["git add", "git commit", "git push"]:
    need(forbidden not in runner_text, f"runner must not persist publisher data to Git: {forbidden}")

print("MouldMaster public benchmark runner QA passed (publisher-only retrieval; process separation; canonical mapping; no raw artifact path)")
