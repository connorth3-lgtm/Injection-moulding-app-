#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

DATASET_ID = "6k8fpbrd9s"
VERSION = 1
DOI = "10.17632/6k8fpbrd9s.1"
PUBLIC_FILES_ENDPOINT = f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def get_json(url: str):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
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
    return []


def compact(item):
    details = item.get("content_details") or item.get("contentDetails") or {}
    name = str(item.get("filename") or item.get("name") or "").strip()
    ext = Path(name).suffix.lower()
    return {
        "id": item.get("id") or item.get("file_id") or item.get("uuid"),
        "filename": name,
        "extension": ext,
        "sizeBytes": details.get("size") if details.get("size") is not None else item.get("size"),
        "sha256": details.get("sha256_hash") or details.get("sha256Hash") or item.get("sha256"),
        "contentType": details.get("content_type") or details.get("contentType") or item.get("content_type"),
        "supportedForStage2": ext in {".csv", ".tsv", ".txt", ".xls", ".xlsx", ".json"},
        "rawPayloadDownloaded": False
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()

    files = [compact(x) for x in flatten_files(get_json(PUBLIC_FILES_ENDPOINT))]
    result = {
        "schema": 1,
        "status": "publisher-file-manifest-profiled" if files else "publisher-record-no-files-exposed",
        "retrievedDate": args.retrieved_date,
        "source": {
            "datasetId": "mendeley-6k8fpbrd9s-v1",
            "mendeleyDatasetId": DATASET_ID,
            "datasetDoi": DOI,
            "version": VERSION,
            "publisher": "Mendeley Data",
            "license": "CC BY 4.0",
            "manifestEndpoint": PUBLIC_FILES_ENDPOINT
        },
        "manifest": {
            "files": files,
            "fileCount": len(files),
            "totalBytes": sum(int(x.get("sizeBytes") or 0) for x in files),
            "filesWithPublisherSha256": sum(1 for x in files if isinstance(x.get("sha256"), str) and len(x["sha256"]) == 64),
            "supportedStage2Files": [x["filename"] for x in files if x["supportedForStage2"]],
            "rawPayloadsDownloaded": False,
            "rawRowsOrArraysEmitted": False
        },
        "acceptance": {
            "stage1ManifestComplete": len(files) > 0,
            "countsAsFullyProfiledMeasuredDataset": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "stage2Required": len(files) > 0
        },
        "evidenceBoundary": "Publisher file metadata only. This polypropylene pvT dataset is material-characterization evidence, not an injection-moulding cycle dataset. No pressure, temperature, specific-volume, row or sample count is accepted until exact delivered files are fingerprinted and semantically profiled."
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": result["status"], "fileCount": len(files), "totalBytes": result["manifest"]["totalBytes"], "supportedStage2Files": result["manifest"]["supportedStage2Files"]}, indent=2))


if __name__ == "__main__":
    main()
