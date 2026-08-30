#!/usr/bin/env python3
"""Validate an authorised INQCIM author response without emitting raw rows or values.

This tool is intentionally local-only. It fingerprints delivered files, checks the
written authorization manifest, profiles table structure, and counts numeric cells
only for source-defined measured channels. It never uploads or copies source files.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from typing import Any, Iterable

ALLOWED_AUTHORITY_ROLES = {
    "corresponding_author",
    "project_data_steward",
    "rights_holder_authorized_representative",
}
ALLOWED_CHANNEL_ROLES = {
    "measured_signal",
    "measured_quality",
    "command",
    "setpoint",
    "model_output",
    "derived_feature",
    "label",
    "identifier",
}
MEASURED_ROLES = {"measured_signal", "measured_quality"}


def fail(message: str) -> None:
    raise ValueError(message)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def safe_join(root: Path, relative: str) -> Path:
    if not relative or Path(relative).is_absolute():
        fail(f"invalid relative path: {relative!r}")
    target = (root / relative).resolve()
    resolved_root = root.resolve()
    try:
        target.relative_to(resolved_root)
    except ValueError:
        fail(f"path escapes data root: {relative}")
    return target


def is_number(value: Any) -> bool:
    if value is None or isinstance(value, bool):
        return False
    if isinstance(value, (int, float)):
        return True
    text = str(value).strip()
    if not text:
        return False
    try:
        float(text)
        return True
    except ValueError:
        return False


def profile_delimited(path: Path, delimiter: str, measured_fields: set[str]) -> dict[str, Any]:
    row_count = 0
    numeric_by_field = {field: 0 for field in measured_fields}
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        headers = list(reader.fieldnames or [])
        if not headers:
            fail(f"no header row found in {path.name}")
        for row in reader:
            row_count += 1
            for field in measured_fields:
                if field in row and is_number(row.get(field)):
                    numeric_by_field[field] += 1
    return {
        "format": "csv" if delimiter == "," else "tsv",
        "rows": row_count,
        "columns": len(headers),
        "headerNames": headers,
        "numericMeasuredCellsByField": numeric_by_field,
    }


def profile_xlsx(path: Path, measured_fields: set[str]) -> dict[str, Any]:
    try:
        import openpyxl  # type: ignore
    except ImportError:
        return {
            "format": "xlsx",
            "parserAvailable": False,
            "promotionBlockingReason": "openpyxl is required for XLSX structural profiling",
            "sheets": [],
        }

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheets: list[dict[str, Any]] = []
    try:
        for ws in wb.worksheets:
            iterator = ws.iter_rows(values_only=True)
            first = next(iterator, None)
            headers = [str(x).strip() if x is not None else "" for x in (first or [])]
            row_count = 0
            numeric_by_field = {field: 0 for field in measured_fields}
            index = {name: i for i, name in enumerate(headers) if name}
            for values in iterator:
                if not any(v is not None and str(v).strip() for v in values):
                    continue
                row_count += 1
                for field in measured_fields:
                    idx = index.get(field)
                    if idx is not None and idx < len(values) and is_number(values[idx]):
                        numeric_by_field[field] += 1
            sheets.append({
                "name": ws.title,
                "rows": row_count,
                "columns": len(headers),
                "headerNames": headers,
                "numericMeasuredCellsByField": numeric_by_field,
            })
    finally:
        wb.close()
    return {"format": "xlsx", "parserAvailable": True, "sheets": sheets}


def union_headers(profile: dict[str, Any]) -> set[str]:
    if profile.get("format") in {"csv", "tsv"}:
        return set(profile.get("headerNames") or [])
    if profile.get("format") == "xlsx":
        out: set[str] = set()
        for sheet in profile.get("sheets") or []:
            out.update(sheet.get("headerNames") or [])
        return out
    return set()


def numeric_counts(profile: dict[str, Any]) -> dict[str, int]:
    out: dict[str, int] = {}
    if profile.get("format") in {"csv", "tsv"}:
        for field, count in (profile.get("numericMeasuredCellsByField") or {}).items():
            out[field] = out.get(field, 0) + int(count)
    elif profile.get("format") == "xlsx":
        for sheet in profile.get("sheets") or []:
            for field, count in (sheet.get("numericMeasuredCellsByField") or {}).items():
                out[field] = out.get(field, 0) + int(count)
    return out


def validate_manifest(manifest: dict[str, Any]) -> tuple[list[dict[str, Any]], set[str]]:
    if manifest.get("schema") != 1:
        fail("manifest schema must be 1")
    if manifest.get("datasetId") != "inqcim-2500-request":
        fail("datasetId must be inqcim-2500-request")
    source = manifest.get("source") or {}
    if source.get("paperDoi") != "10.3390/polym14173551":
        fail("paper DOI mismatch")
    if source.get("projectId") != "FFG 864885":
        fail("project id mismatch")

    authority = manifest.get("authority") or {}
    if authority.get("role") not in ALLOWED_AUTHORITY_ROLES:
        fail("authority role is not sufficient")
    for key in ("name", "organization", "authorizationEvidence"):
        if not str(authority.get(key) or "").strip():
            fail(f"authority.{key} is required")

    authorization = manifest.get("authorization") or {}
    for key in ("filesSuppliedOrAuthorizedLocation", "retrieveAndProfileAllowed", "automatedAggregateProfilingAllowed"):
        if authorization.get(key) is not True:
            fail(f"authorization.{key} must be true")
    if not isinstance(authorization.get("rawRedistributionAllowed"), bool):
        fail("authorization.rawRedistributionAllowed must be an explicit boolean")
    if not isinstance(authorization.get("conditions"), list):
        fail("authorization.conditions must be a list")

    delivery = manifest.get("delivery") or {}
    if not str(delivery.get("receivedDate") or "").strip():
        fail("delivery.receivedDate is required")
    files = delivery.get("files") or []
    if not isinstance(files, list) or not files:
        fail("at least one delivered file is required")
    for item in files:
        if not str(item.get("relativePath") or "").strip():
            fail("every delivered file needs relativePath")
        if not str(item.get("declaredRole") or "").strip():
            fail("every delivered file needs declaredRole")
        if not str(item.get("publisherOrAuthorFilename") or "").strip():
            fail("every delivered file needs publisherOrAuthorFilename")

    semantics = manifest.get("semantics") or {}
    for key in ("cycleIdentifierField", "experimentIdentifierField"):
        if not str(semantics.get(key) or "").strip():
            fail(f"semantics.{key} is required")
    channels = semantics.get("channels") or []
    if not isinstance(channels, list) or not channels:
        fail("source-defined channel semantics are required")

    measured_fields: set[str] = set()
    seen: set[str] = set()
    for channel in channels:
        field = str(channel.get("field") or "").strip()
        role = channel.get("role")
        if not field or field in seen:
            fail("channel fields must be non-empty and unique")
        seen.add(field)
        if role not in ALLOWED_CHANNEL_ROLES:
            fail(f"unsupported channel role for {field}: {role}")
        if role in MEASURED_ROLES:
            for key in ("quantity", "unit", "sourceEvidence"):
                if not str(channel.get(key) or "").strip():
                    fail(f"measured channel {field} is missing {key}")
            if role == "measured_signal":
                rate = channel.get("samplingRateHz")
                if not isinstance(rate, (int, float)) or rate <= 0:
                    fail(f"measured signal {field} needs a positive samplingRateHz")
            measured_fields.add(field)
        else:
            if not str(channel.get("sourceEvidence") or "").strip():
                fail(f"non-measured channel {field} still needs sourceEvidence for classification")
    if not measured_fields:
        fail("at least one source-defined measured channel is required for promotion")
    return channels, measured_fields


def run(manifest_path: Path, data_root: Path) -> dict[str, Any]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    channels, measured_fields = validate_manifest(manifest)

    profiles: list[dict[str, Any]] = []
    all_headers: set[str] = set()
    total_numeric_by_field = {field: 0 for field in measured_fields}
    for item in manifest["delivery"]["files"]:
        path = safe_join(data_root, item["relativePath"])
        if not path.is_file():
            fail(f"delivered file missing: {item['relativePath']}")
        suffix = path.suffix.lower()
        if suffix == ".csv":
            table = profile_delimited(path, ",", measured_fields)
        elif suffix in {".tsv", ".txt"}:
            table = profile_delimited(path, "\t", measured_fields)
        elif suffix == ".xlsx":
            table = profile_xlsx(path, measured_fields)
        else:
            table = {"format": suffix.lstrip(".") or "unknown", "promotionBlockingReason": "unsupported tabular parser"}
        all_headers.update(union_headers(table))
        for field, count in numeric_counts(table).items():
            total_numeric_by_field[field] = total_numeric_by_field.get(field, 0) + count
        profiles.append({
            "relativePath": item["relativePath"],
            "publisherOrAuthorFilename": item["publisherOrAuthorFilename"],
            "declaredRole": item["declaredRole"],
            "sizeBytes": path.stat().st_size,
            "sha256": sha256_file(path),
            "tableProfile": table,
        })

    semantics = manifest["semantics"]
    required_identifiers = {semantics["cycleIdentifierField"], semantics["experimentIdentifierField"]}
    missing_identifiers = sorted(required_identifiers - all_headers)
    missing_measured_fields = sorted(measured_fields - all_headers)
    unsupported_profiles = [
        p["relativePath"] for p in profiles
        if (p.get("tableProfile") or {}).get("promotionBlockingReason")
    ]

    accepted_by_field = {
        field: int(total_numeric_by_field.get(field, 0))
        for field in sorted(measured_fields)
    }
    accepted_total = sum(accepted_by_field.values())
    promotion_eligible = not missing_identifiers and not missing_measured_fields and not unsupported_profiles and accepted_total > 0

    return {
        "schema": 1,
        "datasetId": "inqcim-2500-request",
        "status": "author-response-validated" if promotion_eligible else "author-response-blocked",
        "authorization": {
            "authorityRole": manifest["authority"]["role"],
            "retrieveAndProfileAllowed": True,
            "automatedAggregateProfilingAllowed": True,
            "rawRedistributionAllowed": manifest["authorization"]["rawRedistributionAllowed"],
            "conditionsCaptured": len(manifest["authorization"].get("conditions") or []),
        },
        "delivery": {
            "filesReceived": len(profiles),
            "files": profiles,
        },
        "semanticProfile": {
            "cycleIdentifierField": semantics["cycleIdentifierField"],
            "experimentIdentifierField": semantics["experimentIdentifierField"],
            "sourceDefinedChannels": channels,
            "missingIdentifierFields": missing_identifiers,
            "missingMeasuredFields": missing_measured_fields,
            "unsupportedProfiles": unsupported_profiles,
        },
        "acceptance": {
            "promotionEligible": promotion_eligible,
            "acceptedMeasuredNumericCellsByField": accepted_by_field,
            "acceptedMeasuredNumericCells": accepted_total if promotion_eligible else 0,
            "countsAsFullyProfiledMeasuredDataset": False,
            "rawRowsOrCellValuesEmitted": False,
            "rawPublisherFilesCommitted": False,
            "rawRowsUploadedAsPublicArtifact": False,
            "note": "A validated author response establishes permission, fingerprints, structure and source-defined measured-cell counts. Fully-profiled-family promotion remains a separate repository decision after delivered cycle/DOE coverage is reconciled against the paper and any author-supplied conditions.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = run(args.manifest, args.data_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(result["status"], result["acceptance"]["acceptedMeasuredNumericCells"])


if __name__ == "__main__":
    main()
