#!/usr/bin/env python3
"""Aggregate-only semantic probe for the CC BY 4.0 FORinFPRO-HIMD release.

Retrieves the exact three-file Zenodo v1 release, verifies the fingerprints already
pinned by the structural benchmark, and emits only schema/statistical metadata.
No publisher rows, arrays, or individual sensor values are committed or uploaded.
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
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECORD_ID = 20744054
RECORD_DOI = "10.5281/zenodo.20744054"
BASE = f"https://zenodo.org/records/{RECORD_ID}/files"
EXPECTED = {
    "cycle_001_machine_data.csv": {
        "sha256": "d249cbe4980b00f1565a100c3363dde4cf621c490233a4c184d47ad8d202e480",
        "delimiter": ";",
        "expected_rows": 10132,
    },
    "cycle_001_pt.csv": {
        "sha256": "9c8dff7f18c531d447a7b2e0ca3420c3a8a30b9771dd373c4f3433f1acd27538",
        "delimiter": ",",
        "expected_rows": 403,
    },
    "cycle_001_us_rms.csv": {
        "sha256": "0e7d1610202d05177d0a3f8d44a783a9d6268a8b7df59abc268f41d97c360628",
        "delimiter": ",",
        "expected_rows": 2154,
    },
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(name: str, target: Path) -> dict:
    url = f"{BASE}/{name}?download=1"
    headers = {
        "User-Agent": "MouldMaster/1.0 aggregate-semantic-probe",
        "Accept": "text/csv,application/octet-stream;q=0.9,*/*;q=0.5",
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=180) as response, target.open("wb") as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
        return {
            "url": url,
            "httpStatus": int(getattr(response, "status", 200) or 200),
            "contentType": response.headers.get("Content-Type"),
            "contentLengthHeader": response.headers.get("Content-Length"),
            "finalUrl": response.geturl(),
        }


def parse_float(value: str):
    text = value.strip()
    if not text:
        return None
    try:
        x = float(text)
    except ValueError:
        return None
    return x if math.isfinite(x) else None


def summarize_numeric(values: list[float]) -> dict:
    if not values:
        return {
            "numericCount": 0,
            "min": None,
            "max": None,
            "median": None,
            "mean": None,
        }
    return {
        "numericCount": len(values),
        "min": min(values),
        "max": max(values),
        "median": statistics.median(values),
        "mean": statistics.fmean(values),
    }


def summarize_time(values: list[float]) -> dict:
    if len(values) < 2:
        return {
            "strictlyIncreasing": None,
            "nonDecreasing": None,
            "positiveDeltaCount": 0,
            "medianPositiveDelta": None,
            "minPositiveDelta": None,
            "maxPositiveDelta": None,
        }
    deltas = [b - a for a, b in zip(values, values[1:])]
    positive = [x for x in deltas if x > 0]
    return {
        "strictlyIncreasing": all(x > 0 for x in deltas),
        "nonDecreasing": all(x >= 0 for x in deltas),
        "positiveDeltaCount": len(positive),
        "medianPositiveDelta": statistics.median(positive) if positive else None,
        "minPositiveDelta": min(positive) if positive else None,
        "maxPositiveDelta": max(positive) if positive else None,
    }


def profile_csv(path: Path, delimiter: str) -> dict:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.reader(fh, delimiter=delimiter)
        try:
            headers = next(reader)
        except StopIteration:
            raise AssertionError(f"empty CSV: {path.name}")

        width = len(headers)
        non_empty = [0] * width
        numeric = [[] for _ in range(width)]
        distinct_text_samples = [set() for _ in range(width)]
        rows = 0
        width_mismatch = 0

        for row in reader:
            rows += 1
            if len(row) != width:
                width_mismatch += 1
                if len(row) < width:
                    row = row + [""] * (width - len(row))
                else:
                    row = row[:width]
            for i, value in enumerate(row):
                text = value.strip()
                if not text:
                    continue
                non_empty[i] += 1
                x = parse_float(text)
                if x is not None:
                    numeric[i].append(x)
                elif len(distinct_text_samples[i]) < 25:
                    distinct_text_samples[i].add(text)

    columns = []
    for i, header in enumerate(headers):
        stats = summarize_numeric(numeric[i])
        rec = {
            "index": i,
            "header": header,
            "nonEmptyCount": non_empty[i],
            **stats,
            "nonNumericDistinctSampleCountCappedAt25": len(distinct_text_samples[i]),
            "rawValuesEmitted": False,
        }
        lowered = header.strip().lower()
        if numeric[i] and ("time" in lowered or lowered in {"t", "timestamp"}):
            rec["timeOrdering"] = summarize_time(numeric[i])
        columns.append(rec)

    return {
        "rows": rows,
        "columns": width,
        "headers": headers,
        "widthMismatchRows": width_mismatch,
        "columnProfiles": columns,
        "rawRowsOrCellValuesEmitted": False,
    }


def run(output: Path) -> dict:
    work = Path(tempfile.mkdtemp(prefix="mouldmaster-forinfpro-semantic-"))
    files = []
    try:
        for name, spec in EXPECTED.items():
            target = work / name
            retrieval = download(name, target)
            digest = sha256_file(target)
            if digest != spec["sha256"]:
                raise AssertionError(f"{name}: SHA-256 mismatch: {digest}")
            profile = profile_csv(target, spec["delimiter"])
            if profile["rows"] != spec["expected_rows"]:
                raise AssertionError(f"{name}: row count drifted: {profile['rows']}")
            files.append({
                "name": name,
                "sizeBytes": target.stat().st_size,
                "sha256": digest,
                "delimiter": spec["delimiter"],
                "retrieval": retrieval,
                "profile": profile,
            })

        result = {
            "schema": 1,
            "status": "aggregate-semantic-probe-complete",
            "source": {
                "datasetId": "forinfpro-himd-v1",
                "recordId": RECORD_ID,
                "doi": RECORD_DOI,
                "license": "CC BY 4.0",
                "release": "v1",
                "expectedFilesVerified": len(EXPECTED),
            },
            "files": files,
            "summary": {
                "filesVerified": len(files),
                "totalRows": sum(x["profile"]["rows"] for x in files),
                "machineNamedColumns": sum(1 for x in files if x["name"].endswith("machine_data.csv") for h in x["profile"]["headers"] if h.strip()),
                "rawRowsOrCellValuesEmitted": False,
                "rawPublisherFilesCommitted": False,
                "rawPublisherFilesUploadedAsArtifact": False,
            },
            "interpretationBoundary": {
                "automaticPromotion": False,
                "acceptedMeasuredTimeSeriesSamples": 0,
                "reason": "This probe exposes only aggregate schema/statistical evidence. Engineering units and measured-vs-command/derived semantics must be reconciled before promotion.",
            },
        }
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return result
    finally:
        for p in work.iterdir() if work.exists() else []:
            p.unlink(missing_ok=True)
        work.rmdir()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = run(args.output)
    print(
        "FORinFPRO aggregate semantic probe complete "
        f"({result['summary']['filesVerified']} files / {result['summary']['totalRows']} rows; no automatic promotion)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
