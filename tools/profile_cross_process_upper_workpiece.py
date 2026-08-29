#!/usr/bin/env python3
"""Profile source-defined upper-workpiece injection-moulding CSV cycle files.

The profiler downloads the exact CC BY 4.0 cross-process archive into temporary
storage, verifies publisher checksums/ZIP integrity, and promotes only the upper
channels whose meanings and units are source-backed by the MouldMaster contract:
melt volume (cm3) and volumetric injection velocity (cm3/s).

Upper pressure target/actual and state are parsed for structural integrity but
remain non-counting. Raw rows and cell values are never emitted or committed.
"""

from __future__ import annotations

from collections import Counter
import csv
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
RESULT = ROOT / "data" / "public-benchmark-results" / "cross-process-upper-workpiece-source-contract-v1.json"
DICTIONARY = ROOT / "data" / "cross-process-upper-workpiece-dictionary-v1.json"
RECORD_URL = "https://zenodo.org/api/records/17240390"
EXPECTED_PUBLISHER_MD5 = "069e190338b2ca29f736b21fabf407ba"
EXPECTED_UPPER_SERIAL_FILES = 10_697
USER_AGENT = "MouldMaster-cross-process-upper-profiler/1.0 (aggregate research profiling)"


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


def _finite_float(value: str) -> float:
    parsed = float(str(value).strip())
    if not math.isfinite(parsed):
        raise ValueError("non-finite value")
    return parsed


def _integer_like(value: float, *, tolerance: float = 1e-9) -> int:
    rounded = int(round(value))
    if abs(value - rounded) > tolerance:
        raise ValueError("value is not integer-like")
    return rounded


def _timing_key(step: float) -> str:
    # Stable aggregate key without pretending the time column's engineering unit
    # is source-defined. Twelve significant digits preserves delivered precision
    # while collapsing harmless binary floating-point representation noise.
    return f"{step:.12g}"


def parse_upper_csv(binary, name: str, contract: dict) -> dict:
    """Return aggregate metadata for one upper-workpiece serial CSV.

    Structural/time drift fails the file closed. The parser never returns source
    rows or raw cell values.
    """
    wrapper = io.TextIOWrapper(binary, encoding="utf-8-sig", errors="strict", newline="")
    reader = csv.reader(wrapper, delimiter=",")
    header = next(reader, None)
    if header is None:
        raise ValueError(f"{name}: missing CSV header")

    expected = ["", *contract["exactDeliveredSchema"]]
    actual = [str(value).strip() for value in header]
    if actual != expected:
        raise ValueError(f"{name}: delivered header drifted")

    fields = {item["column"]: item for item in contract["fields"]}
    accepted_columns = [
        column
        for column in contract["exactDeliveredSchema"]
        if fields[column].get("promotionEligibleAfterDeterministicProfile") is True
    ]
    if accepted_columns != ["melt_volume", "injection_velocity"]:
        raise ValueError(f"{name}: accepted upper-channel contract drifted")

    row_count = 0
    expected_index = 0
    previous_time: float | None = None
    reference_step: float | None = None
    step_mismatches = 0
    state_counts: Counter[int] = Counter()

    for row in reader:
        if not row or not any(str(value).strip() for value in row):
            continue
        if len(row) != len(expected):
            raise ValueError(f"{name}: data row width drifted")
        try:
            index = _integer_like(_finite_float(row[0]))
            values = [_finite_float(value) for value in row[1:]]
        except ValueError as exc:
            raise ValueError(f"{name}: non-numeric, non-finite or non-integer index/state data") from exc

        if index != expected_index:
            raise ValueError(f"{name}: row index is not contiguous from zero")
        expected_index += 1

        current_time = values[0]
        state = _integer_like(values[5])
        state_counts[state] += 1

        if previous_time is not None:
            step = current_time - previous_time
            if step <= 0:
                raise ValueError(f"{name}: time is not strictly increasing")
            if reference_step is None:
                reference_step = step
            tolerance = max(1e-8, abs(reference_step) * 1e-5)
            if abs(step - reference_step) > tolerance:
                step_mismatches += 1
        previous_time = current_time
        row_count += 1

    if row_count == 0:
        raise ValueError(f"{name}: no data rows")
    if row_count > 1 and reference_step is None:
        raise ValueError(f"{name}: unable to establish delivered time increment")
    if step_mismatches:
        raise ValueError(f"{name}: delivered time vector is not regularly stepped")

    return {
        "rows": row_count,
        "acceptedMeasuredChannelsPerRow": len(accepted_columns),
        "acceptedMeasuredValues": row_count * len(accepted_columns),
        "pressureTargetValuesExcluded": row_count,
        "pressureActualValuesUnitBlocked": row_count,
        "stateValuesSemanticBlocked": row_count,
        "deliveredTimeIncrement": reference_step,
        "stateCodeCounts": dict(sorted(state_counts.items())),
        "timeStepMismatchCount": step_mismatches,
        "rawRowsOrCellValuesEmitted": False,
    }


def is_upper_serial_csv(name: str) -> bool:
    normalized = name.lower().replace("\\", "/")
    return (
        "injection_molding/upper_workpiece/serial_data/" in normalized
        and normalized.endswith(".csv")
    )


def is_injection_static_csv(name: str) -> bool:
    normalized = name.lower().replace("\\", "/")
    return (
        "injection_molding/" in normalized
        and normalized.endswith("/static_data.csv")
    )


def profile_archive() -> dict:
    contract = json.loads(DICTIONARY.read_text(encoding="utf-8"))
    if contract.get("datasetId") != "cross-process-chain-17240390":
        raise AssertionError("upper-workpiece dictionary dataset ID drifted")

    record = fetch_json(RECORD_URL)
    metadata = record.get("metadata") or {}
    licence = (metadata.get("license") or {}).get("id")
    if licence != "cc-by-4.0":
        raise AssertionError(f"cross-process licence drifted: {licence}")
    files = record.get("files") or []
    if len(files) != 1:
        raise AssertionError(f"expected one publisher archive, found {len(files)}")
    item = files[0]

    with tempfile.TemporaryDirectory(prefix="mouldmaster-cross-upper-") as temp:
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
        injection_static_files_excluded = 0
        with zipfile.ZipFile(archive) as zf:
            bad_member = zf.testzip()
            if bad_member:
                raise AssertionError(f"ZIP CRC failure: {bad_member}")
            for info in zf.infolist():
                if info.is_dir():
                    continue
                archive_members += 1
                if is_injection_static_csv(info.filename):
                    injection_static_files_excluded += 1
                if not is_upper_serial_csv(info.filename):
                    continue
                try:
                    with zf.open(info) as source:
                        profiles.append(parse_upper_csv(source, info.filename, contract))
                except ValueError as exc:
                    failed_files.append({"reason": str(exc).split(":", 1)[-1].strip()})

    if len(profiles) + len(failed_files) != EXPECTED_UPPER_SERIAL_FILES:
        raise AssertionError(
            "upper serial file count drifted: "
            f"{len(profiles) + len(failed_files)} != {EXPECTED_UPPER_SERIAL_FILES}"
        )
    if failed_files:
        raise AssertionError(
            "upper source contract rejected files: "
            + json.dumps(dict(Counter(item["reason"] for item in failed_files)), sort_keys=True)
        )
    if injection_static_files_excluded != 2:
        raise AssertionError(
            f"expected two injection static_data.csv files, found {injection_static_files_excluded}"
        )

    rows = sum(profile["rows"] for profile in profiles)
    accepted_values = sum(profile["acceptedMeasuredValues"] for profile in profiles)
    pressure_targets = sum(profile["pressureTargetValuesExcluded"] for profile in profiles)
    pressure_actuals = sum(profile["pressureActualValuesUnitBlocked"] for profile in profiles)
    state_values = sum(profile["stateValuesSemanticBlocked"] for profile in profiles)

    timing_counts: Counter[str] = Counter()
    timing_examples: dict[str, float] = {}
    state_counts: Counter[int] = Counter()
    for profile in profiles:
        if profile["deliveredTimeIncrement"] is not None:
            key = _timing_key(profile["deliveredTimeIncrement"])
            timing_counts[key] += 1
            timing_examples.setdefault(key, profile["deliveredTimeIncrement"])
        for code, count in profile["stateCodeCounts"].items():
            state_counts[int(code)] += count

    eligible = [
        field
        for field in contract["fields"]
        if field.get("promotionEligibleAfterDeterministicProfile") is True
    ]

    return {
        "schema_version": 1,
        "status": "completed-source-defined-upper-workpiece-partial-acceptance",
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
            "upperWorkpieceSerialCsvFilesAccepted": len(profiles),
            "upperWorkpieceSerialCsvFilesRejected": len(failed_files),
            "injectionStaticCsvFilesExcluded": injection_static_files_excluded,
            "upperWorkpieceRowsAccepted": rows,
            "acceptedMeasuredChannelsPerRow": len(eligible),
            "acceptedMeasuredTimeSeriesSamples": accepted_values,
            "pressureTargetValuesExcludedFromMeasuredCount": pressure_targets,
            "pressureActualValuesExcludedPendingUnit": pressure_actuals,
            "stateValuesExcludedPendingSemantics": state_values,
            "deliveredTimeIncrementFileCounts": [
                {
                    "deliveredIncrement": timing_examples[key],
                    "canonicalKey": key,
                    "files": count,
                    "engineeringUnit": None,
                }
                for key, count in sorted(timing_counts.items(), key=lambda item: float(item[0]))
            ],
            "observedStateCodeCounts": [
                {"code": code, "values": count}
                for code, count in sorted(state_counts.items())
            ],
            "rawRowsOrCellValuesEmitted": False,
        },
        "channels": [
            {
                "canonicalName": field["column"],
                "role": field["role"],
                "unit": field.get("engineeringUnit"),
                "acceptedMeasuredValue": field.get("promotionEligibleAfterDeterministicProfile") is True,
                "blocker": field.get("blocker"),
            }
            for field in contract["fields"]
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
            "Upper pressure target is command evidence and remains excluded from measured totals.",
            "Upper pressure actual is structurally validated but remains excluded until an authoritative engineering unit is established.",
            "Upper state codes are structurally validated and aggregated but remain excluded until authoritative semantics are established.",
            "The delivered time vector is validated per file without assigning an engineering unit or imposing the publisher's approximate global frequency.",
            "Injection static_data.csv tables are outside this time-series parser and remain non-promoted here.",
        ],
    }


def main() -> None:
    result = profile_archive()
    RESULT.parent.mkdir(parents=True, exist_ok=True)
    RESULT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "datasetId": result["source"]["datasetId"],
                "status": result["status"],
                "profile": result["profile"],
            }
        )
    )


if __name__ == "__main__":
    main()
