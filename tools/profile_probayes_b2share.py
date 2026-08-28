#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import urllib.request
from collections import Counter
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

UA = "MouldMaster-ProBayes-profiler/1.0"

DATASETS = [
    {
        "datasetId": "probayes-main-v2",
        "record": "k0v7s-jf859",
        "version": "v2",
        "title": "Injection-Molding Production Data with Quality Labels",
        "parquet": "dataset_V2.parquet",
        "publishedMd5": "f04efe419e63db5fb4a392e1569ea417",
        "publishedRows": 564,
        "publishedFeatures": 334,
        "experimentalPoints": 47,
        "materials": ["PP", "ABS with 70% recyclate"],
        "machine": "KraussMaffei 160-750PX",
        "recordUrl": "https://b2share.eudat.eu/records/k0v7s-jf859",
    },
    {
        "datasetId": "probayes-doptimal-v1",
        "record": "v64sz-f0f41",
        "version": "v1",
        "title": "Injection-Molding Production Data with Quality Labels (d-optimal Design of Experiment pattern)",
        "parquet": "dataset.parquet",
        "publishedMd5": "913cb30061ba35b78cc7715799674783",
        "publishedRows": 303,
        "publishedFeatures": 396,
        "experimentalPoints": 28,
        "materials": ["Borealis HE125MO polypropylene"],
        "machine": "KraussMaffei 160-750PX",
        "recordUrl": "https://b2share.eudat.eu/records/v64sz-f0f41",
    },
]


def digest(path: Path, algorithm: str) -> str:
    h = hashlib.new(algorithm)
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, out: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/octet-stream,*/*"})
    with urllib.request.urlopen(req, timeout=180) as r, out.open("wb") as f:
        while True:
            chunk = r.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)


def type_info(t: pa.DataType) -> dict:
    out = {"arrowType": str(t)}
    if pa.types.is_list(t) or pa.types.is_large_list(t) or pa.types.is_fixed_size_list(t):
        out["container"] = "list"
        out["valueType"] = str(t.value_type)
        if pa.types.is_fixed_size_list(t):
            out["fixedSize"] = t.list_size
    elif pa.types.is_struct(t):
        out["container"] = "struct"
    elif pa.types.is_map(t):
        out["container"] = "map"
    else:
        out["container"] = "scalar"
    return out


def finite_number(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def value_preview(v):
    if v is None:
        return None
    if isinstance(v, (list, tuple)):
        vals = list(v)
        return {
            "length": len(vals),
            "head": vals[:3],
            "tail": vals[-3:] if len(vals) > 3 else vals,
        }
    if isinstance(v, (str, int, float, bool)):
        s = str(v)
        return s[:160]
    return str(type(v).__name__)


def profile_column(arr: pa.ChunkedArray, field: pa.Field, rows: int) -> dict:
    result = {
        "name": field.name,
        **type_info(field.type),
        "nullCount": arr.null_count,
        "nonNull": rows - arr.null_count,
    }
    sample_py = arr.slice(0, min(rows, 16)).to_pylist()
    first = next((x for x in sample_py if x is not None), None)
    result["sample"] = value_preview(first)

    if result["container"] == "list":
        lengths = []
        numeric_values = 0
        non_numeric_values = 0
        empty = 0
        # There are only 303/564 rows; scanning list lengths is cheap even when
        # the arrays themselves contain many values.
        for chunk in arr.chunks:
            for v in chunk.to_pylist():
                if v is None:
                    continue
                if not isinstance(v, list):
                    try:
                        v = list(v)
                    except Exception:
                        non_numeric_values += 1
                        continue
                lengths.append(len(v))
                if not v:
                    empty += 1
                    continue
                numeric_values += sum(1 for x in v if finite_number(x))
                non_numeric_values += sum(1 for x in v if x is not None and not finite_number(x))
        result["listStats"] = {
            "rowsWithList": len(lengths),
            "emptyLists": empty,
            "minLength": min(lengths) if lengths else 0,
            "maxLength": max(lengths) if lengths else 0,
            "distinctLengths": sorted(set(lengths))[:30],
            "totalElements": sum(lengths),
            "finiteNumericElements": numeric_values,
            "nonNumericElements": non_numeric_values,
        }
    else:
        # Cardinality preview for identifiers, materials, labels and status fields.
        vals = []
        for chunk in arr.chunks:
            vals.extend(chunk.to_pylist())
        clean = [v for v in vals if v is not None]
        if len(clean) <= 10000:
            rendered = [str(v) for v in clean]
            counts = Counter(rendered)
            if len(counts) <= 30:
                result["smallCardinality"] = dict(counts.most_common(30))
        if clean and all(finite_number(v) for v in clean):
            nums = [float(v) for v in clean]
            result["numericRange"] = {"min": min(nums), "max": max(nums)}
    return result


def classify_name(name: str) -> list[str]:
    n = name.lower()
    tags = []
    rules = {
        "identifier": ["id", "cycle", "part", "experiment", "doe", "datetime", "timestamp"],
        "quality": ["quality", "ok", "nok", "label", "class", "warpage", "weight", "mass", "vision", "infrared", "ir_", "dimension", "defect"],
        "machine-process": ["pressure", "temp", "temperature", "speed", "velocity", "position", "stroke", "volume", "flow", "screw", "holding", "injection", "dosing", "cool", "mold", "mould", "cylinder"],
        "peripheral": ["dryer", "dosing unit", "temperature control", "thermolator", "scale"],
        "derived": ["calc", "mean", "median", "std", "max", "min", "integral", "gradient", "slope", "feature"],
    }
    for tag, markers in rules.items():
        if any(m in n for m in markers):
            tags.append(tag)
    return tags


def profile_dataset(spec: dict, workdir: Path) -> dict:
    url = f"https://b2share.eudat.eu/records/{spec['record']}/files/{spec['parquet']}?download=1"
    local = workdir / f"{spec['datasetId']}.parquet"
    download(url, local)
    md5 = digest(local, "md5")
    if md5 != spec["publishedMd5"]:
        raise RuntimeError(f"{spec['datasetId']} MD5 mismatch: {md5} != {spec['publishedMd5']}")

    pf = pq.ParquetFile(local)
    rows = pf.metadata.num_rows
    cols = pf.metadata.num_columns
    table = pf.read()
    schema = table.schema
    profiles = [profile_column(table.column(i), schema.field(i), rows) for i in range(len(schema))]
    list_cols = [p for p in profiles if p.get("container") == "list"]
    scalar_cols = [p for p in profiles if p.get("container") == "scalar"]
    total_array_numeric = sum((p.get("listStats") or {}).get("finiteNumericElements", 0) for p in list_cols)

    by_tag = Counter()
    for p in profiles:
        p["nameTags"] = classify_name(p["name"])
        by_tag.update(p["nameTags"])

    unique_cycle_candidates = []
    for p in scalar_cols:
        if "cycle" in p["name"].lower() and p.get("smallCardinality"):
            unique_cycle_candidates.append({"field": p["name"], "unique": len(p["smallCardinality"])})

    return {
        "datasetId": spec["datasetId"],
        "title": spec["title"],
        "status": "profile-generated-review-required",
        "source": {
            "recordUrl": spec["recordUrl"],
            "recordId": spec["record"],
            "version": spec["version"],
            "file": spec["parquet"],
            "downloadUrl": url,
            "publishedMd5": spec["publishedMd5"],
            "license": None,
            "accessTerms": "B2SHARE record is marked Dataset Open; current public record page exposes no explicit licence value. Raw redistribution is therefore not assumed.",
        },
        "file": {
            "sizeBytes": local.stat().st_size,
            "md5": md5,
            "sha256": digest(local, "sha256"),
            "parquetRows": rows,
            "parquetPhysicalColumns": cols,
            "arrowTopLevelFields": len(schema),
            "rowGroups": pf.metadata.num_row_groups,
        },
        "publishedContext": {
            "rows": spec["publishedRows"],
            "features": spec["publishedFeatures"],
            "experimentalPoints": spec["experimentalPoints"],
            "materials": spec["materials"],
            "machine": spec["machine"],
            "recordUnit": "one injection-moulded part / machine cycle per row",
            "quality": "produced parts manually inspected and classified; quality-control devices include computer vision, scale and infrared camera",
            "variedSetParameters": ["cylinder temperature", "mould temperature", "injection speed", "holding pressure"],
        },
        "reconciliation": {
            "rowsMatchPublished": rows == spec["publishedRows"],
            "topLevelFieldCountMatchesPublishedFeatureClaim": len(schema) == spec["publishedFeatures"],
            "note": "Published feature counts are compared with Arrow top-level fields. Nested time-series arrays are stored within cells and do not create extra rows.",
        },
        "schemaSummary": {
            "listFields": len(list_cols),
            "scalarFields": len(scalar_cols),
            "totalFiniteNumericElementsInsideAllListFields": total_array_numeric,
            "nameTagCounts": dict(by_tag),
            "cycleIdentifierCandidates": unique_cycle_candidates,
        },
        "fields": profiles,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "acceptedMeasuredCycles": 0,
        "rawSourceRowsCommitted": False,
        "redistributionAllowed": False,
        "boundary": "This discovery/profile pass verifies the exact B2SHARE Parquet file against the publisher-displayed MD5 and inspects every top-level field and nested list length. No nested array value is accepted into MouldMaster's measured-sample ledger until field semantics distinguish direct physical measurements from derived features, setpoints, identifiers and labels. The raw Parquet is not committed or redistributed because the record page currently shows no explicit licence value.",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="probayes-b2share-profile.json")
    ap.add_argument("--workdir", default=".probayes-profile-work")
    args = ap.parse_args()
    workdir = Path(args.workdir)
    workdir.mkdir(parents=True, exist_ok=True)
    profiles = [profile_dataset(d, workdir) for d in DATASETS]
    payload = {
        "schema_version": 1,
        "completed_date": "2026-08-28",
        "status": "profile-generated-review-required",
        "datasetPackages": len(profiles),
        "profiles": profiles,
        "rawSourceRowsCommitted": False,
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    compact = []
    for p in profiles:
        compact.append({
            "datasetId": p["datasetId"],
            "file": p["file"],
            "reconciliation": p["reconciliation"],
            "schemaSummary": p["schemaSummary"],
        })
    print(json.dumps(compact, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
