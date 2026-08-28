#!/usr/bin/env python3
"""Retrieve and safely profile the pinned scatimdata / AVAPS measured dataset.

Only aggregate structural evidence is emitted. Publisher raw rows, signal values and
cycle identifiers are never written to the result or committed to the repository.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path, PurePosixPath
import shutil
import tempfile
import urllib.request
import zipfile

import h5py
import numpy as np
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


def decode_text(value) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace").strip()
    return str(value).strip()


def normalize_scalar_id(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, (np.integer, int)):
        return str(int(value))
    if isinstance(value, (np.floating, float)):
        if np.isnan(value):
            return None
        if float(value).is_integer():
            return str(int(value))
        return None
    text = decode_text(value)
    if not text:
        return None
    try:
        f = float(text)
        if f.is_integer():
            return str(int(f))
    except ValueError:
        return None
    return None


def numeric_tokens(label) -> set[str]:
    text = decode_text(label)
    out = set()
    for token in re.findall(r"\d+", text):
        try:
            out.add(str(int(token)))
        except ValueError:
            pass
    return out


def linked_ids(dynamic_labels, scalar_ids: set[str]) -> set[str]:
    linked = set()
    for label in dynamic_labels:
        hits = numeric_tokens(label) & scalar_ids
        if len(hits) == 1:
            linked.update(hits)
    return linked


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
        "flow" in joined or "durchfluss" in joined or "geschwindigkeit" in joined or "strom" in joined,
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
        "headerCount": len(headers),
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


def h5_role(group_name: str) -> str:
    lname = group_name.lower()
    if "einspritzdruck" in lname or "pressure" in lname:
        return "pressure"
    if "einspritzstrom" in lname or "flow" in lname or "durchfluss" in lname:
        return "flow"
    if "werkzeuginnendruck" in lname or "cavity" in lname:
        return "cavity-pressure"
    return "other"


def h5_scalar_candidates(group: h5py.Group) -> list[dict]:
    candidates = []
    for key in sorted(group.keys()):
        m = re.fullmatch(r"block(\d+)_values", key)
        if not m:
            continue
        block = m.group(1)
        values = group[key][()]
        if values.ndim != 2:
            continue
        item_key = f"block{block}_items"
        if item_key not in group:
            continue
        names = [decode_text(x) for x in group[item_key][()]]
        if len(names) != values.shape[1]:
            continue
        for col, name in enumerate(names):
            ids = {x for x in (normalize_scalar_id(v) for v in values[:, col]) if x is not None}
            if ids:
                candidates.append({"field": name, "ids": ids})
    return candidates


def read_hdf5_profile(path: Path) -> tuple[list[dict], list[dict]]:
    summaries: list[dict] = []
    metas: list[dict] = []
    with h5py.File(path, "r") as h5:
        dynamic = {}
        for group_name in h5.keys():
            obj = h5[group_name]
            if not isinstance(obj, h5py.Group):
                continue
            role = h5_role(group_name)
            if "block0_values" in obj and "axis0" in obj and "axis1" in obj:
                shape = tuple(int(x) for x in obj["block0_values"].shape)
                summaries.append({
                    "sourceFile": path.name,
                    "group": group_name,
                    "role": role,
                    "matrixShape": list(shape),
                    "axis0Count": int(obj["axis0"].size),
                    "axis1Count": int(obj["axis1"].size),
                    "rawValuesEmitted": False,
                })
                if role in {"pressure", "flow"} and len(shape) == 2:
                    dynamic[role] = {
                        "labels": list(obj["axis0"][()]),
                        "samples": int(obj["axis1"].size),
                        "columns": int(obj["axis0"].size),
                    }

        scalar_group = h5.get("scalars")
        if isinstance(scalar_group, h5py.Group):
            summaries.append({
                "sourceFile": path.name,
                "group": "scalars",
                "role": "scalar-cycle-quality",
                "rowCount": int(scalar_group["axis1"].size) if "axis1" in scalar_group else None,
                "fieldCount": int(scalar_group["axis0"].size) if "axis0" in scalar_group else None,
                "rawValuesEmitted": False,
            })

        if {"pressure", "flow"} <= set(dynamic) and isinstance(scalar_group, h5py.Group):
            expected_rows = int(scalar_group["axis1"].size) if "axis1" in scalar_group else 0
            best = None
            for candidate in h5_scalar_candidates(scalar_group):
                scalar_ids = candidate["ids"]
                p_linked = linked_ids(dynamic["pressure"]["labels"], scalar_ids)
                f_linked = linked_ids(dynamic["flow"]["labels"], scalar_ids)
                common = p_linked & f_linked
                score = len(common)
                if best is None or score > best["score"]:
                    best = {
                        "score": score,
                        "field": candidate["field"],
                        "scalar_count": len(scalar_ids),
                        "pressure_linked": len(p_linked),
                        "flow_linked": len(f_linked),
                        "common": len(common),
                    }
            metas.append({
                "kind": "hdf5-linked-timeseries",
                "expected_scalar_rows": expected_rows,
                "pressure_columns": dynamic["pressure"]["columns"],
                "flow_columns": dynamic["flow"]["columns"],
                "pressure_samples": dynamic["pressure"]["samples"],
                "flow_samples": dynamic["flow"]["samples"],
                "best_cycle_field": None if best is None else best["field"],
                "best_scalar_id_count": 0 if best is None else best["scalar_count"],
                "pressure_linked": 0 if best is None else best["pressure_linked"],
                "flow_linked": 0 if best is None else best["flow_linked"],
                "common_linked": 0 if best is None else best["common"],
            })
    return summaries, metas


def read_file_profiles(path: Path) -> tuple[list[dict], list[dict]]:
    ext = path.suffix.lower()
    try:
        if ext in {".csv", ".txt", ".tsv"}:
            summary, meta = read_csv_profile(path)
            return [summary], [meta]
        if ext in {".h5", ".hdf5", ".hdf"}:
            return read_hdf5_profile(path)
        if ext == ".parquet":
            df = pd.read_parquet(path)
            return [{"sourceFile": path.name, "rows": int(len(df.index)), "columns": int(len(df.columns)), "rawValuesEmitted": False}], []
        if ext in {".xlsx", ".xls"}:
            sheets = pd.read_excel(path, sheet_name=None)
            return [
                {"sourceFile": path.name, "table": str(sheet), "rows": int(len(df.index)), "columns": int(len(df.columns)), "rawValuesEmitted": False}
                for sheet, df in sheets.items()
            ], []
    except Exception as exc:
        return [{"sourceFile": path.name, "readError": f"{type(exc).__name__}: {exc}", "rawValuesEmitted": False}], []
    # Deliberately do not deserialize pickle/joblib or other executable formats.
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

    hdf = next((m for m in metas if m.get("kind") == "hdf5-linked-timeseries"), None)
    if hdf is not None:
        ps = int(hdf["pressure_samples"])
        fs = int(hdf["flow_samples"])
        linked = int(hdf["common_linked"])
        cycle_ok = int(hdf["expected_scalar_rows"]) == expected_cycles and linked == expected_cycles
        structure = cycle_ok and ps == fs and ps > 0
        return {
            "expectedCycles": expected_cycles,
            "cycleCountObserved": cycle_ok,
            "linkedCyclesWithBothSignals": linked,
            "pressureSeriesColumns": int(hdf["pressure_columns"]),
            "flowSeriesColumns": int(hdf["flow_columns"]),
            "pressureSamplesPerLinkedCycle": ps,
            "flowSamplesPerLinkedCycle": fs,
            "timeSeriesStructureObserved": structure,
            "measuredTimeSeriesSamplesObserved": linked * (ps + fs) if structure else 0,
            "storageOrientation": "HDF5 dynamic matrices linked to scalar cycle field",
            "cycleLinkField": hdf.get("best_cycle_field"),
            "scalarCycleIdsObserved": int(hdf.get("best_scalar_id_count", 0)),
        }

    return {"expectedCycles": expected_cycles, "cycleCountObserved": False, "linkedCyclesWithBothSignals": 0, "timeSeriesStructureObserved": False, "measuredTimeSeriesSamplesObserved": 0, "storageOrientation": "unresolved"}


def retrieve(url: str, output: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "MouldMaster measured-data profiler/3"})
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
                member_meta = [{"path": i.filename, "compressedBytes": int(i.compress_size), "uncompressedBytes": int(i.file_size)} for i in members]

            summaries, metas = [], []
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
        delivered_points = sorted({
            int(x["classification"].get("pressureSamplesPerLinkedCycle", 0))
            for x in archive_results if x["classification"].get("pressureSamplesPerLinkedCycle")
        })
        result = {
            "schema_version": 3,
            "status": "completed-public-measured-benchmark" if accepted else "retrieved-profile-needs-structure-review",
            "retrieved_date": retrieved_date,
            "source": {
                "datasetId": contract["datasetId"], "title": source["title"], "repository": source["repository"],
                "repositoryCommit": commit, "license": source["license"], "peerReviewedCompanion": source["peerReviewedCompanion"]
            },
            "archives": archive_results,
            "measurementProfile": {
                "cycles": int(mc["cycleCount"]),
                "timeSeriesSignals": mc["timeSeriesSignals"],
                "paperReportedPointsPerSignalPerCycle": int(mc["pointsPerSignalPerCycle"]),
                "deliveredPointsPerSignalPerLinkedCycle": delivered_points,
                "paperReportedSampleIntervalMilliseconds": int(mc["sampleIntervalMilliseconds"]),
                "deliveredMeasuredTimeSeriesSamples": observed_samples if accepted else 0,
                "qualityOutcomes": mc["qualityOutcomes"],
                "cycleCountReconciledAgainstDeliveredFiles": all_cycles,
                "timeSeriesStructureObservedInDeliveredFiles": all_ts,
                "paperVsDeliveredPointCountDifferenceDocumented": bool(delivered_points) and delivered_points != [int(mc["pointsPerSignalPerCycle"])],
            },
            "retrieval": {"mode": "credential-free pinned GitHub raw archive retrieval", "rawPublisherFilesCommitted": False, "rawPublisherFilesUploadedAsArtifact": False, "rawRowsOrCellValuesEmitted": False},
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
    print(json.dumps({"status": result["status"], "cycles": result["measurementProfile"]["cycles"], "deliveredMeasuredTimeSeriesSamples": result["measurementProfile"]["deliveredMeasuredTimeSeriesSamples"], "archiveCount": len(result["archives"]), "rawValuesEmitted": False}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
