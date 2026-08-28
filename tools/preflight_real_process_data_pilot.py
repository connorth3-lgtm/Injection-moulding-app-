#!/usr/bin/env python3
"""Privacy-preserving preflight for a prepared real injection-moulding pilot CSV.

This tool validates whether a prepared site file is structurally/governance-ready for
human MouldMaster diagnostic evaluation. It never emits raw row values, ranges,
setpoints, identifiers, or category labels beyond the fixed canonical phase names.
It does not declare a pilot complete and it does not authorise production changes.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sys
from collections import Counter
from pathlib import Path

REQUIRED_HEADERS = {
    "shot_index",
    "cavity_alias",
    "machine_alias",
    "mould_alias",
    "material_alias",
    "lot_alias",
    "phase",
    "fill_time_s",
    "transfer_position_mm",
    "transfer_pressure_mpa",
    "cushion_mm",
    "recovery_time_s",
    "cycle_time_s",
    "quality_result",
    "defect_alias",
    "intervention_code",
}

PHASE_MAP = {
    "baseline": "baseline",
    "known-good": "baseline",
    "known_good": "baseline",
    "fault": "fault",
    "drift": "fault",
    "test": "test",
    "intervention": "test",
    "recovery": "recovery",
    "verification": "verification",
}
CANONICAL_PHASES = ["baseline", "fault", "test", "recovery", "verification"]

PHYSICAL_SIGNAL_HEADERS = [
    "fill_time_s",
    "transfer_position_mm",
    "transfer_pressure_mpa",
    "cushion_mm",
    "recovery_time_s",
    "cycle_time_s",
    "tcu_supply_c",
    "tcu_return_c",
    "tcu_flow_lpm",
    "resin_moisture_ppm",
    "hot_runner_actual_c",
    "part_mass_g",
    "dimension_value",
    "peak_cavity_pressure_mpa",
    "pressure_time_area",
    "cooling_time_s",
    "supply_temp_c",
    "return_temp_c",
    "flow_lmin",
]

FORBIDDEN_HEADER_TOKENS = {
    "customer",
    "operator",
    "person",
    "employee",
    "name",
    "email",
    "phone",
    "address",
    "timestamp",
    "datetime",
    "serial_number",
    "asset_tag",
    "free_text",
    "comment",
}

CONFIRMATION_ARGS = [
    "confirm_site_authorised",
    "confirm_prepared_file_approved",
    "confirm_units_reviewed",
    "confirm_command_actual_reviewed",
    "confirm_raw_retained_under_site_governance",
    "confirm_independent_finding_available",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def is_number(value: str) -> bool:
    if value is None:
        return False
    s = str(value).strip()
    if not s:
        return False
    try:
        x = float(s)
    except ValueError:
        return False
    return math.isfinite(x)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, type=Path)
    p.add_argument("--output", required=True, type=Path)
    p.add_argument("--confirm-site-authorised", action="store_true")
    p.add_argument("--confirm-prepared-file-approved", action="store_true")
    p.add_argument("--confirm-units-reviewed", action="store_true")
    p.add_argument("--confirm-command-actual-reviewed", action="store_true")
    p.add_argument("--confirm-raw-retained-under-site-governance", action="store_true")
    p.add_argument("--confirm-independent-finding-available", action="store_true")
    p.add_argument(
        "--synthetic-test-fixture",
        action="store_true",
        help="Marks the run as regression-only; never use this flag for measured site data.",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    path = args.input
    if not path.is_file():
        raise SystemExit(f"input file not found: {path}")

    file_sha = sha256(path)
    file_size = path.stat().st_size

    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            headers = []
        headers = [h.strip() for h in headers]
        rows = [row for row in reader if any(str(v).strip() for v in row)]

    row_count = len(rows)
    width = len(headers)
    empty_header_count = sum(not h for h in headers)
    duplicate_header_count = sum(count - 1 for count in Counter(h for h in headers if h).values() if count > 1)
    row_width_mismatch_count = sum(len(row) != width for row in rows)
    normalized_rows = [dict(zip(headers, row + [""] * max(0, width - len(row)))) for row in rows]

    missing_required = sorted(REQUIRED_HEADERS - set(headers))
    forbidden_header_count = 0
    for h in headers:
        lower = h.lower()
        if any(token in lower for token in FORBIDDEN_HEADER_TOKENS):
            forbidden_header_count += 1

    shot_missing = shot_nonnumeric = shot_duplicate = shot_non_increasing = 0
    shot_values = []
    for row in normalized_rows:
        raw = str(row.get("shot_index", "")).strip()
        if not raw:
            shot_missing += 1
            continue
        if not is_number(raw):
            shot_nonnumeric += 1
            continue
        shot_values.append(float(raw))
    shot_duplicate = len(shot_values) - len(set(shot_values))
    for a, b in zip(shot_values, shot_values[1:]):
        if b <= a:
            shot_non_increasing += 1

    canonical_phase_counts = Counter({p: 0 for p in CANONICAL_PHASES})
    invalid_phase_count = 0
    for row in normalized_rows:
        raw = str(row.get("phase", "")).strip().lower()
        mapped = PHASE_MAP.get(raw)
        if mapped:
            canonical_phase_counts[mapped] += 1
        else:
            invalid_phase_count += 1

    structure = {}
    for key in ["cavity_alias", "machine_alias", "mould_alias", "material_alias", "lot_alias"]:
        values = [str(r.get(key, "")).strip() for r in normalized_rows]
        structure[key] = {
            "nonmissing_count": sum(bool(v) for v in values),
            "missing_count": sum(not v for v in values),
            "distinct_alias_count": len({v for v in values if v}),
        }

    signal_profiles = []
    usable_signal_count = 0
    for key in PHYSICAL_SIGNAL_HEADERS:
        if key not in headers:
            continue
        values = [str(r.get(key, "")).strip() for r in normalized_rows]
        nonmissing = [v for v in values if v]
        numeric = sum(is_number(v) for v in nonmissing)
        invalid_numeric = len(nonmissing) - numeric
        if numeric > 0 and invalid_numeric == 0:
            usable_signal_count += 1
        signal_profiles.append(
            {
                "name": key,
                "nonmissing_count": len(nonmissing),
                "missing_count": row_count - len(nonmissing),
                "numeric_count": numeric,
                "invalid_numeric_count": invalid_numeric,
            }
        )

    quality_values = [str(r.get("quality_result", "")).strip() for r in normalized_rows]
    intervention_values = [str(r.get("intervention_code", "")).strip() for r in normalized_rows]

    confirmations = {name: bool(getattr(args, name)) for name in CONFIRMATION_ARGS}

    technical_failures = []
    if row_count < 2:
        technical_failures.append("prepared file must contain at least two data rows")
    if empty_header_count:
        technical_failures.append("one or more CSV headers are blank")
    if duplicate_header_count:
        technical_failures.append("duplicate headers are present")
    if row_width_mismatch_count:
        technical_failures.append("one or more data rows do not match the header column count")
    if missing_required:
        technical_failures.append("required prepared-pilot headers are missing")
    if forbidden_header_count:
        technical_failures.append("prepared file still contains direct/person/timestamp/free-text header classes")
    if shot_missing or shot_nonnumeric or shot_duplicate or shot_non_increasing:
        technical_failures.append("shot_index is not complete, numeric, unique and strictly increasing")
    if invalid_phase_count:
        technical_failures.append("one or more phase labels are outside the controlled phase vocabulary")
    if canonical_phase_counts["baseline"] == 0:
        technical_failures.append("no baseline/known-good phase is present")
    if canonical_phase_counts["fault"] == 0:
        technical_failures.append("no fault/drift phase is present")
    if usable_signal_count < 4:
        technical_failures.append("fewer than four usable numeric physical evidence signals are present")

    technical_passed = not technical_failures
    governance_passed = all(confirmations.values())
    ready_for_diagnostic_evaluation = technical_passed and governance_passed

    evidence_gaps = []
    if canonical_phase_counts["test"] == 0:
        evidence_gaps.append("No controlled test/intervention phase is represented in the prepared file.")
    if canonical_phase_counts["recovery"] == 0:
        evidence_gaps.append("No recovery phase is represented in the prepared file.")
    if canonical_phase_counts["verification"] == 0:
        evidence_gaps.append("No verification phase is represented in the prepared file.")
    if not confirmations["confirm_independent_finding_available"]:
        evidence_gaps.append("An independently investigated finding or defensible engineering review has not been confirmed available.")

    if args.synthetic_test_fixture:
        status = "synthetic-regression-only"
    elif ready_for_diagnostic_evaluation:
        status = "evaluation-ready-human-comparison-required"
    else:
        status = "preflight-not-ready"

    report = {
        "schema_version": 1,
        "status": status,
        "synthetic_test_fixture": bool(args.synthetic_test_fixture),
        "file": {
            "sha256": file_sha,
            "size_bytes": file_size,
            "data_rows": row_count,
            "columns": width,
            "row_width_mismatch_count": row_width_mismatch_count,
        },
        "privacy": {
            "raw_values_emitted": False,
            "forbidden_header_count": forbidden_header_count,
            "duplicate_header_count": duplicate_header_count,
            "empty_header_count": empty_header_count,
            "unknown_header_names_emitted": False,
        },
        "schema": {
            "missing_required_headers": missing_required,
            "required_headers_present": len(REQUIRED_HEADERS) - len(missing_required),
            "required_headers_total": len(REQUIRED_HEADERS),
        },
        "sequence": {
            "missing_shot_index_count": shot_missing,
            "nonnumeric_shot_index_count": shot_nonnumeric,
            "duplicate_shot_index_count": shot_duplicate,
            "non_increasing_transition_count": shot_non_increasing,
        },
        "phases": {
            "canonical_counts": dict(canonical_phase_counts),
            "invalid_or_missing_phase_count": invalid_phase_count,
        },
        "structure": structure,
        "physical_signals": {
            "usable_numeric_signal_count": usable_signal_count,
            "profiles": signal_profiles,
        },
        "quality": {
            "nonmissing_count": sum(bool(v) for v in quality_values),
            "missing_count": sum(not v for v in quality_values),
            "distinct_label_count": len({v for v in quality_values if v}),
        },
        "interventions": {
            "nonmissing_count": sum(bool(v) for v in intervention_values),
            "missing_count": sum(not v for v in intervention_values),
            "distinct_code_count": len({v for v in intervention_values if v}),
        },
        "confirmations": confirmations,
        "technical_checks_passed": technical_passed,
        "governance_confirmations_passed": governance_passed,
        "ready_for_diagnostic_evaluation": ready_for_diagnostic_evaluation,
        "technical_failures": technical_failures,
        "evidence_gaps": evidence_gaps,
        "completion_boundary": (
            "Passing this preflight does not complete the MouldMaster real-data pilot. "
            "Pilot completion still requires human comparison of MouldMaster reasoning with an independently "
            "investigated engineering finding, a documented learning/content conclusion, and evidence retained "
            "under the site's approved governance process. No result authorises a production change or defines "
            "a universal process window, setpoint or machine/mould/material limit."
        ),
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.synthetic_test_fixture:
        return 0 if technical_passed else 2
    return 0 if ready_for_diagnostic_evaluation else 2


if __name__ == "__main__":
    sys.exit(main())
