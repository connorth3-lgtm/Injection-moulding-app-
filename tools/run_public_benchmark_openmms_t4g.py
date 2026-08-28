#!/usr/bin/env python3
"""Profile the exact OpenMMS-T4G case-study CSV without emitting raw rows."""

from __future__ import annotations
import argparse, hashlib, json, shutil, tempfile, urllib.request
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/openmms-t4g-v1.json"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for b in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(b)
    return h.hexdigest()


def infer_semantic(name: str) -> dict:
    n = name.lower().replace("º", "°")
    if "press" in n or "bar" in n:
        kind = "pressure"
    elif "temp" in n or "thermo" in n or "°c" in n:
        kind = "temperature"
    elif "force" in n or "forca" in n or "força" in n or "newton" in n:
        kind = "force"
    elif "acc" in n or "acceler" in n:
        kind = "acceleration"
    elif "gyro" in n or "gyr" in n:
        kind = "gyroscope"
    elif "time" in n or "timestamp" in n or "date" in n:
        kind = "time"
    else:
        kind = "unclassified"
    unit = None
    for token, normalized in [("bar", "bar"), ("°c", "degC"), (" c", "degC"), ("(n)", "N"), (" m/s", "m/s"), ("g)", "g"), ("deg/s", "deg/s")]:
        if token in n:
            unit = normalized
            break
    return {"semantic": kind, "unitFromHeader": unit}


def time_profile(series: pd.Series) -> dict | None:
    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.notna().mean() >= 0.95:
        values = numeric.dropna().to_numpy(dtype=float)
        if len(values) > 1:
            deltas = np.diff(values)
            positive = deltas[deltas > 0]
            return {
                "basis": "numeric-column",
                "nonNull": int(len(values)),
                "monotonicNonDecreasing": bool(np.all(deltas >= 0)),
                "medianPositiveStep": None if len(positive) == 0 else float(np.median(positive)),
                "rawValuesEmitted": False,
            }
    parsed = pd.to_datetime(series, errors="coerce", utc=True)
    if parsed.notna().mean() >= 0.95:
        values = parsed.dropna().astype("int64").to_numpy()
        if len(values) > 1:
            deltas = np.diff(values) / 1_000_000_000
            positive = deltas[deltas > 0]
            return {
                "basis": "datetime-column",
                "nonNull": int(len(values)),
                "monotonicNonDecreasing": bool(np.all(deltas >= 0)),
                "medianPositiveStepSeconds": None if len(positive) == 0 else float(np.median(positive)),
                "rawValuesEmitted": False,
            }
    return None


def run(output: Path, retrieved_date: str) -> dict:
    c = json.loads(CONTRACT.read_text(encoding="utf-8"))
    src, f = c["source"], c["file"]
    url = f"https://raw.githubusercontent.com/TEPGomes/OpenMMS-T4G/{src['repositoryCommit']}/{f['path']}"
    work = Path(tempfile.mkdtemp(prefix="mouldmaster-openmms-"))
    try:
        local = work / "Case_Study_Raw_Data.csv"
        req = urllib.request.Request(url, headers={"User-Agent": "MouldMaster measured-data profiler/1"})
        with urllib.request.urlopen(req, timeout=120) as response, local.open("wb") as out:
            shutil.copyfileobj(response, out)
        size = local.stat().st_size
        if size != f["sizeBytes"]:
            raise RuntimeError(f"OpenMMS file size drifted: {size} != {f['sizeBytes']}")
        digest = sha256_file(local)
        df = pd.read_csv(local, sep=None, engine="python", on_bad_lines="error")
        columns = []
        classified_values = 0
        time_candidates = []
        for name in df.columns:
            semantic = infer_semantic(str(name))
            non_null = int(df[name].notna().sum())
            rec = {
                "name": str(name), "dtype": str(df[name].dtype), "nonNull": non_null,
                "missing": int(len(df) - non_null), **semantic, "rawValuesEmitted": False
            }
            columns.append(rec)
            if semantic["semantic"] in {"pressure", "temperature", "force", "acceleration", "gyroscope"}:
                classified_values += non_null
            if semantic["semantic"] == "time":
                tp = time_profile(df[name])
                if tp:
                    time_candidates.append({"column": str(name), **tp})
        signal_columns = [x for x in columns if x["semantic"] in {"pressure", "temperature", "force", "acceleration", "gyroscope"}]
        accepted = len(df) > 0 and bool(signal_columns) and bool(time_candidates)
        result = {
            "schema_version": 1,
            "status": "completed-public-measured-benchmark" if accepted else "retrieved-profile-needs-semantic-review",
            "retrieved_date": retrieved_date,
            "source": {
                "datasetId": c["datasetId"], "repository": src["repository"], "repositoryCommit": src["repositoryCommit"],
                "license": src["license"], "peerReviewedCompanion": src["peerReviewedCompanion"], "filePath": f["path"],
                "gitBlobSha1": f["gitBlobSha1"], "sizeBytes": size, "sha256": digest
            },
            "profile": {
                "rows": int(len(df)), "columns": int(len(df.columns)), "columnProfiles": columns,
                "classifiedSensorColumns": len(signal_columns), "classifiedMeasuredValues": classified_values,
                "timeOrderingCandidates": time_candidates,
                "timeOrderingEstablished": bool(time_candidates),
                "rawRowsOrCellValuesEmitted": False
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
    p = argparse.ArgumentParser(); p.add_argument("--output", type=Path, required=True); p.add_argument("--retrieved-date", required=True)
    a = p.parse_args(); r = run(a.output, a.retrieved_date)
    print(json.dumps({"status": r["status"], "rows": r["profile"]["rows"], "sensorColumns": r["profile"]["classifiedSensorColumns"], "classifiedMeasuredValues": r["profile"]["classifiedMeasuredValues"]}, indent=2))


if __name__ == "__main__": main()
