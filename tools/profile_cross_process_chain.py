#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import re
import shutil
import tempfile
import urllib.request
import zipfile
from collections import Counter
from pathlib import Path

RECORD_ID = "17240390"
DOI = "10.5281/zenodo.17240390"
API_URL = f"https://zenodo.org/api/records/{RECORD_ID}"
RECORD_URL = f"https://zenodo.org/records/{RECORD_ID}"
EXPECTED_MD5 = "069e190338b2ca29f736b21fabf407ba"
UA = "MouldMaster-CrossProcessChain-profiler/1.0"


def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def flatten_files(record):
    files = record.get("files")
    if isinstance(files, list):
        return files
    if isinstance(files, dict):
        entries = files.get("entries") or files.get("items") or files.get("files")
        if isinstance(entries, list):
            return entries
        if isinstance(entries, dict):
            return list(entries.values())
    return []


def file_name(item):
    return str(item.get("key") or item.get("filename") or item.get("name") or "")


def file_url(item):
    links = item.get("links") or {}
    return links.get("content") or links.get("self") or links.get("download") or item.get("url")


def stream_download(url: str, path: Path):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/zip,application/octet-stream,*/*"})
    md5 = hashlib.md5(); sha = hashlib.sha256(); total = 0
    with urllib.request.urlopen(req, timeout=600) as r, path.open("wb") as out:
        while True:
            chunk = r.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk); md5.update(chunk); sha.update(chunk); total += len(chunk)
    return {"sizeBytes": total, "md5": md5.hexdigest(), "sha256": sha.hexdigest()}


def license_metadata(record):
    m = record.get("metadata") or {}
    return {
        "accessRight": m.get("access_right") or m.get("accessRight"),
        "license": m.get("license"),
        "rights": m.get("rights"),
        "version": m.get("version"),
    }


def classify(path: str):
    p = path.lower()
    suffix = Path(path).suffix.lower()
    if suffix == ".json":
        return "screw-driving-json"
    if suffix in {".csv", ".txt"}:
        if any(x in p for x in ["label", "class", "metadata", "static", "quality"]):
            return "metadata-or-label-table"
        if any(x in p for x in ["upper", "injection", "molding", "moulding"]):
            return "upper-or-generic-injection-stream"
        if "lower" in p:
            return "lower-injection-stream"
        return "tabular-unresolved"
    if suffix in {".md", ".yaml", ".yml"}:
        return "documentation"
    return "other"


def inspect_text_member(zf, info, max_bytes=131072):
    with zf.open(info) as f:
        raw = f.read(max_bytes)
    text = raw.decode("utf-8-sig", errors="replace")
    lines = [x for x in text.splitlines() if x.strip()][:6]
    first = lines[0] if lines else ""
    delimiter = None
    if info.filename.lower().endswith((".csv", ".txt")):
        try:
            delimiter = csv.Sniffer().sniff("\n".join(lines), delimiters=",;\t").delimiter
        except Exception:
            delimiter = ";" if ";" in first else ("," if "," in first else ("\t" if "\t" in first else None))
    header = []
    if delimiter and first:
        header = next(csv.reader([first], delimiter=delimiter))
    return {"delimiter": delimiter, "header": header, "previewLines": lines[:3]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="cross-process-chain-v1.json")
    ap.add_argument("--work-dir", default=None)
    args = ap.parse_args()

    record = get_json(API_URL)
    files = flatten_files(record)
    target = next((x for x in files if file_name(x) == "class_values.zip"), None)
    if target is None:
        raise RuntimeError("class_values.zip missing from Zenodo record")
    url = file_url(target)
    if not url:
        raise RuntimeError("class_values.zip has no download link")

    if args.work_dir:
        work = Path(args.work_dir); work.mkdir(parents=True, exist_ok=True); cleanup = False
    else:
        work = Path(tempfile.mkdtemp(prefix="mm-cpc-")); cleanup = True
    archive_path = work / "class_values.zip"
    try:
        archive = stream_download(url, archive_path)
        if archive["md5"] != EXPECTED_MD5:
            raise RuntimeError(f"archive MD5 mismatch: {archive['md5']} != {EXPECTED_MD5}")
        if not zipfile.is_zipfile(archive_path):
            raise RuntimeError("downloaded cross-process-chain file is not a ZIP archive")

        members = []
        category_counts = Counter()
        suffix_counts = Counter()
        with zipfile.ZipFile(archive_path) as zf:
            infos = [x for x in zf.infolist() if not x.is_dir()]
            for info in infos:
                category = classify(info.filename)
                suffix = Path(info.filename).suffix.lower() or "<none>"
                category_counts[category] += 1; suffix_counts[suffix] += 1
                members.append({
                    "path": info.filename,
                    "compressedBytes": info.compress_size,
                    "uncompressedBytes": info.file_size,
                    "crc32": f"{info.CRC:08x}",
                    "suffix": suffix,
                    "classification": category,
                })

            sample_candidates = [
                x for x in infos
                if classify(x.filename) in {"upper-or-generic-injection-stream", "lower-injection-stream", "tabular-unresolved", "metadata-or-label-table", "documentation"}
                and x.file_size <= 25_000_000
            ]
            sample_candidates.sort(key=lambda x: (classify(x.filename), x.filename))
            samples = []
            per_category = Counter()
            for info in sample_candidates:
                category = classify(info.filename)
                if per_category[category] >= 5:
                    continue
                inspected = inspect_text_member(zf, info)
                samples.append({"path": info.filename, "classification": category, "sizeBytes": info.file_size, **inspected})
                per_category[category] += 1
                if len(samples) >= 20:
                    break

        injection_candidates = [x for x in members if x["classification"] in {"upper-or-generic-injection-stream", "lower-injection-stream"}]
        unresolved_tabular = [x for x in members if x["classification"] == "tabular-unresolved"]
        payload = {
            "schema": 1,
            "status": "profile-generated-review-required",
            "completedDate": "2026-08-28",
            "source": {
                "title": "Cross-process-chain dataset archive: Combined data collection from injection molding and screw driving",
                "doi": DOI,
                "recordId": RECORD_ID,
                "recordUrl": RECORD_URL,
                "apiUrl": API_URL,
                "publisher": "Zenodo",
                "licenseMetadata": license_metadata(record),
                "publishedInjectionSamplingFrequency": "~1 kHz",
                "publishedInjectionMeasurements": ["pressure target", "pressure actual", "velocity", "volume", "state where applicable"],
                "materialContext": "thermoplastic with varying recyclate and glass-fibre content",
            },
            "archive": {"name": "class_values.zip", **archive, "publisherMd5": EXPECTED_MD5},
            "memberInventory": {
                "files": len(members),
                "categoryCounts": dict(sorted(category_counts.items())),
                "suffixCounts": dict(sorted(suffix_counts.items())),
                "totalUncompressedBytes": sum(x["uncompressedBytes"] for x in members),
                "injectionCandidateFiles": len(injection_candidates),
                "unresolvedTabularFiles": len(unresolved_tabular),
            },
            "sampledMembers": samples,
            "memberManifest": members,
            "acceptedMeasuredCycles": 0,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "rawSourceRowsCommitted": False,
            "boundary": "Discovery profile only. The exact Zenodo archive is fingerprinted and every member is enumerated, but injection-moulding streams must be separated from screw-driving and label/static tables, experiment/cycle IDs reconciled, direct actual measurements separated from targets/state fields, and source rights/units/time basis confirmed before package or scalar promotion. Screw-driving operations never count as injection-moulding cycles or samples."
        }
        Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"source": payload["source"], "archive": payload["archive"], "memberInventory": payload["memberInventory"], "sampledMembers": samples}, indent=2, ensure_ascii=False))
    finally:
        if cleanup:
            shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
