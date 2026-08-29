#!/usr/bin/env python3
"""Validate the Warwick Origin/OriginPro export manifest and optional exported tables."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
from pathlib import Path, PurePosixPath

EXPECTED_FILES = [
    "data1_09.06.2023_Material_Jetting.opju",
    "data1_16.06.2023_b2b.opju",
    "data_visualisation.opju",
    "representative_curves_14.06.2023.opju",
    "surface_parameters_27.10.2023.opju",
]
PENDING_HASH = "REQUIRED_VERIFIED_SHA256"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
COMPLETE_STATUSES = {"exported-awaiting-semantic-review", "reconciled-ready-for-counting"}
VALID_ROLES = {
    "direct-measured",
    "time-order",
    "derived-formula",
    "metadata-id",
    "command-setpoint",
    "category-label",
    "unknown",
}
VALID_UNIT_STATUS = {"source-defined", "dimensionless", "not-present", "unresolved"}
VALID_TRIAL_STATUS = {"source-defined", "not-applicable"}
VALID_OBJECT_TYPES = {"worksheet", "matrix"}
VALID_FORMATS = {"csv", "tsv"}
VALID_SAMPLING_EVIDENCE = {"exported-time-vector", "origin-project-metadata"}
VALID_FORCE_CONVERSION = {
    "project-native-force",
    "project-documented-conversion",
    "raw-voltage-only",
    "not-applicable",
}


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def is_sha256(value: object) -> bool:
    return isinstance(value, str) and bool(SHA256_RE.fullmatch(value))


def safe_relative_path(value: object, label: str) -> str:
    need(isinstance(value, str) and value.strip(), f"{label} must be a non-empty relative path")
    path = PurePosixPath(value)
    need(not path.is_absolute(), f"{label} must be relative")
    need(".." not in path.parts, f"{label} must not contain '..'")
    return value


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def expected_time_step(unit: str, rate_hz: float) -> float:
    scale = {"s": 1.0, "ms": 1_000.0, "us": 1_000_000.0}
    need(unit in scale, f"Explicit time-vector unit {unit!r} is unsupported; use s, ms or us")
    return scale[unit] / rate_hz


def validate_table_file(root: Path, obj: dict) -> None:
    export = obj["export"]
    rel = safe_relative_path(export["path"], "export.path")
    path = root / Path(rel)
    need(path.is_file(), f"Exported table is missing: {rel}")
    need(file_sha256(path) == export["sha256"], f"SHA-256 mismatch for {rel}")

    delimiter = "," if export["format"] == "csv" else "\t"
    columns = obj["columns"]
    expected_header = [c["name"] for c in columns]
    direct_indices = [i for i, c in enumerate(columns) if c["role"] == "direct-measured"]
    direct_counts = [0 for _ in direct_indices]

    time_basis = obj["timeBasis"]
    explicit_time = time_basis["kind"] == "explicit-time-column"
    time_index = None
    previous_time = None
    time_values = 0
    if explicit_time:
        names = [c["name"] for c in columns]
        need(time_basis["timeColumn"] in names, f"Time column {time_basis['timeColumn']!r} not found in {rel}")
        time_index = names.index(time_basis["timeColumn"])

    row_count = 0
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle, delimiter=delimiter)
        try:
            header = next(reader)
        except StopIteration:
            raise AssertionError(f"Exported table is empty: {rel}")
        need(header == expected_header, f"Header mismatch for {rel}")

        for row_number, row in enumerate(reader, start=2):
            need(len(row) == len(columns), f"Row width mismatch in {rel} at line {row_number}")
            row_count += 1
            for slot, col_index in enumerate(direct_indices):
                value = row[col_index].strip()
                if value == "":
                    continue
                try:
                    number = float(value)
                except ValueError as exc:
                    raise AssertionError(
                        f"Non-numeric direct measurement in {rel} at line {row_number}, column {columns[col_index]['name']}"
                    ) from exc
                need(math.isfinite(number), f"Non-finite direct measurement in {rel} at line {row_number}")
                direct_counts[slot] += 1

            if explicit_time:
                value = row[time_index].strip()
                need(value != "", f"Blank time value in {rel} at line {row_number}")
                try:
                    current = float(value)
                except ValueError as exc:
                    raise AssertionError(f"Non-numeric time value in {rel} at line {row_number}") from exc
                need(math.isfinite(current), f"Non-finite time value in {rel} at line {row_number}")
                if previous_time is not None:
                    delta = current - previous_time
                    need(delta > 0, f"Time vector must be strictly increasing in {rel}")
                    expected = time_basis["timeStepInColumnUnits"]
                    tolerance = max(1e-9, abs(expected) * 1e-4)
                    need(abs(delta - expected) <= tolerance, f"10 kHz time-step drift in {rel} at line {row_number}")
                previous_time = current
                time_values += 1

    need(row_count == export["rowCount"], f"Row count mismatch for {rel}")
    for slot, col_index in enumerate(direct_indices):
        expected_count = columns[col_index]["acceptedNumericCount"]
        need(
            direct_counts[slot] == expected_count,
            f"Direct-measured numeric count mismatch for {rel} column {columns[col_index]['name']}",
        )
    if explicit_time:
        need(time_values == row_count, f"Time-vector length mismatch for {rel}")


def validate_manifest(manifest: dict, exports_root: Path | None = None) -> dict:
    need(manifest.get("schema") == 1, "Warwick export manifest schema must be 1")
    need(manifest.get("datasetId") == "warwick-demoulding", "Warwick dataset id drifted")
    need(manifest.get("datasetDoi") == "10.17632/x9hc7hf6xd.2", "Warwick dataset DOI drifted")
    need(manifest.get("license") == "CC BY 4.0", "Warwick dataset licence drifted")

    status = manifest.get("status")
    need(
        status in {"pending-origin-export", "exported-awaiting-semantic-review", "reconciled-ready-for-counting"},
        "Unknown Warwick export manifest status",
    )
    complete = status in COMPLETE_STATUSES

    env = manifest.get("originEnvironment") or {}
    need(env.get("platform") == "Windows", "Warwick export environment must remain Windows")
    if complete:
        need(env.get("product") in {"Origin", "OriginPro"}, "Completed Warwick export must identify Origin or OriginPro")
        need(isinstance(env.get("version"), str) and env["version"].strip(), "Completed Warwick export must record Origin version")
        need(isinstance(env.get("build"), str) and env["build"].strip(), "Completed Warwick export must record Origin build")
        need(env.get("validatedOpenOfAllProjects") is True, "Completed Warwick export must validate opening all five projects")
    else:
        need(env.get("validatedOpenOfAllProjects") is False, "Pending Warwick manifest cannot claim validated project opens")

    projects = manifest.get("sourceProjects")
    need(isinstance(projects, list) and len(projects) == 5, "Warwick manifest must contain exactly five source projects")
    need([p.get("sourceFile") for p in projects] == EXPECTED_FILES, "Warwick source-project list/order drifted")
    need(len({p.get("sourceFile") for p in projects}) == 5, "Warwick source-project names must be unique")

    all_objects = []
    direct_total = 0
    direct_channels = 0
    trial_keys = set()
    total_skipped = 0

    for project in projects:
        source_file = project["sourceFile"]
        source_hash = project.get("sourceSha256")
        if complete:
            need(is_sha256(source_hash), f"{source_file}: completed manifest requires the verified source SHA-256")
            need(project.get("originOpened") is True, f"{source_file}: Origin open was not confirmed")
        else:
            need(source_hash == PENDING_HASH, f"{source_file}: pending manifest must use the explicit SHA-256 placeholder")
            need(project.get("originOpened") is False, f"{source_file}: pending manifest cannot claim Origin open")

        reconciliation = project.get("projectReconciliation")
        objects = project.get("objects")
        need(isinstance(objects, list), f"{source_file}: objects must be a list")

        if not complete:
            need(reconciliation is None, f"{source_file}: pending manifest must not invent reconciliation counts")
            need(objects == [], f"{source_file}: pending manifest must not contain exported objects")
            continue

        need(isinstance(reconciliation, dict), f"{source_file}: project reconciliation is required")
        count_fields = [
            "originWorkbookCount",
            "originWorksheetOrMatrixCount",
            "dataBearingWorksheetOrMatrixCount",
            "exportedDataBearingObjectCount",
            "skippedDataBearingObjectCount",
        ]
        for field in count_fields:
            value = reconciliation.get(field)
            need(isinstance(value, int) and value >= 0, f"{source_file}: {field} must be a non-negative integer")
        need(
            reconciliation["exportedDataBearingObjectCount"] + reconciliation["skippedDataBearingObjectCount"]
            == reconciliation["dataBearingWorksheetOrMatrixCount"],
            f"{source_file}: data-bearing Origin object reconciliation does not balance",
        )
        need(
            len(objects) == reconciliation["exportedDataBearingObjectCount"],
            f"{source_file}: exported object count does not match object manifest",
        )
        total_skipped += reconciliation["skippedDataBearingObjectCount"]

        seen_identities = set()
        for obj in objects:
            need(obj.get("objectType") in VALID_OBJECT_TYPES, f"{source_file}: invalid Origin object type")
            need(isinstance(obj.get("workbook"), str) and obj["workbook"].strip(), f"{source_file}: workbook identity missing")
            need(isinstance(obj.get("sheet"), str) and obj["sheet"].strip(), f"{source_file}: sheet identity missing")
            need(isinstance(obj.get("sheetIndex"), int) and obj["sheetIndex"] >= 0, f"{source_file}: sheetIndex invalid")
            identity = (obj["workbook"], obj["sheet"], obj["sheetIndex"], obj["objectType"])
            need(identity not in seen_identities, f"{source_file}: duplicate Origin object identity {identity}")
            seen_identities.add(identity)
            need(obj.get("dataBearing") is True, f"{source_file}: only exported data-bearing objects belong in objects")

            trial = obj.get("trialIdentity") or {}
            need(trial.get("status") in VALID_TRIAL_STATUS, f"{source_file}: trial identity status missing/invalid")
            if trial["status"] == "source-defined":
                need(isinstance(trial.get("value"), str) and trial["value"].strip(), f"{source_file}: source-defined trial id missing")
                trial_keys.add((source_file, trial["value"]))
            else:
                need(trial.get("value") is None, f"{source_file}: not-applicable trial identity must use null value")

            export = obj.get("export") or {}
            safe_relative_path(export.get("path"), f"{source_file} export.path")
            need(export.get("format") in VALID_FORMATS, f"{source_file}: export format must be csv or tsv")
            need(is_sha256(export.get("sha256")), f"{source_file}: export SHA-256 missing/invalid")
            need(isinstance(export.get("rowCount"), int) and export["rowCount"] >= 0, f"{source_file}: rowCount invalid")
            need(isinstance(export.get("columnCount"), int) and export["columnCount"] > 0, f"{source_file}: columnCount invalid")

            columns = obj.get("columns")
            need(isinstance(columns, list) and len(columns) == export["columnCount"], f"{source_file}: column manifest count mismatch")
            names = [c.get("name") for c in columns]
            need(all(isinstance(n, str) and n.strip() for n in names), f"{source_file}: every column needs a name")
            need(len(set(names)) == len(names), f"{source_file}: exported headers must be unique")

            has_force_signal = False
            for col in columns:
                role = col.get("role")
                need(role in VALID_ROLES, f"{source_file}: invalid column role {role!r}")
                unit_status = col.get("unitStatus")
                need(unit_status in VALID_UNIT_STATUS, f"{source_file}: invalid unit status for {col['name']}")
                if unit_status in {"source-defined", "dimensionless"}:
                    if unit_status == "source-defined":
                        need(isinstance(col.get("unit"), str) and col["unit"].strip(), f"{source_file}: source-defined unit missing for {col['name']}")
                    else:
                        need(col.get("unit") in {None, "1"}, f"{source_file}: dimensionless column must use null or '1' unit")
                else:
                    need(col.get("unit") is None, f"{source_file}: unresolved/not-present unit must be null")

                accepted_count = col.get("acceptedNumericCount")
                need(isinstance(accepted_count, int) and accepted_count >= 0, f"{source_file}: acceptedNumericCount invalid for {col['name']}")
                formula = col.get("originFormula")
                if role == "derived-formula":
                    need(isinstance(formula, str) and formula.strip(), f"{source_file}: derived column {col['name']} requires its Origin formula")
                    need(accepted_count == 0, f"{source_file}: derived column {col['name']} must remain non-counting")
                elif role != "direct-measured":
                    need(accepted_count == 0, f"{source_file}: non-measured column {col['name']} must remain non-counting")

                if role == "direct-measured":
                    need(unit_status in {"source-defined", "dimensionless"}, f"{source_file}: direct measurement {col['name']} needs a source-defined unit/status")
                    need(isinstance(col.get("quantity"), str) and col["quantity"].strip(), f"{source_file}: direct measurement {col['name']} needs a quantity")
                    direct_total += accepted_count
                    direct_channels += 1
                    quantity = col["quantity"].lower()
                    if "force" in quantity:
                        has_force_signal = True

            time_basis = obj.get("timeBasis") or {}
            need(time_basis.get("kind") in {"explicit-time-column", "sample-index", "not-applicable"}, f"{source_file}: invalid time basis")
            if has_force_signal:
                need(time_basis["kind"] != "not-applicable", f"{source_file}: force waveform must have a time/sample basis")
                need(time_basis.get("samplingRateHz") == 10000, f"{source_file}: force waveform must verify the 10 kHz source basis")
                need(time_basis.get("samplingEvidence") in VALID_SAMPLING_EVIDENCE, f"{source_file}: force waveform needs project/time-vector sampling evidence")
                if time_basis["kind"] == "explicit-time-column":
                    time_name = time_basis.get("timeColumn")
                    need(time_name in names, f"{source_file}: explicit time column missing from export")
                    time_col = next(c for c in columns if c["name"] == time_name)
                    need(time_col["role"] == "time-order", f"{source_file}: explicit time column must be time-order")
                    need(time_col["unitStatus"] == "source-defined", f"{source_file}: explicit time column needs a source-defined unit")
                    expected = expected_time_step(time_col["unit"], 10000)
                    step = time_basis.get("timeStepInColumnUnits")
                    need(isinstance(step, (int, float)) and math.isfinite(step), f"{source_file}: explicit time step missing")
                    need(abs(step - expected) <= max(1e-12, abs(expected) * 1e-9), f"{source_file}: explicit time step is not 10 kHz")
                else:
                    need(time_basis.get("samplingEvidence") == "origin-project-metadata", f"{source_file}: sample-index force waveform needs Origin-project sampling metadata")

                conversion = obj.get("forceConversion") or {}
                need(conversion.get("status") in VALID_FORCE_CONVERSION, f"{source_file}: force conversion status missing")
                need(isinstance(conversion.get("source"), str) and conversion["source"].strip(), f"{source_file}: force conversion provenance missing")
                force_cols = [c for c in columns if c["role"] == "direct-measured" and "force" in c["quantity"].lower()]
                if any(c.get("unit") == "N" for c in force_cols):
                    need(
                        conversion["status"] in {"project-native-force", "project-documented-conversion"},
                        f"{source_file}: force values in N require project-native/project-documented conversion evidence",
                    )

            if exports_root is not None:
                validate_table_file(exports_root, obj)

            all_objects.append((source_file, identity))

    acceptance = manifest.get("acceptance") or {}
    need(acceptance.get("rawRowsCommittedToRepository") is False, "Warwick public-repository raw-row boundary must remain false")

    if not complete:
        need(acceptance.get("allFiveProjectsReconciled") is False, "Pending Warwick manifest cannot claim reconciliation")
        need(acceptance.get("dataBearingObjectsSkipped") is None, "Pending Warwick manifest must leave skipped-object total unresolved")
        need(acceptance.get("acceptedMeasuredValues") == 0, "Pending Warwick manifest must remain at zero accepted values")
        need(acceptance.get("acceptedTrialCount") is None, "Pending Warwick manifest must not invent a trial count")
        need(acceptance.get("acceptedChannelCount") is None, "Pending Warwick manifest must not invent a channel count")
    else:
        need(acceptance.get("allFiveProjectsReconciled") is True, "Completed Warwick export must reconcile all five projects")
        need(acceptance.get("dataBearingObjectsSkipped") == total_skipped, "Top-level skipped-object count does not reconcile")
        if status == "exported-awaiting-semantic-review":
            need(acceptance.get("acceptedMeasuredValues") == 0, "Semantic-review-pending Warwick manifest must remain non-counting")
        else:
            need(total_skipped == 0, "Ready-for-counting Warwick manifest cannot skip any data-bearing Origin objects")
            need(acceptance.get("acceptedMeasuredValues") == direct_total, "Accepted measured total must equal direct-measured numeric counts")
            need(acceptance.get("acceptedChannelCount") == direct_channels, "Accepted channel count must equal direct-measured column instances")
            need(acceptance.get("acceptedTrialCount") == len(trial_keys), "Accepted trial count must equal unique source-defined trials")

    return {
        "status": status,
        "projects": len(projects),
        "exportedObjects": len(all_objects),
        "directMeasuredColumns": direct_channels,
        "directMeasuredNumericValues": direct_total,
        "acceptedMeasuredValues": acceptance.get("acceptedMeasuredValues"),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--manifest",
        default="data/warwick-origin-export-manifest-template-v1.json",
        help="Warwick Origin export manifest JSON",
    )
    parser.add_argument(
        "--exports-root",
        default=None,
        help="Optional root containing exported CSV/TSV files. When supplied, hashes, headers, dimensions and numeric counts are verified.",
    )
    args = parser.parse_args()
    manifest_path = Path(args.manifest)
    exports_root = Path(args.exports_root) if args.exports_root else None
    result = validate_manifest(load_json(manifest_path), exports_root)
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
