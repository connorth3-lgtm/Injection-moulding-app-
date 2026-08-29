#!/usr/bin/env python3
"""Stage-1 profiler for RWTH PCR injection-moulding data.

Retrieves the exact CC BY 4.0 publisher archive, fingerprints every delivered
member, and records schema/shape metadata without emitting raw rows, arrays or
cell values. Stage 1 is deliberately non-promoting. If the repository serves a
non-archive response, the runner emits aggregate retrieval diagnostics and
remains fail-closed rather than crashing or treating HTML as data.
"""

from __future__ import annotations

import argparse
import hashlib
import http.cookiejar
import json
import shutil
import tempfile
import urllib.error
import urllib.request
import zipfile
from collections import Counter
from pathlib import Path, PurePosixPath

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/rwth-pcr-2025-v1.json"

SUPPORTED = {".csv", ".tsv", ".txt", ".xlsx", ".xls", ".mat", ".npy", ".npz", ".json"}
SEMANTIC_MARKERS = [
    "time", "zeit", "pressure", "druck", "cavity", "kavita", "antechamber",
    "vorraum", "velocity", "geschwindigkeit", "volume", "volumen", "mass",
    "masse", "controller", "control", "regler", "reference", "referenz",
    "setpoint", "soll", "measurement", "mess", "iteration", "cycle", "zyklus"
]


def sha256_stream(fh) -> str:
    h = hashlib.sha256()
    for chunk in iter(lambda: fh.read(1024 * 1024), b""):
        h.update(chunk)
    return h.hexdigest()


def sha256_file(path: Path) -> str:
    with path.open("rb") as fh:
        return sha256_stream(fh)


def safe_member(name: str) -> bool:
    p = PurePosixPath(name)
    return not p.is_absolute() and ".." not in p.parts and not any(part == "" for part in p.parts)


def schema_markers(names) -> list[str]:
    text = " ".join(str(x).lower() for x in names)
    return sorted({m for m in SEMANTIC_MARKERS if m in text})


def tabular_profile(path: Path, ext: str) -> dict:
    if ext in {".csv", ".tsv"}:
        sep = "\t" if ext == ".tsv" else None
        df = pd.read_csv(path, sep=sep, engine="python", on_bad_lines="error")
        headers = [str(x) for x in df.columns]
        return {
            "kind": "tabular",
            "tables": [{
                "name": path.name,
                "rows": int(len(df)),
                "columns": int(len(df.columns)),
                "headers": headers,
                "dtypes": {str(c): str(df[c].dtype) for c in df.columns},
                "nonNullCounts": {str(c): int(df[c].notna().sum()) for c in df.columns},
                "semanticNameMarkers": schema_markers(headers),
                "rawValuesEmitted": False,
            }],
        }
    if ext in {".xlsx", ".xls"}:
        book = pd.ExcelFile(path)
        tables = []
        for sheet in book.sheet_names:
            df = pd.read_excel(path, sheet_name=sheet)
            headers = [str(x) for x in df.columns]
            tables.append({
                "name": str(sheet),
                "rows": int(len(df)),
                "columns": int(len(df.columns)),
                "headers": headers,
                "dtypes": {str(c): str(df[c].dtype) for c in df.columns},
                "nonNullCounts": {str(c): int(df[c].notna().sum()) for c in df.columns},
                "semanticNameMarkers": schema_markers([sheet, *headers]),
                "rawValuesEmitted": False,
            })
        return {"kind": "workbook", "tables": tables}
    raise ValueError(ext)


def mat_profile(path: Path) -> dict:
    try:
        from scipy.io import whosmat
        variables = []
        for name, shape, matlab_class in whosmat(path):
            variables.append({
                "name": str(name),
                "shape": [int(x) for x in shape],
                "matlabClass": str(matlab_class),
                "elementCount": int(np.prod(shape, dtype=np.int64)) if shape else 1,
                "semanticNameMarkers": schema_markers([name]),
                "rawValuesEmitted": False,
            })
        return {"kind": "mat-v5-or-earlier", "variables": variables}
    except (NotImplementedError, ValueError, OSError):
        import h5py
        datasets = []
        with h5py.File(path, "r") as h5:
            def visitor(name, obj):
                if isinstance(obj, h5py.Dataset):
                    shape = [int(x) for x in obj.shape]
                    datasets.append({
                        "name": str(name),
                        "shape": shape,
                        "dtype": str(obj.dtype),
                        "elementCount": int(np.prod(shape, dtype=np.int64)) if shape else 1,
                        "semanticNameMarkers": schema_markers([name]),
                        "rawValuesEmitted": False,
                    })
            h5.visititems(visitor)
        return {"kind": "mat-v7.3-hdf5", "datasets": datasets}


def numpy_profile(path: Path, ext: str) -> dict:
    if ext == ".npy":
        arr = np.load(path, mmap_mode="r", allow_pickle=False)
        return {
            "kind": "npy",
            "arrays": [{
                "name": path.name,
                "shape": [int(x) for x in arr.shape],
                "dtype": str(arr.dtype),
                "elementCount": int(arr.size),
                "semanticNameMarkers": schema_markers([path.name]),
                "rawValuesEmitted": False,
            }],
        }
    z = np.load(path, allow_pickle=False)
    arrays = []
    try:
        for name in z.files:
            arr = z[name]
            arrays.append({
                "name": str(name),
                "shape": [int(x) for x in arr.shape],
                "dtype": str(arr.dtype),
                "elementCount": int(arr.size),
                "semanticNameMarkers": schema_markers([name]),
                "rawValuesEmitted": False,
            })
    finally:
        z.close()
    return {"kind": "npz", "arrays": arrays}


def json_profile(path: Path) -> dict:
    obj = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(obj, dict):
        keys = [str(x) for x in obj.keys()]
        shape = {"topLevelType": "object", "topLevelKeys": keys, "topLevelKeyCount": len(keys)}
    elif isinstance(obj, list):
        shape = {"topLevelType": "array", "topLevelLength": len(obj)}
    else:
        shape = {"topLevelType": type(obj).__name__}
    shape.update({"semanticNameMarkers": schema_markers(shape.get("topLevelKeys", [])), "rawValuesEmitted": False})
    return {"kind": "json", **shape}


def text_profile(path: Path) -> dict:
    with path.open("rb") as fh:
        lines = sum(1 for _ in fh)
    return {"kind": "text", "lineCount": int(lines), "rawValuesEmitted": False}


def inspect_member(extracted: Path, ext: str) -> dict | None:
    try:
        if ext in {".csv", ".tsv", ".xlsx", ".xls"}:
            return tabular_profile(extracted, ext)
        if ext == ".mat":
            return mat_profile(extracted)
        if ext in {".npy", ".npz"}:
            return numpy_profile(extracted, ext)
        if ext == ".json":
            return json_profile(extracted)
        if ext == ".txt":
            return text_profile(extracted)
    except Exception as exc:
        return {"kind": "profile-error", "errorType": type(exc).__name__, "rawValuesEmitted": False}
    return None


def retrieval_candidates(url: str) -> list[str]:
    suffix = "&" if "?" in url else "?"
    candidates = [url, f"{url}{suffix}download=1", f"{url}{suffix}download=true"]
    return list(dict.fromkeys(candidates))


def retrieve_archive(src: dict, work: Path) -> tuple[Path | None, list[dict]]:
    """Retrieve a valid ZIP or return aggregate-only diagnostics.

    No response bodies or raw file values are included in diagnostics.
    """
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    browser_headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 MouldMaster/1.0",
        "Accept": "application/zip, application/octet-stream;q=0.9, */*;q=0.5",
        "Referer": src["recordUrl"],
    }

    # Establish repository session/cookies where the publication server uses them.
    try:
        landing_req = urllib.request.Request(src["recordUrl"], headers=browser_headers)
        with opener.open(landing_req, timeout=60) as landing:
            landing.read(1)
    except Exception:
        pass

    attempts = []
    for index, url in enumerate(retrieval_candidates(src["downloadUrl"]), 1):
        target = work / f"download-attempt-{index}.bin"
        rec = {"url": url, "rawResponseBodyEmitted": False}
        try:
            req = urllib.request.Request(url, headers=browser_headers)
            with opener.open(req, timeout=180) as response, target.open("wb") as out:
                rec.update({
                    "httpStatus": int(getattr(response, "status", 200) or 200),
                    "finalUrl": response.geturl(),
                    "contentType": response.headers.get("Content-Type"),
                    "contentLengthHeader": response.headers.get("Content-Length"),
                    "contentDisposition": response.headers.get("Content-Disposition"),
                })
                shutil.copyfileobj(response, out)
            rec["sizeBytes"] = int(target.stat().st_size)
            rec["sha256"] = sha256_file(target)
            with target.open("rb") as fh:
                signature = fh.read(4)
            rec["zipSignatureMatch"] = signature in {b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"}
            rec["zipStructureValid"] = bool(zipfile.is_zipfile(target))
            attempts.append(rec)
            if rec["zipStructureValid"]:
                archive = work / src["publisherFileName"]
                target.replace(archive)
                return archive, attempts
        except urllib.error.HTTPError as exc:
            rec.update({
                "httpStatus": int(exc.code),
                "errorType": type(exc).__name__,
                "contentType": exc.headers.get("Content-Type") if exc.headers else None,
                "zipSignatureMatch": False,
                "zipStructureValid": False,
            })
            attempts.append(rec)
        except Exception as exc:
            rec.update({
                "errorType": type(exc).__name__,
                "zipSignatureMatch": False,
                "zipStructureValid": False,
            })
            attempts.append(rec)
        finally:
            target.unlink(missing_ok=True)
    return None, attempts


def blocked_result(contract: dict, retrieved_date: str, attempts: list[dict]) -> dict:
    src = contract["source"]
    return {
        "schema_version": 1,
        "status": "retrieval-blocked-non-archive-response",
        "retrieved_date": retrieved_date,
        "source": {
            "datasetId": contract["datasetId"],
            "datasetDoi": src["datasetDoi"],
            "recordUrl": src["recordUrl"],
            "downloadUrl": src["downloadUrl"],
            "publisherFileName": src["publisherFileName"],
            "license": src["license"],
            "licenseEvidenceUrl": src["licenseEvidenceUrl"],
            "peerReviewedCompanion": src["peerReviewedCompanion"],
            "retrievalAttempts": attempts,
        },
        "archiveProfile": None,
        "acceptance": {
            "stage1ProfileComplete": False,
            "countsAsFullyProfiledMeasuredDataset": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "reason": "The authoritative download endpoint did not deliver a structurally valid ZIP in this execution environment; no source data were accepted.",
        },
        "retrieval": {
            "rawPublisherArchiveCommitted": False,
            "rawPublisherFilesCommitted": False,
            "rawRowsOrArraysUploadedAsArtifact": False,
            "rawResponseBodiesUploadedAsArtifact": False,
        },
        "experimentContext": contract["experimentContext"],
        "evidenceBoundary": contract["evidenceBoundary"],
    }


def run(output: Path, retrieved_date: str) -> dict:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    src = contract["source"]
    work = Path(tempfile.mkdtemp(prefix="mouldmaster-rwth-pcr-"))
    try:
        archive, attempts = retrieve_archive(src, work)
        if archive is None:
            result = blocked_result(contract, retrieved_date, attempts)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
            return result

        archive_size = archive.stat().st_size
        archive_sha = sha256_file(archive)
        members = []
        type_counts = Counter()
        data_members = 0
        total_uncompressed = 0
        unsafe = []

        with zipfile.ZipFile(archive, "r") as zf:
            infos = zf.infolist()
            for info in infos:
                if not safe_member(info.filename):
                    unsafe.append(info.filename)
            if unsafe:
                raise RuntimeError(f"unsafe archive member paths detected: {len(unsafe)}")

            for index, info in enumerate(infos, 1):
                if info.is_dir():
                    continue
                total_uncompressed += int(info.file_size)
                ext = Path(info.filename).suffix.lower()
                type_counts[ext or "<none>"] += 1
                with zf.open(info, "r") as member_fh:
                    digest = sha256_stream(member_fh)
                rec = {
                    "index": index,
                    "name": info.filename,
                    "extension": ext,
                    "sizeBytes": int(info.file_size),
                    "compressedBytes": int(info.compress_size),
                    "crc32": f"{info.CRC:08x}",
                    "sha256": digest,
                    "supportedForSchemaProfile": ext in SUPPORTED,
                    "rawValuesEmitted": False,
                }
                if ext in SUPPORTED:
                    data_members += 1
                    target = work / f"member-{index}{ext or '.bin'}"
                    with zf.open(info, "r") as src_fh, target.open("wb") as dst_fh:
                        shutil.copyfileobj(src_fh, dst_fh)
                    rec["schemaProfile"] = inspect_member(target, ext)
                    target.unlink(missing_ok=True)
                members.append(rec)

        observed_names = []
        for member in members:
            observed_names.append(member["name"])
            sp = member.get("schemaProfile") or {}
            for table in sp.get("tables") or []:
                observed_names.extend([table.get("name", ""), *(table.get("headers") or [])])
            for var in sp.get("variables") or []:
                observed_names.append(var.get("name", ""))
            for ds in sp.get("datasets") or []:
                observed_names.append(ds.get("name", ""))
            for arr in sp.get("arrays") or []:
                observed_names.append(arr.get("name", ""))

        result = {
            "schema_version": 1,
            "status": "retrieved-profile-needs-semantic-review",
            "retrieved_date": retrieved_date,
            "source": {
                "datasetId": contract["datasetId"],
                "datasetDoi": src["datasetDoi"],
                "recordUrl": src["recordUrl"],
                "downloadUrl": src["downloadUrl"],
                "publisherFileName": src["publisherFileName"],
                "license": src["license"],
                "licenseEvidenceUrl": src["licenseEvidenceUrl"],
                "peerReviewedCompanion": src["peerReviewedCompanion"],
                "sizeBytes": archive_size,
                "sha256": archive_sha,
                "retrievalAttempts": attempts,
            },
            "archiveProfile": {
                "nonDirectoryMembers": len(members),
                "supportedDataMembers": data_members,
                "totalUncompressedBytes": total_uncompressed,
                "fileTypeCounts": dict(sorted(type_counts.items())),
                "allArchivePathsSafe": True,
                "semanticNameMarkersObserved": schema_markers(observed_names),
                "members": members,
                "rawRowsOrCellValuesEmitted": False,
            },
            "acceptance": {
                "stage1ProfileComplete": len(members) > 0 and all(len(m["sha256"]) == 64 for m in members),
                "countsAsFullyProfiledMeasuredDataset": False,
                "acceptedMeasuredTimeSeriesSamples": 0,
                "reason": "Stage 1 deliberately stops before measurement-semantic and time-basis acceptance.",
            },
            "retrieval": {
                "rawPublisherArchiveCommitted": False,
                "rawPublisherFilesCommitted": False,
                "rawRowsOrArraysUploadedAsArtifact": False,
                "rawResponseBodiesUploadedAsArtifact": False,
            },
            "experimentContext": contract["experimentContext"],
            "evidenceBoundary": contract["evidenceBoundary"],
        }
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        return result
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()
    result = run(args.output, args.retrieved_date)
    summary = {
        "status": result["status"],
        "stage1ProfileComplete": result["acceptance"]["stage1ProfileComplete"],
        "countsAsFullyProfiledMeasuredDataset": result["acceptance"]["countsAsFullyProfiledMeasuredDataset"],
        "acceptedMeasuredTimeSeriesSamples": result["acceptance"]["acceptedMeasuredTimeSeriesSamples"],
        "retrievalAttempts": len(result["source"].get("retrievalAttempts") or []),
    }
    if result.get("archiveProfile"):
        summary.update({
            "archiveSha256": result["source"]["sha256"],
            "nonDirectoryMembers": result["archiveProfile"]["nonDirectoryMembers"],
            "supportedDataMembers": result["archiveProfile"]["supportedDataMembers"],
            "fileTypeCounts": result["archiveProfile"]["fileTypeCounts"],
            "semanticNameMarkersObserved": result["archiveProfile"]["semanticNameMarkersObserved"],
        })
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
