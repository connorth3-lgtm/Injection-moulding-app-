#!/usr/bin/env python3
"""Retrieve and safely profile the pinned scatimdata / AVAPS measured dataset.

The profiler emits aggregate structural evidence only. It never emits publisher raw
rows or cell values and deletes its temporary download workspace after execution.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import tempfile
import urllib.request
import zipfile

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


def normalized_headers(df: pd.DataFrame) -> list[str]:
    return [str(x).strip() for x in df.columns]


def table_summary(df: pd.DataFrame, source_name: str, table_name: str) -> dict:
    headers = normalized_headers(df)
    joined = " ".join([source_name, table_name, *headers]).lower()
    return {
        "sourceFile": source_name,
        "table": table_name,
        "rows": int(len(df.index)),
        "columns": int(len(df.columns)),
        "pressureTokenObserved": "pressure" in joined or "druck" in joined,
        "flowTokenObserved": "flow" in joined or "durchfluss" in joined or "speed" in joined,
        "cycleTokenObserved": "cycle" in joined or "zyklus" in joined,
        "headerPreview": headers[:12],
        "headerTailPreview": headers[-12:] if len(headers) > 12 else [],
        "rawValuesEmitted": False,
    }


def read_table_summaries(path: Path) -> list[dict]:
    ext = path.suffix.lower()
    out: list[dict] = []
    try:
        if ext in {".csv", ".txt", ".tsv"}:
            kwargs = {"engine": "python", "on_bad_lines": "error"}
            if ext == ".tsv":
                kwargs["sep"] = "\t"
            else:
                kwargs["sep"] = None
            df = pd.read_csv(path, **kwargs)
            out.append(table_summary(df, path.name, path.name))
        elif ext in {".xlsx", ".xls"}:
            sheets = pd.read_excel(path, sheet_name=None)
            for sheet, df in sheets.items():
                out.append(table_summary(df, path.name, str(sheet)))
        elif ext == ".parquet":
            df = pd.read_parquet(path)
            out.append(table_summary(df, path.name, path.name))
        elif ext == ".json":
            try:
                df = pd.read_json(path, lines=True)
            except ValueError:
                df = pd.read_json(path)
            out.append(table_summary(df, path.name, path.name))
        # Intentionally do not deserialize pickle/joblib or other executable formats.
    except Exception as exc:
        out.append({
            "sourceFile": path.name,
            "table": path.name,
            "readError": f"{type(exc).__name__}: {exc}",
            "rawValuesEmitted": False,
        })
    return out


def classify_archive(tables: list[dict], expected_cycles: int, points_per_signal: int) -> dict:
    readable = [x for x in tables if "rows" in x and "columns" in x]
    cycle_tables = [x for x in readable if x["rows"] == expected_cycles]

    pressure = [x for x in cycle_tables if x.get("pressureTokenObserved") and x["columns"] >= points_per_signal]
    flow = [x for x in cycle_tables if x.get("flowTokenObserved") and x["columns"] >= points_per_signal]
    combined = [
        x for x in cycle_tables
        if x.get("pressureTokenObserved") and x.get("flowTokenObserved") and x["columns"] >= points_per_signal * 2
    ]

    structure = bool(combined or (pressure and flow))
    return {
        "expectedCycles": expected_cycles,
        "cycleCountObserved": bool(cycle_tables),
        "cycleTableCount": len(cycle_tables),
        "timeSeriesStructureObserved": structure,
        "pressureCandidateTables": len(pressure),
        "flowCandidateTables": len(flow),
        "combinedCandidateTables": len(combined),
    }


def retrieve(url: str, output: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "MouldMaster measured-data profiler/1"})
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

            tables = []
            for path in sorted(p for p in extract_dir.rglob("*") if p.is_file()):
                tables.extend(read_table_summaries(path))

            classification = classify_archive(
                tables,
                int(archive["expectedCycles"]),
                int(mc["pointsPerSignalPerCycle"]),
            )
            archive_results.append({
                "name": name,
                "part": archive["part"],
                "sourceUrl": url,
                "gitBlobSha1": archive["gitBlobSha1"],
                "sizeBytes": actual_size,
                "sha256": archive_sha256,
                "archiveMembers": member_meta,
                "tableSummaries": tables,
                "classification": classification,
                "rawValuesEmitted": False,
            })

        all_cycle_counts = all(x["classification"]["cycleCountObserved"] for x in archive_results)
        all_ts_structure = all(x["classification"]["timeSeriesStructureObserved"] for x in archive_results)
        accepted = all_cycle_counts and all_ts_structure

        result = {
            "schema_version": 1,
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
                "pointsPerSignalPerCycle": int(mc["pointsPerSignalPerCycle"]),
                "signalsPerCycle": int(mc["signalsPerCycle"]),
                "timeSeriesValuesPerCycle": int(mc["timeSeriesValuesPerCycle"]),
                "sampleIntervalMilliseconds": int(mc["sampleIntervalMilliseconds"]),
                "measuredTimeSeriesSamples": int(mc["expectedMeasuredTimeSeriesSamples"]) if accepted else 0,
                "qualityOutcomes": mc["qualityOutcomes"],
                "cycleCountReconciledAgainstDeliveredFiles": all_cycle_counts,
                "timeSeriesStructureObservedInDeliveredFiles": all_ts_structure,
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
        "measuredTimeSeriesSamples": result["measurementProfile"]["measuredTimeSeriesSamples"],
        "archiveCount": len(result["archives"]),
        "rawValuesEmitted": False,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
