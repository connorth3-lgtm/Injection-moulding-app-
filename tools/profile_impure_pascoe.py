#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import re
import statistics
import urllib.request
from collections import Counter
from pathlib import Path

RECORD_ID = "6913660"
DOI = "10.5281/zenodo.6913660"
API_URL = f"https://zenodo.org/api/records/{RECORD_ID}"
RECORD_URL = f"https://zenodo.org/records/{RECORD_ID}"
UA = "MouldMaster-ImPure-PASCOE-profiler/1.0"
CYCLE_RE = re.compile(r"^Pascoe_17_05_2022_Cycle(\d+)\.csv$", re.I)


def get_bytes(url: str, accept: str = "*/*") -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def file_name(item: dict) -> str:
    return str(item.get("key") or item.get("filename") or item.get("name") or "")


def file_url(item: dict) -> str | None:
    links = item.get("links") or {}
    for key in ("content", "self", "download"):
        value = links.get(key)
        if value:
            return str(value)
    return item.get("url")


def declared_md5(item: dict) -> str | None:
    checksum = str(item.get("checksum") or "")
    if checksum.startswith("md5:"):
        return checksum.split(":", 1)[1].lower()
    if re.fullmatch(r"[0-9a-fA-F]{32}", checksum):
        return checksum.lower()
    return None


def flatten_files(record: dict) -> list[dict]:
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


def license_metadata(record: dict):
    metadata = record.get("metadata") or {}
    return {
        "accessRight": metadata.get("access_right") or metadata.get("accessRight"),
        "license": metadata.get("license"),
        "rights": metadata.get("rights"),
        "resourceType": metadata.get("resource_type") or metadata.get("resourceType"),
    }


def sniff_csv(data: bytes) -> tuple[str, list[str], list[list[str]]]:
    text = data.decode("utf-8-sig", errors="replace")
    sample = text[:20000]
    try:
        delim = csv.Sniffer().sniff(sample, delimiters=",;\t").delimiter
    except Exception:
        delim = ","
    rows = list(csv.reader(io.StringIO(text), delimiter=delim))
    return delim, (rows[0] if rows else []), rows[1:] if rows else []


def finite(value) -> bool:
    try:
        return math.isfinite(float(value))
    except Exception:
        return False


def profile_cycle_csv(data: bytes) -> dict:
    delim, header, rows = sniff_csv(data)
    width = len(header)
    missing = 0
    numeric_counts = [0] * width
    mins = [None] * width
    maxs = [None] * width
    for row in rows:
        if len(row) < width:
            row = row + [""] * (width - len(row))
        for i, v in enumerate(row[:width]):
            if str(v).strip() == "":
                missing += 1
                continue
            if finite(v):
                x = float(v)
                numeric_counts[i] += 1
                mins[i] = x if mins[i] is None else min(mins[i], x)
                maxs[i] = x if maxs[i] is None else max(maxs[i], x)
    cols = []
    for i, name in enumerate(header):
        cols.append({"name": name, "numericCount": numeric_counts[i], "min": mins[i], "max": maxs[i]})
    return {"delimiter": delim, "rows": len(rows), "columns": width, "missingCells": missing, "header": header, "columnStats": cols}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="impure-pascoe-2022-v1.json")
    args = ap.parse_args()

    record = json.loads(get_bytes(API_URL, "application/json").decode("utf-8"))
    files = flatten_files(record)
    if not files:
        raise RuntimeError("Zenodo API returned no file list")

    cycle_items = []
    auxiliary = []
    for item in files:
        name = file_name(item)
        match = CYCLE_RE.match(name)
        if match:
            cycle_items.append((int(match.group(1)), item))
        else:
            auxiliary.append(item)
    cycle_items.sort(key=lambda x: x[0])
    if not cycle_items:
        raise RuntimeError("Zenodo record contains no cycle CSVs")

    cycle_profiles = []
    header_counter = Counter()
    row_counts = []
    total_numeric_cells = 0
    total_missing_cells = 0
    first_columns = None
    for cycle_id, item in cycle_items:
        url = file_url(item)
        if not url:
            raise RuntimeError(f"missing download URL for cycle {cycle_id}")
        data = get_bytes(url)
        declared = declared_md5(item)
        observed_md5 = md5(data)
        if declared and declared != observed_md5:
            raise RuntimeError(f"MD5 mismatch for cycle {cycle_id}: {observed_md5} != {declared}")
        p = profile_cycle_csv(data)
        header_key = json.dumps(p["header"], ensure_ascii=False)
        header_counter[header_key] += 1
        row_counts.append(p["rows"])
        total_missing_cells += p["missingCells"]
        total_numeric_cells += sum(c["numericCount"] for c in p["columnStats"])
        if first_columns is None:
            first_columns = p["columnStats"]
        cycle_profiles.append({
            "cycle": cycle_id,
            "name": file_name(item),
            "sizeBytes": len(data),
            "declaredMd5": declared,
            "md5": observed_md5,
            "sha256": sha256(data),
            "rows": p["rows"],
            "columns": p["columns"],
            "missingCells": p["missingCells"],
        })

    aux_profiles = []
    for item in auxiliary:
        name = file_name(item)
        url = file_url(item)
        if not url:
            continue
        data = get_bytes(url)
        declared = declared_md5(item)
        observed = md5(data)
        if declared and declared != observed:
            raise RuntimeError(f"MD5 mismatch for auxiliary file {name}")
        rec = {"name": name, "sizeBytes": len(data), "declaredMd5": declared, "md5": observed, "sha256": sha256(data)}
        if name.lower().endswith(".csv"):
            p = profile_cycle_csv(data)
            rec.update({"rows": p["rows"], "columns": p["columns"], "missingCells": p["missingCells"], "header": p["header"]})
        aux_profiles.append(rec)

    header_variants = [{"header": json.loads(k), "cycleFiles": v} for k, v in header_counter.items()]
    cycle_ids = [x[0] for x in cycle_items]
    gaps = [n for n in range(min(cycle_ids), max(cycle_ids) + 1) if n not in set(cycle_ids)]
    payload = {
        "schema": 1,
        "status": "profile-generated-review-required",
        "completedDate": "2026-08-28",
        "source": {
            "title": "ImPure Injection Molding Sensor Data - Trial 17th May",
            "doi": DOI,
            "recordId": RECORD_ID,
            "recordUrl": RECORD_URL,
            "apiUrl": API_URL,
            "publisher": "Zenodo",
            "description": (record.get("metadata") or {}).get("description"),
            "licenseMetadata": license_metadata(record),
        },
        "recordFileInventory": {
            "allFiles": len(files),
            "cycleCsvFiles": len(cycle_items),
            "auxiliaryFiles": len(auxiliary),
            "minimumCycleNumber": min(cycle_ids),
            "maximumCycleNumber": max(cycle_ids),
            "missingCycleNumbersWithinRange": gaps,
        },
        "cycleCsvStructure": {
            "headerVariants": header_variants,
            "firstCycleColumnStats": first_columns,
            "minRowsPerCycle": min(row_counts),
            "maxRowsPerCycle": max(row_counts),
            "medianRowsPerCycle": statistics.median(row_counts),
            "totalRowsAcrossCycleFiles": sum(row_counts),
            "totalNumericCellsAcrossCycleFiles": total_numeric_cells,
            "totalMissingCellsAcrossCycleFiles": total_missing_cells,
        },
        "cycleFiles": cycle_profiles,
        "auxiliaryFiles": aux_profiles,
        "acceptedMeasuredCycles": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "boundary": "Exact Zenodo files are fingerprinted and cycle CSV structure is profiled, but no measured-sample count is promoted until the channel headers/units, direct-measurement semantics, time basis, trial-stage labels and licence/reuse metadata are reviewed. Generated summaries do not redistribute raw source rows."
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "licenseMetadata": payload["source"]["licenseMetadata"],
        "fileInventory": payload["recordFileInventory"],
        "cycleStructure": payload["cycleCsvStructure"],
        "auxiliaryFiles": aux_profiles,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
