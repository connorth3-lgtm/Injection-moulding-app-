#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import urllib.parse
import urllib.request
from pathlib import Path

DATASET_ID = "6f9x8yg8nj"
VERSION = 1
DOI = "10.17632/6f9x8yg8nj.1"
API = "https://api.data.mendeley.com"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def request_json(url: str):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "application/json, application/vnd.mendeley-public-dataset.1+json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def walk_files():
    files = []
    folders_seen = set()
    queue = [None]
    while queue:
        folder_id = queue.pop(0)
        params = {"version": VERSION, "$start": 0, "$limit": 100}
        if folder_id:
            params["folder_id"] = folder_id
        url = f"{API}/datasets/publics/{DATASET_ID}/files?{urllib.parse.urlencode(params)}"
        batch = request_json(url)
        if isinstance(batch, dict):
            batch = batch.get("results") or batch.get("files") or []
        if batch is None:
            batch = []
        for f in batch:
            files.append(f)
        if folder_id is None:
            folder_url = f"{API}/datasets/{DATASET_ID}/folders?version={VERSION}"
            try:
                folders = request_json(folder_url) or []
            except Exception:
                folders = []
            for folder in folders:
                fid = folder.get("id")
                if fid and fid not in folders_seen:
                    folders_seen.add(fid)
                    queue.append(fid)
    dedup = {}
    for f in files:
        key = f.get("id") or f.get("file_id") or f.get("filename")
        if key:
            dedup[key] = f
    return list(dedup.values())


def compact_file(f):
    cd = f.get("content_details") or {}
    name = f.get("filename") or f.get("name") or ""
    lower = name.lower()
    injection_marker = any(x in lower for x in ["injection", "mold", "mould", "case", "real"])
    excluded_marker = any(x in lower for x in ["swat", "tennessee", "tep"])
    return {
        "id": f.get("id") or f.get("file_id"),
        "filename": name,
        "folderId": f.get("folder_id"),
        "sizeBytes": cd.get("size") if cd.get("size") is not None else f.get("size"),
        "sha256": cd.get("sha256_hash"),
        "contentType": cd.get("content_type"),
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

    metadata_url = f"{API}/datasets/{DATASET_ID}?version={VERSION}"
    metadata = request_json(metadata_url)
    files = [compact_file(x) for x in walk_files()]
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
            "licenseExpectedFromPublisherPage": "CC BY 4.0",
            "metadataName": metadata.get("name"),
            "metadataVersion": metadata.get("version"),
            "metadataDoi": ((metadata.get("doi") or {}).get("id") if isinstance(metadata.get("doi"), dict) else metadata.get("doi")),
        },
        "manifest": {
            "files": files,
            "fileCount": len(files),
            "totalBytes": sum(int(x.get("sizeBytes") or 0) for x in files),
            "filesWithPublisherSha256": sum(1 for x in files if isinstance(x.get("sha256"), str) and len(x["sha256"]) == 64),
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
    print(json.dumps({"status": result["status"], "fileCount": result["manifest"]["fileCount"], "likelyInjectionSubsetByName": result["manifest"]["likelyInjectionSubsetByName"], "explicitNonInjectionBenchmarkByName": result["manifest"]["explicitNonInjectionBenchmarkByName"]}, indent=2))


if __name__ == "__main__":
    main()
