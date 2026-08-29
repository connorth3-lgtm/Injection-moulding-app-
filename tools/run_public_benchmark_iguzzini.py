#!/usr/bin/env python3
"""Aggregate-only profiler for the restricted-use iGuzzini road-lens dataset."""

from __future__ import annotations
import argparse, hashlib, io, json, urllib.request
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/iguzzini-road-lenses-v1.json"

def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()

def run(output: Path, retrieved_date: str) -> dict:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    src = contract["source"]
    raw_url = (
        "https://raw.githubusercontent.com/airtlab/"
        "machine-learning-for-quality-prediction-in-plastic-injection-molding/"
        f"{src['pinnedCommit']}/{src['file']}"
    )
    req = urllib.request.Request(raw_url, headers={"User-Agent": "MouldMaster/1.0 aggregate-profiler"})
    with urllib.request.urlopen(req, timeout=90) as response:
        data = response.read()
        final_url = response.geturl()
        content_type = response.headers.get("Content-Type")

    actual_blob = git_blob_sha(data)
    exact_source = actual_blob == src["gitBlobSha"] and len(data) == src["sizeBytes"]
    if not exact_source:
        raise RuntimeError(f"pinned iGuzzini source mismatch: blob={actual_blob} bytes={len(data)}")

    df = pd.read_csv(io.BytesIO(data), sep=";")
    headers = [str(c) for c in df.columns]
    if "quality" not in df.columns:
        raise RuntimeError("quality column missing from delivered CSV")
    process_cols = [c for c in df.columns if c != "quality"]
    quality_numeric = pd.to_numeric(df["quality"], errors="coerce")
    quality_counts = {
        str(int(k)): int(v)
        for k, v in quality_numeric.dropna().value_counts().sort_index().items()
        if float(k).is_integer()
    }
    quality_non_null = int(quality_numeric.notna().sum())
    expected_labels = {"1", "2", "3", "4"}
    delivered_label_set = set(quality_counts)
    non_null = {str(c): int(df[c].notna().sum()) for c in df.columns}
    process_non_null = sum(non_null[str(c)] for c in process_cols)
    fully_profiled = (
        len(df) == 1451 and len(df.columns) == 14 and len(process_cols) == 13
        and quality_non_null == len(df) and delivered_label_set == expected_labels
        and all(non_null[str(c)] == len(df) for c in process_cols)
    )

    reported = contract["experimentContext"]["publisherReportedQualityClasses"]
    reported_counts = {k: int(v["reportedCount"]) for k, v in reported.items()}
    delivered_vs_reported = {k: quality_counts.get(k, 0) - reported_counts.get(k, 0) for k in sorted(expected_labels)}

    result = {
        "schema_version": 1,
        "status": "accepted-restricted-profile" if fully_profiled else "retrieved-profile-needs-review",
        "retrieved_date": retrieved_date,
        "source": {
            "datasetId": contract["datasetId"], "repository": src["repository"],
            "pinnedCommit": src["pinnedCommit"], "file": src["file"],
            "gitBlobSha": actual_blob, "sha256": hashlib.sha256(data).hexdigest(),
            "sizeBytes": len(data), "finalUrl": final_url, "contentType": content_type,
            "releaseTerms": src["releaseTerms"], "useScope": "research-and-education-only",
            "rawRedistributionAllowed": False
        },
        "profile": {
            "rows": int(len(df)), "columns": int(len(df.columns)), "headers": headers,
            "processFeatureColumns": [str(c) for c in process_cols], "processFeatureCount": len(process_cols),
            "nonNullCounts": non_null, "recordLevelMeasuredProcessValues": int(process_non_null),
            "qualityNonNull": quality_non_null, "deliveredQualityCounts": quality_counts,
            "publisherReportedQualityCounts": reported_counts,
            "publisherReportedQualityCountSum": sum(reported_counts.values()),
            "deliveredQualityCountSum": sum(quality_counts.values()),
            "deliveredMinusReportedByClass": delivered_vs_reported,
            "rawRowsOrCellValuesEmitted": False
        },
        "acceptance": {
            "countsAsFullyProfiledMeasuredDataset": bool(fully_profiled),
            "useScope": "research-and-education-only", "acceptedMeasuredTimeSeriesSamples": 0,
            "recordLevelOnly": True, "rawPublisherFileCommitted": False,
            "rawRowsUploadedAsArtifact": False
        },
        "evidenceBoundary": contract["evidenceBoundary"]
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--retrieved-date", required=True)
    args = p.parse_args()
    out = run(args.output, args.retrieved_date)
    print(json.dumps({
        "status": out["status"], "rows": out["profile"]["rows"],
        "columns": out["profile"]["columns"], "qualityCounts": out["profile"]["deliveredQualityCounts"],
        "reportedQualityCounts": out["profile"]["publisherReportedQualityCounts"],
        "recordLevelMeasuredProcessValues": out["profile"]["recordLevelMeasuredProcessValues"]
    }, indent=2))
