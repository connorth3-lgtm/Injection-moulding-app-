#!/usr/bin/env python3
"""Validate an owner-authorized bottle-cap profile without emitting confidential rows or identifiers."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
import re
from typing import Any

DATASET_ID = "bottle-cap-7162-confidential"
PAPER_CYCLES = 7162
MEASURED_ROLES = {"measured_signal", "measured_quality"}
TABULAR_SUFFIXES = {".csv": ",", ".tsv": "\t"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def is_numeric(value: str | None) -> bool:
    if value is None or not value.strip():
        return False
    try:
        float(value)
        return True
    except ValueError:
        return False


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def safe_local_path(root: Path, relative_path: str) -> Path:
    require(bool(relative_path), "delivery relativePath is required")
    root = root.resolve()
    candidate = (root / relative_path).resolve()
    require(candidate == root or root in candidate.parents, "delivery path escapes approved data root")
    require(candidate.is_file(), "declared delivery file does not exist")
    return candidate


def validate_authorization(manifest: dict[str, Any]) -> None:
    authority = manifest.get("authority") or {}
    require(authority.get("ownerIdentified") is True, "confidential-data owner/controller must be identified")
    require(bool(str(authority.get("ownerOrControllerName", "")).strip()), "owner/controller name is required")
    require(bool(str(authority.get("authorizationEvidence", "")).strip()), "owner authorization evidence is required")

    permission = manifest.get("authorization") or {}
    for key in ("researchProfilingAllowed", "automatedAggregateProfilingAllowed", "aggregatePublicationAllowed"):
        require(permission.get(key) is True, f"{key} must be explicitly true")
    require(permission.get("rawRedistributionAllowed") is False, "rawRedistributionAllowed must remain false")

    confidentiality = manifest.get("confidentiality") or {}
    require(confidentiality.get("publicArtifactsMayContainRawRowsOrValues") is False, "public artifacts may not contain raw rows or values")


def measured_channel_contract(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    channels = (manifest.get("semantics") or {}).get("channels") or []
    measured = [item for item in channels if item.get("role") in MEASURED_ROLES]
    seen_labels: set[str] = set()
    seen_fields: set[str] = set()
    for channel in measured:
        for key in ("field", "publicLabel", "quantity", "unit", "sourceEvidence"):
            require(bool(str(channel.get(key, "")).strip()), f"measured channel missing {key}")
        label = str(channel["publicLabel"]).strip()
        field = str(channel["field"]).strip()
        require(label not in seen_labels, "duplicate measured publicLabel")
        require(field not in seen_fields, "duplicate measured source field")
        seen_labels.add(label)
        seen_fields.add(field)
    return measured


def controlled_transfer(manifest: dict[str, Any], data_root: Path, measured: list[dict[str, Any]]) -> dict[str, Any]:
    confidentiality = manifest.get("confidentiality") or {}
    require(confidentiality.get("rawDataMayLeaveOwnerEnvironment") is True, "controlled-transfer mode requires explicit permission for raw data to leave owner environment")
    cycle_field = str((manifest.get("semantics") or {}).get("cycleIdentifierField", "")).strip()
    require(bool(cycle_field), "controlled-transfer mode requires a source-defined cycleIdentifierField")

    files = (manifest.get("delivery") or {}).get("files") or []
    require(bool(files), "controlled-transfer mode requires at least one delivered file")

    total_by_label: dict[str, int] = {str(item["publicLabel"]): 0 for item in measured}
    file_profiles: list[dict[str, Any]] = []
    cycle_field_seen = False

    for index, item in enumerate(files, start=1):
        relative_path = str(item.get("relativePath", ""))
        path = safe_local_path(data_root, relative_path)
        suffix = path.suffix.lower()
        require(suffix in TABULAR_SUFFIXES, "current controlled-transfer validator accepts only CSV/TSV files")
        delimiter = TABULAR_SUFFIXES[suffix]

        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle, delimiter=delimiter)
            headers = reader.fieldnames or []
            require(bool(headers), "delivered table has no header row")
            cycle_field_seen = cycle_field_seen or cycle_field in headers
            local_channels = [c for c in measured if str(c["field"]) in headers]
            rows = 0
            for row in reader:
                rows += 1
                for channel in local_channels:
                    if is_numeric(row.get(str(channel["field"]))):
                        total_by_label[str(channel["publicLabel"])] += 1

        file_profiles.append({
            "fileIndex": index,
            "sha256": sha256_file(path),
            "sizeBytes": path.stat().st_size,
            "rows": rows,
            "columns": len(headers),
            "headerFingerprintSha256": hashlib.sha256("\u001f".join(headers).encode("utf-8")).hexdigest(),
        })

    total_by_label = {key: value for key, value in sorted(total_by_label.items()) if value > 0}
    total = sum(total_by_label.values())
    if not cycle_field_seen:
        return {
            "status": "authorized-profile-blocked",
            "delivery": {"filesReceived": len(file_profiles), "files": file_profiles},
            "blockingReasons": ["source-defined cycle identifier was not present in delivered tables"],
            "acceptedMeasuredNumericCellsByPublicLabel": {},
            "acceptedMeasuredNumericCells": 0,
        }

    return {
        "status": "authorized-profile-validated" if total > 0 else "authorized-profile-blocked",
        "delivery": {"filesReceived": len(file_profiles), "files": file_profiles},
        "blockingReasons": [] if total > 0 else ["no numeric cells found in source-defined measured channels"],
        "acceptedMeasuredNumericCellsByPublicLabel": total_by_label,
        "acceptedMeasuredNumericCells": total,
    }


def owner_side_execution(manifest: dict[str, Any], data_root: Path, measured: list[dict[str, Any]]) -> dict[str, Any]:
    confidentiality = manifest.get("confidentiality") or {}
    require(confidentiality.get("rawDataMayLeaveOwnerEnvironment") is False, "owner-side mode must keep raw data inside owner environment")

    owner_side = manifest.get("ownerSideExecution") or {}
    commit = str(owner_side.get("profilerCommit", "")).strip().lower()
    require(re.fullmatch(r"[0-9a-f]{40}", commit) is not None, "owner-side profilerCommit must be an exact 40-character Git commit")
    artifact = safe_local_path(data_root, str(owner_side.get("aggregateArtifactRelativePath", "")))
    aggregate = json.loads(artifact.read_text(encoding="utf-8"))

    require(aggregate.get("schema") == 1, "unsupported owner-side aggregate schema")
    require(aggregate.get("datasetId") == DATASET_ID, "owner-side aggregate datasetId drifted")
    require(str(aggregate.get("profilerCommit", "")).lower() == commit, "owner-side aggregate profiler commit does not match manifest")
    require(aggregate.get("rawRowsOrCellValuesEmitted") is False, "owner-side aggregate declares raw row/value emission")
    require(aggregate.get("productionCycles") == PAPER_CYCLES, "owner-side aggregate does not reconcile the 7,162-cycle paper horizon")

    allowed_labels = {str(channel["publicLabel"]) for channel in measured}
    counts = aggregate.get("acceptedMeasuredNumericCellsByPublicLabel") or {}
    require(isinstance(counts, dict), "owner-side measured counts must be an object")
    require(set(counts).issubset(allowed_labels), "owner-side aggregate counts an undeclared measured public label")
    normalized: dict[str, int] = {}
    for label, value in counts.items():
        require(isinstance(value, int) and value >= 0, "owner-side measured counts must be non-negative integers")
        if value > 0:
            normalized[str(label)] = value
    total = sum(normalized.values())
    require(aggregate.get("acceptedMeasuredNumericCells") == total, "owner-side accepted measured total does not reconcile")

    source_ids = aggregate.get("sourceFingerprintsOrStableIdentifiers") or []
    require(bool(source_ids), "owner-side aggregate requires source fingerprints or owner-approved stable identifiers")

    return {
        "status": "authorized-profile-validated" if total > 0 else "authorized-profile-blocked",
        "delivery": {
            "aggregateArtifactSha256": sha256_file(artifact),
            "aggregateArtifactSizeBytes": artifact.stat().st_size,
            "productionCycles": PAPER_CYCLES,
            "sourceIdentityCount": len(source_ids),
        },
        "blockingReasons": [] if total > 0 else ["owner-side aggregate contains no accepted measured values"],
        "acceptedMeasuredNumericCellsByPublicLabel": dict(sorted(normalized.items())),
        "acceptedMeasuredNumericCells": total,
    }


def run(manifest_path: Path, data_root: Path) -> dict[str, Any]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    require(manifest.get("schema") == 1, "unsupported owner-authorization manifest schema")
    require(manifest.get("datasetId") == DATASET_ID, "bottle-cap datasetId drifted")
    mode = manifest.get("mode")
    require(mode in {"controlled-transfer", "owner-side-execution"}, "unsupported authorization mode")
    validate_authorization(manifest)
    measured = measured_channel_contract(manifest)
    require(bool(measured), "at least one source-defined measured channel is required")

    if mode == "controlled-transfer":
        profile = controlled_transfer(manifest, data_root, measured)
    else:
        profile = owner_side_execution(manifest, data_root, measured)

    channel_public_metadata = {
        str(channel["publicLabel"]): {
            "role": channel["role"],
            "quantity": channel["quantity"],
            "unit": channel["unit"],
            "sourceEvidence": channel["sourceEvidence"],
        }
        for channel in measured
        if str(channel["publicLabel"]) in profile["acceptedMeasuredNumericCellsByPublicLabel"]
    }

    return {
        "schema": 1,
        "datasetId": DATASET_ID,
        "mode": mode,
        "status": profile["status"],
        "authorization": {
            "ownerIdentified": True,
            "researchProfilingAllowed": True,
            "automatedAggregateProfilingAllowed": True,
            "aggregatePublicationAllowed": True,
            "rawRedistributionAllowed": False,
        },
        "delivery": profile["delivery"],
        "acceptedChannelMetadataByPublicLabel": channel_public_metadata,
        "acceptance": {
            "promotionEligible": profile["status"] == "authorized-profile-validated",
            "countsAsFullyProfiledMeasuredDataset": False,
            "acceptedMeasuredNumericCellsByPublicLabel": profile["acceptedMeasuredNumericCellsByPublicLabel"],
            "acceptedMeasuredNumericCells": profile["acceptedMeasuredNumericCells"],
            "rawRowsOrCellValuesEmitted": False,
            "sourceFilenamesOrInternalFieldNamesEmitted": False,
        },
        "blockingReasons": profile["blockingReasons"],
        "boundary": "This aggregate result does not itself promote the confidential source into repository totals. A separate audited repository decision is required after owner authorization, semantic review and count reconciliation.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("data_root", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = run(args.manifest, args.data_root)
    rendered = json.dumps(result, indent=2, sort_keys=True)
    if args.output:
        args.output.write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)


if __name__ == "__main__":
    main()
