#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import urllib.request
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/public-benchmark-results/mendeley-wave2-batch2-stage1.json"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"
API_ROOT = "https://api.data.mendeley.com"


def get(url: str) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read(), r.geturl()


def public_listing(dataset_id: str, version: int):
    url = f"https://data.mendeley.com/public-api/datasets/{dataset_id}/files?folder_id=root&version={version}"
    raw, _ = get(url)
    payload = json.loads(raw.decode("utf-8"))
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "files", "items", "data"):
            if isinstance(payload.get(key), list):
                return payload[key]
    return []


def file_id(item):
    return str(item.get("id") or item.get("file_id") or item.get("uuid") or "")


def file_url(dataset_id: str, version: int, item):
    details = item.get("content_details") or item.get("contentDetails") or {}
    for key in ("download_url", "downloadUrl"):
        if details.get(key):
            return str(details[key])
        if item.get(key):
            return str(item[key])
    fid = file_id(item)
    if not fid:
        raise RuntimeError("publisher item has no file id")
    return f"{API_ROOT}/datasets/{dataset_id}/files/{fid}/file_downloaded?version={version}"


def safe_text(value):
    if not isinstance(value, str):
        return None
    text = " ".join(value.strip().split())
    if not text or len(text) > 120 or not re.search(r"[A-Za-z]", text):
        return None
    # Avoid emitting strings that are effectively raw numeric measurements.
    if re.fullmatch(r"[-+0-9.,Ee% /]+", text):
        return None
    return text


def profile_workbook(data: bytes):
    wb = load_workbook(io.BytesIO(data), read_only=True, data_only=False)
    sheets = []
    for ws in wb.worksheets:
        nonempty = numeric = formulas = strings = booleans = dates = 0
        text_labels = []
        seen = set()
        first_text_cells = []
        for row in ws.iter_rows():
            for cell in row:
                v = cell.value
                if v is None:
                    continue
                nonempty += 1
                if cell.data_type == "f":
                    formulas += 1
                    continue
                if isinstance(v, bool):
                    booleans += 1
                elif isinstance(v, (int, float)):
                    numeric += 1
                elif getattr(cell, "is_date", False):
                    dates += 1
                elif isinstance(v, str):
                    strings += 1
                    t = safe_text(v)
                    if t and t not in seen and len(text_labels) < 120:
                        seen.add(t)
                        text_labels.append(t)
                        if len(first_text_cells) < 80:
                            first_text_cells.append({"coordinate": cell.coordinate, "text": t})
        sheets.append({
            "sheet": ws.title,
            "maxRow": ws.max_row,
            "maxColumn": ws.max_column,
            "nonEmptyCells": nonempty,
            "numericConstantCells": numeric,
            "formulaCells": formulas,
            "stringCells": strings,
            "booleanCells": booleans,
            "dateCells": dates,
            "textLabels": text_labels,
            "firstTextCells": first_text_cells,
            "rawNumericValuesEmitted": False,
        })
    return sheets


def profile_source(source, dataset_id: str, version: int):
    listing = public_listing(dataset_id, version)
    by_id = {file_id(x): x for x in listing}
    files = []
    for expected in source["apiFiles"]:
        fid = expected["id"]
        item = by_id.get(fid)
        if item is None:
            raise RuntimeError(f"publisher file id disappeared: {fid}")
        data, final_url = get(file_url(dataset_id, version, item))
        digest = hashlib.sha256(data).hexdigest()
        if digest.lower() != expected["sha256"].lower():
            raise RuntimeError(f"publisher SHA mismatch for {expected['name']}: {digest}")
        files.append({
            "fileId": fid,
            "fileName": expected["name"],
            "sizeBytes": len(data),
            "sha256": digest,
            "publisherSha256Matched": True,
            "resolvedUrl": final_url,
            "workbook": profile_workbook(data),
            "rawPublisherFileCommitted": False,
            "rawRowsOrNumericValuesEmitted": False,
        })
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    selected = []
    specs = {
        "mendeley-c3pt29jt7c-v1": ("c3pt29jt7c", 1),
        "mendeley-yxz2w7ctnh-v1": ("yxz2w7ctnh", 1),
    }
    for source in manifest["sources"]:
        if source["datasetId"] not in specs:
            continue
        did, version = specs[source["datasetId"]]
        selected.append({
            "datasetId": source["datasetId"],
            "doi": source["doi"],
            "license": source["license"],
            "status": "retrieved-profile-needs-semantic-review",
            "files": profile_source(source, did, version),
            "countsAsFullyProfiledMeasuredDataset": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
        })
    result = {
        "schema": 1,
        "status": "retrieved-workbook-layouts-needing-semantic-review",
        "retrievedDate": args.retrieved_date,
        "sources": selected,
        "summary": {
            "sourcesRetrieved": len(selected),
            "filesRetrieved": sum(len(x["files"]) for x in selected),
            "fullyProfiledAccepted": 0,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "rawPublisherFilesCommitted": False,
            "rawRowsOrNumericValuesEmitted": False,
        },
        "evidenceBoundary": "Exact CC BY 4.0 publisher workbooks are temporarily retrieved and SHA-verified. Only workbook structure, text labels, cell-type counts and fingerprints are emitted. Numeric measurement values and raw files are not retained. Acceptance requires a separate source-specific semantic mapping."
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], indent=2))


if __name__ == "__main__":
    main()
