#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

DATASET_ID = "6f9x8yg8nj"
VERSION = 1
DOI = "10.17632/6f9x8yg8nj.1"
PAGE = f"https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}"
PUBLIC_API = f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def request_bytes(url: str, accept: str = "*/*"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read(), r.geturl(), r.headers.get("Content-Type")


def request_json_optional(url: str):
    try:
        raw, final, ctype = request_bytes(url, "application/json")
        return json.loads(raw.decode("utf-8")), {"url": url, "finalUrl": final, "contentType": ctype, "ok": True}
    except Exception as e:
        return None, {"url": url, "ok": False, "error": f"{type(e).__name__}: {e}"}


def flatten_list(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "files", "folders", "items", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    return []


def compact_file(f, listing_source):
    cd = f.get("content_details") or f.get("contentDetails") or {}
    name = str(f.get("filename") or f.get("name") or "").strip()
    lower = name.lower()
    injection_marker = any(x in lower for x in ["injection", "mold", "mould", "case", "real", "automotive"])
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
        "listingSource": listing_source,
        "likelyInjectionSubsetByName": bool(injection_marker and not excluded_marker),
        "explicitNonInjectionBenchmarkByName": bool(excluded_marker),
        "rawPayloadDownloaded": False,
    }


def compact_folder(f, listing_source):
    name = str(f.get("name") or "").strip()
    lower = name.lower()
    injection_marker = any(x in lower for x in ["injection", "mold", "mould", "case", "real", "automotive"])
    excluded_marker = any(x in lower for x in ["swat", "tennessee", "tep"])
    return {
        "id": f.get("id") or f.get("folder_id") or f.get("uuid"),
        "name": name,
        "parentId": f.get("parent_id") or f.get("parentId"),
        "listingSource": listing_source,
        "likelyInjectionSubsetByName": bool(injection_marker and not excluded_marker),
        "explicitNonInjectionBenchmarkByName": bool(excluded_marker),
    }


def page_file_links():
    raw, final, ctype = request_bytes(PAGE, "text/html,application/xhtml+xml")
    text = html.unescape(raw.decode("utf-8", "replace")).replace("\\u002F", "/").replace("\\/", "/")
    pattern = re.compile(rf"https://data\.mendeley\.com/public-files/datasets/{DATASET_ID}/files/([0-9a-fA-F-]{{36}})/file_downloaded")
    links = []
    seen = set()
    for m in pattern.finditer(text):
        fid = m.group(1).lower()
        if fid in seen:
            continue
        seen.add(fid)
        start = max(0, m.start() - 800)
        end = min(len(text), m.end() + 800)
        context = text[start:end]
        name_match = re.search(r'"(?:filename|name)"\s*:\s*"([^"\\]{1,240})"', context)
        name = name_match.group(1) if name_match else ""
        links.append({
            "id": fid,
            "filename": name,
            "folderId": None,
            "sizeBytes": None,
            "sha256": None,
            "md5": None,
            "contentType": None,
            "status": None,
            "listingSource": PAGE,
            "likelyInjectionSubsetByName": any(x in name.lower() for x in ["injection", "mold", "mould", "case", "real", "automotive"]) if name else False,
            "explicitNonInjectionBenchmarkByName": any(x in name.lower() for x in ["swat", "tennessee", "tep"]) if name else False,
            "rawPayloadDownloaded": False,
        })
    return links, {"url": PAGE, "finalUrl": final, "contentType": ctype, "ok": True, "publicFileLinksFound": len(links)}


def enumerate_manifest():
    attempts = []
    files = []
    folders = []

    root_urls = [
        f"{PUBLIC_API}/files?folder_id=root&version={VERSION}",
        f"{PUBLIC_API}/files?version={VERSION}",
    ]
    for url in root_urls:
        payload, diag = request_json_optional(url)
        attempts.append(diag)
        for item in flatten_list(payload):
            if str(item.get("type") or "").lower() == "folder":
                folders.append(compact_folder(item, url))
            else:
                files.append(compact_file(item, url))

    folder_urls = [
        f"{PUBLIC_API}/folders?version={VERSION}",
        f"{PUBLIC_API}/folders?parent_id=root&version={VERSION}",
    ]
    for url in folder_urls:
        payload, diag = request_json_optional(url)
        attempts.append(diag)
        for item in flatten_list(payload):
            folders.append(compact_folder(item, url))

    folder_by_id = {}
    for folder in folders:
        if folder.get("id"):
            folder_by_id[folder["id"]] = folder
    folders = list(folder_by_id.values())

    for folder in folders:
        fid = folder.get("id")
        if not fid:
            continue
        url = f"{PUBLIC_API}/files?folder_id={urllib.parse.quote(str(fid))}&version={VERSION}"
        payload, diag = request_json_optional(url)
        attempts.append(diag)
        for item in flatten_list(payload):
            files.append(compact_file(item, url))

    page_links, page_diag = page_file_links()
    attempts.append(page_diag)
    files.extend(page_links)

    file_by_id = {}
    anonymous = []
    for f in files:
        key = f.get("id")
        if key:
            old = file_by_id.get(key)
            if old is None or (not old.get("filename") and f.get("filename")):
                file_by_id[key] = f
        elif f.get("filename"):
            anonymous.append(f)
    files = list(file_by_id.values()) + anonymous
    return files, folders, attempts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()

    files, folders, attempts = enumerate_manifest()
    result = {
        "schema": 1,
        "status": "publisher-file-manifest-profiled" if files else "publisher-folder-manifest-profiled-no-files-yet",
        "retrievedDate": args.retrieved_date,
        "source": {
            "datasetId": "ad-stgn-injection-moulding-v1",
            "mendeleyDatasetId": DATASET_ID,
            "datasetDoi": DOI,
            "version": VERSION,
            "publisher": "Mendeley Data",
            "datasetPage": PAGE,
            "licenseExpectedFromPublisherPage": "CC BY 4.0",
        },
        "manifest": {
            "files": files,
            "folders": folders,
            "fileCount": len(files),
            "folderCount": len(folders),
            "totalBytes": sum(int(x.get("sizeBytes") or 0) for x in files),
            "filesWithPublisherSha256": sum(1 for x in files if isinstance(x.get("sha256"), str) and len(x["sha256"]) == 64),
            "filesWithPublisherMd5": sum(1 for x in files if isinstance(x.get("md5"), str) and len(x["md5"]) == 32),
            "likelyInjectionFilesByName": [x["filename"] for x in files if x["likelyInjectionSubsetByName"]],
            "explicitNonInjectionFilesByName": [x["filename"] for x in files if x["explicitNonInjectionBenchmarkByName"]],
            "likelyInjectionFoldersByName": [x["name"] for x in folders if x["likelyInjectionSubsetByName"]],
            "explicitNonInjectionFoldersByName": [x["name"] for x in folders if x["explicitNonInjectionBenchmarkByName"]],
            "listingAttempts": attempts,
            "rawPayloadsDownloaded": False,
            "rawRowsOrArraysEmitted": False,
        },
        "acceptance": {
            "stage1ManifestComplete": bool(files or folders),
            "countsAsFullyProfiledMeasuredDataset": False,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "stage2Required": True,
        },
        "evidenceBoundary": "Stage 1 enumerates publisher file/folder metadata and public-file link identifiers only. No file payload is downloaded. TEP and SWaT are never counted as injection-moulding evidence. Injection-moulding files must be isolated and profiled separately before any measured row, channel, cycle or sample count is accepted.",
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": result["status"],
        "fileCount": result["manifest"]["fileCount"],
        "folderCount": result["manifest"]["folderCount"],
        "totalBytes": result["manifest"]["totalBytes"],
        "likelyInjectionFilesByName": result["manifest"]["likelyInjectionFilesByName"],
        "likelyInjectionFoldersByName": result["manifest"]["likelyInjectionFoldersByName"],
        "explicitNonInjectionFilesByName": result["manifest"]["explicitNonInjectionFilesByName"],
        "explicitNonInjectionFoldersByName": result["manifest"]["explicitNonInjectionFoldersByName"],
    }, indent=2))


if __name__ == "__main__":
    main()
