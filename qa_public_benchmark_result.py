from pathlib import Path
import argparse
import json
import re

EXPECTED_DOI = "10.17632/gtnb4j7bfx.1"
EXPECTED_VERSION = "1"
EXPECTED_LICENSE = "CC BY 4.0"
REQUIRED_COLUMNS = {
    "Machine", "Mold_Cavities", "Injection_Pressure", "Retention_Pressure",
    "Melt_Temp", "Mold_Temp", "Cycle_Time", "Cooling_Time_Injection",
    "Ejection_Time_Injection", "Retention_Time_Injection", "Injection_Speed",
}
FORBIDDEN_KEYS = {"rows", "records", "samples", "sample_values", "raw_values", "raw_rows"}


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def walk(value, path="root"):
    if isinstance(value, dict):
        for key, child in value.items():
            need(key.lower() not in FORBIDDEN_KEYS, f"raw-value key emitted: {path}.{key}")
            walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            walk(child, f"{path}[{index}]")


parser = argparse.ArgumentParser()
parser.add_argument("report", type=Path)
args = parser.parse_args()
report = json.loads(args.report.read_text(encoding="utf-8"))
walk(report)

need(report.get("status") == "public-measured-benchmark-profile-generated-review-required", "benchmark status is not review-gated measured profile")
source = report.get("source", {})
need(source.get("doi") == EXPECTED_DOI, "benchmark DOI mismatch")
need(str(source.get("version")) == EXPECTED_VERSION, "benchmark version mismatch")
need(source.get("license") == EXPECTED_LICENSE, "benchmark licence mismatch")
need(source.get("publisher") == "Mendeley Data", "benchmark publisher mismatch")

file_info = report.get("file", {})
need(int(file_info.get("data_rows", 0)) > 0, "benchmark contains no injection-moulding rows")
need(int(file_info.get("columns", 0)) >= 10, "benchmark schema is unexpectedly narrow")
need(int(file_info.get("size_bytes", 0)) > 0, "profiled source table has no file size")
need(re.fullmatch(r"[0-9a-f]{64}", str(file_info.get("sha256", ""))) is not None, "profiled table SHA-256 invalid")

container = report.get("source_container", {})
need(int(container.get("size_bytes", 0)) > 0, "publisher source container has no file size")
need(re.fullmatch(r"[0-9a-f]{64}", str(container.get("sha256", ""))) is not None, "publisher source SHA-256 invalid")

process = report.get("process_context", {})
need(process.get("declared") == "injection-moulding", "benchmark process context is not injection moulding")
selection = process.get("selection_evidence", {})
need(selection.get("method"), "process separation method missing")
need(selection.get("mixed_process_rows_emitted") is False, "mixed injection/blow rows were emitted")
need(not selection.get("blow_specific_header_matches") or selection.get("machine_partition_counts"), "blow schema present without documented row partition evidence")

missing = report.get("missing_value_policy", {})
need(missing.get("zero_fill_performed") is False, "benchmark silently zero-filled missing data")
need(report.get("raw_values_emitted") is False, "benchmark emitted raw row values")

schema = report.get("schema", {})
present = set(schema.get("present_expected_columns", []))
need(len(present & REQUIRED_COLUMNS) >= 7, f"too few core injection fields matched the source contract: {sorted(present & REQUIRED_COLUMNS)}")
need(len(schema.get("columns", [])) == int(file_info["columns"]), "profile column count disagrees with schema profile")

normalization = report.get("normalization", {})
need(normalization.get("row_values_written_to_report") is False, "normalization emitted raw row values")
need(normalization.get("contract_columns_present", 0) >= len(present), "normalization mapping is incomplete")
need("no unit conversion" in normalization.get("unit_policy", "").lower(), "unit boundary missing")
need("unresolved" in normalization.get("command_actual_policy", "").lower(), "command/actual uncertainty boundary missing")

retrieval = report.get("retrieval", {})
need(retrieval.get("mode") == "automated-public-publisher-retrieval", "benchmark was not retrieved from publisher lane")
need(retrieval.get("raw_files_retained_in_report") is False, "report claims raw files retained")
need(retrieval.get("raw_files_intended_for_artifact_upload") is False, "workflow intends to upload raw files")

text = json.dumps(report).lower()
for forbidden_claim in [
    "validated process window",
    "recommended setpoint",
    "production authority",
    "root cause proven",
]:
    need(forbidden_claim not in text, f"unsafe benchmark claim present: {forbidden_claim}")
need("not a site pilot" in report.get("benchmark_boundary", "").lower(), "site-pilot separation boundary missing")
need("production-change authority" in report.get("benchmark_boundary", "").lower(), "production authority boundary missing")

print(
    "MouldMaster public measured benchmark result QA passed "
    f"({file_info['data_rows']} injection rows; {len(present)} contract columns; raw rows excluded)"
)
