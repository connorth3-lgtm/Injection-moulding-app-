#!/usr/bin/env python3
"""Profile the exact OpenMMS-T4G case-study CSV without emitting raw rows."""

from __future__ import annotations
import argparse, hashlib, json, shutil, tempfile, urllib.request
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/openmms-t4g-v1.json"

SOURCE_SCHEMA = {
    "t":  {"semantic":"time-module-1", "unit":"s", "module":"temperature-pressure-force"},
    "T1": {"semantic":"temperature-1", "unit":"degC", "module":"temperature-pressure-force"},
    "T2": {"semantic":"temperature-2", "unit":"degC", "module":"temperature-pressure-force"},
    "P":  {"semantic":"cavity-pressure", "unit":"bar", "module":"temperature-pressure-force"},
    "F":  {"semantic":"extraction-force", "unit":"N", "module":"temperature-pressure-force"},
    "Ax": {"semantic":"acceleration-x", "unit":"g", "module":"inertial"},
    "Ay": {"semantic":"acceleration-y", "unit":"g", "module":"inertial"},
    "Az": {"semantic":"acceleration-z", "unit":"g", "module":"inertial"},
    "Gx": {"semantic":"angular-velocity-x", "unit":"dps/1000", "module":"inertial"},
    "Gy": {"semantic":"angular-velocity-y", "unit":"dps/1000", "module":"inertial"},
    "Gz": {"semantic":"angular-velocity-z", "unit":"dps/1000", "module":"inertial"},
    "t2": {"semantic":"time-module-2", "unit":"s", "module":"inertial"}
}
MEASURED_COLUMNS = ["T1","T2","P","F","Ax","Ay","Az","Gx","Gy","Gz"]
TIME_COLUMNS = ["t","t2"]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for b in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(b)
    return h.hexdigest()


def time_profile(series: pd.Series) -> dict | None:
    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.notna().mean() < 0.99:
        return None
    values = numeric.dropna().to_numpy(dtype=float)
    if len(values) < 2:
        return None
    deltas = np.diff(values)
    positive = deltas[deltas > 0]
    return {
        "nonNull": int(len(values)),
        "monotonicNonDecreasing": bool(np.all(deltas >= 0)),
        "strictlyIncreasingFraction": float(np.mean(deltas > 0)),
        "medianPositiveStepSeconds": None if len(positive) == 0 else float(np.median(positive)),
        "rawValuesEmitted": False
    }


def run(output: Path, retrieved_date: str) -> dict:
    c = json.loads(CONTRACT.read_text(encoding="utf-8"))
    src, f = c["source"], c["file"]
    url = f"https://raw.githubusercontent.com/TEPGomes/OpenMMS-T4G/{src['repositoryCommit']}/{f['path']}"
    work = Path(tempfile.mkdtemp(prefix="mouldmaster-openmms-"))
    try:
        local = work / "Case_Study_Raw_Data.csv"
        req = urllib.request.Request(url, headers={"User-Agent": "MouldMaster measured-data profiler/2"})
        with urllib.request.urlopen(req, timeout=120) as response, local.open("wb") as out:
            shutil.copyfileobj(response, out)
        size = local.stat().st_size
        if size != f["sizeBytes"]:
            raise RuntimeError(f"OpenMMS file size drifted: {size} != {f['sizeBytes']}")
        digest = sha256_file(local)
        df = pd.read_csv(local, sep=None, engine="python", on_bad_lines="error")
        headers = [str(x) for x in df.columns]
        schema_exact = headers == list(SOURCE_SCHEMA)
        column_profiles = []
        for name in headers:
            mapping = SOURCE_SCHEMA.get(name)
            non_null = int(df[name].notna().sum())
            column_profiles.append({
                "name": name,
                "dtype": str(df[name].dtype),
                "nonNull": non_null,
                "missing": int(len(df)-non_null),
                "semantic": None if mapping is None else mapping["semantic"],
                "unit": None if mapping is None else mapping["unit"],
                "module": None if mapping is None else mapping["module"],
                "rawValuesEmitted": False
            })
        time_profiles = {name: time_profile(df[name]) for name in TIME_COLUMNS if name in df.columns}
        time_profiles = {k:v for k,v in time_profiles.items() if v is not None}
        time_ok = len(time_profiles) == 2 and all(v["monotonicNonDecreasing"] for v in time_profiles.values())
        measured_values = sum(int(df[name].notna().sum()) for name in MEASURED_COLUMNS if name in df.columns)
        accepted = schema_exact and time_ok and all(int(df[name].notna().sum()) == len(df) for name in MEASURED_COLUMNS)
        result = {
            "schema_version": 2,
            "status": "completed-public-measured-benchmark" if accepted else "retrieved-profile-needs-semantic-review",
            "retrieved_date": retrieved_date,
            "source": {
                "datasetId": c["datasetId"], "repository": src["repository"], "repositoryCommit": src["repositoryCommit"],
                "license": src["license"], "peerReviewedCompanion": src["peerReviewedCompanion"], "filePath": f["path"],
                "gitBlobSha1": f["gitBlobSha1"], "sizeBytes": size, "sha256": digest
            },
            "profile": {
                "rows": int(len(df)), "columns": int(len(df.columns)), "headerSchemaExact": schema_exact,
                "columnProfiles": column_profiles,
                "measuredSignalColumns": len(MEASURED_COLUMNS),
                "acceptedMeasuredTimeSeriesSamples": measured_values if accepted else 0,
                "timeOrdering": time_profiles,
                "bothModuleTimeBasesEstablished": time_ok,
                "sourceCodeSchemaBasis": "OpenMMS main.py defines Time [s], Temperature 1/2 [degC], Pressure [bar], Force [N], Acceleration [g], Angular velocity [dps/1000], and writes t2 for module 2 when both modules operate.",
                "rawRowsOrCellValuesEmitted": False
            },
            "caseStudy": {
                "paperReportedCycles": 110,
                "paperReportedNormalCycles": 54,
                "faultContext": "simulated extraction-system fault after the first 54 normal cycles; repeated retightening used to recreate the abnormal condition",
                "paperReportedVisualizationRateHz": 10,
                "productionGeneralizationAllowed": False
            },
            "retrieval": {"rawPublisherFileCommitted": False, "rawRowsUploadedAsArtifact": False},
            "evidenceBoundary": c["evidenceBoundary"]
        }
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        return result
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main():
    p=argparse.ArgumentParser(); p.add_argument("--output",type=Path,required=True); p.add_argument("--retrieved-date",required=True)
    a=p.parse_args(); r=run(a.output,a.retrieved_date)
    print(json.dumps({"status":r["status"],"rows":r["profile"]["rows"],"measuredSignalColumns":r["profile"]["measuredSignalColumns"],"acceptedMeasuredTimeSeriesSamples":r["profile"]["acceptedMeasuredTimeSeriesSamples"]},indent=2))


if __name__ == "__main__": main()
