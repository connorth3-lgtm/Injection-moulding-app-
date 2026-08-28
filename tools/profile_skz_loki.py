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
UA = "MouldMaster-SKZ-LoKI-profiler/1.1"

FILES = {
    "quality": {"name": "quality_table_data.parquet", "md5": "4078fb85d2586bc3dd03d4a0825ff74d"},
    "machine": {"name": "set_parameter_and_EM77_data.parquet", "md5": "384b1ee87679fa4b52b78e842a83cd99"},
    "viscometer": {"name": "viscometer_pressure_data.parquet", "md5": "d37a69bacfbdbe5d7bac9339dfdd94be"},
}

DIRECT_PRESSURE_FIELDS = [
    "MEAS_pressure_frontsensor_bar",
    "MEAS_pressure_backsensor_bar",
]
DERIVED_PRESSURE_FIELDS = ["MEAS_pressure_difference_bar"]


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


def identify_fields(names: list[str]) -> dict:
    lower = {n: n.lower() for n in names}
    pressure = [n for n in names if n.startswith("MEAS_") and "press" in lower[n]]
    direct = [n for n in pressure if n in DIRECT_PRESSURE_FIELDS]
    derived = [n for n in pressure if n in DERIVED_PRESSURE_FIELDS or "difference" in lower[n]]
    return {
        "metadata": [n for n in names if n.startswith("META_")],
        "setParameters": [n for n in names if n.startswith("SET_")],
        "measured": [n for n in names if n.startswith("MEAS_")],
        "pressureMeasured": pressure,
        "directPressureMeasured": direct,
        "derivedPressure": derived,
        "timeLike": [n for n in names if any(k in lower[n] for k in ("time", "timestamp", "elapsed"))],
        "qualityLike": [n for n in names if any(k in lower[n] for k in ("quality", "weight", "mass", "dimension", "label", "defect"))],
    }


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
        "fieldClasses": identify_fields(table.schema.names),
    }


def cycle_pairs_from_table(table: pa.Table) -> list[tuple[str, str]]:
    names = table.schema.names
    if "META_experiment" not in names or "META_run" not in names:
        return []
    exps = table["META_experiment"].to_pylist()
    runs = table["META_run"].to_pylist()
    return sorted({(str(e), str(r)) for e, r in zip(exps, runs) if e is not None and r is not None})


def profile_viscometer(path: Path) -> dict:
    pf = pq.ParquetFile(path)
    names = pf.schema_arrow.names
    ids = identify_fields(names)
    selected = list(dict.fromkeys(["META_experiment", "META_run"] + ids["pressureMeasured"] + ids["timeLike"]))
    selected = [n for n in selected if n in names]

    cycle_pairs = set()
    rows_by_cycle = Counter()
    time_min_by_cycle = {}
    time_max_by_cycle = {}
    numeric_counts = Counter()
    null_counts = Counter()
    min_vals = {}
    max_vals = {}
    first_values = {}
    positive_steps = {n: [] for n in ids["timeLike"] if n in names}
    previous_time = {n: None for n in positive_steps}
    primary_time = ids["timeLike"][0] if ids["timeLike"] else None

    for batch in pf.iter_batches(batch_size=131072, columns=selected):
        data = batch.to_pydict()
        exps = data.get("META_experiment")
        runs = data.get("META_run")
        times = data.get(primary_time) if primary_time else None
        if exps is not None and runs is not None:
            if times is None:
                times = [None] * len(exps)
            for e, r, t in zip(exps, runs, times):
                if e is None or r is None:
                    continue
                key = (str(e), str(r))
                cycle_pairs.add(key)
                rows_by_cycle[key] += 1
                if finite(t):
                    x = float(t)
                    time_min_by_cycle[key] = x if key not in time_min_by_cycle else min(time_min_by_cycle[key], x)
                    time_max_by_cycle[key] = x if key not in time_max_by_cycle else max(time_max_by_cycle[key], x)

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
            "classification": "direct-physical-pressure" if n in ids["directPressureMeasured"] else ("derived-pressure-difference" if n in ids["derivedPressure"] else "measured-other"),
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
            "estimatedRateIfSecondsHz": (1 / statistics.median(diffs)) if diffs and statistics.median(diffs) > 0 else None,
            "sampledPositiveStepCount": len(diffs),
        })

    cycle_rows = sorted(rows_by_cycle.values())
    cycle_details = []
    for key in sorted(cycle_pairs):
        cycle_details.append({
            "experiment": key[0],
            "run": key[1],
            "rows": rows_by_cycle[key],
            "timeMin": time_min_by_cycle.get(key),
            "timeMax": time_max_by_cycle.get(key),
        })

    return {
        "rows": pf.metadata.num_rows,
        "columns": len(names),
        "rowGroups": pf.metadata.num_row_groups,
        "schema": [{"name": f.name, **arrow_type(f.type)} for f in pf.schema_arrow],
        "fieldClasses": ids,
        "cyclePairs": len(cycle_pairs),
        "cyclePairsAll": [{"experiment": e, "run": r} for e, r in sorted(cycle_pairs)],
        "rowsPerPressureCycle": {
            "min": min(cycle_rows) if cycle_rows else 0,
            "median": statistics.median(cycle_rows) if cycle_rows else 0,
            "max": max(cycle_rows) if cycle_rows else 0,
            "distinct": sorted(set(cycle_rows)),
        },
        "cycleDetails": cycle_details,
        "measuredColumnStats": measured_columns,
        "timeColumnStats": time_columns,
        "candidateDirectPhysicalPressureSamples": int(sum(numeric_counts.get(n, 0) for n in ids["directPressureMeasured"])),
        "derivedPressureDifferenceValues": int(sum(numeric_counts.get(n, 0) for n in ids["derivedPressure"])),
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

    q_pairs = cycle_pairs_from_table(pq.read_table(local_paths["quality"]))
    m_pairs = cycle_pairs_from_table(pq.read_table(local_paths["machine"]))
    v_pairs = {(p["experiment"], p["run"]) for p in visco["cyclePairsAll"]}
    expected_pairs = set(m_pairs)
    missing_pressure = sorted(expected_pairs - v_pairs)
    unexpected_pressure = sorted(v_pairs - expected_pairs)

    payload = {
        "schema_version": 2,
        "status": "profile-generated-review-required",
        "completed_date": "2026-08-28",
        "source": {
            "title": "Injection Molding Dataset (Viscometer, Euromap77, Quality Table)",
            "recordUrl": RECORD_URL,
            "recordId": RECORD_ID,
            "doi": "10.23728/b2share.d8502ea56c544e069ebda44c3edd441b",
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
        "qualityTable": {**quality, "uniqueCycles": len(q_pairs), "cyclePairsAll": [{"experiment": e, "run": r} for e, r in q_pairs]},
        "machineAndEuromap77": {**machine, "uniqueCycles": len(m_pairs), "cyclePairsAll": [{"experiment": e, "run": r} for e, r in m_pairs]},
        "viscometerPressure": visco,
        "publishedVsObserved": {
            "descriptionQualityRows": 68,
            "observedQualityRows": quality["rows"],
            "descriptionMachineRows": 68,
            "descriptionMachineColumns": 34,
            "observedMachineRows": machine["rows"],
            "observedMachineColumns": machine["columns"],
            "descriptionViscometerRows": 1048575,
            "descriptionViscometerColumns": 6,
            "observedViscometerRows": visco["rows"],
            "observedViscometerColumns": visco["columns"],
            "descriptionPressureCyclesImplied": 68,
            "observedPressureCycles": visco["cyclePairs"],
            "descriptionTimeField": "MEAS_time_s",
            "observedTimeField": visco["fieldClasses"]["timeLike"],
            "note": "The publisher-description PDF and the publisher-hosted Parquet disagree on pressure-table row count, pressure-cycle coverage and time-field name. The exact Parquet matches the checksum displayed on the current B2SHARE record, so MouldMaster preserves the discrepancy instead of rewriting the data to the PDF description.",
        },
        "reconciliation": {
            "qualityCycleCountMatchesPublished": len(q_pairs) == 68,
            "machineCycleCountMatchesPublished": len(m_pairs) == 68,
            "pressureCyclesObserved": visco["cyclePairs"],
            "pressureCyclesMissingFromMachineTable": [{"experiment": e, "run": r} for e, r in missing_pressure],
            "unexpectedPressureCycles": [{"experiment": e, "run": r} for e, r in unexpected_pressure],
            "pressureCoverageFraction": visco["cyclePairs"] / len(m_pairs) if m_pairs else None,
        },
        "candidateMeasuredCycles": 68,
        "candidateCyclesWithPressureTimeSeries": visco["cyclePairs"],
        "candidateMeasuredTimeSeriesSamples": visco["candidateDirectPhysicalPressureSamples"],
        "acceptedMeasuredCycles": 0,
        "acceptedMeasuredTimeSeriesSamples": 0,
        "rawSourceRowsCommitted": False,
        "redistributionAllowed": False,
        "boundary": "This exact-file profile verifies all three publisher Parquet files against B2SHARE-displayed MD5 values. The scalar machine and quality tables cover 68 cycles; the exact pressure Parquet covers 60 of those cycles and contains 18,000,000 rows. Only front- and back-sensor pressure are candidate direct physical samples; the pressure-difference field is derived and time is an axis. Promotion is separate from this discovery profile, and raw files are not redistributed because the current record's License field is blank.",
    }
    Path(args.output).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "files": file_profiles,
        "quality": {"rows": quality["rows"], "cols": quality["columns"], "cycles": len(q_pairs)},
        "machine": {"rows": machine["rows"], "cols": machine["columns"], "cycles": len(m_pairs)},
        "viscometer": {
            "rows": visco["rows"],
            "cols": visco["columns"],
            "cycles": visco["cyclePairs"],
            "rowsPerCycle": visco["rowsPerPressureCycle"],
            "fieldClasses": visco["fieldClasses"],
            "timeColumns": visco["timeColumnStats"],
            "directPhysicalPressureSamples": visco["candidateDirectPhysicalPressureSamples"],
            "derivedPressureDifferenceValues": visco["derivedPressureDifferenceValues"],
            "missingPressureCycles": [{"experiment": e, "run": r} for e, r in missing_pressure],
        },
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
