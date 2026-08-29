#!/usr/bin/env python3
"""Aggregate validation for locale-formatted ENGEL actual-temperature channels.

This intentionally emits no row-level values. It verifies the pinned FORinFPRO
machine CSV, parses decimal-comma numeric formatting, and summarizes only the
delivered columns whose source names end in `.rActualTemp`.
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

RECORD_ID = 20744054
NAME = "cycle_001_machine_data.csv"
URL = f"https://zenodo.org/records/{RECORD_ID}/files/{NAME}?download=1"
EXPECTED_SHA256 = "d249cbe4980b00f1565a100c3363dde4cf621c490233a4c184d47ad8d202e480"
EXPECTED_ROWS = 10132


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
    # The delivered machine CSV is semicolon-delimited and uses German-style
    # decimal commas. Do not attempt ambiguous thousands-separator rewriting.
    if text.count(",") == 1 and "." not in text:
        text = text.replace(",", ".")
    try:
        x = float(text)
    except ValueError:
        return None
    return x if math.isfinite(x) else None


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
            candidates = [i for i, h in enumerate(headers) if h.strip().endswith(".rActualTemp")]
            values = {i: [] for i in candidates}
            non_empty = {i: 0 for i in candidates}
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

        result = {
            "schema": 1,
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
        f"{x['profile']['actualTemperatureCandidateColumns']} complete candidate channels"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
