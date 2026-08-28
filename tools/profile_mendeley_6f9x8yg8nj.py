#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

DATASET_ID = "6f9x8yg8nj"
VERSION = "1"
DOI = "10.17632/6f9x8yg8nj.1"
TITLE = "AD-STGN for RCA in CMMS"
PAGE = f"https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}"
API = f"https://api.data.mendeley.com/datasets/{DATASET_ID}/files?version={VERSION}&folder_id=root&$limit=500"
ZIP_URL = f"https://api.data.mendeley.com/datasets/{DATASET_ID}/zip/file_downloaded?version={VERSION}"
UA = "MouldMaster-Automotive-Injection-Profiler/1.1"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def get(url: str, accept: str = "*/*"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=300) as response:
        return response.read(), response.headers, response.geturl()


def flatten(value):
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        for key in ("results", "files", "items", "data"):
            if isinstance(value.get(key), list):
                return value[key]
    return []


def discover_files():
    raw, _, _ = get(API, "application/json")
    found = []
    for item in flatten(json.loads(raw.decode("utf-8"))):
        details = item.get("content_details") or {}
        url = item.get("download_url") or item.get("downloadUrl") or details.get("download_url")
        name = item.get("filename") or item.get("name") or item.get("file_name")
        if url:
            found.append({"name": name, "url": url, "publisherId": item.get("id"), "publisherSha256": details.get("sha256_hash")})
    return found


def filename(final_url, headers, fallback):
    cd = headers.get("Content-Disposition")
    if cd and "filename=" in cd:
        value = cd.split("filename=", 1)[1].split(";", 1)[0].strip().strip('"')
        if value:
            return urllib.parse.unquote(value)
    candidate = Path(urllib.parse.urlparse(final_url).path).name
    return candidate if Path(candidate).suffix else fallback


def table_profile(text: str):
    sample = text[:65536]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except Exception:
        dialect = csv.excel
    rows = list(csv.reader(io.StringIO(text), dialect))
    if not rows:
        return {"rows": 0, "columns": 0, "header": [], "numericColumns": 0, "missingCells": 0}
    header = [str(x).strip() for x in rows[0]]
    body = [row for row in rows[1:] if any(str(x).strip() for x in row)]
    numeric = [0] * len(header)
    missing = 0
    for row in body:
        values = list(row[: len(header)]) + [""] * max(0, len(header) - len(row))
        for idx, value in enumerate(values):
            if str(value).strip() == "":
                missing += 1
                continue
            try:
                float(str(value).strip())
                numeric[idx] += 1
            except Exception:
                pass
    numeric_cols = sum(1 for count in numeric if body and count >= max(1, int(len(body) * 0.95)))
    return {"rows": len(body), "columns": len(header), "header": header, "numericColumns": numeric_cols, "missingCells": missing}


def classify(name: str, profile: dict | None):
    hay = name.lower()
    if any(token in hay for token in ("swat", "secure_water", "secure-water", "tennessee", "tep")):
        return "non-injection-benchmark"
    if any(token in hay for token in ("injection", "molding", "moulding", "pmt", "automotive", "industrial", "case3", "case_3", "case-3")):
        return "automotive-injection-candidate"
    if profile:
        rows = profile.get("rows")
        cols = profile.get("columns")
        if rows in {88000, 22614} and 72 <= (cols or 0) <= 76:
            return "automotive-injection-candidate"
        if 72 <= (cols or 0) <= 76:
            return "automotive-injection-candidate-shape"
        if 48 <= (cols or 0) <= 55:
            return "non-injection-benchmark-shape"
    return "unresolved"


def profile_bytes(name: str, raw: bytes, publisher_id=None, publisher_sha=None):
    suffix = Path(name).suffix.lower()
    item = {
        "name": name,
        "publisherId": publisher_id,
        "sizeBytes": len(raw),
        "sha256": sha256(raw),
        "publisherSha256": publisher_sha,
        "suffix": suffix,
        "format": suffix.lstrip(".") or "unknown",
    }
    if publisher_sha:
        item["publisherSha256Matches"] = item["sha256"].lower() == str(publisher_sha).lower()
    profile = None
    if suffix in {".csv", ".tsv", ".txt"}:
        profile = table_profile(raw.decode("utf-8-sig", "replace"))
        item["table"] = profile
    elif suffix == ".json":
        try:
            parsed = json.loads(raw.decode("utf-8-sig"))
            item["jsonType"] = type(parsed).__name__
            if isinstance(parsed, dict):
                item["jsonKeys"] = sorted(str(k) for k in parsed)[:100]
        except Exception:
            item["jsonParseable"] = False
    item["processClassification"] = classify(name, profile)
    return item


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="automotive-injection-6f9x8yg8nj-v1.json")
    args = parser.parse_args()

    files = []
    acquisition = {"mode": None}
    try:
        records = discover_files()
    except Exception as exc:
        records = []
        acquisition["fileApiError"] = str(exc)

    if records:
        acquisition["mode"] = "current-public-file-api"
        for index, record in enumerate(records, 1):
            raw, headers, final_url = get(record["url"])
            name = record.get("name") or filename(final_url, headers, f"publisher-file-{index}")
            files.append(profile_bytes(name, raw, record.get("publisherId"), record.get("publisherSha256")))
    else:
        acquisition["mode"] = "version-pinned-dataset-zip-fallback"
        archive, _, final_url = get(ZIP_URL, "application/zip")
        acquisition["zip"] = {"sizeBytes": len(archive), "sha256": sha256(archive), "finalUrlHost": urllib.parse.urlparse(final_url).hostname}
        with zipfile.ZipFile(io.BytesIO(archive)) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                raw = zf.read(info.filename)
                files.append(profile_bytes(info.filename, raw))

    candidate_rows = sum((f.get("table") or {}).get("rows", 0) for f in files if f["processClassification"].startswith("automotive-injection-candidate"))
    candidate_tables = sum(1 for f in files if f["processClassification"].startswith("automotive-injection-candidate") and f.get("table"))
    excluded_rows = sum((f.get("table") or {}).get("rows", 0) for f in files if f["processClassification"].startswith("non-injection-benchmark"))
    classifications = {}
    for f in files:
        classifications[f["processClassification"]] = classifications.get(f["processClassification"], 0) + 1

    payload = {
        "schema": 1,
        "status": "exact-file-discovery-profile-review-required",
        "completedDate": "2026-08-28",
        "source": {
            "datasetId": DATASET_ID,
            "version": VERSION,
            "doi": DOI,
            "title": TITLE,
            "publisher": "Mendeley Data",
            "page": PAGE,
            "license": "CC BY 4.0",
            "publishedIndustrialContext": "Real-world injection-moulding production line at an automotive electronics manufacturer in Tianjin; data collected 2025-02-02 through 2025-03-14.",
            "publishedSystem": {"continuousMeasurements": 66, "discreteControls": 7, "terminalIndicator": "X66"},
            "publishedNormalSamples": {"training": 88000, "validation": 22614},
            "publishedProcessStages": ["clamping", "injection", "holding", "cooling", "ejection", "robot picking/placing"],
        },
        "acquisition": acquisition,
        "files": files,
        "fileCount": len(files),
        "classificationCounts": classifications,
        "automotiveInjectionCandidateTables": candidate_tables,
        "automotiveInjectionCandidateRowsObserved": candidate_rows,
        "nonInjectionBenchmarkRowsObserved": excluded_rows,
        "acceptedMeasuredRecords": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "rawSourceFilesCommitted": False,
        "boundary": "This Mendeley package bundles Tennessee Eastman, SWaT and one real automotive injection-moulding case. Only exact source files proven to belong to the automotive injection line may be promoted. TEP/SWaT rows never count as injection-moulding evidence. Promotion additionally requires exact table identity, 66-measurement/7-control reconciliation, time/sample ordering and anomaly/defect-label semantics.",
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "acquisition": acquisition,
        "fileCount": len(files),
        "classifications": classifications,
        "files": [(f["name"], f["sizeBytes"], f["sha256"], f["processClassification"], (f.get("table") or {}).get("rows"), (f.get("table") or {}).get("columns")) for f in files],
        "automotiveInjectionCandidateTables": candidate_tables,
        "automotiveInjectionCandidateRowsObserved": candidate_rows,
        "nonInjectionBenchmarkRowsObserved": excluded_rows,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
