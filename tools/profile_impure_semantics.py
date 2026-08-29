#!/usr/bin/env python3
"""Aggregate-only semantic probe for the ImPure/PASCOE cycle CSVs.

The probe reuses the CC BY 4.0 Zenodo source, verifies publisher MD5s, and
computes only aggregate channel statistics. It never emits raw rows, individual
cell values, timestamps, or publisher files. The purpose is to distinguish the
anonymous analogue channels using source-described experimental interventions
before any measured-value promotion.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
import statistics
import tempfile
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

RECORD_API = "https://zenodo.org/api/records/6913660"
USER_AGENT = "MouldMaster-ImPure-semantic-probe/1.1 (aggregate research profiling)"
EXPECTED_HEADERS = [
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
SENSOR_HEADERS = EXPECTED_HEADERS[1:]
CYCLE_RE = re.compile(r"Cycle(\d+)\.csv$", re.IGNORECASE)


def fetch_json(url: str) -> dict:
    for attempt in range(7):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=90) as response:
                return json.load(response)
        except HTTPError as exc:
            if exc.code not in {429, 500, 502, 503, 504} or attempt == 6:
                raise
            time.sleep(min(60, 2 ** attempt))
    raise AssertionError("unreachable")


def download(url: str, target: Path, expected_size: int | None) -> tuple[str, str]:
    md5 = hashlib.md5(usedforsecurity=False)
    sha256 = hashlib.sha256()
    with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=180) as response, target.open("wb") as out:
        for chunk in iter(lambda: response.read(1024 * 1024), b""):
            out.write(chunk)
            md5.update(chunk)
            sha256.update(chunk)
    if expected_size is not None and target.stat().st_size != expected_size:
        raise AssertionError(f"size mismatch: {target.stat().st_size} != {expected_size}")
    return md5.hexdigest(), sha256.hexdigest()


def quantile(sorted_values: list[float], p: float) -> float | None:
    if not sorted_values:
        return None
    if len(sorted_values) == 1:
        return sorted_values[0]
    pos = (len(sorted_values) - 1) * p
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return sorted_values[lo]
    w = pos - lo
    return sorted_values[lo] * (1 - w) + sorted_values[hi] * w


def rounded(value: float | None, digits: int = 6) -> float | None:
    return None if value is None else round(float(value), digits)


def describe(values: list[float]) -> dict:
    ordered = sorted(values)
    return {
        "count": len(ordered),
        "min": rounded(ordered[0] if ordered else None),
        "q05": rounded(quantile(ordered, 0.05)),
        "q25": rounded(quantile(ordered, 0.25)),
        "median": rounded(quantile(ordered, 0.50)),
        "q75": rounded(quantile(ordered, 0.75)),
        "q95": rounded(quantile(ordered, 0.95)),
        "max": rounded(ordered[-1] if ordered else None),
        "mean": rounded(statistics.fmean(ordered) if ordered else None),
    }


def parse_time_seconds(value: str) -> tuple[float | None, str]:
    text = value.strip()
    if not text:
        return None, "empty"
    try:
        return float(text), "numeric"
    except ValueError:
        pass
    iso = text.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(iso)
        return dt.timestamp(), "iso-datetime"
    except ValueError:
        pass
    for fmt, label in [
        ("%H:%M:%S.%f", "HH:MM:SS.fraction"),
        ("%H:%M:%S", "HH:MM:SS"),
        ("%M:%S.%f", "MM:SS.fraction"),
        ("%M:%S", "MM:SS"),
    ]:
        try:
            dt = datetime.strptime(text, fmt)
            seconds = dt.hour * 3600 + dt.minute * 60 + dt.second + dt.microsecond / 1_000_000
            return seconds, label
        except ValueError:
            continue
    if re.fullmatch(r"\d{1,2}:\d{2}:\d{2}[.,]\d+", text):
        h, m, s = re.split(r":", text, maxsplit=2)
        return int(h) * 3600 + int(m) * 60 + float(s.replace(",", ".")), "HH:MM:SS.fraction"
    return None, "unparsed"


def cycle_profile(path: Path) -> tuple[dict[str, list[float]], list[float], Counter, int]:
    by_channel = {name: [] for name in SENSOR_HEADERS}
    time_deltas: list[float] = []
    time_formats: Counter = Counter()
    previous_time: float | None = None
    rows = 0
    with path.open("r", encoding="utf-8-sig", errors="strict", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames != EXPECTED_HEADERS:
            raise AssertionError(f"schema drifted: {reader.fieldnames}")
        for row in reader:
            rows += 1
            parsed_time, family = parse_time_seconds(row["Time"])
            time_formats[family] += 1
            if parsed_time is not None:
                if previous_time is not None:
                    delta = parsed_time - previous_time
                    if delta < -12 * 3600:
                        delta += 24 * 3600
                    if delta > 0:
                        time_deltas.append(delta)
                previous_time = parsed_time
            for name in SENSOR_HEADERS:
                raw = row[name].strip()
                if raw:
                    by_channel[name].append(float(raw.replace(",", ".")))
    return by_channel, time_deltas, time_formats, rows


def support_profile(path: Path, name: str) -> dict:
    """Profile stage/label tables without emitting row-level values.

    Low-cardinality text categories may be emitted because they are experiment
    stage labels/metadata, not raw sensor measurements. Numeric values themselves
    are never emitted.
    """
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as fh:
        reader = csv.DictReader(fh)
        headers = [str(x) for x in (reader.fieldnames or [])]
        rows = 0
        nonempty = Counter()
        numeric = Counter()
        text_values: dict[str, Counter] = {h: Counter() for h in headers}
        for row in reader:
            rows += 1
            for h in headers:
                raw = str(row.get(h, "")).strip()
                if not raw:
                    continue
                nonempty[h] += 1
                try:
                    float(raw.replace(",", "."))
                    numeric[h] += 1
                except ValueError:
                    text_values[h][raw] += 1
    low_cardinality_text = {}
    for h, counts in text_values.items():
        if counts and len(counts) <= 20:
            low_cardinality_text[h] = [
                {"category": category, "count": count}
                for category, count in counts.most_common()
            ]
    return {
        "name": name,
        "rows": rows,
        "headers": headers,
        "nonEmptyCounts": {h: nonempty[h] for h in headers},
        "numericCounts": {h: numeric[h] for h in headers},
        "lowCardinalityTextCategories": low_cardinality_text,
        "rawRowsOrNumericValuesEmitted": False,
    }


def cycle_band(cycle_number: int, width: int = 25) -> str:
    start = ((cycle_number - 1) // width) * width + 1
    end = start + width - 1
    return f"{start:03d}-{end:03d}"


def run(output: Path) -> dict:
    record = fetch_json(RECORD_API)
    licence = ((record.get("metadata") or {}).get("license") or {}).get("id")
    if licence != "cc-by-4.0":
        raise AssertionError(f"ImPure licence drifted: {licence}")

    files = record.get("files") or []
    cycle_items = [item for item in files if CYCLE_RE.search(item.get("key", ""))]
    support_items = [item for item in files if item.get("key") in {"Trial 17 05 all stages.csv", "Trial 17 05 all stages_ires-labels.csv"}]
    if len(cycle_items) != 307:
        raise AssertionError(f"expected 307 cycle CSVs, found {len(cycle_items)}")
    if len(support_items) != 2:
        raise AssertionError(f"expected two support files, found {len(support_items)}")

    global_values = {name: [] for name in SENSOR_HEADERS}
    cycle_medians = {name: [] for name in SENSOR_HEADERS}
    band_medians: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    band_cycle_numbers: dict[str, set[int]] = defaultdict(set)
    all_time_deltas: list[float] = []
    time_formats: Counter = Counter()
    manifest_sha = hashlib.sha256()
    verified_files = 0
    total_rows = 0
    support_profiles = []

    with tempfile.TemporaryDirectory(prefix="mouldmaster-impure-semantics-") as temp:
        root = Path(temp)
        for index, item in enumerate(cycle_items):
            name = item["key"]
            match = CYCLE_RE.search(name)
            assert match
            cycle_number = int(match.group(1))
            band = cycle_band(cycle_number)
            target = root / f"cycle-{index:04d}.csv"
            md5, sha256 = download(item["links"]["self"], target, item.get("size"))
            checksum = str(item.get("checksum") or "")
            if checksum.startswith("md5:") and md5 != checksum.split(":", 1)[1].lower():
                raise AssertionError(f"publisher MD5 mismatch: {name}")
            manifest_sha.update(f"{name}\0{sha256}\n".encode("utf-8"))
            verified_files += 1

            channel_values, deltas, formats, rows = cycle_profile(target)
            time_formats.update(formats)
            all_time_deltas.extend(deltas)
            total_rows += rows
            band_cycle_numbers[band].add(cycle_number)
            for channel, values in channel_values.items():
                global_values[channel].extend(values)
                if values:
                    med = float(statistics.median(values))
                    cycle_medians[channel].append(med)
                    band_medians[band][channel].append(med)
            target.unlink(missing_ok=True)

        for index, item in enumerate(support_items):
            name = item["key"]
            target = root / f"support-{index:02d}.csv"
            md5, sha256 = download(item["links"]["self"], target, item.get("size"))
            checksum = str(item.get("checksum") or "")
            if checksum.startswith("md5:") and md5 != checksum.split(":", 1)[1].lower():
                raise AssertionError(f"publisher MD5 mismatch: {name}")
            manifest_sha.update(f"{name}\0{sha256}\n".encode("utf-8"))
            verified_files += 1
            support_profiles.append(support_profile(target, name))
            target.unlink(missing_ok=True)

    channels = {}
    for channel in SENSOR_HEADERS:
        values = global_values[channel]
        medians = cycle_medians[channel]
        bins = Counter(round(v / 5.0) * 5 for v in medians)
        channels[channel] = {
            "valueSummary": describe(values),
            "cycleMedianSummary": describe(medians),
            "cycleMedianBinsWidth5": [
                {"binCenter": rounded(center, 3), "cycleCount": count}
                for center, count in sorted(bins.items(), key=lambda x: (-x[1], x[0]))[:12]
            ],
        }

    cycle_band_profiles = []
    for band in sorted(band_medians):
        cycle_band_profiles.append({
            "cycleNumberBand": band,
            "deliveredCycles": len(band_cycle_numbers[band]),
            "channelCycleMedianSummary": {
                channel: describe(band_medians[band].get(channel, []))
                for channel in SENSOR_HEADERS
            },
        })

    result = {
        "schema_version": 1,
        "status": "aggregate-semantic-probe-complete",
        "retrieved_date": time.strftime("%Y-%m-%d", time.gmtime()),
        "source": {
            "datasetId": "impure-pascoe-2022",
            "recordId": 6913660,
            "license": "CC BY 4.0",
            "licenseEvidence": "official Zenodo records API metadata.license.id",
            "cycleFilesVerified": len(cycle_items),
            "supportFilesVerified": len(support_items),
            "publisherFilesVerifiedInProbe": verified_files,
            "probeManifestSha256": manifest_sha.hexdigest(),
        },
        "profile": {
            "cycleRows": total_rows,
            "sensorColumns": len(SENSOR_HEADERS),
            "numericSensorValues": sum(len(v) for v in global_values.values()),
            "channels": channels,
            "cycleNumberBands": cycle_band_profiles,
            "supportFiles": support_profiles,
            "time": {
                "formatFamilies": dict(sorted(time_formats.items())),
                "positiveDeltaSeconds": describe(all_time_deltas),
            },
            "rawRowsOrCellValuesEmitted": False,
            "absoluteTimestampsEmitted": False,
            "perCycleRawValuesEmitted": False,
        },
        "interpretationBoundary": {
            "purpose": "Use aggregate distributions and stage-aware cycle-number bands only to reconcile anonymous Analog Input[1]/[2] against source-documented nozzle-temperature and heating-water-temperature streams, including the documented 93 C to 40 C heating-water intervention.",
            "automaticPromotion": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
        },
        "retrieval": {
            "rawPublisherFilesCommitted": False,
            "rawPublisherFilesUploadedAsArtifact": False,
            "rawRowsOrArraysUploadedAsArtifact": False,
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = run(args.output)
    print(json.dumps({
        "status": result["status"],
        "cycleFilesVerified": result["source"]["cycleFilesVerified"],
        "supportFilesVerified": result["source"]["supportFilesVerified"],
        "cycleRows": result["profile"]["cycleRows"],
        "numericSensorValues": result["profile"]["numericSensorValues"],
        "time": result["profile"]["time"],
        "channels": result["profile"]["channels"],
        "cycleNumberBands": result["profile"]["cycleNumberBands"],
        "supportFiles": result["profile"]["supportFiles"],
    }, indent=2))


if __name__ == "__main__":
    main()
