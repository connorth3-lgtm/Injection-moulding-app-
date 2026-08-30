#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import tempfile
import urllib.request
from collections import Counter
from datetime import datetime
from pathlib import Path

RECORD_ID = "20338544"
DOI = "10.5281/zenodo.20338544"
API = f"https://zenodo.org/api/records/{RECORD_ID}"
UA = "MouldMaster-Zenodo-Energy-Profiler/2.0"
CSV_NAMES = {"feb_production.csv", "mar_production.csv", "test_dataset.csv"}
RAW_PRODUCTION_FILES = {"feb_production.csv", "mar_production.csv"}
KNOWN_MD5 = {
    "feb_production.csv": "3b2daf123be817b271529b909e19edc5",
    "mar_production.csv": "12dd28a9e8a12ed734c3ca4398f93d1b",
    "test_dataset.csv": "2a19cfa6f2fc569723e3ad8d78d8e418",
}
EXPECTED_SHA256 = {
    "feb_production.csv": "8a728a72f7fd4cf3821f244db0b31410bd27da0ca1997fc766673d044cf9da4c",
    "mar_production.csv": "26ea166c06180969e64e4055996b2609b9f13efa45080b7d674a546abb1d8d36",
    "test_dataset.csv": "259d7cfa903320cb5a2d51c816771f07b0b39a701d2a1b4bde8bfb491fee5fee",
}
EXPECTED_ROWS = {
    "feb_production.csv": 816925,
    "mar_production.csv": 452962,
    "test_dataset.csv": 2901,
}
DIRECT_PHASE_CHANNELS = [
    f"{phase}_{metric}"
    for phase in "ABC"
    for metric in ("ACT_POWER", "APRT_POWER", "CURRENT", "FREQ", "VOLTAGE")
]
DERIVED_OR_AGGREGATE_CHANNELS = [
    "A_PF", "B_PF", "C_PF", "TOTAL_ACT_POWER", "TOTAL_APRT_POWER", "TOTAL_CURRENT"
]
MEASUREMENT_UNITS = {
    "ACT_POWER": "W",
    "APRT_POWER": "VA",
    "CURRENT": "A",
    "FREQ": "Hz",
    "VOLTAGE": "V",
    "PF": "dimensionless",
}
SEMANTIC_SOURCE = "Shelly Pro 3EM Gen2 EM technical documentation: phase current A, voltage V, active power W, apparent power VA, power factor dimensionless, frequency Hz; total fields are phase aggregates."


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


def parse_datetime(value: str):
    text = value.strip()
    if not text:
        return None
    candidates = [text, text.replace("Z", "+00:00")]
    for candidate in candidates:
        try:
            return datetime.fromisoformat(candidate)
        except ValueError:
            pass
    for fmt in (
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y.%m.%d %H:%M:%S.%f",
        "%Y.%m.%d %H:%M:%S",
    ):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            pass
    return None


def semantic_role(name: str) -> str:
    if name in DIRECT_PHASE_CHANNELS:
        return "direct-instrument-reported-physical"
    if name in DERIVED_OR_AGGREGATE_CHANNELS:
        return "derived-or-aggregate-electrical"
    if name == "N_CURRENT":
        return "direct-physical-unpopulated"
    if name in {"LOG_TIME", "OBSERVATION_TIME"}:
        return "time-axis"
    if name in {"PRODUCTIONSTATUS_NAME", "PRODUCTION_STATUS", "DEVSTATUS_NAME", "DEVSTATUS_ID"}:
        return "production-or-device-state"
    if name in {"ORDERNAME", "MACHINENAME", "PRODNAME", "MOLD_NAME", "CAVITY", "MOLD_SPEED", "ACTUALSCRAP", "ACTUALQUANTITY", "QUANTITY"}:
        return "production-context-or-quality"
    if name in {"ERROR_REASON", "ENERGY_ERROR"}:
        return "label-or-error-context"
    if name in {"ID", "DEVICE_ID"}:
        return "identifier"
    return "unresolved"


def unit_for(name: str):
    for suffix, unit in MEASUREMENT_UNITS.items():
        if name.endswith("_" + suffix):
            return unit
    return None


def profile_csv(path: Path) -> dict:
    dialect = sniff(path)
    row_count = 0
    header = []
    missing = []
    numeric = []
    unique_small = []
    first_values = {}
    last_values = {}
    time_parse_failures = Counter()
    first_time_by_column = {}
    last_time_by_column = {}
    previous_log_time_by_device = {}
    log_delta_counts = Counter()
    nonpositive_log_deltas = 0

    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        reader = csv.reader(handle, dialect)
        try:
            header = [str(x).strip() for x in next(reader)]
        except StopIteration:
            return {"rows": 0, "columns": 0, "header": [], "columnProfiles": []}
        width = len(header)
        index = {name: i for i, name in enumerate(header)}
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
                name = header[i]
                if not text:
                    missing[i] += 1
                    continue
                if name not in first_values:
                    first_values[name] = text[:160]
                last_values[name] = text[:160]
                try:
                    float(text.replace(",", ".") if dialect.delimiter != "," else text)
                    numeric[i] += 1
                except Exception:
                    pass
                if len(unique_small[i]) <= 32:
                    unique_small[i].add(text[:120])

            device = row[index["DEVICE_ID"]].strip() if "DEVICE_ID" in index else "__single__"
            for time_name in ("LOG_TIME", "OBSERVATION_TIME"):
                if time_name not in index:
                    continue
                raw_time = row[index[time_name]].strip()
                parsed = parse_datetime(raw_time)
                if parsed is None:
                    if raw_time:
                        time_parse_failures[time_name] += 1
                    continue
                if time_name not in first_time_by_column or parsed < first_time_by_column[time_name]:
                    first_time_by_column[time_name] = parsed
                if time_name not in last_time_by_column or parsed > last_time_by_column[time_name]:
                    last_time_by_column[time_name] = parsed
                if time_name == "LOG_TIME":
                    previous = previous_log_time_by_device.get(device)
                    if previous is not None:
                        delta = (parsed - previous).total_seconds()
                        if delta > 0:
                            log_delta_counts[round(delta, 6)] += 1
                        else:
                            nonpositive_log_deltas += 1
                    previous_log_time_by_device[device] = parsed

    profiles = []
    for i, name in enumerate(header):
        profiles.append({
            "name": name,
            "semanticRole": semantic_role(name),
            "unit": unit_for(name),
            "numericCount": numeric[i],
            "missingCount": missing[i],
            "numericFraction": round(numeric[i] / row_count, 6) if row_count else 0,
            "smallCardinalityValues": sorted(unique_small[i]) if 0 < len(unique_small[i]) <= 20 else None,
        })

    direct_numeric_counts = {name: numeric[header.index(name)] for name in DIRECT_PHASE_CHANNELS if name in header}
    direct_missing_counts = {name: missing[header.index(name)] for name in DIRECT_PHASE_CHANNELS if name in header}
    direct_complete = len(direct_numeric_counts) == len(DIRECT_PHASE_CHANNELS) and all(v == row_count for v in direct_numeric_counts.values()) and all(v == 0 for v in direct_missing_counts.values())
    common_deltas = [
        {"seconds": seconds, "count": count}
        for seconds, count in log_delta_counts.most_common(12)
    ]
    time_range = {
        name: {
            "first": first_time_by_column[name].isoformat(),
            "last": last_time_by_column[name].isoformat(),
            "parseFailures": time_parse_failures.get(name, 0),
        }
        for name in first_time_by_column
    }

    return {
        "rows": row_count,
        "columns": len(header),
        "header": header,
        "delimiter": repr(dialect.delimiter),
        "columnProfiles": profiles,
        "semanticRoleCounts": {
            role: sum(1 for p in profiles if p["semanticRole"] == role)
            for role in sorted({p["semanticRole"] for p in profiles})
        },
        "directPhysicalChannelCount": len(DIRECT_PHASE_CHANNELS),
        "directPhysicalChannels": DIRECT_PHASE_CHANNELS,
        "directPhysicalChannelsComplete": direct_complete,
        "directPhysicalScalarValues": row_count * len(DIRECT_PHASE_CHANNELS) if direct_complete else 0,
        "timeRange": time_range,
        "logTimeByDevice": {
            "deviceCount": len(previous_log_time_by_device),
            "commonPositiveDeltaSeconds": common_deltas,
            "nonpositiveDeltas": nonpositive_log_deltas,
        },
        "contextExamples": {
            key: sorted(unique_small[header.index(key)]) if key in header and 0 < len(unique_small[header.index(key)]) <= 20 else None
            for key in ("DEVICE_ID", "MACHINENAME", "PRODUCTIONSTATUS_NAME", "DEVSTATUS_NAME", "PRODNAME", "MOLD_NAME")
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
            if fp["md5"] != KNOWN_MD5[name]:
                raise RuntimeError(f"{name} MD5 mismatch: {fp['md5']} != {KNOWN_MD5[name]}")
            if fp["sha256"] != EXPECTED_SHA256[name]:
                raise RuntimeError(f"{name} SHA-256 mismatch: {fp['sha256']} != {EXPECTED_SHA256[name]}")
            publisher_checksum = meta.get("checksum")
            if publisher_checksum and publisher_checksum.startswith("md5:") and publisher_checksum.split(":", 1)[1] != fp["md5"]:
                raise RuntimeError(f"{name} publisher checksum mismatch")
            table = profile_csv(path)
            if table["rows"] != EXPECTED_ROWS[name]:
                raise RuntimeError(f"{name} row count drift: {table['rows']} != {EXPECTED_ROWS[name]}")
            profiled.append({
                "name": name,
                "sizeBytes": fp["sizeBytes"],
                "md5": fp["md5"],
                "sha256": fp["sha256"],
                "publisherChecksum": publisher_checksum,
                "datasetRole": "raw-production-energy-timeseries" if name in RAW_PRODUCTION_FILES else "derived-or-curated-test-subset-noncounting-for-scalars",
                "table": table,
            })

    license_obj = metadata.get("license") or metadata.get("rights") or {}
    if isinstance(license_obj, dict):
        license_id = license_obj.get("id") or license_obj.get("title")
    else:
        license_id = str(license_obj) if license_obj else None
    access_status = access.get("status") or metadata.get("access_right")

    raw_files = [f for f in profiled if f["name"] in RAW_PRODUCTION_FILES]
    raw_rows = sum(f["table"]["rows"] for f in raw_files)
    all_raw_complete = all(f["table"]["directPhysicalChannelsComplete"] for f in raw_files)
    accepted_scalars = sum(f["table"]["directPhysicalScalarValues"] for f in raw_files) if all_raw_complete else 0
    observed_machines = sorted({value for f in raw_files for value in (f["table"]["contextExamples"].get("MACHINENAME") or [])})
    observed_devices = sorted({value for f in raw_files for value in (f["table"]["contextExamples"].get("DEVICE_ID") or [])})
    timestamp_verified = all(
        (f["table"]["timeRange"].get("LOG_TIME") or {}).get("parseFailures") == 0
        and (f["table"]["timeRange"].get("OBSERVATION_TIME") or {}).get("parseFailures") == 0
        and f["table"]["logTimeByDevice"]["commonPositiveDeltaSeconds"]
        for f in raw_files
    )
    promotion_ready = (
        access_status == "open"
        and str(license_id).lower() == "cc-by-4.0"
        and raw_rows == 1_269_887
        and all_raw_complete
        and timestamp_verified
        and observed_machines == ["FGP085"]
    )

    payload = {
        "schema": 2,
        "status": "completed-public-measured-timeseries-benchmark" if promotion_ready else "exact-file-profile-review-required",
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
            "measurementHardwareObserved": "Shelly Pro 3EM device identifiers in exact CSV rows",
            "measurementSemanticSource": SEMANTIC_SOURCE,
            "measurementSemanticDocumentation": "https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/EM/",
        },
        "measurementSemantics": {
            "directInstrumentReportedPhysicalChannels": DIRECT_PHASE_CHANNELS,
            "unitsByMetricSuffix": MEASUREMENT_UNITS,
            "derivedOrAggregateExcludedFromScalarLedger": DERIVED_OR_AGGREGATE_CHANNELS,
            "neutralCurrentExcludedBecauseUnpopulated": "N_CURRENT",
            "testDatasetExcludedFromScalarLedger": True,
            "reasonTestExcluded": "test_dataset.csv is a separate curated/test file and may overlap the raw February/March production stream; excluding it prevents double counting.",
        },
        "files": profiled,
        "csvFilesProfiled": len(profiled),
        "rawProductionFilesAccepted": len(raw_files) if promotion_ready else 0,
        "rawProductionRowsAccepted": raw_rows if promotion_ready else 0,
        "observedMachineNames": observed_machines,
        "observedEnergyMeterDeviceIds": observed_devices,
        "acceptedMeasuredRecords": raw_rows if promotion_ready else 0,
        "acceptedMeasuredTimeSeriesSamples": accepted_scalars if promotion_ready else 0,
        "rawSourceRowsCommitted": False,
        "rawSourceFilesCommitted": False,
        "boundary": "Only the two exact raw February/March production-energy streams count. Fifteen per-phase instrument-reported physical channels per row are accepted: active power, apparent power, current, frequency and voltage for phases A/B/C. Power factor and total fields are classified as derived/aggregate and excluded; neutral current is empty; the curated test dataset is excluded from the scalar ledger to avoid overlap. Timestamp parsing and per-device sample ordering are verified from LOG_TIME/OBSERVATION_TIME.",
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": payload["status"],
        "license": license_id,
        "rawProductionRowsAccepted": payload["rawProductionRowsAccepted"],
        "acceptedMeasuredTimeSeriesSamples": payload["acceptedMeasuredTimeSeriesSamples"],
        "observedMachineNames": observed_machines,
        "observedEnergyMeterDeviceIds": observed_devices,
        "files": [
            {
                "name": f["name"],
                "rows": f["table"]["rows"],
                "directPhysicalChannelsComplete": f["table"]["directPhysicalChannelsComplete"],
                "directPhysicalScalarValues": f["table"]["directPhysicalScalarValues"],
                "timeRange": f["table"]["timeRange"],
                "commonPositiveDeltaSeconds": f["table"]["logTimeByDevice"]["commonPositiveDeltaSeconds"][:8],
                "nonpositiveDeltas": f["table"]["logTimeByDevice"]["nonpositiveDeltas"],
            }
            for f in profiled
        ],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
