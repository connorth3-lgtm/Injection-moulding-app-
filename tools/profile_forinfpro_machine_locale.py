#!/usr/bin/env python3
"""Aggregate validation for locale-formatted ENGEL machine temperature channels.

This intentionally emits no row-level values or absolute timestamps. It verifies
the pinned FORinFPRO machine CSV, parses the delivered date/time coordinate and
German decimal-comma numeric formatting, and summarizes only the source-named
`.rActualTemp` candidate channels.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import statistics
import tempfile
import urllib.request
from datetime import datetime
from pathlib import Path

RECORD_ID = 20744054
NAME = "cycle_001_machine_data.csv"
URL = f"https://zenodo.org/records/{RECORD_ID}/files/{NAME}?download=1"
EXPECTED_SHA256 = "d249cbe4980b00f1565a100c3363dde4cf621c490233a4c184d47ad8d202e480"
EXPECTED_ROWS = 10132
TIME_HEADER = "Datum/Zeit"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_locale_number(value: str):
    text = value.strip().replace("\u00a0", "")
    if not text:
        return None
    if text.count(",") == 1 and "." not in text:
        text = text.replace(",", ".")
    try:
        x = float(text)
    except ValueError:
        return None
    return x if math.isfinite(x) else None


def parse_delivered_datetime(value: str):
    text = value.strip()
    if not text:
        return None, None
    formats = [
        "%d.%m.%Y %H:%M:%S.%f",
        "%d.%m.%Y %H:%M:%S,%f",
        "%d.%m.%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S,%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(text, fmt), fmt
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")), "isoformat"
    except ValueError:
        return None, None


def run(output: Path) -> dict:
    work = Path(tempfile.mkdtemp(prefix="mouldmaster-forinfpro-temp-"))
    target = work / NAME
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "MouldMaster/1.0 aggregate-temperature-verifier"})
        with urllib.request.urlopen(req, timeout=180) as response, target.open("wb") as out:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        digest = sha256_file(target)
        if digest != EXPECTED_SHA256:
            raise AssertionError(f"machine CSV SHA-256 mismatch: {digest}")

        with target.open("r", encoding="utf-8-sig", newline="") as fh:
            reader = csv.reader(fh, delimiter=";")
            headers = next(reader)
            if TIME_HEADER not in headers:
                raise AssertionError(f"missing delivered time header: {TIME_HEADER}")
            time_index = headers.index(TIME_HEADER)
            candidates = [i for i, h in enumerate(headers) if h.strip().endswith(".rActualTemp")]
            values = {i: [] for i in candidates}
            non_empty = {i: 0 for i in candidates}
            parsed_times = []
            time_formats = set()
            time_non_empty = 0
            rows = 0
            width_mismatch = 0
            for row in reader:
                rows += 1
                if len(row) != len(headers):
                    width_mismatch += 1
                    if len(row) < len(headers):
                        row = row + [""] * (len(headers) - len(row))
                    else:
                        row = row[:len(headers)]
                time_text = row[time_index].strip()
                if time_text:
                    time_non_empty += 1
                    dt, fmt = parse_delivered_datetime(time_text)
                    if dt is not None:
                        parsed_times.append(dt)
                        time_formats.add(fmt)
                for i in candidates:
                    text = row[i].strip()
                    if not text:
                        continue
                    non_empty[i] += 1
                    x = parse_locale_number(text)
                    if x is not None:
                        values[i].append(x)

        if rows != EXPECTED_ROWS:
            raise AssertionError(f"machine CSV row count drifted: {rows}")
        profiles = []
        for i in candidates:
            xs = values[i]
            profiles.append({
                "index": i,
                "header": headers[i],
                "sourceRoleFromName": "actual/real temperature",
                "nonEmptyCount": non_empty[i],
                "localizedNumericCount": len(xs),
                "completeLocalizedNumericTrace": non_empty[i] == rows == len(xs),
                "min": min(xs) if xs else None,
                "max": max(xs) if xs else None,
                "median": statistics.median(xs) if xs else None,
                "mean": statistics.fmean(xs) if xs else None,
                "rawValuesEmitted": False,
            })

        time_deltas = []
        if len(parsed_times) >= 2:
            time_deltas = [(b - a).total_seconds() for a, b in zip(parsed_times, parsed_times[1:])]
        positive_time_deltas = [x for x in time_deltas if x > 0]
        time_profile = {
            "header": TIME_HEADER,
            "nonEmptyCount": time_non_empty,
            "parsedCount": len(parsed_times),
            "parseFormatsObserved": sorted(time_formats),
            "absoluteTimestampsEmitted": False,
            "strictlyIncreasing": bool(time_deltas) and all(x > 0 for x in time_deltas),
            "nonDecreasing": bool(time_deltas) and all(x >= 0 for x in time_deltas),
            "positiveDeltaCount": len(positive_time_deltas),
            "medianPositiveDeltaSeconds": statistics.median(positive_time_deltas) if positive_time_deltas else None,
            "minPositiveDeltaSeconds": min(positive_time_deltas) if positive_time_deltas else None,
            "maxPositiveDeltaSeconds": max(positive_time_deltas) if positive_time_deltas else None,
        }

        result = {
            "schema": 2,
            "status": "aggregate-actual-temperature-validation-complete",
            "source": {
                "datasetId": "forinfpro-himd-v1",
                "doi": "10.5281/zenodo.20744054",
                "license": "CC BY 4.0",
                "file": NAME,
                "sha256": digest,
            },
            "profile": {
                "rows": rows,
                "deliveredColumns": len(headers),
                "widthMismatchRows": width_mismatch,
                "timeOrdering": time_profile,
                "actualTemperatureCandidateColumns": len(candidates),
                "allCandidatesCompleteLocalizedNumericTraces": all(x["completeLocalizedNumericTrace"] for x in profiles),
                "candidateProfiles": profiles,
                "rawRowsOrCellValuesEmitted": False,
            },
            "interpretationBoundary": {
                "automaticPromotion": False,
                "unitNotDerivedFromNumericRange": True,
                "manufacturerDocumentationRequiredForEngineeringUnit": True,
            },
        }
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return result
    finally:
        target.unlink(missing_ok=True)
        work.rmdir()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    x = run(args.output)
    print(
        f"FORinFPRO actual-temperature validation complete: "
        f"{x['profile']['actualTemperatureCandidateColumns']} complete candidate channels; "
        f"{x['profile']['timeOrdering']['parsedCount']} timestamps parsed"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
