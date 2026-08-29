#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

DATASET_ID = "6f9x8yg8nj"
VERSION = 1
DOI = "10.17632/6f9x8yg8nj.1"
PAGE = f"https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}"
PUBLIC_FILES_ENDPOINT = f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def request_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def flatten_files(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "files", "items", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    raise RuntimeError("Mendeley public file-list response did not contain a file array")


def compact_file(f):
    cd = f.get("content_details") or f.get("contentDetails") or {}
    name = str(f.get("filename") or f.get("name") or "").strip()
    lower = name.lower()
    injection_marker = any(x in lower for x in ["injection", "mold", "mould", "case", "real"])
    excluded_marker = any(x in lower for x in ["swat", "tennessee", "tep"])
    sha = cd.get("sha256_hash") or cd.get("sha256Hash") or f.get("sha256") or f.get("sha256_hash")
    return {
        "id": f.get("id") or f.get("file_id") or f.get("uuid"),
        "filename": name,
        "folderId": f.get("folder_id") or f.get("folderId"),
        "sizeBytes": cd.get("size") if cd.get("size") is not None else f.get("size"),
        "sha256": sha,
        "md5": f.get("md5") or f.get("md5_hash"),
        "contentType": cd.get("content_type") or cd.get("contentType") or f.get("content_type"),
        "status": f.get("status"),
        "likelyInjectionSubsetByName": bool(injection_marker and not excluded_marker),
        "explicitNonInjectionBenchmarkByName": bool(excluded_marker),
        "rawPayloadDownloaded": False,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()

    payload = request_json(PUBLIC_FILES_ENDPOINT)
    files = [compact_file(x) for x in flatten_files(payload)]
    files = [x for x in files if x.get("id") or x.get("filename")]
    result = {
        "schema": 1,
        "status": "publisher-file-manifest-profiled",
        "retrievedDate": args.retrieved_date,
        "source": {
            "datasetId": "ad-stgn-injection-moulding-v1",
            "mendeleyDatasetId": DATASET_ID,
            "datasetDoi": DOI,
            "version": VERSION,
            "publisher": "Mendeley Data",
            "datasetPage": PAGE,
            "manifestEndpoint": PUBLIC_FILES_ENDPOINT,
            "licenseExpectedFromPublisherPage": "CC BY 4.0",
        },
        "manifest": {
            "files": files,
            "fileCount": len(files),
            "totalBytes": sum(int(x.get("sizeBytes") or 0) for x in files),
            "filesWithPublisherSha256": sum(1 for x in files if isinstance(x.get("sha256"), str) and len(x["sha256"]) == 64),
            "filesWithPublisherMd5": sum(1 for x in files if isinstance(x.get("md5"), str) and len(x["md5"]) == 32),
            "likelyInjectionSubsetByName": [x["filename"] for x in files if x["likelyInjectionSubsetByName"]],
            "explicitNonInjectionBenchmarkByName": [x["filename"] for x in files if x["explicitNonInjectionBenchmarkByName"]],
            "rawPayloadsDownloaded": False,
            "rawRowsOrArraysEmitted": False,
        },
        "acceptance": {
            "stage1ManifestComplete": len(files) > 0,
            "countsAsFullyProfiledMeasuredDataset": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "stage2Required": True,
        },
        "evidenceBoundary": "Stage 1 enumerates publisher file metadata only. TEP and SWaT payloads are never counted as injection-moulding evidence. Injection-moulding files must be isolated from the manifest and profiled separately before any measured row, channel, cycle or sample count is accepted.",
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": result["status"],
        "fileCount": result["manifest"]["fileCount"],
        "totalBytes": result["manifest"]["totalBytes"],
        "likelyInjectionSubsetByName": result["manifest"]["likelyInjectionSubsetByName"],
        "explicitNonInjectionBenchmarkByName": result["manifest"]["explicitNonInjectionBenchmarkByName"],
    }, indent=2))


if __name__ == "__main__":
    main()
