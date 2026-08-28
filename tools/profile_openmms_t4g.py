#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, hashlib, io, json, math, statistics, urllib.request
from collections import Counter
from pathlib import Path

SOURCE_REPO = "TEPGomes/OpenMMS-T4G"
SOURCE_COMMIT = "cfa6e23c7fc02a645e31e06d299021cb0a3ce3e7"
SOURCE_PATH = "Real_World_Test/Case_Study_Raw_Data.csv"
SOURCE_URL = f"https://raw.githubusercontent.com/{SOURCE_REPO}/{SOURCE_COMMIT}/{SOURCE_PATH}"
COMPANION_DOI = "10.3390/s23073569"
LICENSE = "BSD-3-Clause"
UA = "MouldMaster-OpenMMS-profiler/1.0"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def download() -> bytes:
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": UA, "Accept": "text/csv,*/*"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def to_float(value: str):
    s = (value or "").strip().replace(",", ".")
    if not s:
        return None
    try:
        x = float(s)
        return x if math.isfinite(x) else None
    except ValueError:
        return None


def summarize_numeric(values: list[float]) -> dict:
    if not values:
        return {"count": 0}
    vals = sorted(values)
    n = len(vals)
    def pct(p):
        i = min(n - 1, max(0, round((n - 1) * p)))
        return vals[i]
    return {
        "count": n,
        "min": vals[0],
        "p01": pct(0.01),
        "median": statistics.median(vals),
        "p99": pct(0.99),
        "max": vals[-1],
        "mean": statistics.fmean(vals),
    }


def infer_time_column(headers: list[str], numeric: dict[str, list[float]]) -> str | None:
    candidates = [h for h in headers if any(k in h.lower() for k in ("time", "tempo", "timestamp"))]
    for h in candidates:
        v = numeric.get(h) or []
        if len(v) >= 3 and all(b >= a for a, b in zip(v, v[1:])):
            return h
    for h in headers:
        v = numeric.get(h) or []
        if len(v) >= 3 and all(b >= a for a, b in zip(v, v[1:])):
            diffs = [b-a for a,b in zip(v,v[1:]) if b>a]
            if diffs and statistics.median(diffs) < 10:
                return h
    return None


def cycle_candidate_count(values: list[float], threshold: float) -> int:
    if not values:
        return 0
    on = False
    starts = 0
    for x in values:
        active = x > threshold
        if active and not on:
            starts += 1
        on = active
    return starts


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="openmms-t4g-v1.json")
    args = ap.parse_args()
    raw = download()
    text = raw.decode("utf-8-sig", "replace")
    sample = text[:65536]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except Exception:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    try:
        headers = [str(v).strip() for v in next(reader)]
    except StopIteration:
        raise RuntimeError("OpenMMS source CSV is empty")
    rows = 0
    missing = [0] * len(headers)
    numeric_counts = [0] * len(headers)
    numeric: dict[str, list[float]] = {h: [] for h in headers}
    unique_small: dict[str, Counter] = {h: Counter() for h in headers}
    for row in reader:
        if not any(str(v).strip() for v in row):
            continue
        rows += 1
        vals = list(row[:len(headers)]) + [""] * max(0, len(headers)-len(row))
        for i, (h, value) in enumerate(zip(headers, vals)):
            s = str(value).strip()
            if not s:
                missing[i] += 1
                continue
            if len(unique_small[h]) <= 100:
                unique_small[h][s] += 1
            x = to_float(s)
            if x is not None:
                numeric_counts[i] += 1
                numeric[h].append(x)
    time_col = infer_time_column(headers, numeric)
    timing = None
    if time_col:
        tv = numeric[time_col]
        diffs = [b-a for a,b in zip(tv,tv[1:]) if b>a]
        if diffs:
            med = statistics.median(diffs)
            timing = {
                "column": time_col,
                "first": tv[0],
                "last": tv[-1],
                "medianPositiveStep": med,
                "estimatedRateIfSecondsHz": (1/med if med > 0 else None),
                "positiveStepCount": len(diffs),
            }
    summaries = {h: summarize_numeric(v) for h,v in numeric.items() if v}
    pressure_cols = [h for h in headers if "press" in h.lower() or "cav" in h.lower()]
    temp_cols = [h for h in headers if "temp" in h.lower()]
    force_cols = [h for h in headers if "force" in h.lower() or "forca" in h.lower() or "força" in h.lower()]
    accel_cols = [h for h in headers if "acc" in h.lower() or "acceler" in h.lower()]
    gyro_cols = [h for h in headers if "gyro" in h.lower() or "gyr" in h.lower()]
    # Cycle estimates are diagnostics only; they are never accepted automatically.
    cycle_diagnostics = []
    for h in pressure_cols:
        vals = numeric.get(h) or []
        if vals:
            s = summaries[h]
            span = s["max"] - s["min"]
            for fraction in (0.10, 0.20, 0.30):
                threshold = s["min"] + span * fraction
                cycle_diagnostics.append({"column":h,"thresholdFractionOfRange":fraction,"threshold":threshold,"risingExcursions":cycle_candidate_count(vals,threshold)})
    payload = {
        "schema_version": 1,
        "status": "profile-generated-review-required",
        "completed_date": "2026-08-28",
        "source": {
            "repository": f"https://github.com/{SOURCE_REPO}",
            "commit": SOURCE_COMMIT,
            "path": SOURCE_PATH,
            "rawUrl": SOURCE_URL,
            "license": LICENSE,
            "peerReviewedCompanion": COMPANION_DOI,
        },
        "file": {"sizeBytes": len(raw), "sha256": sha256(raw), "dataRows": rows, "columns": len(headers), "headers": headers},
        "columnCompleteness": [
            {"name":h,"missing":missing[i],"numeric":numeric_counts[i],"nonMissing":rows-missing[i]}
            for i,h in enumerate(headers)
        ],
        "numericSummaries": summaries,
        "timing": timing,
        "signalFamilies": {
            "pressure": pressure_cols,
            "temperature": temp_cols,
            "force": force_cols,
            "acceleration": accel_cols,
            "gyroscope": gyro_cols,
        },
        "smallCardinalityFields": {
            h: dict(c.most_common(25)) for h,c in unique_small.items() if 0 < len(c) <= 25
        },
        "cycleSegmentationDiagnostics": cycle_diagnostics,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "boundary": "This first pass profiles the exact paper-linked raw CSV at a pinned source commit. It does not accept a cycle count or measured-sample count until timestamp/sample-rate semantics, channel identities/units, normal-versus-fault intervals and cycle segmentation are reconciled with the companion paper. Threshold-based rising excursions are diagnostics only."
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps({"file":payload["file"],"timing":timing,"signalFamilies":payload["signalFamilies"],"cycleDiagnostics":cycle_diagnostics[:12]},indent=2,ensure_ascii=False))


if __name__ == "__main__":
    main()
