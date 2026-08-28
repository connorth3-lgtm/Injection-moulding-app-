#!/usr/bin/env python3
"""Retrieve and safely profile the pinned scatimdata / AVAPS measured dataset.

The profiler emits aggregate structural evidence only. It never emits publisher raw
rows or cell values and deletes its temporary download workspace after execution.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import tempfile
import urllib.request
import zipfile

import h5py
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "data" / "public-benchmark-contracts" / "scatimdata-avaps-v1.json"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def safe_members(zf: zipfile.ZipFile) -> list[zipfile.ZipInfo]:
    members = []
    for info in zf.infolist():
        p = PurePosixPath(info.filename)
        if p.is_absolute() or ".." in p.parts:
            raise RuntimeError(f"unsafe archive path: {info.filename}")
        if not info.is_dir():
            members.append(info)
    if not members:
        raise RuntimeError("archive contains no files")
    return members


def normalize_cycle_id(value) -> str | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        number = float(text)
        if number.is_integer():
            return str(int(number))
    except ValueError:
        pass
    return text


def header_tokens(source_name: str, headers: list[str]) -> tuple[bool, bool, bool]:
    joined = " ".join([source_name, *headers]).lower()
    return (
        "pressure" in joined or "druck" in joined,
        "flow" in joined or "durchfluss" in joined or "geschwindigkeit" in joined,
        "cycle" in joined or "zyklus" in joined,
    )


def read_csv_profile(path: Path) -> tuple[dict, dict]:
    ext = path.suffix.lower()
    kwargs = {"engine": "python", "on_bad_lines": "error"}
    kwargs["sep"] = "\t" if ext == ".tsv" else None
    df = pd.read_csv(path, **kwargs)
    headers = [str(x).strip() for x in df.columns]
    pressure, flow, cycle = header_tokens(path.name, headers)
    summary = {
        "sourceFile": path.name,
        "table": path.name,
        "rows": int(len(df.index)),
        "columns": int(len(df.columns)),
        "pressureTokenObserved": pressure,
        "flowTokenObserved": flow,
        "cycleTokenObserved": cycle,
        "headerPreview": headers[:12],
        "headerTailPreview": headers[-12:] if len(headers) > 12 else [],
        "rawValuesEmitted": False,
    }
    meta: dict = {"kind": "table", "rows": len(df.index), "columns": len(df.columns)}

    cycle_col = next((h for h in headers if h.lower() in {"cycle_counter", "cycle", "zyklus", "cyclecounter"}), None)
    if cycle_col is not None:
        ids = {x for x in (normalize_cycle_id(v) for v in df[cycle_col].tolist()) if x is not None}
        meta.update({"kind": "scalar-cycle-table", "cycle_ids": ids})
        summary["uniqueCycleIds"] = len(ids)

    if headers and headers[0].lower() in {"time", "zeit", "timestamp"} and len(headers) > 2:
        ids = {x for x in (normalize_cycle_id(h) for h in headers[1:]) if x is not None}
        role = "pressure" if "pressure" in path.name.lower() else "flow" if "flow" in path.name.lower() else "timeseries"
        meta.update({
            "kind": "transposed-timeseries",
            "role": role,
            "cycle_ids": ids,
            "samples_per_series": len(df.index),
        })
        summary["seriesCycleColumns"] = len(ids)
        summary["samplesPerSeries"] = int(len(df.index))
        summary["orientation"] = "time-rows/cycle-columns"

    return summary, meta


def read_hdf5_profile(path: Path) -> tuple[list[dict], list[dict]]:
    summaries: list[dict] = []
    meta: list[dict] = []
    with h5py.File(path, "r") as h5:
        def visitor(name, obj):
            if not isinstance(obj, h5py.Dataset):
                return
            shape = tuple(int(x) for x in obj.shape)
            lname = name.lower()
            role = "pressure" if ("pressure" in lname or "druck" in lname) else "flow" if ("flow" in lname or "durchfluss" in lname) else "other"
            summaries.append({
                "sourceFile": path.name,
                "datasetPath": name,
                "shape": list(shape),
                "rank": len(shape),
                "elementCount": int(obj.size),
                "dtype": str(obj.dtype),
                "roleToken": role,
                "rawValuesEmitted": False,
            })
            meta.append({"path": name, "shape": shape, "role": role})
        h5.visititems(visitor)
    return summaries, meta


def read_file_profiles(path: Path) -> tuple[list[dict], list[dict]]:
    ext = path.suffix.lower()
    try:
        if ext in {".csv", ".txt", ".tsv"}:
            summary, meta = read_csv_profile(path)
            return [summary], [meta]
        if ext in {".h5", ".hdf5", ".hdf"}:
            return read_hdf5_profile(path)
        if ext in {".xlsx", ".xls"}:
            summaries = []
            metas = []
            for sheet, df in pd.read_excel(path, sheet_name=None).items():
                headers = [str(x).strip() for x in df.columns]
                pressure, flow, cycle = header_tokens(f"{path.name} {sheet}", headers)
                summaries.append({
                    "sourceFile": path.name,
                    "table": str(sheet),
                    "rows": int(len(df.index)),
                    "columns": int(len(df.columns)),
                    "pressureTokenObserved": pressure,
                    "flowTokenObserved": flow,
                    "cycleTokenObserved": cycle,
                    "headerPreview": headers[:12],
                    "headerTailPreview": headers[-12:] if len(headers) > 12 else [],
                    "rawValuesEmitted": False,
                })
                metas.append({"kind": "table", "rows": len(df.index), "columns": len(df.columns)})
            return summaries, metas
        if ext == ".parquet":
            df = pd.read_parquet(path)
            headers = [str(x).strip() for x in df.columns]
            pressure, flow, cycle = header_tokens(path.name, headers)
            return [{
                "sourceFile": path.name,
                "table": path.name,
                "rows": int(len(df.index)),
                "columns": int(len(df.columns)),
                "pressureTokenObserved": pressure,
                "flowTokenObserved": flow,
                "cycleTokenObserved": cycle,
                "headerPreview": headers[:12],
                "headerTailPreview": headers[-12:] if len(headers) > 12 else [],
                "rawValuesEmitted": False,
            }], [{"kind": "table", "rows": len(df.index), "columns": len(df.columns)}]
    except Exception as exc:
        return [{
            "sourceFile": path.name,
            "readError": f"{type(exc).__name__}: {exc}",
            "rawValuesEmitted": False,
        }], []
    # Intentionally do not deserialize pickle/joblib or other executable formats.
    return [], []


def classify_archive(metas: list[dict], expected_cycles: int) -> dict:
    scalar = [m for m in metas if m.get("kind") == "scalar-cycle-table"]
    transposed = [m for m in metas if m.get("kind") == "transposed-timeseries"]
    pressure = [m for m in transposed if m.get("role") == "pressure"]
    flow = [m for m in transposed if m.get("role") == "flow"]

    if scalar and pressure and flow:
        scalar_ids = scalar[0]["cycle_ids"]
        common = scalar_ids & pressure[0]["cycle_ids"] & flow[0]["cycle_ids"]
        ps = int(pressure[0]["samples_per_series"])
        fs = int(flow[0]["samples_per_series"])
        structure = len(common) == expected_cycles and ps == fs and ps > 0
        return {
            "expectedCycles": expected_cycles,
            "cycleCountObserved": len(scalar_ids) == expected_cycles,
            "linkedCyclesWithBothSignals": len(common),
            "pressureSeriesColumns": len(pressure[0]["cycle_ids"]),
            "flowSeriesColumns": len(flow[0]["cycle_ids"]),
            "pressureSamplesPerLinkedCycle": ps,
            "flowSamplesPerLinkedCycle": fs,
            "timeSeriesStructureObserved": structure,
            "measuredTimeSeriesSamplesObserved": len(common) * (ps + fs) if structure else 0,
            "storageOrientation": "scalar rows + transposed time-series tables",
        }

    h5 = [m for m in metas if "shape" in m]
    h5_pressure = []
    h5_flow = []
    for m in h5:
        shape = m["shape"]
        if len(shape) != 2 or expected_cycles not in shape:
            continue
        other = shape[1] if shape[0] == expected_cycles else shape[0]
        rec = {**m, "samples": int(other)}
        if m.get("role") == "pressure":
            h5_pressure.append(rec)
        elif m.get("role") == "flow":
            h5_flow.append(rec)
    if h5_pressure and h5_flow:
        ps = h5_pressure[0]["samples"]
        fs = h5_flow[0]["samples"]
        structure = ps == fs and ps > 0
        return {
            "expectedCycles": expected_cycles,
            "cycleCountObserved": True,
            "linkedCyclesWithBothSignals": expected_cycles,
            "pressureSamplesPerLinkedCycle": ps,
            "flowSamplesPerLinkedCycle": fs,
            "timeSeriesStructureObserved": structure,
            "measuredTimeSeriesSamplesObserved": expected_cycles * (ps + fs) if structure else 0,
            "storageOrientation": "HDF5 two-dimensional signal datasets",
        }

    return {
        "expectedCycles": expected_cycles,
        "cycleCountObserved": False,
        "linkedCyclesWithBothSignals": 0,
        "timeSeriesStructureObserved": False,
        "measuredTimeSeriesSamplesObserved": 0,
        "storageOrientation": "unresolved",
    }


def retrieve(url: str, output: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "MouldMaster measured-data profiler/2"})
    with urllib.request.urlopen(req, timeout=120) as response, output.open("wb") as fh:
        shutil.copyfileobj(response, fh)


def run(output: Path, retrieved_date: str) -> dict:
    contract = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    source = contract["source"]
    mc = contract["measurementContract"]
    commit = source["repositoryCommit"]

    workspace = Path(tempfile.mkdtemp(prefix="mouldmaster-scatimdata-"))
    archive_results = []
    try:
        for archive in contract["archives"]:
            name = archive["name"]
            url = f"https://raw.githubusercontent.com/sc4t1m/scatimdata/{commit}/{name}"
            local_zip = workspace / name
            retrieve(url, local_zip)
            actual_size = local_zip.stat().st_size
            if actual_size != archive["sizeBytes"]:
                raise RuntimeError(f"{name}: byte size drifted: {actual_size} != {archive['sizeBytes']}")

            archive_sha256 = sha256_file(local_zip)
            extract_dir = workspace / (name + "-extracted")
            extract_dir.mkdir()
            with zipfile.ZipFile(local_zip) as zf:
                members = safe_members(zf)
                zf.extractall(extract_dir, members=members)
                member_meta = [
                    {
                        "path": info.filename,
                        "compressedBytes": int(info.compress_size),
                        "uncompressedBytes": int(info.file_size),
                    }
                    for info in members
                ]

            summaries: list[dict] = []
            metas: list[dict] = []
            for path in sorted(p for p in extract_dir.rglob("*") if p.is_file()):
                s, m = read_file_profiles(path)
                summaries.extend(s)
                metas.extend(m)

            classification = classify_archive(metas, int(archive["expectedCycles"]))
            archive_results.append({
                "name": name,
                "part": archive["part"],
                "sourceUrl": url,
                "gitBlobSha1": archive["gitBlobSha1"],
                "sizeBytes": actual_size,
                "sha256": archive_sha256,
                "archiveMembers": member_meta,
                "structureSummaries": summaries,
                "classification": classification,
                "rawValuesEmitted": False,
            })

        all_cycles = all(x["classification"]["cycleCountObserved"] for x in archive_results)
        all_ts = all(x["classification"]["timeSeriesStructureObserved"] for x in archive_results)
        observed_samples = sum(int(x["classification"]["measuredTimeSeriesSamplesObserved"]) for x in archive_results)
        accepted = all_cycles and all_ts and observed_samples > 0

        result = {
            "schema_version": 2,
            "status": "completed-public-measured-benchmark" if accepted else "retrieved-profile-needs-structure-review",
            "retrieved_date": retrieved_date,
            "source": {
                "datasetId": contract["datasetId"],
                "title": source["title"],
                "repository": source["repository"],
                "repositoryCommit": commit,
                "license": source["license"],
                "peerReviewedCompanion": source["peerReviewedCompanion"],
            },
            "archives": archive_results,
            "measurementProfile": {
                "cycles": int(mc["cycleCount"]),
                "timeSeriesSignals": mc["timeSeriesSignals"],
                "paperReportedPointsPerSignalPerCycle": int(mc["pointsPerSignalPerCycle"]),
                "paperReportedSampleIntervalMilliseconds": int(mc["sampleIntervalMilliseconds"]),
                "deliveredMeasuredTimeSeriesSamples": observed_samples if accepted else 0,
                "qualityOutcomes": mc["qualityOutcomes"],
                "cycleCountReconciledAgainstDeliveredFiles": all_cycles,
                "timeSeriesStructureObservedInDeliveredFiles": all_ts,
                "paperVsDeliveredPointCountReconciled": accepted and all(
                    x["classification"].get("pressureSamplesPerLinkedCycle") in {2048, 2049}
                    and x["classification"].get("flowSamplesPerLinkedCycle") in {2048, 2049}
                    for x in archive_results
                ),
            },
            "retrieval": {
                "mode": "credential-free pinned GitHub raw archive retrieval",
                "rawPublisherFilesCommitted": False,
                "rawPublisherFilesUploadedAsArtifact": False,
                "rawRowsOrCellValuesEmitted": False,
            },
            "evidenceBoundary": contract["evidenceBoundary"],
        }
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        return result
    finally:
        shutil.rmtree(workspace, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--retrieved-date", required=True)
    args = parser.parse_args()
    result = run(args.output, args.retrieved_date)
    print(json.dumps({
        "status": result["status"],
        "cycles": result["measurementProfile"]["cycles"],
        "deliveredMeasuredTimeSeriesSamples": result["measurementProfile"]["deliveredMeasuredTimeSeriesSamples"],
        "archiveCount": len(result["archives"]),
        "rawValuesEmitted": False,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
