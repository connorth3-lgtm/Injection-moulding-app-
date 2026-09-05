#!/usr/bin/env python3
"""Retrieve pinned AVAPS Dataset 1 and emit bounded source/unit diagnostics.

The proof verifies the exact archive, delivered timing, pressure same-scale agreement and
published flow perturbation consistency. Quality means are compared across source-defined
waveform intersections instead of choosing rows merely because they match the paper.
No raw third-party rows or full traces are retained.
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
from collections import Counter
from pathlib import Path

URL = "https://raw.githubusercontent.com/sc4t1m/scatimdata/7bd35941d75c97a3f276439377dc430ab47402be/dataset1.zip"
EXPECTED_SHA256 = "f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09"
SCALAR_MEMBER = "dataset1/ds1_scalar_and_quality.csv"
PRESSURE_MEMBER = "dataset1/ds1_timeseries_injectionpressure.csv"
FLOW_MEMBER = "dataset1/ds1_timeseries_injectionflow.csv"
EXPECTED_TIME_SERIES_POINTS = 2048
PAPER_SAMPLE_INTERVAL_S = 0.006
PAPER_WEIGHT_MEAN_G = 58.92
PAPER_DISTANCE_A_MEAN_MM = 84.9372
FLOW_PERTURBATION_WINDOWS = {
    "minus10pct": {"start": 324, "end": 384, "multiplier": 0.90, "paperLabel": "-10%"},
    "plus10pct_nonoverlap": {"start": 385, "end": 457, "multiplier": 1.10, "paperLabel": "+10%"},
    "plus20pct_nonoverlap": {"start": 468, "end": 528, "multiplier": 1.20, "paperLabel": "+20%"},
}


def as_float(value: str) -> float | None:
    text = str(value).strip().replace("\u00a0", "")
    if not text:
        return None
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    try:
        number = float(text)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def cycle_number(value: str) -> int | None:
    text = str(value).strip()
    if not text:
        return None
    try:
        number = int(float(text.replace(",", ".")))
    except ValueError:
        return None
    return number if number > 0 else None


def parse_csv(payload: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(payload.decode("utf-8-sig"))))


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
    times: list[float] = []
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
            maxima[i] = max(maxima[i], value)
    if len(times) != EXPECTED_TIME_SERIES_POINTS:
        raise RuntimeError(f"AVAPS {label} point-count drift: {len(times)}")
    if not all(a < b for a, b in zip(times, times[1:])):
        raise RuntimeError(f"AVAPS {label} time coordinate is not strictly increasing")
    if any(count != EXPECTED_TIME_SERIES_POINTS for count in numeric_counts):
        bad = sum(count != EXPECTED_TIME_SERIES_POINTS for count in numeric_counts)
        raise RuntimeError(f"AVAPS {label} has {bad} incomplete cycle columns")
    deltas = [b-a for a,b in zip(times,times[1:])]
    median_interval = statistics.median(deltas)
    if abs(median_interval-PAPER_SAMPLE_INTERVAL_S) > 1e-9:
        raise RuntimeError(f"AVAPS {label} median sample interval drift: {median_interval}")
    if min(deltas) < 0.003 or max(deltas) > 0.012:
        raise RuntimeError(f"AVAPS {label} delivered timing contains an unexpected interval range")
    counts = Counter(round(delta, 9) for delta in deltas)
    finite_maxima = [value for value in maxima if math.isfinite(value)]
    return {
        "cycleIds": cycle_ids,
        "maxima": maxima,
        "cycleSeriesCount": len(cycle_ids),
        "pointsPerSeries": len(times),
        "timeStartS": times[0],
        "timeEndS": times[-1],
        "paperReportedSampleIntervalS": PAPER_SAMPLE_INTERVAL_S,
        "deliveredMedianSampleIntervalS": median_interval,
        "deliveredMinimumSampleIntervalS": min(deltas),
        "deliveredMaximumSampleIntervalS": max(deltas),
        "deliveredSampleIntervalCounts": {str(key): counts[key] for key in sorted(counts)},
        "timeCoordinatePolicy": "Preserve delivered strictly increasing time values; do not synthesize a uniform 6 ms axis.",
        "globalMinimumOfCycleMaxima": min(finite_maxima),
        "globalMaximumOfCycleMaxima": max(finite_maxima),
        "medianOfCycleMaxima": statistics.median(finite_maxima),
    }


def quality_subset_summary(records: list[dict], name: str) -> dict:
    weights = [r["weight"] for r in records if r["weight"] is not None]
    distances = [r["distanceA"] for r in records if r["distanceA"] is not None]
    both = [r for r in records if r["weight"] is not None and r["distanceA"] is not None]
    out = {
        "name": name,
        "records": len(records),
        "weightNumericRecords": len(weights),
        "distanceNumericRecords": len(distances),
        "completeQualityRecords": len(both),
    }
    if weights:
        mean = statistics.fmean(weights)
        out.update({
            "weightMeanDelivered": mean,
            "weightPaperMeanG": PAPER_WEIGHT_MEAN_G,
            "weightMeanDifferenceFromPaper": mean-PAPER_WEIGHT_MEAN_G,
        })
    if distances:
        raw_mean = statistics.fmean(distances)
        scaled = raw_mean/1000.0
        out.update({
            "distanceRawMean": raw_mean,
            "distanceMeanIfDividedBy1000Mm": scaled,
            "distancePaperMeanMm": PAPER_DISTANCE_A_MEAN_MM,
            "distanceScaledMeanDifferenceFromPaperMm": scaled-PAPER_DISTANCE_A_MEAN_MM,
        })
    return out


def scalar_profiles(rows: list[list[str]], pressure_cycle_ids: set[str], flow_cycle_ids: set[str]) -> tuple[dict[str, float], dict]:
    if not rows:
        raise RuntimeError("AVAPS scalar table is empty")
    header = rows[0]
    required = ["cycle_counter", "maximaler_spritzdruck", "weight", "distanceA"]
    missing = [name for name in required if name not in header]
    if missing:
        raise RuntimeError(f"AVAPS scalar header drift: {missing}")
    idx = {name: header.index(name) for name in required}
    records: list[dict] = []
    pressure_map: dict[str, float] = {}
    duplicate_cycles = 0
    for row in rows[1:]:
        if max(idx.values()) >= len(row):
            continue
        cycle = row[idx["cycle_counter"]].strip()
        if not cycle:
            continue
        record = {
            "cycle": cycle,
            "pressure": as_float(row[idx["maximaler_spritzdruck"]]),
            "weight": as_float(row[idx["weight"]]),
            "distanceA": as_float(row[idx["distanceA"]]),
        }
        records.append(record)
        if record["pressure"] is not None:
            if cycle in pressure_map:
                duplicate_cycles += 1
            else:
                pressure_map[cycle] = record["pressure"]
    if not records or not pressure_map:
        raise RuntimeError("AVAPS scalar table lacks source records/pressure evidence")
    pressure_linked = [r for r in records if r["cycle"] in pressure_cycle_ids]
    flow_linked = [r for r in records if r["cycle"] in flow_cycle_ids]
    both_waveforms = [r for r in records if r["cycle"] in pressure_cycle_ids and r["cycle"] in flow_cycle_ids]
    pressure_plus_scalar = [r for r in pressure_linked if r["pressure"] is not None]
    complete_pressure_linked = [r for r in pressure_linked if r["pressure"] is not None and r["weight"] is not None and r["distanceA"] is not None]
    return pressure_map, {
        "scalarRecordCount": len(records),
        "numericScalarMaxPressureRecords": len(pressure_map),
        "duplicateCycleCountersIgnored": duplicate_cycles,
        "sourceDefinedQualitySubsets": [
            quality_subset_summary(records, "all-scalar-records"),
            quality_subset_summary(pressure_linked, "pressure-waveform-linked"),
            quality_subset_summary(flow_linked, "flow-waveform-linked"),
            quality_subset_summary(both_waveforms, "both-waveforms-linked"),
            quality_subset_summary(pressure_plus_scalar, "pressure-waveform-plus-scalar-pressure"),
            quality_subset_summary(complete_pressure_linked, "pressure-linked-complete-quality"),
        ],
        "qualityDecisionBoundary": "Paper aggregate means are diagnostics, not row-selection criteria. A learner unit/transform decision must be supported by a source-defined subset and documented transformation, not by cherry-picking rows to fit the target mean.",
    }


def pressure_peak_agreement(scalar: dict[str, float], pressure: dict) -> dict:
    pairs=[]
    for cycle, peak in zip(pressure["cycleIds"], pressure["maxima"]):
        if cycle in scalar and math.isfinite(peak):
            pairs.append((cycle, scalar[cycle], peak))
    if not pairs:
        raise RuntimeError("AVAPS pressure waveform has no cycles linked to scalar max-pressure records")
    abs_errors=[abs(s-p) for _,s,p in pairs]
    rel_errors=[abs(s-p)/max(abs(s),1e-12) for _,s,p in pairs]
    ratios=[p/s for _,s,p in pairs if s != 0]
    median_rel = statistics.median(rel_errors)
    max_rel = max(rel_errors)
    median_ratio = statistics.median(ratios)
    if median_rel > 0.01 or max_rel > 0.05 or abs(median_ratio-1.0) > 0.01:
        raise RuntimeError(f"AVAPS pressure waveform not on scalar pressure scale: medianRel={median_rel}, maxRel={max_rel}, ratio={median_ratio}")
    relative_thresholds=(0.001,0.0025,0.005,0.01,0.02)
    return {
        "linkedCycleCount":len(pairs),
        "medianAbsoluteDifference":statistics.median(abs_errors),
        "maximumAbsoluteDifference":max(abs_errors),
        "medianRelativeDifference":median_rel,
        "maximumRelativeDifference":max_rel,
        "medianWaveformToScalarRatio":median_ratio,
        "matchFractionsByRelativeTolerance":{str(t):sum(error<=t for error in rel_errors)/len(rel_errors) for t in relative_thresholds},
        "relationship":"Compare waveform cycle maximum with maximaler_spritzdruck for the same cycle without scaling/interpolation/unit conversion.",
        "scaleDecision":"same numerical engineering scale supported; exact value identity is not asserted",
    }


def flow_perturbation_consistency(flow: dict) -> dict:
    by_cycle={}
    for cycle_id, peak in zip(flow["cycleIds"], flow["maxima"]):
        number=cycle_number(cycle_id)
        if number is not None and math.isfinite(peak):
            by_cycle[number]=float(peak)
    windows={}
    inferred_baselines=[]
    for key,spec in FLOW_PERTURBATION_WINDOWS.items():
        values=[by_cycle[n] for n in range(spec["start"],spec["end"]+1) if n in by_cycle]
        if not values:
            raise RuntimeError(f"AVAPS flow perturbation window {key} contains no delivered waveform cycles")
        median_peak=statistics.median(values)
        inferred_baseline=median_peak/spec["multiplier"]
        inferred_baselines.append(inferred_baseline)
        windows[key]={
            "paperLabel":spec["paperLabel"], "paperMultiplier":spec["multiplier"],
            "nonOverlappingCycleStart":spec["start"], "nonOverlappingCycleEnd":spec["end"],
            "deliveredCycleCount":len(values), "medianWaveformPeak":median_peak,
            "minimumWaveformPeak":min(values), "maximumWaveformPeak":max(values),
            "impliedUnperturbedBaseline":inferred_baseline,
        }
    baseline_mean=statistics.fmean(inferred_baselines)
    return {
        "publishedTable":"doi:10.3390/polym15040978 Table 1",
        "publishedOverlapHandling":"Printed +10%/+20% ranges overlap at cycles 458-467; those cycles are excluded rather than assigned arbitrarily.",
        "windows":windows,
        "meanImpliedUnperturbedBaseline":baseline_mean,
        "coefficientOfVariationAcrossImpliedBaselines":statistics.pstdev(inferred_baselines)/abs(baseline_mean),
        "normalizedMedianPeaksUsingMeanImpliedBaseline":{key:entry["medianWaveformPeak"]/baseline_mean for key,entry in windows.items()},
        "interpretationBoundary":"Relative perturbation consistency supports flow-quantity identity on a source scale; it does not alone establish the engineering unit.",
    }


def main() -> int:
    out_dir=Path("measured-source-proof"); out_dir.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".zip",delete=True) as tmp:
        with urllib.request.urlopen(URL,timeout=90) as response:
            while True:
                chunk=response.read(1024*1024)
                if not chunk: break
                tmp.write(chunk)
        tmp.flush(); tmp.seek(0); digest=hashlib.sha256(tmp.read()).hexdigest()
        if digest != EXPECTED_SHA256: raise SystemExit(f"AVAPS dataset1 SHA mismatch: {digest}")
        tmp.seek(0)
        with zipfile.ZipFile(tmp) as archive:
            required={SCALAR_MEMBER,PRESSURE_MEMBER,FLOW_MEMBER}; missing=sorted(required-set(archive.namelist()))
            if missing: raise SystemExit(f"AVAPS required archive members missing: {missing}")
            members=[]
            for info in archive.infolist():
                item={"name":info.filename,"sizeBytes":info.file_size,"compressedBytes":info.compress_size}
                if not info.is_dir() and info.filename.lower().endswith(('.csv','.txt')):
                    raw=archive.read(info.filename)[:65536]
                    item["firstRows"]=list(csv.reader(io.StringIO(raw.decode('utf-8-sig',errors='replace'))))[:3]
                members.append(item)
            scalar_rows=parse_csv(archive.read(SCALAR_MEMBER)); pressure_rows=parse_csv(archive.read(PRESSURE_MEMBER)); flow_rows=parse_csv(archive.read(FLOW_MEMBER))

    pressure=waveform_profile(pressure_rows,"injection-pressure")
    flow=waveform_profile(flow_rows,"injection-flow")
    scalar_map,scalar_stats=scalar_profiles(scalar_rows,set(pressure["cycleIds"]),set(flow["cycleIds"]))
    pressure_agreement=pressure_peak_agreement(scalar_map,pressure)
    flow_consistency=flow_perturbation_consistency(flow)
    pressure_summary={k:v for k,v in pressure.items() if k not in {"cycleIds","maxima"}}
    flow_summary={k:v for k,v in flow.items() if k not in {"cycleIds","maxima"}}
    proof={
        "schemaVersion":5,"status":"source-proof-passed-with-unit-diagnostics","datasetId":"scatimdata-avaps",
        "sourceArtifact":"dataset1.zip","url":URL,"sha256":"sha256:"+digest,"members":members,"rawSourceRetained":False,
        "scalarProfile":scalar_stats,"pressureWaveformProfile":pressure_summary,"flowWaveformProfile":flow_summary,
        "pressurePeakScalarAgreement":pressure_agreement,"flowPerturbationConsistency":flow_consistency,
        "unitEvidenceContext":{
            "peerReviewedDatasetPaper":"doi:10.3390/polym15040978",
            "paperReportedDataset1WeightMeanG":PAPER_WEIGHT_MEAN_G,
            "paperReportedDataset1DistanceAMeanMm":PAPER_DISTANCE_A_MEAN_MM,
            "machineQuantityConventionReference":"doi:10.3390/polym16010054",
            "machineQuantityConvention":"Arburg Allrounder 520 E engineering data reports injection pressure in bar and injection flow rate in cm3/s.",
            "decisionBoundary":"Pressure has a same-cycle scale cross-check. Quality fields are diagnosed on source-defined intersections. Flow has perturbation consistency but no independent scalar absolute-scale channel in Dataset 1."
        },
        "boundary":"Diagnostic source proof only. AVAPS promotion readiness remains fail-closed until channel-level unit/transform decisions are explicitly governed; no learner case, recipe or causal diagnosis is authorized here."
    }
    (out_dir/'avaps-dataset1-source-proof.json').write_text(json.dumps(proof,indent=2)+"\n",encoding='utf-8')
    print(json.dumps({
        "status":proof["status"],"datasetId":proof["datasetId"],"sha256":proof["sha256"],
        "pressureLinkedCycles":pressure_agreement["linkedCycleCount"],
        "pressureMedianRelativeDifference":pressure_agreement["medianRelativeDifference"],
        "pressureMaximumRelativeDifference":pressure_agreement["maximumRelativeDifference"],
        "pressureMedianWaveformToScalarRatio":pressure_agreement["medianWaveformToScalarRatio"],
        "qualitySubsets":scalar_stats["sourceDefinedQualitySubsets"],
        "flowImpliedBaselineCV":flow_consistency["coefficientOfVariationAcrossImpliedBaselines"],
        "flowNormalizedMedians":flow_consistency["normalizedMedianPeaksUsingMeanImpliedBaseline"],
        "pressureTimeDeltaRange":[pressure_summary["deliveredMinimumSampleIntervalS"],pressure_summary["deliveredMaximumSampleIntervalS"]],
    },separators=(',',':')))
    return 0

if __name__=='__main__': raise SystemExit(main())
