#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import tempfile
import urllib.request
from pathlib import Path

RECORD_ID = "20338544"
DOI = "10.5281/zenodo.20338544"
API = f"https://zenodo.org/api/records/{RECORD_ID}"
UA = "MouldMaster-Zenodo-Energy-Profiler/1.0"
CSV_NAMES = {"feb_production.csv", "mar_production.csv", "test_dataset.csv"}
KNOWN_MD5 = {
    "feb_production.csv": "3b2daf123be817b271529b909e19edc5",
    "mar_production.csv": "12dd28a9e8a12ed734c3ca4398f93d1b",
    "test_dataset.csv": "2a19cfa6f2fc569723e3ad8d78d8e418",
}


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.load(response)


def download(url: str, path: Path):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    md5 = hashlib.md5()
    sha = hashlib.sha256()
    size = 0
    with urllib.request.urlopen(req, timeout=300) as response, path.open("wb") as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
            md5.update(chunk)
            sha.update(chunk)
            size += len(chunk)
    return {"sizeBytes": size, "md5": md5.hexdigest(), "sha256": sha.hexdigest()}


def sniff(path: Path):
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        sample = handle.read(65536)
    try:
        return csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except Exception:
        return csv.excel


def role(name: str) -> str:
    text = re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
    if any(x in text for x in ("timestamp", "date time", "datetime", "time stamp")) or text in {"time", "date"}:
        return "time-axis"
    if any(x in text for x in ("active power", "total power", "power kw", "power w", "energy", "consumption")):
        return "energy-or-power-measurement"
    if any(x in text for x in ("machine", "production", "state", "status", "running", "idle", "cycle", "product", "order", "job")):
        return "production-context-or-state"
    if any(x in text for x in ("anomaly", "fault", "label", "class")):
        return "label-or-anomaly"
    return "unresolved"


def profile_csv(path: Path) -> dict:
    dialect = sniff(path)
    row_count = 0
    header = []
    missing = []
    numeric = []
    unique_small = []
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        reader = csv.reader(handle, dialect)
        try:
            header = [str(x).strip() for x in next(reader)]
        except StopIteration:
            return {"rows": 0, "columns": 0, "header": [], "columnProfiles": []}
        width = len(header)
        missing = [0] * width
        numeric = [0] * width
        unique_small = [set() for _ in range(width)]
        for raw in reader:
            if not raw or not any(str(x).strip() for x in raw):
                continue
            row_count += 1
            row = list(raw[:width]) + [""] * max(0, width - len(raw))
            for i, value in enumerate(row):
                text = str(value).strip()
                if not text:
                    missing[i] += 1
                    continue
                try:
                    float(text.replace(",", ".") if dialect.delimiter != "," else text)
                    numeric[i] += 1
                except Exception:
                    pass
                if len(unique_small[i]) <= 32:
                    unique_small[i].add(text[:120])
    profiles = []
    for i, name in enumerate(header):
        profiles.append({
            "name": name,
            "roleHeuristic": role(name),
            "numericCount": numeric[i],
            "missingCount": missing[i],
            "numericFraction": round(numeric[i] / row_count, 6) if row_count else 0,
            "smallCardinalityValues": sorted(unique_small[i]) if 0 < len(unique_small[i]) <= 20 else None,
        })
    return {
        "rows": row_count,
        "columns": len(header),
        "header": header,
        "delimiter": repr(dialect.delimiter),
        "columnProfiles": profiles,
        "roleCounts": {
            r: sum(1 for p in profiles if p["roleHeuristic"] == r)
            for r in sorted({p["roleHeuristic"] for p in profiles})
        },
    }


def content_url(file_record: dict) -> str:
    links = file_record.get("links") or {}
    for key in ("content", "self"):
        if links.get(key):
            return links[key]
    raise RuntimeError(f"No downloadable content link for {file_record.get('key')}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="zenodo-energy-20338544-v1.json")
    args = parser.parse_args()

    record = get_json(API)
    metadata = record.get("metadata") or {}
    access = record.get("access") or {}
    files_meta = record.get("files") or []
    file_map = {f.get("key"): f for f in files_meta}
    missing_files = sorted(CSV_NAMES - set(file_map))
    if missing_files:
        raise RuntimeError(f"Expected Zenodo files missing: {missing_files}")

    profiled = []
    with tempfile.TemporaryDirectory() as td:
        temp = Path(td)
        for name in sorted(CSV_NAMES):
            meta = file_map[name]
            path = temp / name
            fp = download(content_url(meta), path)
            expected_md5 = KNOWN_MD5[name]
            if fp["md5"] != expected_md5:
                raise RuntimeError(f"{name} MD5 mismatch: {fp['md5']} != {expected_md5}")
            publisher_checksum = meta.get("checksum")
            if publisher_checksum and publisher_checksum.startswith("md5:") and publisher_checksum.split(":", 1)[1] != fp["md5"]:
                raise RuntimeError(f"{name} publisher checksum mismatch")
            table = profile_csv(path)
            profiled.append({
                "name": name,
                "sizeBytes": fp["sizeBytes"],
                "md5": fp["md5"],
                "sha256": fp["sha256"],
                "publisherChecksum": publisher_checksum,
                "table": table,
            })

    license_obj = metadata.get("license") or metadata.get("rights") or {}
    if isinstance(license_obj, dict):
        license_id = license_obj.get("id") or license_obj.get("title")
    else:
        license_id = str(license_obj) if license_obj else None
    access_status = access.get("status") or metadata.get("access_right")
    total_rows = sum(f["table"]["rows"] for f in profiled)
    power_cols = sum(f["table"]["roleCounts"].get("energy-or-power-measurement", 0) for f in profiled)
    state_cols = sum(f["table"]["roleCounts"].get("production-context-or-state", 0) for f in profiled)
    time_cols = sum(f["table"]["roleCounts"].get("time-axis", 0) for f in profiled)

    payload = {
        "schema": 1,
        "status": "exact-file-discovery-profile-review-required",
        "completedDate": "2026-08-28",
        "source": {
            "recordId": RECORD_ID,
            "doi": DOI,
            "title": metadata.get("title"),
            "publisher": "Zenodo",
            "recordApi": API,
            "accessStatus": access_status,
            "license": license_id,
            "creators": [x.get("name") for x in metadata.get("creators") or []],
            "descriptionInjectionContext": "Real injection-moulding plant production and energy data used to detect irregular energy usage and tempering-unit operation states.",
        },
        "files": profiled,
        "csvFilesProfiled": len(profiled),
        "totalCsvRowsObserved": total_rows,
        "heuristicRoleTotalsAcrossFiles": {
            "timeAxisColumns": time_cols,
            "energyOrPowerMeasurementColumns": power_cols,
            "productionContextOrStateColumns": state_cols,
        },
        "acceptedMeasuredRecords": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "rawSourceFilesCommitted": False,
        "boundary": "Exact open Zenodo CSV bytes are checksum-verified and schema-profiled, but the first run is discovery-only. Promotion requires inspection of observed timestamp basis, measurement units, production-state semantics, machine/tempering-unit context, and separation of measured power/energy from labels, derived anomaly scores and images.",
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "source": payload["source"],
        "csvFilesProfiled": len(profiled),
        "totalCsvRowsObserved": total_rows,
        "heuristicRoleTotalsAcrossFiles": payload["heuristicRoleTotalsAcrossFiles"],
        "files": [{"name": f["name"], "sizeBytes": f["sizeBytes"], "md5": f["md5"], "sha256": f["sha256"], "rows": f["table"]["rows"], "columns": f["table"]["columns"], "header": f["table"]["header"]} for f in profiled],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
