from pathlib import Path
import importlib.util
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / "tools"
RUNNER = TOOLS / "run_public_benchmark_gtnb4j7bfx.py"
ADAPTER = TOOLS / "run_public_benchmark_gtnb4j7bfx_public_api.py"
PROFILER = TOOLS / "profile_public_benchmark.py"
WORKFLOW = ROOT / ".github/workflows/public-benchmark-gtnb4j7bfx.yml"
RELEASE_WORKFLOW = ROOT / ".github/workflows/qa.yml"
CONTRACT = ROOT / "data/public-benchmark-contracts/gtnb4j7bfx-v1.json"


def need(ok, message):
    if not ok:
        raise AssertionError(message)


for path in [RUNNER, ADAPTER, PROFILER, WORKFLOW, RELEASE_WORKFLOW, CONTRACT]:
    need(path.exists(), f"public benchmark dependency missing: {path.relative_to(ROOT)}")

p = subprocess.run([sys.executable, "-m", "py_compile", str(RUNNER), str(ADAPTER), str(PROFILER)], capture_output=True, text=True)
need(p.returncode == 0, "public benchmark Python syntax error: " + (p.stderr or p.stdout))

sys.path.insert(0, str(TOOLS))
spec = importlib.util.spec_from_file_location("mm_public_benchmark_runner", RUNNER)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

adapter_spec = importlib.util.spec_from_file_location("mm_public_benchmark_adapter", ADAPTER)
adapter = importlib.util.module_from_spec(adapter_spec)
adapter_spec.loader.exec_module(adapter)

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

# Version-pinned Mendeley v1 regression: one Spanish workbook/sheet, exactly
# 4,502 injection rows and 1,855 blow rows, translated to 26 canonical fields.
source_headers = [source_name for source_name, _ in adapter.SOURCE_TO_CANONICAL] + sorted(adapter.BLOW_SOURCE_HEADERS)
need(len(source_headers) == 33 and len(set(source_headers)) == 33, "v1 source schema fixture must contain 33 unique columns")
machine_i = source_headers.index("Maquina")
fixture_rows = []
for i in range(adapter.EXPECTED_INJECTION_ROWS):
    row = [""] * len(source_headers)
    row[machine_i] = f"I{(i % 9) + 1}"
    fixture_rows.append(row)
for i in range(adapter.EXPECTED_BLOW_ROWS):
    row = [""] * len(source_headers)
    row[machine_i] = f"S{(i % 7) + 1}"
    fixture_rows.append(row)
source_item = {
    "path": Path(adapter.EXPECTED_PUBLISHER_FILE),
    "publisher_file_id": "5a234943-9f9d-45de-b82f-de0c64809dd7",
    "publisher_filename": adapter.EXPECTED_PUBLISHER_FILE,
    "sha256": "1" * 64,
    "size_bytes": 1,
}
source_candidate = {
    "source_item": source_item,
    "path": Path(adapter.EXPECTED_PUBLISHER_FILE),
    "sheet": adapter.EXPECTED_SHEET,
    "headers": source_headers,
    "rows": fixture_rows,
    "row_count": len(fixture_rows),
    "injection_hits": [],
    "blow_hits": [],
    "score": 0,
}
need(adapter.machine_class_counts(source_candidate) == {
    "injection_prefix": 4502, "blow_prefix": 1855, "blank": 0, "other": 0
}, "Spanish source machine partition regression failed")
source_selected = adapter.source_specific_injection_candidate([source_candidate])
need(source_selected is not None, "version-pinned Spanish source adapter failed closed on known-good schema")
need(len(source_selected["rows"]) == 4502, "Spanish source adapter did not isolate 4,502 injection rows")
need(len(source_selected["headers"]) == 26, "Spanish source adapter did not normalize to 26 canonical injection fields")
need(source_selected["headers"] == [x["name"] for x in contract["columns"]], "Spanish-to-canonical contract order drifted")
need(source_selected["machine_partition_counts"] == {
    "injection_rows": 4502, "blow_rows_excluded": 1855, "unclassified_rows": 0
}, "source-specific process separation evidence drifted")
need(source_selected["source_schema_translation"]["missing_cells_preserved"] is True, "source adapter must preserve missing cells")
need(source_selected["source_schema_translation"]["unit_conversion_performed"] is False, "source adapter must not silently convert units")

altered = dict(source_candidate)
altered["rows"] = fixture_rows[:-1]
altered["row_count"] = len(altered["rows"])
need(adapter.source_specific_injection_candidate([altered]) is None, "version-pinned adapter must fail closed if publisher row count changes")

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
    "run_public_benchmark_gtnb4j7bfx_public_api.py",
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

adapter_text = ADAPTER.read_text(encoding="utf-8")
for marker in [
    "EXPECTED_INJECTION_ROWS = 4502",
    "EXPECTED_BLOW_ROWS = 1855",
    "missing cells",
    "fails closed",
    "v1-spanish-schema+documented-machine-prefix",
]:
    need(marker in adapter_text, f"source-specific adapter boundary missing: {marker}")
for forbidden in ["git add", "git commit", "git push"]:
    need(forbidden not in adapter_text, f"adapter must not persist publisher data to Git: {forbidden}")

print("MouldMaster public benchmark runner QA passed (Mendeley v1 Spanish schema; 4502/1855 process separation; canonical 26-field mapping; no raw artifact path)")
