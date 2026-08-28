#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import urllib.request
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

UA = "MouldMaster-ProBayes-fast-profiler/1.0"

SPECS = {
    "probayes-main-v2": {
        "record": "k0v7s-jf859",
        "legacyRecord": "4c5692b886db419180f716acf895bf06",
        "doi": "10.23728/b2share.4c5692b886db419180f716acf895bf06",
        "version": "v2",
        "title": "Injection-Molding Production Data with Quality Labels",
        "file": "dataset_V2.parquet",
        "md5": "f04efe419e63db5fb4a392e1569ea417",
        "rows": 564,
        "features": 334,
        "experimentalPoints": 47,
        "materials": ["polypropylene (PP)", "ABS containing 70% recyclate"],
    },
    "probayes-doptimal-v1": {
        "record": "v64sz-f0f41",
        "legacyRecord": "3f80952ce5ff4be88ae4cf6a3bdfe732",
        "doi": "10.23728/b2share.3f80952ce5ff4be88ae4cf6a3bdfe732",
        "version": "v1",
        "title": "Injection-Molding Production Data with Quality Labels (d-optimal Design of Experiment pattern)",
        "file": "dataset.parquet",
        "md5": "913cb30061ba35b78cc7715799674783",
        "rows": 303,
        "features": 396,
        "experimentalPoints": 28,
        "materials": ["Borealis HE125MO polypropylene"],
    },
}


def digest(path: Path, algorithm: str) -> str:
    h = hashlib.new(algorithm)
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, path: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/octet-stream,*/*"})
    with urllib.request.urlopen(req, timeout=300) as r, path.open("wb") as f:
        for chunk in iter(lambda: r.read(4 * 1024 * 1024), b""):
            f.write(chunk)


def container_type(t: pa.DataType) -> str:
    if pa.types.is_list(t) or pa.types.is_large_list(t) or pa.types.is_fixed_size_list(t):
        return "list"
    if pa.types.is_struct(t):
        return "struct"
    if pa.types.is_map(t):
        return "map"
    return "scalar"


def finite(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def profile_one(dataset_id: str, output: Path, workdir: Path) -> None:
    s = SPECS[dataset_id]
    record_url = f"https://b2share.eudat.eu/records/{s['record']}"
    download_url = f"{record_url}/files/{s['file']}?download=1"
    local = workdir / s["file"]
    workdir.mkdir(parents=True, exist_ok=True)
    download(download_url, local)
    md5 = digest(local, "md5")
    if md5 != s["md5"]:
        raise RuntimeError(f"published MD5 mismatch for {dataset_id}: {md5}")

    pf = pq.ParquetFile(local)
    rows = pf.metadata.num_rows
    if rows != s["rows"]:
        raise RuntimeError(f"published row-count mismatch for {dataset_id}: {rows}")

    arrow_schema = pf.schema_arrow
    # Reading one row group is enough to inspect real values and list lengths;
    # the exact file MD5/SHA-256 and Parquet metadata cover the full file.
    sample_table = pf.read_row_group(0)
    fields = []
    list_fields = 0
    scalar_fields = 0
    for i, field in enumerate(arrow_schema):
        kind = container_type(field.type)
        list_fields += int(kind == "list")
        scalar_fields += int(kind == "scalar")
        arr = sample_table.column(i)
        samples = arr.slice(0, min(8, len(arr))).to_pylist()
        first = next((v for v in samples if v is not None), None)
        rec = {
            "name": field.name,
            "arrowType": str(field.type),
            "container": kind,
            "sampleNullCountInFirstRowGroup": arr.null_count,
        }
        if kind == "list" and first is not None:
            vals = list(first)
            rec["firstObservedListLength"] = len(vals)
            rec["firstObservedFiniteNumericElements"] = sum(1 for v in vals if finite(v))
            rec["firstObservedHead"] = vals[:3]
        elif first is not None:
            text = str(first)
            rec["firstObservedValue"] = text[:160]
        fields.append(rec)

    names = [f["name"] for f in fields]
    lower = [n.lower() for n in names]
    machine_cycle_fields = [names[i] for i,n in enumerate(lower) if "machinecycle" in n or ("machine" in n and "cycle" in n)]
    quality_fields = [names[i] for i,n in enumerate(lower) if any(k in n for k in ("quality", "label", "class", "ok", "nok", "weight", "mass", "warpage", "vision", "infrared"))]
    process_fields = [names[i] for i,n in enumerate(lower) if any(k in n for k in ("pressure", "temperature", "temp", "speed", "velocity", "position", "screw", "holding", "injection", "mould", "mold", "cylinder"))]
    derived_fields = [names[i] for i,n in enumerate(lower) if any(k in n for k in ("calc", "mean", "median", "std", "max", "min", "integral", "gradient", "slope"))]

    payload = {
        "schema_version": 1,
        "status": "profile-generated-review-required",
        "completed_date": "2026-08-28",
        "datasetId": dataset_id,
        "title": s["title"],
        "source": {
            "recordUrl": record_url,
            "legacyRecordId": s["legacyRecord"],
            "doi": s["doi"],
            "version": s["version"],
            "file": s["file"],
            "downloadUrl": download_url,
            "publishedMd5": s["md5"],
            "recordAccess": "Dataset Open",
            "licenseOnCurrentB2shareRecordPage": None,
            "rightsNote": "Current B2SHARE page displays Dataset Open but leaves its License field blank. EUDAT B2FIND metadata records the ProBayes records as Creative Commons Attribution (CC-BY) / openAccess; CC-BY version is not specified. Raw redistribution remains disabled in MouldMaster.",
        },
        "file": {
            "sizeBytes": local.stat().st_size,
            "md5": md5,
            "sha256": digest(local, "sha256"),
            "parquetRows": rows,
            "parquetPhysicalColumns": pf.metadata.num_columns,
            "arrowTopLevelFields": len(arrow_schema),
            "rowGroups": pf.metadata.num_row_groups,
        },
        "publishedContext": {
            "cycles": s["rows"],
            "features": s["features"],
            "experimentalPoints": s["experimentalPoints"],
            "materials": s["materials"],
            "machine": "KraussMaffei 160-750PX",
            "recordUnit": "one injection-moulded part / machine cycle per row",
            "variedSetParameters": ["cylinder temperature", "mould temperature", "injection speed", "holding pressure"],
            "quality": "all produced parts manually inspected and classified; dataset also combines computer-vision, scale and infrared-camera quality-control sources",
            "dataSources": 9,
        },
        "schemaSummary": {
            "listFields": list_fields,
            "scalarFields": scalar_fields,
            "machineCycleFields": machine_cycle_fields,
            "qualityFieldCandidates": quality_fields,
            "processFieldCandidates": process_fields,
            "derivedFieldCandidates": derived_fields,
        },
        "fields": fields,
        "acceptedMeasuredCycles": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "rawSourceRedistributed": False,
        "boundary": "Exact file identity and schema are profiled here. Cycle/package acceptance and any measured-sample promotion require semantic review of field identities/units and direct-measurement versus calculated-feature separation. No raw Parquet bytes are committed.",
    }
    output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"datasetId": dataset_id, "file": payload["file"], "schemaSummary": payload["schemaSummary"]}, indent=2, ensure_ascii=False))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset-id", required=True, choices=sorted(SPECS))
    ap.add_argument("--output", required=True)
    ap.add_argument("--workdir", default=".probayes-fast-work")
    args = ap.parse_args()
    profile_one(args.dataset_id, Path(args.output), Path(args.workdir))


if __name__ == "__main__":
    main()
