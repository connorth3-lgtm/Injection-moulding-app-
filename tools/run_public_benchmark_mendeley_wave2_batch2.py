#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/mendeley-wave2-batch2-v1.json"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def get(url: str, accept: str = "*/*") -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def flatten_files(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "files", "items", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    return []


def compact_api_item(item):
    details = item.get("content_details") or item.get("contentDetails") or {}
    return {
        "id": item.get("id") or item.get("file_id") or item.get("uuid"),
        "name": item.get("filename") or item.get("name"),
        "folderId": item.get("folder_id"),
        "sizeBytes": details.get("size") if details.get("size") is not None else item.get("size"),
        "sha256": details.get("sha256_hash") or details.get("sha256Hash"),
        "contentType": details.get("content_type") or details.get("contentType"),
        "rawPayloadDownloaded": False,
    }


def html_file_ids(dataset_id: str, version: int):
    page = f"https://data.mendeley.com/datasets/{dataset_id}/{version}"
    raw = get(page, "text/html,application/xhtml+xml")
    text = html.unescape(raw.decode("utf-8", "replace")).replace("\\u002F", "/").replace("\\/", "/")
    pattern = re.compile(rf"https://data\.mendeley\.com/public-files/datasets/{dataset_id}/files/([0-9a-fA-F-]{{36}})/file_downloaded")
    ids = []
    seen = set()
    for match in pattern.finditer(text):
        fid = match.group(1).lower()
        if fid not in seen:
            seen.add(fid)
            ids.append(fid)
    return ids


def profile_source(src):
    did = src["mendeleyDatasetId"]
    version = int(src["version"])
    endpoint = f"https://data.mendeley.com/public-api/datasets/{did}/files?folder_id=root&version={version}"
    errors = []
    api_items = []
    try:
        raw = get(endpoint, "application/json")
        api_items = [compact_api_item(x) for x in flatten_files(json.loads(raw.decode("utf-8")))]
    except Exception as exc:
        errors.append(f"public-api:{type(exc).__name__}:{exc}")
    page_ids = []
    try:
        page_ids = html_file_ids(did, version)
    except Exception as exc:
        errors.append(f"dataset-page:{type(exc).__name__}:{exc}")
    known_ids = {str(x.get("id") or "").lower() for x in api_items if x.get("id")}
    html_only = [x for x in page_ids if x not in known_ids]
    state = "publisher-file-manifest-exposed" if api_items or page_ids else "publisher-record-no-files-exposed"
    return {
        "datasetId": src["datasetId"],
        "doi": src["doi"],
        "license": src["license"],
        "priority": src["priority"],
        "state": state,
        "apiFiles": api_items,
        "htmlFileIds": page_ids,
        "htmlOnlyFileIds": html_only,
        "fileCountLowerBound": len(set(page_ids) | known_ids),
        "errors": errors,
        "rawPayloadsDownloaded": False,
        "countsAsFullyProfiledMeasuredDataset": False,
        "acceptedMeasuredTimeSeriesSamples": 0,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    sources = [profile_source(x) for x in contract["sources"]]
    result = {
        "schema": 1,
        "status": "publisher-metadata-batch-profiled",
        "retrievedDate": args.retrieved_date,
        "sources": sources,
        "summary": {
            "sourcesReviewed": len(sources),
            "publisherFileManifestExposed": sum(1 for x in sources if x["state"] == "publisher-file-manifest-exposed"),
            "publisherRecordNoFilesExposed": sum(1 for x in sources if x["state"] == "publisher-record-no-files-exposed"),
            "fullyProfiledAccepted": 0,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "rawPayloadsDownloaded": False,
        },
        "evidenceBoundary": "Stage 1 enumerates publisher metadata and file identifiers only. No third-party payload is downloaded; no reported row, sample, test or measurement count is accepted until a source-specific stage-two profiler verifies delivered files and semantics."
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], indent=2))


if __name__ == "__main__":
    main()
