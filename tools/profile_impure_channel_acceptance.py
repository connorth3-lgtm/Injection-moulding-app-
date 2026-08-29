#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import re
import tempfile
import time
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

RECORD_URL = "https://zenodo.org/api/records/6913660"
USER_AGENT = "MouldMaster-impure-specialist-profiler/1.0 (aggregate research profiling)"
EXPECTED_HEADER = [
    "Time",
    "HydPressure[IRT/Pascoe]",
    "ScrewPosition[IRT/Pascoe]",
    "Analog Input[1]",
    "Analog Input[2]",
    "TempMold1[IRT/Pascoe]",
    "TempMold2[IRT/Pascoe]",
    "Pressure1[IRT/Pascoe]",
    "Pressure2[IRT/Pascoe]",
]
ACCEPTED_COLUMNS = {
    "HydPressure[IRT/Pascoe]": {"meaning": "hydraulic pressure", "unit": "bar"},
    "TempMold1[IRT/Pascoe]": {"meaning": "cavity 1 contact temperature", "unit": "degC"},
    "TempMold2[IRT/Pascoe]": {"meaning": "cavity 2 contact temperature", "unit": "degC"},
    "Pressure1[IRT/Pascoe]": {"meaning": "cavity 1 pressure", "unit": "bar"},
    "Pressure2[IRT/Pascoe]": {"meaning": "cavity 2 pressure", "unit": "bar"},
}
NONCOUNTING_COLUMNS = {
    "ScrewPosition[IRT/Pascoe]": "exact released engineering unit/scaling remains unresolved",
    "Analog Input[1]": "one of nozzle-temperature/heating-water-temperature pair; exact column-to-role ordering unresolved",
    "Analog Input[2]": "one of nozzle-temperature/heating-water-temperature pair; exact column-to-role ordering unresolved",
}
TIME_FORMATS = [
    ("iso8601", None),
    ("HMS_micro", "%H:%M:%S.%f"),
    ("HMS_comma_micro", "%H:%M:%S,%f"),
    ("HMS", "%H:%M:%S"),
    ("DMY_HMS_micro", "%d/%m/%Y %H:%M:%S.%f"),
    ("DMY_HMS_comma_micro", "%d/%m/%Y %H:%M:%S,%f"),
    ("DMY_HMS", "%d/%m/%Y %H:%M:%S"),
    ("YMD_HMS_micro", "%Y-%m-%d %H:%M:%S.%f"),
    ("YMD_HMS_comma_micro", "%Y-%m-%d %H:%M:%S,%f"),
    ("YMD_HMS", "%Y-%m-%d %H:%M:%S"),
]


def need(ok: bool, msg: str) -> None:
    if not ok:
        raise AssertionError(msg)


def fetch_json(url: str) -> dict:
    for attempt in range(7):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=90) as response:
                return json.load(response)
        except HTTPError as exc:
            if exc.code not in {429, 500, 502, 503, 504} or attempt == 6:
                raise
            time.sleep(min(60, 2**attempt))
    raise AssertionError("unreachable")


def download(url: str, target: Path, expected_size: int | None, publisher_checksum: str | None) -> str:
    md5 = hashlib.md5(usedforsecurity=False)
    sha256 = hashlib.sha256()
    with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=180) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
            md5.update(chunk)
            sha256.update(chunk)
    if expected_size is not None:
        need(target.stat().st_size == expected_size, f"size mismatch for publisher file: {target.stat().st_size} != {expected_size}")
    if publisher_checksum and publisher_checksum.lower().startswith("md5:"):
        need(md5.hexdigest() == publisher_checksum.split(":", 1)[1].lower(), "publisher MD5 mismatch")
    return sha256.hexdigest()


def time_shape(value: str) -> str:
    s = value.strip()
    return re.sub(r"[A-Za-z]", "A", re.sub(r"\d", "9", s))[:80]


def parse_time(value: str) -> tuple[float, str]:
    s = value.strip()
    need(bool(s), "blank Time value")
    normalized = s[:-1] + "+00:00" if s.endswith("Z") else s
    try:
        dt = datetime.fromisoformat(normalized)
        base = dt.timestamp() if dt.tzinfo else dt.toordinal() * 86400.0
        return base + (0.0 if dt.tzinfo else dt.hour * 3600 + dt.minute * 60 + dt.second + dt.microsecond / 1e6), "iso8601"
    except ValueError:
        pass
    for name, fmt in TIME_FORMATS[1:]:
        try:
            dt = datetime.strptime(s, fmt)
            base = dt.toordinal() * 86400.0 if "%Y" in fmt else 0.0
            return base + dt.hour * 3600 + dt.minute * 60 + dt.second + dt.microsecond / 1e6, name
        except ValueError:
            continue
    raise ValueError(f"unsupported Time shape={time_shape(s)!r} length={len(s)}")


def canonical_step(value: float) -> str:
    return format(value, ".12g")


def profile_cycle(raw: bytes, filename: str) -> dict:
    wrapper = io.TextIOWrapper(io.BytesIO(raw), encoding="utf-8-sig", errors="strict", newline="")
    reader = csv.reader(wrapper)
    header = [str(x).strip() for x in next(reader, [])]
    need(header == EXPECTED_HEADER, f"{filename}: exact nine-column schema drift")

    rows = 0
    prev_time = None
    time_format = None
    increments = Counter()
    finite_counts = Counter()

    for row in reader:
        if not any(str(x).strip() for x in row):
            continue
        rows += 1
        need(len(row) == len(EXPECTED_HEADER), f"{filename}: row width drift at row {rows}")
        try:
            t, fmt = parse_time(row[0])
        except ValueError as exc:
            raise AssertionError(f"{filename}: {exc}") from exc
        if time_format is None:
            time_format = fmt
        need(fmt == time_format, f"{filename}: mixed Time formats within one cycle")
        if prev_time is not None:
            need(t >= prev_time, f"{filename}: Time vector moves backward at row {rows}")
            increments[canonical_step(t - prev_time)] += 1
        prev_time = t

        for index, column in enumerate(EXPECTED_HEADER[1:], 1):
            value = row[index].strip()
            need(bool(value), f"{filename}: blank numeric value in {column} row {rows}")
            try:
                number = float(value.replace(",", "."))
            except ValueError as exc:
                raise AssertionError(f"{filename}: nonnumeric value in {column} row {rows}") from exc
            need(math.isfinite(number), f"{filename}: non-finite value in {column} row {rows}")
            finite_counts[column] += 1

    need(rows > 0, f"{filename}: no cycle rows")
    return {"rows": rows, "timeFormat": time_format, "timeIncrementCounts": increments, "finiteCounts": finite_counts}


def main() -> None:
    record = fetch_json(RECORD_URL)
    licence = (((record.get("metadata") or {}).get("license") or {}).get("id"))
    need(licence == "cc-by-4.0", f"ImPure licence drifted: {licence}")
    files = record.get("files") or []
    need(len(files) == 309, f"publisher file-count drifted: {len(files)}")
    cycle_items = [item for item in files if "cycle" in str(item.get("key", "")).lower() and str(item.get("key", "")).lower().endswith(".csv")]
    need(len(cycle_items) == 307, f"cycle file-count drifted: {len(cycle_items)}")

    total_rows = 0
    time_formats = Counter()
    time_increments = Counter()
    channel_finite_counts = Counter()
    manifest_sha256 = hashlib.sha256()

    with tempfile.TemporaryDirectory(prefix="mouldmaster-impure-specialist-") as td:
        temp = Path(td)
        for index, item in enumerate(cycle_items):
            target = temp / f"{index:04d}.csv"
            sha256 = download(item["links"]["self"], target, item.get("size"), item.get("checksum"))
            manifest_sha256.update(str(item.get("key", "")).encode("utf-8"))
            manifest_sha256.update(b"\0")
            manifest_sha256.update(sha256.encode("ascii"))
            manifest_sha256.update(b"\n")
            result = profile_cycle(target.read_bytes(), str(item.get("key", "cycle.csv")))
            total_rows += result["rows"]
            time_formats[result["timeFormat"]] += 1
            time_increments.update(result["timeIncrementCounts"])
            channel_finite_counts.update(result["finiteCounts"])

    need(total_rows == 297_087, f"cycle-row count drifted: {total_rows}")
    need(all(channel_finite_counts[column] == total_rows for column in EXPECTED_HEADER[1:]), "not every non-time channel is finite on every accepted row")

    accepted_values = total_rows * len(ACCEPTED_COLUMNS)
    result = {
        "schema_version": 1,
        "status": "completed-source-defined-impure-partial-channel-acceptance",
        "retrieved_date": time.strftime("%Y-%m-%d", time.gmtime()),
        "source": {
            "datasetId": "impure-pascoe-2022",
            "recordId": 6913660,
            "license": "CC BY 4.0",
            "licenseEvidence": "official Zenodo records API metadata.license.id",
            "cycleManifestSha256": manifest_sha256.hexdigest(),
        },
        "profile": {
            "cycleFilesAccepted": len(cycle_items),
            "cycleFilesRejected": 0,
            "cycleRowsAccepted": total_rows,
            "acceptedMeasuredChannelsPerRow": len(ACCEPTED_COLUMNS),
            "acceptedMeasuredTimeSeriesSamples": accepted_values,
            "parsedButNonCountingChannelsPerRow": len(NONCOUNTING_COLUMNS),
            "rawRowsOrCellValuesEmitted": False,
            "timeFormatFileCounts": [{"format": k, "files": v} for k, v in sorted(time_formats.items())],
            "deliveredTimeIncrementCounts": [{"increment": k, "intervals": v} for k, v in sorted(time_increments.items())],
            "finiteValueCounts": {column: channel_finite_counts[column] for column in EXPECTED_HEADER[1:]},
        },
        "acceptedChannels": [
            {"column": column, "meaning": spec["meaning"], "unit": spec["unit"], "acceptedMeasuredValue": True}
            for column, spec in ACCEPTED_COLUMNS.items()
        ],
        "parsedButNonCountingChannels": [
            {"column": column, "acceptedMeasuredValue": False, "blocker": blocker}
            for column, blocker in NONCOUNTING_COLUMNS.items()
        ],
        "evidenceBoundary": {
            "analogInputRoleSet": ["nozzle temperature", "heating/cooling-water temperature"],
            "analogInputExactOrderingResolved": False,
            "screwPositionMeaningResolved": True,
            "screwPositionEngineeringUnitResolved": False,
            "timeEngineeringUnitInferred": False,
            "duplicateDeliveredTimestampsPreserved": True,
            "backwardTimeJumpsAllowed": False,
        },
        "retrieval": {"rawPublisherFilesCommitted": False, "rawRowsUploadedAsArtifact": False, "temporaryFilesDeletedAfterRun": True},
        "limitations": [
            "Analog Input[1]/[2] remain non-counting until an authoritative source maps the two released columns to nozzle-temperature versus water-temperature roles.",
            "ScrewPosition remains non-counting until the released engineering unit and scaling/reference are authoritative.",
            "The parser preserves source-native row order and allows duplicate delivered Time values while rejecting backward jumps; no Time engineering unit is invented.",
        ],
    }
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
