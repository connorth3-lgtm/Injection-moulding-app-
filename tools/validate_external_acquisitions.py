#!/usr/bin/env python3
"""Structural preflight for PRIVATE, rights-authorised industrial evidence.

This tool reads local CSVs supplied by a site operator, prints only aggregate
counts, never writes/prints raw source rows, and NEVER approves a measured
mechanism, production setpoint, controller change, or release validation.
Synthetic test fixtures may prove this validator, not establish real evidence.
"""
from __future__ import annotations

import argparse
import csv
from collections import defaultdict
import json
import math
from pathlib import Path

SCHEMAS = {
    "334": "black-speck-intervention-recovery-template.csv",
    "335": "hot-runner-synchronised-trace-template.csv",
    "336": "mould-maintenance-recovery-template.csv",
}
TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "data"
IDENTIFIERS = {"name", "email", "phone", "customer", "site", "operator_name",
               "learner_name", "customer_name", "employer", "employee_id"}


class EvidenceStructureError(ValueError):
    """The supplied private rows cannot support even a scoped structural review."""


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise EvidenceStructureError(reason)


def numeric(raw: str, label: str, *, minimum: float | None = None) -> float:
    require(raw is not None and str(raw).strip() != "", f"{label}: missing measured number")
    try:
        value = float(str(raw).strip())
    except (TypeError, ValueError):
        raise EvidenceStructureError(f"{label}: invalid numeric value") from None
    require(math.isfinite(value), f"{label}: NaN/infinity rejected")
    if minimum is not None:
        require(value >= minimum, f"{label}: outside nonnegative measurement domain")
    return value


def integer(raw: str, label: str, *, minimum: int = 0) -> int:
    v = numeric(raw, label, minimum=minimum)
    require(v.is_integer(), f"{label}: must be an integer")
    return int(v)


def mandatory(row: dict, *names: str) -> None:
    for name in names:
        value = str(row.get(name) or "").strip()
        require(bool(value) and len(value) <= 160, f"{name}: missing or oversized linkage/metadata")
        require("\n" not in value and "\r" not in value, f"{name}: multiline metadata rejected")


def verify_header(fields: list[str], issue: str) -> None:
    reference = (TEMPLATE_DIR / SCHEMAS[issue]).read_text(encoding="utf-8").splitlines()[0]
    expected = next(csv.reader([reference]))
    require(fields == expected, f"#{issue}: header mismatch from governed template")
    require(not (set(fields) & IDENTIFIERS), "direct identifying column is prohibited")


def check_black_speck(rows: list[dict]) -> dict:
    groups = defaultdict(list)
    for row in rows:
        mandatory(row, "record_id", "machine_alias", "mould_alias", "cavity_alias",
                  "material_alias", "lot_alias", "inspection_method",
                  "intervention_event_id", "intervention_type", "source_record_alias")
        n = integer(row["shot_index"], "shot_index", minimum=1)
        t = numeric(row["relative_time_s"], "relative_time_s")
        delta = int(numeric(row["relative_shot_from_intervention"], "relative_shot_from_intervention"))
        require(numeric(row["relative_shot_from_intervention"], "relative_shot_from_intervention") == delta,
                "intervention-relative shot must be an integer")
        count = integer(row["defect_count"], "defect_count")
        area = numeric(row["defect_area_mm2"], "defect_area_mm2", minimum=0)
        observed = str(row["defect_observed"]).strip().lower()
        require(observed in ("0", "1", "false", "true", "yes", "no"),
                "defect observation must be explicit true/false")
        require((count > 0 or area > 0) == (observed in ("1", "true", "yes")),
                "defect observation disagrees with measured count/area")
        if row.get("part_mass_g"):
            numeric(row["part_mass_g"], "part_mass_g", minimum=0)
        window = str(row.get("recovery_window_id") or "").strip()
        if delta > 0:
            require(bool(window), "post-intervention shot must identify recovery window")
        key = tuple(row[k] for k in ("machine_alias", "mould_alias", "cavity_alias",
                                     "material_alias", "lot_alias", "intervention_event_id"))
        groups[key].append((n, t, delta, str(row.get("verification_state") or "").lower(),
                            row["intervention_type"],window))
    require(groups, "no linked black-speck events")
    for observations in groups.values():
        ordered = sorted(observations)
        require(len({x[0] for x in ordered}) == len(ordered), "duplicate shot within intervention/cavity")
        require(all(ordered[i][1] < ordered[i + 1][1] for i in range(len(ordered) - 1)),
                "timestamps do not increase with shot order")
        require(all(ordered[i][2] < ordered[i + 1][2] for i in range(len(ordered) - 1)),
                "relative shot sequence is inconsistent")
        require(len([x for x in ordered if x[2] < 0]) >= 2,
                "at least two baseline shots before intervention required")
        post = [x for x in ordered if x[2] > 0]
        require(len(post) >= 2, "at least two distinct recovery shots required")
        require(any(x[3] == "verified" for x in post), "independent recovery verification missing")
        require(len({x[4] for x in ordered}) == 1, "intervention action identity drift")
        require(len({x[5] for x in post}) == 1, "recovery window identity drift")
    return {"linked_event_cavities": len(groups), "rows": len(rows)}


def check_hot_runner(rows: list[dict]) -> dict:
    groups = defaultdict(list)
    for row in rows:
        mandatory(row, "cycle_id", "machine_alias", "mould_alias", "gate_alias",
                  "cavity_alias", "command_state", "quality_record_id",
                  "quality_metric_name", "quality_metric_unit", "sensor_location_alias",
                  "calibration_record_id", "source_channel_alias")
        t = numeric(row["relative_time_ms"], "relative_time_ms", minimum=0)
        target = numeric(row["target_stroke_mm"], "target_stroke_mm", minimum=0)
        actual = numeric(row["actual_pin_position_mm"], "actual_pin_position_mm", minimum=0)
        pressure = numeric(row["cavity_pressure_mpa"], "cavity_pressure_mpa", minimum=0)
        quality = numeric(row["quality_metric_value"], "quality_metric_value")
        require(row.get("actuator_current_a") or row.get("actuator_torque_nm"),
                "measured actuator effort is missing")
        for key in ("actuator_current_a", "actuator_torque_nm"):
            if row.get(key):
                numeric(row[key], key, minimum=0)
        key = tuple(row[k] for k in ("cycle_id", "machine_alias", "mould_alias",
                                     "gate_alias", "cavity_alias"))
        groups[key].append((t, target, actual, pressure, row["command_state"],
                            row["quality_record_id"],row["quality_metric_name"],
                            row["quality_metric_unit"],quality,row["calibration_record_id"],
                            row["sensor_location_alias"]))
    require(groups, "no synchronized cycles")
    for stream in groups.values():
        stream.sort()
        require(len(stream) >= 3, "need >=3 synchronized samples per cycle/gate/cavity")
        require(len({x[0] for x in stream}) == len(stream), "duplicate time sample")
        require(len({x[2] for x in stream}) >= 2,
                "no sampled ACTUAL pin motion; command-only trace is insufficient")
        require(len({x[4] for x in stream}) >= 2, "no command transition present")
        require(len({x[5:9] for x in stream}) == 1,
                "quality measurement identity/value drift within cycle")
        require(len({x[9:] for x in stream}) == 1,
                "calibration and sensor location drift within cycle")
    return {"synchronized_gate_cavity_cycles": len(groups), "rows": len(rows)}


def check_maintenance(rows: list[dict]) -> dict:
    groups = defaultdict(list)
    for row in rows:
        mandatory(row,"record_id","asset_alias","mould_alias","cavity_alias",
                  "maintenance_event_id","condition_metric_name","condition_metric_unit",
                  "condition_method","part_quality_metric_name","part_quality_metric_unit",
                  "quality_method","maintenance_action_alias","source_record_alias")
        phase = str(row["phase"]).lower()
        require(phase in ("pre", "post"), "maintenance phase must be pre or post")
        n = integer(row["relative_sequence"], "relative_sequence")
        integer(row["exposure_shots"], "exposure_shots")
        condition = numeric(row["condition_metric_value"], "condition_metric_value")
        quality = numeric(row["part_quality_metric_value"], "part_quality_metric_value")
        key = tuple(row[k] for k in ("asset_alias", "mould_alias", "cavity_alias",
                                     "maintenance_event_id"))
        grouping = tuple(row[k] for k in ("condition_metric_name","condition_metric_unit",
                                          "condition_method","part_quality_metric_name",
                                          "part_quality_metric_unit","quality_method",
                                          "maintenance_action_alias"))
        groups[key].append((n,phase,grouping,condition,quality,
                            str(row["verification_state"]).lower()))
    require(groups,"no maintenance/recovery events")
    for observations in groups.values():
        seq = sorted(observations)
        require(len({x[0] for x in seq}) == len(seq), "duplicate relative sequence")
        require(len({x[2] for x in seq}) == 1, "pre/post metrics, units or methods differ")
        pre = [x for x in seq if x[1] == "pre"]
        post = [x for x in seq if x[1] == "post"]
        require(len(pre) >= 2 and len(post) >= 2,
                "at least two comparable pre and post observations required")
        require(max(x[0] for x in pre) < min(x[0] for x in post),
                "intervention chronology is ambiguous")
        require(any(x[5] == "verified" for x in post),
                "post-intervention independent recovery verification missing")
        # Record negative recovery outcomes too; never demand improvement.
    return {"linked_maintenance_event_cavities": len(groups), "rows": len(rows)}


CHECKS = {"334": check_black_speck, "335": check_hot_runner, "336": check_maintenance}


def validate(issue: str, header: list[str], rows: list[dict]) -> dict:
    require(issue in SCHEMAS, "unknown external acquisition issue")
    verify_header(header, issue)
    require(bool(rows), "header-only is an intake template, not acquired evidence")
    require(len(rows) <= 500_000, "unexpectedly large local CSV intake")
    require(all(isinstance(row,dict) and None not in row and
                set(row) == set(header) and all(v is not None for v in row.values())
                for row in rows), "malformed or extra-field CSV data")
    if issue in ("334", "336"):
        ids = [row.get("record_id") for row in rows]
        require(len(ids) == len(set(ids)), "duplicate source-record identities rejected")
    summary = CHECKS[issue](rows)
    return {"issue":f"#{issue}","structural_state":"candidate-for-independent-human-provenance-review",
            "external_evidence_acquired":False, "production_control_authorized":False,**summary}


def resolve_private_input(input_path: Path) -> Path:
    # Refuse even a symlink from the public checkout into a private source.
    # Data custody remains entirely with the authorised operator.
    resolved = input_path.expanduser().resolve(strict=True)
    require(resolved.is_file(), "private CSV input is not a readable file")
    repository = TEMPLATE_DIR.parent.resolve()
    require(not resolved.is_relative_to(repository),
            "private measured records must be stored outside the public repository checkout")
    return resolved


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--issue",choices=sorted(SCHEMAS),required=True)
    ap.add_argument("--input",type=Path,required=True,
                    help="private authorised CSV: never a public repository fixture")
    args = ap.parse_args()
    private_source = resolve_private_input(args.input)
    with private_source.open(encoding="utf-8-sig",newline="") as f:
        reader = csv.DictReader(f)
        header = reader.fieldnames or []
        verify_header(header,args.issue)
        rows=list(reader)
    print(json.dumps(validate(args.issue,header,rows),sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except (EvidenceStructureError,ValueError) as exc:
        # Never surface original raw CSV contents or identifiable field values.
        raise SystemExit("Private evidence structural preflight rejected: "+str(exc))
