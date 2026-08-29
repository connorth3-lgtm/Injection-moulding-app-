#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import tempfile
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/hdpe-gnp-4h98rz9f92-v3.json"
DATASET_ID = "4h98rz9f92"
VERSION = 3
PUBLIC_FILES_ENDPOINT = f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}"
API_ROOT = "https://api.data.mendeley.com"
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"


def get(url: str, accept: str = "*/*"):
    req = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read(), response.geturl()


def flatten_files(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("results", "files", "items", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    raise RuntimeError("Mendeley public file list did not contain files")


def file_id(item):
    return str(item.get("id") or item.get("file_id") or item.get("uuid") or "").strip()


def file_name(item):
    return str(item.get("filename") or item.get("name") or "").strip()


def file_url(item):
    details = item.get("content_details") or item.get("contentDetails") or {}
    for candidate in (
        details.get("download_url"),
        details.get("downloadUrl"),
        item.get("download_url"),
        item.get("downloadUrl"),
    ):
        if candidate:
            return str(candidate)
    fid = file_id(item)
    if fid:
        return f"{API_ROOT}/datasets/{DATASET_ID}/files/{fid}/file_downloaded?version={VERSION}"
    return None


def normalise(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value).strip().lower()).strip()


def semantic_columns(columns):
    names = [str(x).strip() for x in columns]
    process = {}
    measured = {}
    derived = []
    for name in names:
        n = normalise(name)
        if "gnp" in n or "graphite" in n:
            process.setdefault("gnpPercentage", name)
        if "pressure" in n:
            process.setdefault("injectionPressure", name)
        if "temperature" in n or n in {"temp", "temp c"}:
            process.setdefault("injectionTemperature", name)
        if "tensile" in n and "modulus" in n:
            measured.setdefault("tensileModulus", name)
        if "toughness" in n:
            measured.setdefault("toughness", name)
        if "hardness" in n:
            measured.setdefault("hardness", name)
        if any(token in n for token in ("class", "category", "prediction", "predicted", "quartile", "high medium low")):
            derived.append(name)
    return {"process": process, "measured": measured, "derivedOrCategorical": sorted(set(derived)), "rawValuesEmitted": False}


def read_tables(name: str, data: bytes):
    suffix = Path(name).suffix.lower()
    if suffix == ".csv":
        return [(name, pd.read_csv(io.BytesIO(data), sep=None, engine="python"))]
    if suffix == ".tsv":
        return [(name, pd.read_csv(io.BytesIO(data), sep="\t"))]
    if suffix in {".xlsx", ".xls"}:
        with tempfile.NamedTemporaryFile(suffix=suffix) as tmp:
            tmp.write(data)
            tmp.flush()
            sheets = pd.read_excel(tmp.name, sheet_name=None)
        return [(str(sheet), frame) for sheet, frame in sheets.items()]
    return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--retrieved-date", required=True)
    args = ap.parse_args()

    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    raw, _ = get(PUBLIC_FILES_ENDPOINT, "application/json")
    files = flatten_files(json.loads(raw.decode("utf-8")))

    file_profiles = []
    table_profiles = []
    best = None

    for item in files:
        name = file_name(item)
        ext = Path(name).suffix.lower()
        details = item.get("content_details") or item.get("contentDetails") or {}
        size = details.get("size") if details.get("size") is not None else item.get("size")
        eligible = ext in {".csv", ".tsv", ".xlsx", ".xls"} and (size is None or int(size) <= 20_000_000)
        fp = {
            "fileId": file_id(item) or None,
            "fileName": name,
            "extension": ext,
            "publisherReportedSizeBytes": size,
            "publisherSha256": details.get("sha256_hash") or details.get("sha256Hash"),
            "tabularProfileEligible": bool(eligible),
            "rawPayloadCommitted": False,
        }
        if not eligible:
            file_profiles.append(fp)
            continue
        url = file_url(item)
        if not url:
            fp["retrievalStatus"] = "no-download-route"
            file_profiles.append(fp)
            continue
        data, final_url = get(url)
        digest = hashlib.sha256(data).hexdigest()
        fp.update({"retrievalStatus": "retrieved-temporarily", "retrievedSizeBytes": len(data), "sha256": digest, "resolvedUrl": final_url})
        if fp["publisherSha256"] and len(str(fp["publisherSha256"])) == 64:
            fp["publisherSha256Matched"] = str(fp["publisherSha256"]).lower() == digest.lower()
        file_profiles.append(fp)
        try:
            tables = read_tables(name, data)
        except Exception as exc:
            table_profiles.append({"fileName": name, "readError": f"{type(exc).__name__}: {exc}", "rawValuesEmitted": False})
            continue
        for table_name, frame in tables:
            frame = frame.dropna(axis=0, how="all").dropna(axis=1, how="all")
            sem = semantic_columns(frame.columns)
            rows = int(len(frame))
            measured_non_null = {
                key: int(frame[col].notna().sum()) for key, col in sem["measured"].items() if col in frame.columns
            }
            direct = int(sum(measured_non_null.values()))
            profile = {
                "fileName": name,
                "table": table_name,
                "rows": rows,
                "columns": int(len(frame.columns)),
                "columnNames": [str(x).strip() for x in frame.columns],
                "semantics": sem,
                "nonNullMeasuredOutcomeCells": measured_non_null,
                "directMeasuredOutcomeCells": direct,
                "rawRowsOrCellValuesEmitted": False,
            }
            table_profiles.append(profile)
            score = len(sem["measured"]) * 100 + len(sem["process"]) * 10 + (5 if rows == 35 else 0)
            candidate = (score, direct, profile)
            if best is None or candidate[:2] > best[:2]:
                best = candidate

    selected = best[2] if best else None
    recognised = bool(
        selected
        and selected["rows"] == contract["experimentContext"]["reportedExperimentalConditions"]
        and set(selected["semantics"]["measured"].keys()) == {"tensileModulus", "toughness", "hardness"}
        and {"injectionPressure", "injectionTemperature"}.issubset(selected["semantics"]["process"].keys())
        and selected["directMeasuredOutcomeCells"] == 105
    )

    result = {
        "schema": 1,
        "status": "completed-public-open-measured-benchmark" if recognised else "retrieved-profile-needs-semantic-review",
        "retrievedDate": args.retrieved_date,
        "source": {
            "datasetId": contract["datasetId"],
            "datasetDoi": contract["source"]["datasetDoi"],
            "version": VERSION,
            "license": contract["source"]["license"],
        },
        "manifest": {
            "publisherFiles": file_profiles,
            "publisherFileCount": len(file_profiles),
            "tabularFilesProfiled": sum(1 for x in file_profiles if x.get("retrievalStatus") == "retrieved-temporarily"),
            "rawPublisherFilesCommitted": False,
        },
        "profile": {
            "tables": table_profiles,
            "selectedMeasuredTable": selected,
            "semanticLayoutRecognized": recognised,
            "reportedExperimentalConditions": contract["experimentContext"]["reportedExperimentalConditions"],
            "recordLevelMeasuredOutcomeValues": 105 if recognised else 0,
            "acceptedMeasuredTimeSeriesSamples": 0,
            "rawRowsOrCellValuesEmitted": False,
        },
        "acceptance": {
            "countsAsFullyProfiledMeasuredDataset": recognised,
            "licenseScope": "public-open-cc-by-4.0",
            "recordLevelMeasuredOutcomeValues": 105 if recognised else 0,
            "acceptedMeasuredTimeSeriesSamples": 0,
        },
        "retrieval": {
            "rawPublisherFileCommitted": False,
            "rawRowsOrCellValuesUploadedAsArtifact": False,
        },
        "evidenceBoundary": contract["evidenceBoundary"],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": result["status"],
        "publisherFileCount": result["manifest"]["publisherFileCount"],
        "tabularFilesProfiled": result["manifest"]["tabularFilesProfiled"],
        "semanticLayoutRecognized": recognised,
        "recordLevelMeasuredOutcomeValues": result["profile"]["recordLevelMeasuredOutcomeValues"],
    }, indent=2))


if __name__ == "__main__":
    main()
