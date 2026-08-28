from pathlib import Path
import argparse
import json
import re

EXPECTED_DOI = "10.17632/gtnb4j7bfx.1"
EXPECTED_VERSION = "1"
EXPECTED_LICENSE = "CC BY 4.0"
EXPECTED_ROWS = 4502
EXPECTED_COLUMNS = 26
EXPECTED_SOURCE_SHA256 = "b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f"
EXPECTED_SELECTION_METHOD = "v1-spanish-schema+documented-machine-prefix"
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
need(int(file_info.get("data_rows", 0)) == EXPECTED_ROWS, f"expected {EXPECTED_ROWS} injection rows")
need(int(file_info.get("columns", 0)) == EXPECTED_COLUMNS, f"expected {EXPECTED_COLUMNS} canonical injection columns")
need(int(file_info.get("size_bytes", 0)) > 0, "profiled source table has no file size")
need(file_info.get("sha256") == EXPECTED_SOURCE_SHA256, "profiled Mendeley v1 workbook SHA-256 drifted")
need(file_info.get("filename") == "modelo.xlsx", "profiled publisher filename drifted")
need(file_info.get("worksheet") == "nicky", "profiled workbook sheet drifted")

container = report.get("source_container", {})
need(int(container.get("size_bytes", 0)) > 0, "publisher source container has no file size")
need(container.get("sha256") == EXPECTED_SOURCE_SHA256, "publisher source SHA-256 drifted")
need(container.get("publisher_filename") == "modelo.xlsx", "publisher container filename drifted")
need(container.get("publisher_file_id") == "5a234943-9f9d-45de-b82f-de0c64809dd7", "publisher file UUID drifted")

process = report.get("process_context", {})
need(process.get("declared") == "injection-moulding", "benchmark process context is not injection moulding")
selection = process.get("selection_evidence", {})
need(selection.get("method") == EXPECTED_SELECTION_METHOD, "benchmark process-separation method drifted")
need(selection.get("mixed_process_rows_emitted") is False, "mixed injection/blow rows were emitted")
partition = selection.get("machine_partition_counts") or {}
need(partition == {"injection_rows": 4502, "blow_rows_excluded": 1855, "unclassified_rows": 0}, "measured machine partition does not match publisher v1 evidence")
need(not selection.get("blow_specific_header_matches"), "blow-only columns survived canonical injection normalization")

missing = report.get("missing_value_policy", {})
need(missing.get("zero_fill_performed") is False, "benchmark silently zero-filled missing data")
need(report.get("raw_values_emitted") is False, "benchmark emitted raw row values")

schema = report.get("schema", {})
present = set(schema.get("present_expected_columns", []))
need(len(present) == EXPECTED_COLUMNS, f"expected all {EXPECTED_COLUMNS} contract columns, found {len(present)}")
need(REQUIRED_COLUMNS <= present, f"core injection fields missing: {sorted(REQUIRED_COLUMNS - present)}")
need(schema.get("missing_expected_columns") == [], "canonical injection contract still has missing columns")
need(schema.get("unexpected_columns") == [], "unexpected source/blow columns survived normalization")
need(len(schema.get("columns", [])) == EXPECTED_COLUMNS, "profile column count disagrees with canonical schema")

normalization = report.get("normalization", {})
need(normalization.get("row_values_written_to_report") is False, "normalization emitted raw row values")
need(normalization.get("contract_columns_present") == EXPECTED_COLUMNS, "normalization mapping is incomplete")
need(normalization.get("contract_columns_missing") == 0, "normalization reports missing contract columns")
need("no unit conversion" in normalization.get("unit_policy", "").lower(), "unit boundary missing")
need("unresolved" in normalization.get("command_actual_policy", "").lower(), "command/actual uncertainty boundary missing")

retrieval = report.get("retrieval", {})
need(retrieval.get("mode") == "automated-public-publisher-retrieval", "benchmark was not retrieved from publisher lane")
need(retrieval.get("raw_files_retained_in_report") is False, "report claims raw files retained")
need(retrieval.get("raw_files_intended_for_artifact_upload") is False, "workflow intends to upload raw files")

# Safety language is intentionally present as negative/limiting wording. Do not reject
# phrases merely because a safe sentence contains terms such as "recommended setpoints".
interpretation = report.get("interpretation", {})
guardrails = [str(x).lower() for x in interpretation.get("guardrails", [])]
evidence_gaps = [str(x).lower() for x in interpretation.get("evidence_gaps", [])]
need(any("do not treat" in x and "recommended setpoint" in x for x in guardrails), "historical-value/no-setpoint guardrail missing")
need(any("does not establish physical root cause" in x for x in evidence_gaps), "correlation/root-cause limitation missing")
need(any("does not establish a validated setting window" in x for x in evidence_gaps), "validated-window limitation missing")
need("human engineering review is required" in interpretation.get("boundary", "").lower(), "human-review boundary missing")
need("no result authorises a production change" in interpretation.get("boundary", "").lower(), "production-change boundary missing")
need("not a site pilot" in report.get("benchmark_boundary", "").lower(), "site-pilot separation boundary missing")
need("production-change authority" in report.get("benchmark_boundary", "").lower(), "production authority boundary missing")

print(
    "MouldMaster public measured benchmark result QA passed "
    f"({file_info['data_rows']} injection rows; {len(present)} canonical fields; SHA-256 pinned; raw rows excluded)"
)
