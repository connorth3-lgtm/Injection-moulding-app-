#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import statistics
import urllib.request
from collections import Counter
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

RECORD_ID = "fkk68-zyf30"
RECORD_URL = f"https://b2share.eudat.eu/records/{RECORD_ID}"
UA = "MouldMaster-SKZ-LoKI-profiler/1.0"

FILES = {
    "quality": {
        "name": "quality_table_data.parquet",
        "md5": "4078fb85d2586bc3dd03d4a0825ff74d",
    },
    "machine": {
        "name": "set_parameter_and_EM77_data.parquet",
        "md5": "384b1ee87679fa4b52b78e842a83cd99",
    },
    "viscometer": {
        "name": "viscometer_pressure_data.parquet",
        "md5": "d37a69bacfbdbe5d7bac9339dfdd94be",
    },
}


def digest(path: Path, algorithm: str) -> str:
    h = hashlib.new(algorithm)
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(name: str, out: Path) -> None:
    url = f"{RECORD_URL}/files/{name}?download=1"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/octet-stream,*/*"})
    with urllib.request.urlopen(req, timeout=300) as r, out.open("wb") as f:
        while True:
            chunk = r.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)


def finite(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def arrow_type(t: pa.DataType) -> dict:
    if pa.types.is_list(t) or pa.types.is_large_list(t) or pa.types.is_fixed_size_list(t):
        return {"container": "list", "arrowType": str(t), "valueType": str(t.value_type)}
    return {"container": "scalar", "arrowType": str(t)}


def profile_small_table(path: Path) -> dict:
    pf = pq.ParquetFile(path)
    table = pf.read()
    rows = table.num_rows
    fields = []
    for i, field in enumerate(table.schema):
        arr = table.column(i)
        vals = arr.to_pylist()
        clean = [v for v in vals if v is not None]
        item = {
            "name": field.name,
            **arrow_type(field.type),
            "nullCount": arr.null_count,
            "nonNull": rows - arr.null_count,
        }
        rendered = [str(v) for v in clean]
        if len(set(rendered)) <= 30:
            item["smallCardinality"] = dict(Counter(rendered).most_common(30))
        if clean and all(finite(v) for v in clean):
            nums = [float(v) for v in clean]
            item["numericRange"] = {"min": min(nums), "max": max(nums)}
        fields.append(item)
    return {
        "rows": rows,
        "columns": len(table.schema),
        "rowGroups": pf.metadata.num_row_groups,
        "fields": fields,
    }


def identify_fields(names: list[str]) -> dict:
    lower = {n: n.lower() for n in names}
    return {
        "metadata": [n for n in names if n.startswith("META_")],
        "setParameters": [n for n in names if n.startswith("SET_")],
        "measured": [n for n in names if n.startswith("MEAS_")],
        "pressureMeasured": [n for n in names if n.startswith("MEAS_") and "press" in lower[n]],
        "timeLike": [n for n in names if any(k in lower[n] for k in ("time", "timestamp", "elapsed"))],
        "qualityLike": [n for n in names if any(k in lower[n] for k in ("quality", "weight", "mass", "dimension", "label", "defect"))],
    }


def unique_cycles_from_table(table: pa.Table) -> tuple[int, list[dict]]:
    names = table.schema.names
    if "META_experiment" not in names or "META_run" not in names:
        return 0, []
    exps = table["META_experiment"].to_pylist()
    runs = table["META_run"].to_pylist()
    pairs = sorted({(str(e), str(r)) for e, r in zip(exps, runs) if e is not None and r is not None})
    return len(pairs), [{"experiment": e, "run": r} for e, r in pairs[:12]]


def profile_viscometer(path: Path) -> dict:
    pf = pq.ParquetFile(path)
    names = pf.schema_arrow.names
    ids = identify_fields(names)
    selected = list(dict.fromkeys(["META_experiment", "META_run"] + ids["pressureMeasured"] + ids["timeLike"]))
    selected = [n for n in selected if n in names]

    cycle_pairs = set()
    numeric_counts = Counter()
    null_counts = Counter()
    min_vals = {}
    max_vals = {}
    first_values = {}
    positive_steps = {n: [] for n in ids["timeLike"] if n in names}
    previous_time = {n: None for n in positive_steps}

    for batch in pf.iter_batches(batch_size=131072, columns=selected):
        data = batch.to_pydict()
        if "META_experiment" in data and "META_run" in data:
            for e, r in zip(data["META_experiment"], data["META_run"]):
                if e is not None and r is not None:
                    cycle_pairs.add((str(e), str(r)))
        for name, vals in data.items():
            for v in vals:
                if v is None:
                    null_counts[name] += 1
                    continue
                if name not in first_values:
                    first_values[name] = v
                if finite(v):
                    x = float(v)
                    numeric_counts[name] += 1
                    min_vals[name] = x if name not in min_vals else min(min_vals[name], x)
                    max_vals[name] = x if name not in max_vals else max(max_vals[name], x)
                    if name in positive_steps:
                        prev = previous_time[name]
                        if prev is not None and x > prev and len(positive_steps[name]) < 100000:
                            positive_steps[name].append(x - prev)
                        previous_time[name] = x

    measured_columns = []
    for n in ids["measured"]:
        measured_columns.append({
            "name": n,
            "numericCount": int(numeric_counts.get(n, 0)),
            "nullCount": int(null_counts.get(n, 0)),
            "min": min_vals.get(n),
            "max": max_vals.get(n),
            "first": first_values.get(n),
        })
    time_columns = []
    for n in ids["timeLike"]:
        diffs = positive_steps.get(n) or []
        time_columns.append({
            "name": n,
            "numericCount": int(numeric_counts.get(n, 0)),
            "min": min_vals.get(n),
            "max": max_vals.get(n),
            "medianPositiveStep": statistics.median(diffs) if diffs else None,
            "sampledPositiveStepCount": len(diffs),
        })

    return {
        "rows": pf.metadata.num_rows,
        "columns": len(names),
        "rowGroups": pf.metadata.num_row_groups,
        "schema": [{"name": f.name, **arrow_type(f.type)} for f in pf.schema_arrow],
        "fieldClasses": ids,
        "cyclePairs": len(cycle_pairs),
        "cyclePairPreview": [{"experiment": e, "run": r} for e, r in sorted(cycle_pairs)[:12]],
        "measuredColumnStats": measured_columns,
        "timeColumnStats": time_columns,
        "candidateDirectPressureScalarSamples": int(sum(numeric_counts.get(n, 0) for n in ids["pressureMeasured"])),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="skz-loki-v1.json")
    ap.add_argument("--workdir", default=".skz-loki-profile-work")
    args = ap.parse_args()

    workdir = Path(args.workdir)
    workdir.mkdir(parents=True, exist_ok=True)
    local_paths = {}
    file_profiles = {}
    for key, spec in FILES.items():
        path = workdir / spec["name"]
        download(spec["name"], path)
        observed_md5 = digest(path, "md5")
        if observed_md5 != spec["md5"]:
            raise RuntimeError(f"{spec['name']} MD5 mismatch: {observed_md5} != {spec['md5']}")
        local_paths[key] = path
        file_profiles[key] = {
            "name": spec["name"],
            "sizeBytes": path.stat().st_size,
            "md5": observed_md5,
            "sha256": digest(path, "sha256"),
        }

    quality = profile_small_table(local_paths["quality"])
    machine = profile_small_table(local_paths["machine"])
    visco = profile_viscometer(local_paths["viscometer"])

    q_table = pq.read_table(local_paths["quality"])
    m_table = pq.read_table(local_paths["machine"])
    q_cycles, q_preview = unique_cycles_from_table(q_table)
    m_cycles, m_preview = unique_cycles_from_table(m_table)

    payload = {
        "schema_version": 1,
        "status": "profile-generated-review-required",
        "completed_date": "2026-08-28",
        "source": {
            "title": "Injection Molding Dataset (Viscometer, Euromap77, Quality Table)",
            "recordUrl": RECORD_URL,
            "recordId": RECORD_ID,
            "version": "v1",
            "publisher": "EUDAT B2SHARE",
            "datasetOpen": True,
            "license": None,
            "licenseBoundary": "The current B2SHARE record renders an empty License field. Open/downloadable status is not treated as permission to redistribute raw files.",
            "publishedDescriptionMd5": "7ea331b2f4cda398698fe6da74dccab0",
        },
        "experimentalContext": {
            "organization": "SKZ German Plastics Center, Würzburg",
            "project": "LoKI",
            "machine": "KraussMaffei 160-750PX",
            "viscometer": "Dynisco MDT465FXL-1/2-2M-A at the injection nozzle",
            "material": {"family": "ABS", "grade": "Terluran GP-35", "manufacturer": "INEOS Styrolution Europe GmbH"},
            "publishedCycles": 68,
            "uniqueMachineSettings": 17,
            "repeatsPerSetting": 4,
            "joinKeys": ["META_experiment", "META_run"],
            "sourceNamingConvention": {"META_*": "metadata", "SET_*": "configured set parameters", "MEAS_*": "recorded measured data"},
        },
        "files": file_profiles,
        "qualityTable": {**quality, "uniqueCycles": q_cycles, "cyclePreview": q_preview, "fieldClasses": identify_fields([f["name"] for f in quality["fields"]])},
        "machineAndEuromap77": {**machine, "uniqueCycles": m_cycles, "cyclePreview": m_preview, "fieldClasses": identify_fields([f["name"] for f in machine["fields"]])},
        "viscometerPressure": visco,
        "reconciliation": {
            "qualityCycleCountMatchesPublished": q_cycles == 68,
            "machineCycleCountMatchesPublished": m_cycles == 68,
            "viscometerCycleCountMatchesPublished": visco["cyclePairs"] == 68,
            "allThreeSubdatasetsJoinOnSameCycleCardinality": q_cycles == m_cycles == visco["cyclePairs"] == 68,
        },
        "acceptedMeasuredCycles": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "redistributionAllowed": False,
        "boundary": "This exact-file profile verifies the three publisher Parquet files and source checksums, reconciles their cycle identifiers and distinguishes source-declared SET_* commands from MEAS_* measurements. The package is not promoted and pressure samples are not counted until the actual schema confirms the direct physical pressure fields, time basis and units and the current blank licence field is retained as a redistribution limitation.",
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "files": file_profiles,
        "quality": {"rows": quality["rows"], "cols": quality["columns"], "cycles": q_cycles},
        "machine": {"rows": machine["rows"], "cols": machine["columns"], "cycles": m_cycles},
        "viscometer": {
            "rows": visco["rows"],
            "cols": visco["columns"],
            "cycles": visco["cyclePairs"],
            "fieldClasses": visco["fieldClasses"],
            "timeColumns": visco["timeColumnStats"],
            "candidatePressureSamples": visco["candidateDirectPressureScalarSamples"],
        },
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
