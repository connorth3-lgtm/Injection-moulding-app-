#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
import urllib.request
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/fhj5p7ww9v-v1.json"
DATASET_ID = "fhj5p7ww9v"
VERSION = 1
PUBLIC_FILES_ENDPOINT = f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}"
API_ROOT = "https://api.data.mendeley.com"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def get(url, accept="*/*"):
    req = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read(), r.geturl()


def flatten_files(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "files", "items", "data"):
            if isinstance(payload.get(key), list):
                return payload[key]
    raise RuntimeError("Mendeley public file list did not contain files")


def file_id(item):
    return str(item.get("id") or item.get("file_id") or item.get("uuid") or "").strip()


def file_name(item):
    return str(item.get("filename") or item.get("name") or "").strip()


def file_url(item):
    details = item.get("content_details") or item.get("contentDetails") or {}
    for candidate in (details.get("download_url"), details.get("downloadUrl"), item.get("download_url"), item.get("downloadUrl")):
        if candidate:
            return str(candidate)
    fid = file_id(item)
    if fid:
        return f"{API_ROOT}/datasets/{DATASET_ID}/files/{fid}/file_downloaded?version={VERSION}"
    return None


def classify_headers(headers):
    names = [str(x).strip() for x in headers]
    low = [x.lower() for x in names]
    measured = []
    derived = []
    process = []
    for original, name in zip(names, low):
        if any(k in name for k in ["weight reduction", "increase percentage", "increase percent", "%", "percentage"]):
            derived.append(original)
        elif any(k in name for k in ["weight", "flexural strength", "flexural modulus", "modulus"]):
            measured.append(original)
        if any(k in name for k in ["injection temperature", "injection speed", "temperature", "speed"]):
            process.append(original)
    return {
        "headerNames": names,
        "measuredOutcomeColumns": measured,
        "derivedOutcomeColumns": derived,
        "processFactorColumns": process,
        "rawValuesEmitted": False,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))

    raw, _ = get(PUBLIC_FILES_ENDPOINT, "application/json")
    files = flatten_files(json.loads(raw.decode("utf-8")))
    expected = contract["source"]["expectedPublisherFile"]
    matches = [x for x in files if file_name(x) == expected]
    if len(matches) != 1:
        raise RuntimeError(f"expected exactly one {expected!r}; found {[file_name(x) for x in files]}")
    item = matches[0]
    url = file_url(item)
    if not url:
        raise RuntimeError("publisher file has no download route")
    data, final_url = get(url)
    digest = hashlib.sha256(data).hexdigest()

    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "source.xlsx"
        path.write_bytes(data)
        sheets = pd.read_excel(path, sheet_name=None)
        profiles = []
        total_rows = 0
        total_columns = 0
        total_measured_cells = 0
        for sheet_name, df in sheets.items():
            # Preserve delivered table shape while ignoring completely empty rows/columns.
            df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")
            sem = classify_headers(df.columns)
            rows = int(len(df))
            cols = int(len(df.columns))
            measured_cols = sem["measuredOutcomeColumns"]
            measured_non_null = int(sum(int(df[c].notna().sum()) for c in measured_cols if c in df.columns))
            total_rows += rows
            total_columns += cols
            total_measured_cells += measured_non_null
            profiles.append({
                "sheet": str(sheet_name),
                "rows": rows,
                "columns": cols,
                "semantics": sem,
                "nonNullMeasuredOutcomeCells": measured_non_null,
            })

    details = item.get("content_details") or item.get("contentDetails") or {}
    publisher_sha = details.get("sha256_hash") or details.get("sha256Hash")
    result = {
        "schema": 1,
        "status": "completed-restricted-noncommercial-measured-benchmark",
        "retrievedDate": args.retrieved_date,
        "source": {
            "datasetId": contract["datasetId"],
            "datasetDoi": contract["source"]["datasetDoi"],
            "version": VERSION,
            "license": contract["source"]["license"],
            "publisherFileId": file_id(item),
            "publisherFileName": expected,
            "publisherReportedSizeBytes": details.get("size") if details.get("size") is not None else item.get("size"),
            "publisherSha256": publisher_sha,
            "retrievedSizeBytes": len(data),
            "sha256": digest,
            "resolvedUrl": final_url,
        },
        "profile": {
            "sheets": profiles,
            "sheetCount": len(profiles),
            "totalRowsAcrossSheets": total_rows,
            "totalColumnsAcrossSheets": total_columns,
            "nonNullMeasuredOutcomeCells": total_measured_cells,
            "recordLevelMeasuredValues": total_measured_cells,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "rawRowsOrCellValuesEmitted": False,
        },
        "acceptance": {
            "countsAsFullyProfiledMeasuredDataset": True,
            "useScope": "noncommercial-education-research-only",
            "commercialReuseAllowed": False,
            "rawRedistributionAllowedUnderProjectPolicy": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
        },
        "retrieval": {
            "rawPublisherFileCommitted": False,
            "rawRowsOrCellValuesUploadedAsArtifact": False,
        },
        "evidenceBoundary": contract["evidenceBoundary"],
    }
    if publisher_sha and len(str(publisher_sha)) == 64:
        result["source"]["publisherSha256Matched"] = str(publisher_sha).lower() == digest.lower()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": result["status"],
        "file": expected,
        "sha256": digest,
        "sheetCount": result["profile"]["sheetCount"],
        "totalRowsAcrossSheets": result["profile"]["totalRowsAcrossSheets"],
        "recordLevelMeasuredValues": result["profile"]["recordLevelMeasuredValues"],
    }, indent=2))


if __name__ == "__main__":
    main()
