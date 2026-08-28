#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
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
UA = "MouldMaster-CrossProcessChain-profiler/2.0"
UPPER_PREFIX = "injection_molding/upper_workpiece/serial_data/"
LOWER_PREFIX = "injection_molding/lower_workpiece/serial_data/"
UPPER_STATIC = "injection_molding/upper_workpiece/static_data.csv"
LOWER_STATIC = "injection_molding/lower_workpiece/static_data.csv"
CLASS_VALUES = "class_values.csv"
UPPER_RE = re.compile(r"upper_workpiece_cycle_(\d+)\.csv$", re.I)
LOWER_RE = re.compile(r"lower_workpiece_cycle_(\d+)\.txt$", re.I)


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
    if p.startswith(UPPER_PREFIX):
        return "upper-injection-stream"
    if p.startswith(LOWER_PREFIX):
        return "lower-injection-stream"
    if p in {UPPER_STATIC, LOWER_STATIC, CLASS_VALUES} or "static_data" in p:
        return "metadata-or-label-table"
    if p.startswith("screw_driving/") and suffix == ".json":
        return "screw-driving-json"
    if suffix in {".csv", ".txt"}:
        return "tabular-unresolved"
    return "other"


def sha_member(zf: zipfile.ZipFile, info: zipfile.ZipInfo):
    h = hashlib.sha256(); size = 0
    with zf.open(info) as f:
        while True:
            b = f.read(1024 * 1024)
            if not b:
                break
            h.update(b); size += len(b)
    return {"sizeBytes": size, "sha256": h.hexdigest(), "crc32": f"{info.CRC:08x}"}


def read_text(zf: zipfile.ZipFile, path: str):
    return zf.read(path).decode("utf-8-sig", errors="replace")


def parse_csv_text(text: str, delimiter: str):
    rows = list(csv.DictReader(io.StringIO(text), delimiter=delimiter))
    header = list(rows[0].keys()) if rows else next(csv.reader([text.splitlines()[0]], delimiter=delimiter), []) if text.splitlines() else []
    return header, rows


def is_missing_filename(value):
    return str(value or "").strip().lower() in {"", "missing", "nan", "none"}


def static_profile(zf: zipfile.ZipFile, path: str, serial_prefix: str):
    text = read_text(zf, path)
    header, rows = parse_csv_text(text, ";")
    referenced = []
    class_values = Counter()
    upper_ids = set(); lower_ids = set()
    for row in rows:
        u = str(row.get("upper_workpiece_id") or "").strip()
        l = str(row.get("lower_workpiece_id") or "").strip()
        if u: upper_ids.add(u)
        if l and l.lower() != "workpiece_not_used": lower_ids.add(l)
        cv = str(row.get("class_value") or "").strip()
        if cv: class_values[cv] += 1
        fn = str(row.get("file_name") or "").strip()
        if not is_missing_filename(fn):
            referenced.append(fn)
    names = set(zf.namelist())
    missing_refs = sorted(fn for fn in referenced if serial_prefix + fn not in names)
    return {
        "rows": len(rows),
        "columns": len(header),
        "header": header,
        "uniqueUpperWorkpieceIds": len(upper_ids),
        "uniqueLowerWorkpieceIds": len(lower_ids),
        "classValueCounts": dict(class_values.most_common()),
        "serialFileReferences": len(referenced),
        "serialFileReferencesMissingFromArchive": len(missing_refs),
        "missingReferenceExamples": missing_refs[:20],
        "fingerprint": sha_member(zf, zf.getinfo(path)),
    }


def class_values_profile(zf: zipfile.ZipFile):
    text = read_text(zf, CLASS_VALUES)
    header, rows = parse_csv_text(text, ",")
    upper = set(); lower = set(); labels = {k: Counter() for k in ["class_value_upper_work_piece", "class_value_lower_work_piece", "class_value_screw_driving"]}
    for row in rows:
        u = str(row.get("upper_workpiece_id") or "").strip()
        l = str(row.get("lower_workpiece_id") or "").strip()
        if u: upper.add(u)
        if l and l.lower() != "workpiece_not_used": lower.add(l)
        for k in labels:
            v = str(row.get(k) or "").strip()
            if v: labels[k][v] += 1
    return {
        "rows": len(rows),
        "columns": len(header),
        "header": header,
        "uniqueUpperWorkpieceIds": len(upper),
        "uniqueLowerWorkpieceIds": len(lower),
        "nonBlankClassCounts": {k: sum(v.values()) for k, v in labels.items()},
        "classLevelCounts": {k: dict(v.most_common()) for k, v in labels.items()},
        "fingerprint": sha_member(zf, zf.getinfo(CLASS_VALUES)),
    }


def cycle_ids(infos, regex):
    out = []
    for info in infos:
        m = regex.search(info.filename)
        if m:
            out.append(int(m.group(1)))
    return out


def pick_samples(infos):
    if not infos:
        return []
    ordered = sorted(infos, key=lambda x: x.filename)
    idx = sorted(set([0, len(ordered)//2, len(ordered)-1]))
    return [ordered[i] for i in idx]


def upper_sample(zf: zipfile.ZipFile, info: zipfile.ZipInfo):
    text = read_text(zf, info.filename)
    reader = csv.reader(io.StringIO(text), delimiter=",")
    rows = list(reader)
    header = rows[0] if rows else []
    data_rows = rows[1:] if rows else []
    normalized = [str(x).strip() for x in header]
    required = ["time", "injection_pressure_target", "injection_pressure_actual", "injection_velocity", "melt_volume", "state"]
    return {
        "path": info.filename,
        "rows": len(data_rows),
        "columns": len(header),
        "header": header,
        "requiredMeasurementColumnsPresent": all(x in normalized for x in required),
        "directPhysicalColumns": [x for x in ["injection_pressure_actual", "injection_velocity", "melt_volume"] if x in normalized],
        "commandColumns": [x for x in ["injection_pressure_target"] if x in normalized],
        "stateColumns": [x for x in ["state"] if x in normalized],
        "timeColumns": [x for x in ["time"] if x in normalized],
        "fingerprint": sha_member(zf, info),
    }


def lower_sample(zf: zipfile.ZipFile, info: zipfile.ZipInfo):
    text = read_text(zf, info.filename)
    lines = text.splitlines()
    start = next((i + 1 for i, line in enumerate(lines) if "-start data-" in line.lower()), None)
    data_rows = []
    if start is not None:
        for line in lines[start:]:
            if not line.strip():
                continue
            parts = [x.strip() for x in line.split(";")]
            try:
                vals = [float(x.replace(",", ".")) for x in parts]
            except Exception:
                continue
            if len(vals) == 5:
                data_rows.append(vals)
    preamble = [line.strip() for line in lines[: start - 1 if start else min(len(lines), 40)] if line.strip()]
    return {
        "path": info.filename,
        "rows": len(data_rows),
        "columns": 5 if data_rows else None,
        "schemaFromCompanionParser": ["time", "injection_pressure_target", "injection_pressure_actual", "melt_volume", "injection_velocity"],
        "directPhysicalColumns": ["injection_pressure_actual", "melt_volume", "injection_velocity"],
        "commandColumns": ["injection_pressure_target"],
        "timeColumns": ["time"],
        "startDataMarkerPresent": start is not None,
        "preamblePreview": preamble[:12],
        "fingerprint": sha_member(zf, info),
    }


def id_summary(ids):
    if not ids:
        return {"files": 0, "uniqueCycleIds": 0}
    s = set(ids)
    return {
        "files": len(ids),
        "uniqueCycleIds": len(s),
        "minimumCycleId": min(s),
        "maximumCycleId": max(s),
        "missingIdsWithinRange": len([x for x in range(min(s), max(s) + 1) if x not in s]),
        "duplicateCycleIds": len(ids) - len(s),
    }


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
        category_counts = Counter(); suffix_counts = Counter()
        with zipfile.ZipFile(archive_path) as zf:
            infos = [x for x in zf.infolist() if not x.is_dir()]
            for info in infos:
                category = classify(info.filename)
                suffix = Path(info.filename).suffix.lower() or "<none>"
                category_counts[category] += 1; suffix_counts[suffix] += 1
                members.append({"path": info.filename, "compressedBytes": info.compress_size, "uncompressedBytes": info.file_size, "crc32": f"{info.CRC:08x}", "suffix": suffix, "classification": category})

            upper_infos = [x for x in infos if x.filename.startswith(UPPER_PREFIX)]
            lower_infos = [x for x in infos if x.filename.startswith(LOWER_PREFIX)]
            screw_infos = [x for x in infos if x.filename.startswith("screw_driving/serial_data/") and x.filename.lower().endswith(".json")]
            upper_ids = cycle_ids(upper_infos, UPPER_RE); lower_ids = cycle_ids(lower_infos, LOWER_RE)
            upper_static = static_profile(zf, UPPER_STATIC, UPPER_PREFIX)
            lower_static = static_profile(zf, LOWER_STATIC, LOWER_PREFIX)
            classes = class_values_profile(zf)
            upper_samples = [upper_sample(zf, x) for x in pick_samples(upper_infos)]
            lower_samples = [lower_sample(zf, x) for x in pick_samples(lower_infos)]

        payload = {
            "schema": 2,
            "status": "completed-public-measured-benchmark",
            "completedDate": "2026-08-28",
            "source": {
                "title": "Cross-process-chain dataset archive: Combined data collection from injection molding and screw driving",
                "doi": DOI,
                "recordId": RECORD_ID,
                "recordUrl": RECORD_URL,
                "apiUrl": API_URL,
                "publisher": "Zenodo",
                "licenseMetadata": license_metadata(record),
                "companionSoftware": "https://github.com/nikolaiwest/cpc-data",
                "publishedInjectionSamplingFrequency": "~1 kHz",
                "publishedInjectionCycleTime": "2-8 seconds typical",
                "publishedInjectionMeasurements": ["pressure target", "pressure actual", "velocity", "volume", "state where applicable"],
                "materialContext": "thermoplastic with varying recyclate and glass-fibre content",
            },
            "archive": {"name": "class_values.zip", **archive, "publisherMd5": EXPECTED_MD5},
            "memberInventory": {
                "files": len(members),
                "categoryCounts": dict(sorted(category_counts.items())),
                "suffixCounts": dict(sorted(suffix_counts.items())),
                "totalUncompressedBytes": sum(x["uncompressedBytes"] for x in members),
                "upperInjectionSerialFiles": len(upper_infos),
                "lowerInjectionSerialFiles": len(lower_infos),
                "screwDrivingSerialFilesExcluded": len(screw_infos),
            },
            "injectionCycleCoverage": {
                "upper": id_summary(upper_ids),
                "lower": id_summary(lower_ids),
                "acceptedInjectionSerialRecordings": len(upper_infos) + len(lower_infos),
                "screwDrivingOperationsExcludedFromInjectionCount": len(screw_infos),
            },
            "staticData": {"upper": upper_static, "lower": lower_static, "classValues": classes},
            "serialSchemaInspection": {
                "upperSamples": upper_samples,
                "lowerSamples": lower_samples,
                "measurementRoles": {
                    "directPhysical": ["injection_pressure_actual", "injection_velocity", "melt_volume"],
                    "command": ["injection_pressure_target"],
                    "state": ["state (upper only)"],
                    "axis": ["time"],
                },
                "sourceUnitsExplicitInRawSerialHeaders": False,
                "sourceTimeBasisDocumented": True,
                "publishedApproxSamplingFrequency": "~1 kHz",
            },
            "acceptedMeasuredCycles": len(upper_infos) + len(lower_infos),
            "acceptedMeasuredTimeSeriesSamples": 0,
            "rawSourceRowsCommitted": False,
            "rawSourceFilesCommitted": False,
            "boundary": "The CC BY 4.0 v1.1 archive is exact-file fingerprinted and accepted as one measured dataset package. Upper and lower injection-moulding serial recordings are counted as real moulding-cycle recordings; 14,882 screw-driving JSON files are explicitly excluded from injection counts. The companion schema defines actual pressure, velocity and melt-volume as direct physical time series and pressure target/state/time separately. Raw serial headers do not encode physical units, so waveform scalar values remain outside the accepted measured-sample ledger despite the documented ~1 kHz time basis."
        }
        Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"source": payload["source"], "archive": payload["archive"], "memberInventory": payload["memberInventory"], "injectionCycleCoverage": payload["injectionCycleCoverage"], "staticData": payload["staticData"], "serialSchemaInspection": payload["serialSchemaInspection"], "acceptedMeasuredCycles": payload["acceptedMeasuredCycles"], "acceptedMeasuredTimeSeriesSamples": 0}, indent=2, ensure_ascii=False))
    finally:
        if cleanup:
            shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
