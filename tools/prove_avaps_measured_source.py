#!/usr/bin/env python3
"""Retrieve pinned AVAPS dataset1 and emit a bounded unit/structure source proof.

No raw third-party rows are committed. In addition to exact archive/member structure,
this proof tests whether the delivered injection-pressure waveform peak is numerically
identical to the source scalar ``maximaler_spritzdruck`` for linked cycles. That relation
can establish a shared engineering scale without guessing from generic machine practice.
The flow waveform envelope is reported separately and is not, by itself, treated as unit
proof.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import statistics
import tempfile
import urllib.request
import zipfile
from pathlib import Path

URL = "https://raw.githubusercontent.com/sc4t1m/scatimdata/7bd35941d75c97a3f276439377dc430ab47402be/dataset1.zip"
EXPECTED_SHA256 = "f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09"
SCALAR_MEMBER = "dataset1/ds1_scalar_and_quality.csv"
PRESSURE_MEMBER = "dataset1/ds1_timeseries_injectionpressure.csv"
FLOW_MEMBER = "dataset1/ds1_timeseries_injectionflow.csv"
EXPECTED_TIME_SERIES_POINTS = 2048
PAPER_SAMPLE_INTERVAL_S = 0.006


def as_float(value: str) -> float | None:
    text = str(value).strip().replace("\u00a0", "")
    if not text:
        return None
    # Delivered dataset1 CSVs use decimal commas inside quoted CSV cells.
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    try:
        number = float(text)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def parse_csv(payload: bytes) -> list[list[str]]:
    text = payload.decode("utf-8-sig")
    return list(csv.reader(io.StringIO(text)))


def scalar_pressure_map(rows: list[list[str]]) -> tuple[dict[str, float], dict]:
    if not rows:
        raise RuntimeError("AVAPS scalar table is empty")
    header = rows[0]
    required = ["cycle_counter", "maximaler_spritzdruck"]
    missing = [name for name in required if name not in header]
    if missing:
        raise RuntimeError(f"AVAPS scalar header drift: {missing}")
    cycle_idx = header.index("cycle_counter")
    pressure_idx = header.index("maximaler_spritzdruck")
    result = {}
    duplicate_cycles = 0
    non_numeric = 0
    for row in rows[1:]:
        if max(cycle_idx, pressure_idx) >= len(row):
            continue
        cycle = row[cycle_idx].strip()
        value = as_float(row[pressure_idx])
        if not cycle or value is None:
            non_numeric += 1
            continue
        if cycle in result:
            duplicate_cycles += 1
            continue
        result[cycle] = value
    if not result:
        raise RuntimeError("AVAPS scalar table exposes no numeric max-pressure records")
    return result, {
        "numericScalarMaxPressureRecords": len(result),
        "duplicateCycleCountersIgnored": duplicate_cycles,
        "nonNumericOrIncompleteScalarRecords": non_numeric,
    }


def waveform_profile(rows: list[list[str]], label: str) -> dict:
    if len(rows) < 3:
        raise RuntimeError(f"AVAPS {label} waveform table is too short")
    header = rows[0]
    if not header or header[0].strip().lower() != "time":
        raise RuntimeError(f"AVAPS {label} waveform first column must be time")
    cycle_ids = [cell.strip() for cell in header[1:]]
    if not cycle_ids or len(cycle_ids) != len(set(cycle_ids)):
        raise RuntimeError(f"AVAPS {label} waveform cycle headers are missing or duplicated")
    maxima = [-math.inf] * len(cycle_ids)
    numeric_counts = [0] * len(cycle_ids)
    times = []
    for row in rows[1:]:
        if not row:
            continue
        time_value = as_float(row[0])
        if time_value is None:
            continue
        times.append(time_value)
        for i, raw in enumerate(row[1:len(cycle_ids)+1]):
            value = as_float(raw)
            if value is None:
                continue
            numeric_counts[i] += 1
            if value > maxima[i]:
                maxima[i] = value
    if len(times) != EXPECTED_TIME_SERIES_POINTS:
        raise RuntimeError(f"AVAPS {label} point-count drift: {len(times)}")
    if not all(a < b for a, b in zip(times, times[1:])):
        raise RuntimeError(f"AVAPS {label} time coordinate is not strictly increasing")
    deltas = [b-a for a,b in zip(times,times[1:])]
    max_interval_error = max(abs(delta-PAPER_SAMPLE_INTERVAL_S) for delta in deltas)
    if max_interval_error > 1e-9:
        raise RuntimeError(f"AVAPS {label} sample interval drift: max error {max_interval_error}")
    if any(count != EXPECTED_TIME_SERIES_POINTS for count in numeric_counts):
        bad = sum(count != EXPECTED_TIME_SERIES_POINTS for count in numeric_counts)
        raise RuntimeError(f"AVAPS {label} has {bad} cycle columns without {EXPECTED_TIME_SERIES_POINTS} numeric samples")
    finite_maxima = [value for value in maxima if math.isfinite(value)]
    return {
        "cycleIds": cycle_ids,
        "maxima": maxima,
        "cycleSeriesCount": len(cycle_ids),
        "pointsPerSeries": len(times),
        "timeStartS": times[0],
        "timeEndS": times[-1],
        "sampleIntervalS": PAPER_SAMPLE_INTERVAL_S,
        "maxSampleIntervalErrorS": max_interval_error,
        "globalMinimumOfCycleMaxima": min(finite_maxima),
        "globalMaximumOfCycleMaxima": max(finite_maxima),
        "medianOfCycleMaxima": statistics.median(finite_maxima),
    }


def pressure_peak_equivalence(scalar: dict[str, float], pressure: dict) -> dict:
    pairs=[]
    for cycle, peak in zip(pressure["cycleIds"], pressure["maxima"]):
        if cycle in scalar and math.isfinite(peak):
            pairs.append((cycle, scalar[cycle], peak))
    if not pairs:
        raise RuntimeError("AVAPS pressure waveform has no cycles linked to scalar max-pressure records")
    abs_errors=[abs(s-p) for _,s,p in pairs]
    rel_errors=[abs(s-p)/max(abs(s),1e-12) for _,s,p in pairs]
    thresholds=(1e-9,1e-6,1e-3,0.1,1.0)
    return {
        "linkedCycleCount":len(pairs),
        "scalarOnlyCycleCount":len(set(scalar)-{c for c,_,_ in pairs}),
        "waveformOnlyCycleCount":len(set(pressure["cycleIds"])-{c for c,_,_ in pairs}),
        "medianAbsoluteDifference":statistics.median(abs_errors),
        "maximumAbsoluteDifference":max(abs_errors),
        "medianRelativeDifference":statistics.median(rel_errors),
        "maximumRelativeDifference":max(rel_errors),
        "matchCountsByAbsoluteTolerance":{str(t):sum(error<=t for error in abs_errors) for t in thresholds},
        "matchFractionsByAbsoluteTolerance":{str(t):sum(error<=t for error in abs_errors)/len(abs_errors) for t in thresholds},
        "relationship":"For each linked cycle, compare max(ds1_timeseries_injectionpressure) with ds1_scalar_and_quality.maximaler_spritzdruck. No scaling, interpolation or unit conversion is applied.",
    }


def main() -> int:
    out_dir = Path("measured-source-proof")
    out_dir.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=True) as tmp:
        with urllib.request.urlopen(URL, timeout=90) as response:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                tmp.write(chunk)
        tmp.flush(); tmp.seek(0)
        digest = hashlib.sha256(tmp.read()).hexdigest()
        if digest != EXPECTED_SHA256:
            raise SystemExit(f"AVAPS dataset1 SHA mismatch: {digest}")
        tmp.seek(0)
        with zipfile.ZipFile(tmp) as archive:
            names=set(archive.namelist())
            required={SCALAR_MEMBER,PRESSURE_MEMBER,FLOW_MEMBER}
            missing=sorted(required-names)
            if missing:
                raise SystemExit(f"AVAPS required archive members missing: {missing}")
            members=[]
            for info in archive.infolist():
                item={"name":info.filename,"sizeBytes":info.file_size,"compressedBytes":info.compress_size}
                lower=info.filename.lower()
                if not info.is_dir() and (lower.endswith('.csv') or lower.endswith('.txt')):
                    raw=archive.read(info.filename)[:65536]
                    text=raw.decode('utf-8-sig',errors='replace')
                    item["firstRows"]=list(csv.reader(io.StringIO(text)))[:3]
                members.append(item)
            scalar_rows=parse_csv(archive.read(SCALAR_MEMBER))
            pressure_rows=parse_csv(archive.read(PRESSURE_MEMBER))
            flow_rows=parse_csv(archive.read(FLOW_MEMBER))

    scalar_map,scalar_stats=scalar_pressure_map(scalar_rows)
    pressure=waveform_profile(pressure_rows,"injection-pressure")
    flow=waveform_profile(flow_rows,"injection-flow")
    pressure_equivalence=pressure_peak_equivalence(scalar_map,pressure)

    # Do not retain full source rows or per-cycle waveforms/maxima in the proof.
    pressure_summary={k:v for k,v in pressure.items() if k not in {"cycleIds","maxima"}}
    flow_summary={k:v for k,v in flow.items() if k not in {"cycleIds","maxima"}}
    proof={
        "schemaVersion":2,"status":"source-proof-passed","datasetId":"scatimdata-avaps",
        "sourceArtifact":"dataset1.zip","url":URL,"sha256":"sha256:"+digest,
        "members":members,"rawSourceRetained":False,
        "scalarMaxPressureProfile":scalar_stats,
        "pressureWaveformProfile":pressure_summary,
        "flowWaveformProfile":flow_summary,
        "pressurePeakScalarEquivalence":pressure_equivalence,
        "unitEvidenceContext":{
            "companionPaper":"doi:10.3390/polym15040978",
            "companionPaperMachine":"Arburg Allrounder 520E 1500-800; 45 mm screw; process data retrieved directly from machine control",
            "sameModelMachineSpecificationReference":"doi:10.3390/polym16010054",
            "sameModelSpecification":"Arburg Allrounder 520 E, 1500 kN, 45 mm screw; max injection pressure reported in bar and max injection flow rate reported in cm3/s",
            "decisionBoundary":"The same-model specification establishes engineering quantity conventions, but waveform-unit promotion still requires the delivered waveform scale to be tied to those quantities. Pressure peak/scalar equivalence is tested here; the flow envelope alone is only consistency evidence and does not by itself prove cm3/s."
        },
        "boundary":"Source proof only. No raw third-party rows or traces are retained. Pressure scale equivalence and flow envelope statistics do not authorize a learner case, production recipe or causal diagnosis."
    }
    path=out_dir/'avaps-dataset1-source-proof.json'
    path.write_text(json.dumps(proof,indent=2)+"\n",encoding='utf-8')
    print(json.dumps({
        "status":proof["status"],"datasetId":proof["datasetId"],"sha256":proof["sha256"],
        "memberCount":len(members),"pressureLinkedCycles":pressure_equivalence["linkedCycleCount"],
        "pressureMedianAbsDifference":pressure_equivalence["medianAbsoluteDifference"],
        "pressureMaxAbsDifference":pressure_equivalence["maximumAbsoluteDifference"],
        "pressureMatchFractionAt0.1":pressure_equivalence["matchFractionsByAbsoluteTolerance"]["0.1"],
        "pressureCycleMaxRange":[pressure_summary["globalMinimumOfCycleMaxima"],pressure_summary["globalMaximumOfCycleMaxima"]],
        "flowCycleMaxRange":[flow_summary["globalMinimumOfCycleMaxima"],flow_summary["globalMaximumOfCycleMaxima"]],
    },separators=(',',':')))
    return 0

if __name__=='__main__':
    raise SystemExit(main())
