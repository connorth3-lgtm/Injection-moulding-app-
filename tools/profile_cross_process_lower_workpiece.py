#!/usr/bin/env python3
"""Profile source-defined lower-workpiece injection-moulding TXT files.

The profiler downloads the exact CC BY 4.0 cross-process archive into temporary
storage, verifies publisher checksums/ZIP integrity, and accepts measured values
only when each lower-workpiece TXT file matches the source-native structure,
units, signal codes and per-file time basis recorded in the MouldMaster contract.
Raw rows and cell values are never emitted or committed.
"""

from __future__ import annotations

from collections import Counter
import hashlib
import io
import json
import math
from pathlib import Path
import tempfile
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "data" / "public-benchmark-results" / "cross-process-lower-workpiece-source-contract-v1.json"
DICTIONARY = ROOT / "data" / "cross-process-lower-workpiece-dictionary-v1.json"
RECORD_URL = "https://zenodo.org/api/records/17240390"
EXPECTED_PUBLISHER_MD5 = "069e190338b2ca29f736b21fabf407ba"
USER_AGENT = "MouldMaster-cross-process-lower-profiler/1.0 (aggregate research profiling)"


def fetch_json(url: str) -> dict:
    for attempt in range(7):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=90) as response:
                return json.load(response)
        except HTTPError as exc:
            if exc.code not in {429, 500, 502, 503, 504} or attempt == 6:
                raise
            time.sleep(min(60, 2 ** attempt))
    raise AssertionError("unreachable")


def download(url: str, target: Path, expected_size: int | None = None) -> tuple[str, str]:
    md5 = hashlib.md5(usedforsecurity=False)
    sha256 = hashlib.sha256()
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=180) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
            md5.update(chunk)
            sha256.update(chunk)
    if expected_size is not None and target.stat().st_size != expected_size:
        raise AssertionError(f"archive size mismatch: {target.stat().st_size} != {expected_size}")
    return md5.hexdigest(), sha256.hexdigest()


def _split(line: str) -> list[str]:
    return [value.strip() for value in line.strip().split(";")]


def _finite_float(value: str) -> float:
    parsed = float(value.replace(",", "."))
    if not math.isfinite(parsed):
        raise ValueError("non-finite value")
    return parsed


def parse_lower_txt(binary, name: str, contract: dict) -> dict:
    """Return aggregate metadata for one lower-workpiece TXT file.

    No raw numeric row or source value is returned. Any semantic/structural drift
    raises ValueError so the calling profile fails the file closed.
    """
    text = io.TextIOWrapper(binary, encoding="utf-8-sig", errors="replace", newline="").read()
    lines = [line.rstrip("\r\n") for line in text.splitlines()]
    stripped = [line.strip() for line in lines]

    column_marker = contract["format"]["columnDescriptionMarker"]
    data_marker = contract["format"]["dataStartMarker"]
    try:
        column_idx = stripped.index(column_marker)
        data_idx = stripped.index(data_marker)
    except ValueError as exc:
        raise ValueError(f"{name}: required structural marker missing") from exc
    if not column_idx < data_idx:
        raise ValueError(f"{name}: structural markers are out of order")
    if column_idx + 3 >= data_idx:
        raise ValueError(f"{name}: incomplete column-description block")

    units = _split(lines[column_idx + 1])
    labels = _split(lines[column_idx + 2])
    codes = _split(lines[column_idx + 3])
    expected_units = contract["format"]["expectedUnitsRow"]
    expected_labels = contract["format"]["expectedSourceLabels"]
    expected_codes = contract["format"]["expectedSignalCodes"]
    if units != expected_units:
        raise ValueError(f"{name}: unit row drifted")
    if labels != expected_labels:
        raise ValueError(f"{name}: source-label row drifted")
    if codes != expected_codes:
        raise ValueError(f"{name}: signal-code row drifted")

    metadata: dict[str, str] = {}
    for line in lines[:column_idx]:
        parts = _split(line)
        if len(parts) >= 2 and parts[0]:
            metadata[parts[0].lower()] = parts[1]

    try:
        declared_signals = int(metadata["signals"])
        declared_points = int(metadata["plotting points"])
        declared_interval = _finite_float(metadata["sampling rate"])
    except (KeyError, ValueError) as exc:
        raise ValueError(f"{name}: required preamble metadata missing or invalid") from exc
    if declared_signals != contract["format"]["declaredSignals"]:
        raise ValueError(f"{name}: declared signal count drifted")
    if declared_interval <= 0:
        raise ValueError(f"{name}: non-positive sampling interval")

    row_count = 0
    previous_time: float | None = None
    step_mismatches = 0
    tolerance = max(1e-7, abs(declared_interval) * 1e-5)
    for line in lines[data_idx + 1 :]:
        if not line.strip():
            continue
        parts = _split(line)
        if len(parts) != contract["format"]["numericColumns"]:
            raise ValueError(f"{name}: data row width drifted")
        try:
            values = [_finite_float(value) for value in parts]
        except ValueError as exc:
            raise ValueError(f"{name}: non-numeric or non-finite data row") from exc
        current_time = values[0]
        if previous_time is not None:
            step = current_time - previous_time
            if step <= 0:
                raise ValueError(f"{name}: time is not strictly increasing")
            if abs(step - declared_interval) > tolerance:
                step_mismatches += 1
        previous_time = current_time
        row_count += 1

    if row_count == 0:
        raise ValueError(f"{name}: no data rows")
    if row_count != declared_points:
        raise ValueError(f"{name}: plotting-point count does not match data rows")
    if step_mismatches:
        raise ValueError(f"{name}: observed time steps disagree with declared sampling interval")

    accepted_channels = sum(bool(channel["acceptedMeasuredValue"]) for channel in contract["channels"])
    command_channels = sum(channel["role"] == "command-target" for channel in contract["channels"])
    return {
        "rows": row_count,
        "declaredSignals": declared_signals,
        "declaredSamplingIntervalSeconds": declared_interval,
        "derivedSamplingFrequencyHz": 1.0 / declared_interval,
        "acceptedActualChannelsPerRow": accepted_channels,
        "commandChannelsPerRow": command_channels,
        "acceptedMeasuredValues": row_count * accepted_channels,
        "commandTargetValues": row_count * command_channels,
        "timeStepMismatchCount": step_mismatches,
        "rawRowsOrCellValuesEmitted": False,
    }


def is_lower_workpiece_txt(name: str) -> bool:
    normalized = name.lower().replace("\\", "/")
    return "lower_workpiece" in normalized and normalized.endswith(".txt")


def profile_archive() -> dict:
    contract = json.loads(DICTIONARY.read_text(encoding="utf-8"))
    record = fetch_json(RECORD_URL)
    metadata = record.get("metadata") or {}
    licence = (metadata.get("license") or {}).get("id")
    if licence != "cc-by-4.0":
        raise AssertionError(f"cross-process licence drifted: {licence}")
    files = record.get("files") or []
    if len(files) != 1:
        raise AssertionError(f"expected one publisher archive, found {len(files)}")
    item = files[0]

    with tempfile.TemporaryDirectory(prefix="mouldmaster-cross-lower-") as temp:
        archive = Path(temp) / "publisher.zip"
        md5, sha256 = download(item["links"]["self"], archive, item.get("size"))
        if md5 != EXPECTED_PUBLISHER_MD5:
            raise AssertionError(f"publisher MD5 mismatch: {md5}")
        publisher_checksum = str(item.get("checksum") or "").lower()
        if publisher_checksum and publisher_checksum != f"md5:{EXPECTED_PUBLISHER_MD5}":
            raise AssertionError(f"publisher checksum metadata drifted: {publisher_checksum}")

        profiles: list[dict] = []
        failed_files: list[dict] = []
        archive_members = 0
        with zipfile.ZipFile(archive) as zf:
            bad_member = zf.testzip()
            if bad_member:
                raise AssertionError(f"ZIP CRC failure: {bad_member}")
            for info in zf.infolist():
                if info.is_dir():
                    continue
                archive_members += 1
                if not is_lower_workpiece_txt(info.filename):
                    continue
                try:
                    with zf.open(info) as source:
                        profiles.append(parse_lower_txt(source, info.filename, contract))
                except ValueError as exc:
                    failed_files.append({"reason": str(exc).split(":", 1)[-1].strip()})

    if not profiles:
        raise AssertionError("no source-conforming lower-workpiece TXT files were accepted")

    interval_counts = Counter(profile["declaredSamplingIntervalSeconds"] for profile in profiles)
    accepted_values = sum(profile["acceptedMeasuredValues"] for profile in profiles)
    command_values = sum(profile["commandTargetValues"] for profile in profiles)
    rows = sum(profile["rows"] for profile in profiles)
    return {
        "schema_version": 1,
        "status": "completed-source-defined-lower-workpiece-profile",
        "retrieved_date": time.strftime("%Y-%m-%d", time.gmtime()),
        "source": {
            "datasetId": contract["datasetId"],
            "recordId": 17240390,
            "license": "CC BY 4.0",
            "publisherChecksum": f"md5:{EXPECTED_PUBLISHER_MD5}",
            "sha256": sha256,
            "sizeBytes": item.get("size"),
            "dictionary": str(DICTIONARY.relative_to(ROOT)),
        },
        "profile": {
            "archiveMembers": archive_members,
            "lowerWorkpieceTxtFilesAccepted": len(profiles),
            "lowerWorkpieceTxtFilesRejected": len(failed_files),
            "lowerWorkpieceRowsAccepted": rows,
            "acceptedActualChannelsPerRow": contract["acceptance"]["acceptedActualChannelsPerRow"],
            "commandChannelsPerRow": contract["acceptance"]["commandChannelsPerRow"],
            "acceptedMeasuredTimeSeriesSamples": accepted_values,
            "commandTargetValuesExcludedFromMeasuredCount": command_values,
            "samplingIntervalSecondsFileCounts": [
                {"intervalSeconds": interval, "files": count, "derivedHz": 1.0 / interval}
                for interval, count in sorted(interval_counts.items())
            ],
            "rawRowsOrCellValuesEmitted": False,
        },
        "channels": [
            {
                "canonicalName": channel["canonicalName"],
                "sourceLabel": channel["sourceLabel"],
                "signalCode": channel["signalCode"],
                "role": channel["role"],
                "unit": channel["unit"],
                "acceptedMeasuredValue": channel["acceptedMeasuredValue"],
            }
            for channel in contract["channels"]
        ],
        "rejectedFiles": {
            "count": len(failed_files),
            "reasons": dict(Counter(item["reason"] for item in failed_files)),
            "filenamesEmitted": False,
        },
        "retrieval": {
            "rawPublisherFilesCommitted": False,
            "rawRowsUploadedAsArtifact": False,
            "temporaryArchiveDeletedAfterRun": True,
        },
        "limitations": [
            contract["remainingFamilyBlocker"],
            "Pressure target/command values are structurally validated but excluded from accepted measured-value totals.",
            "Per-file sampling metadata and observed time deltas control acceptance; no global injection-moulding sampling rate is assumed.",
        ],
    }


def main() -> None:
    result = profile_archive()
    RESULT.parent.mkdir(parents=True, exist_ok=True)
    RESULT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"datasetId": result["source"]["datasetId"], "status": result["status"], "profile": result["profile"]}))


if __name__ == "__main__":
    main()
