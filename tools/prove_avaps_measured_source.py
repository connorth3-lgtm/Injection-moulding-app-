#!/usr/bin/env python3
"""Retrieve pinned AVAPS dataset1 and emit a bounded unit/structure source proof.

No raw third-party rows are committed. The proof binds the exact public archive to the
peer-reviewed Dataset 1 description using source-native structure plus published aggregate
anchors. It quantifies pressure same-scale agreement and flow perturbation consistency;
it does not claim exact peak identity, invent a uniform time axis, infer root cause, or
turn numerical plausibility into an engineering-unit decision by itself.
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

# Table 1 of doi:10.3390/polym15040978 prints +10% as cycles 385-467 and
# +20% as 458-528, creating a ten-cycle overlap. This proof refuses to decide which
# label owns the overlap and uses only the unambiguous non-overlapping core windows.
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


def scalar_profiles(rows: list[list[str]]) -> tuple[dict[str, float], dict]:
    if not rows:
        raise RuntimeError("AVAPS scalar table is empty")
    header = rows[0]
    required = ["cycle_counter", "maximaler_spritzdruck", "weight", "distanceA"]
    missing = [name for name in required if name not in header]
    if missing:
        raise RuntimeError(f"AVAPS scalar header drift: {missing}")
    idx = {name: header.index(name) for name in required}
    pressure = {}
    weights = []
    distances = []
    duplicate_cycles = 0
    non_numeric_pressure = 0
    for row in rows[1:]:
        if max(idx.values()) >= len(row):
            continue
        cycle = row[idx["cycle_counter"]].strip()
        p = as_float(row[idx["maximaler_spritzdruck"]])
        w = as_float(row[idx["weight"]])
        d = as_float(row[idx["distanceA"]])
        if cycle and p is not None:
            if cycle in pressure:
                duplicate_cycles += 1
            else:
                pressure[cycle] = p
        else:
            non_numeric_pressure += 1
        if w is not None:
            weights.append(w)
        if d is not None:
            distances.append(d)
    if not pressure or not weights or not distances:
        raise RuntimeError("AVAPS scalar table lacks required numeric pressure/quality evidence")

    weight_mean = statistics.fmean(weights)
    weight_mean_error = abs(weight_mean - PAPER_WEIGHT_MEAN_G)
    if weight_mean_error > 0.05:
        raise RuntimeError(f"AVAPS Dataset 1 weight mean does not match paper anchor: {weight_mean}")

    raw_distance_mean = statistics.fmean(distances)
    scale_candidates = [1.0, 0.1, 0.01, 0.001, 0.0001]
    scored = sorted((abs(raw_distance_mean * factor - PAPER_DISTANCE_A_MEAN_MM), factor) for factor in scale_candidates)
    best_error, best_factor = scored[0]
    second_error = scored[1][0]
    if best_error > 0.02 or best_factor != 0.001 or second_error < best_error * 20:
        raise RuntimeError(
            f"AVAPS distanceA scale is not uniquely supported by paper mean: rawMean={raw_distance_mean}, best={best_factor}, error={best_error}"
        )

    return pressure, {
        "numericScalarMaxPressureRecords": len(pressure),
        "duplicateCycleCountersIgnored": duplicate_cycles,
        "nonNumericOrIncompleteScalarPressureRecords": non_numeric_pressure,
        "qualityAnchors": {
            "weight": {
                "numericRecords": len(weights),
                "deliveredMean": weight_mean,
                "paperMeanG": PAPER_WEIGHT_MEAN_G,
                "absoluteMeanDifferenceG": weight_mean_error,
                "unitDecision": "g",
                "evidence": "Delivered values are on the same numerical scale as the peer-reviewed Dataset 1 mean part weight."
            },
            "distanceA": {
                "numericRecords": len(distances),
                "deliveredRawMean": raw_distance_mean,
                "paperMeanMm": PAPER_DISTANCE_A_MEAN_MM,
                "sourceToMmScaleFactor": best_factor,
                "scaledMeanMm": raw_distance_mean * best_factor,
                "absoluteMeanDifferenceMm": best_error,
                "unitDecision": "mm after deterministic divide-by-1000 transform",
                "evidence": "The 1/1000 scale is uniquely selected from decimal engineering-scale candidates by the published Dataset 1 Distance A mean."
            },
        },
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
    median_interval = statistics.median(deltas)
    if abs(median_interval-PAPER_SAMPLE_INTERVAL_S) > 1e-9:
        raise RuntimeError(f"AVAPS {label} median sample interval drift: {median_interval}")
    rounded_delta_counts = Counter(round(delta, 9) for delta in deltas)
    if min(deltas) < 0.003 or max(deltas) > 0.012:
        raise RuntimeError(f"AVAPS {label} delivered timing contains an unexpected interval range")
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
        "paperReportedSampleIntervalS": PAPER_SAMPLE_INTERVAL_S,
        "deliveredMedianSampleIntervalS": median_interval,
        "deliveredMinimumSampleIntervalS": min(deltas),
        "deliveredMaximumSampleIntervalS": max(deltas),
        "deliveredSampleIntervalCounts": {str(key): rounded_delta_counts[key] for key in sorted(rounded_delta_counts)},
        "timeCoordinatePolicy": "Preserve delivered strictly increasing time values. Do not replace quantized/jittered increments with a synthetic uniform 6 ms axis.",
        "globalMinimumOfCycleMaxima": min(finite_maxima),
        "globalMaximumOfCycleMaxima": max(finite_maxima),
        "medianOfCycleMaxima": statistics.median(finite_maxima),
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
        raise RuntimeError(
            f"AVAPS pressure waveform does not remain on the scalar max-pressure scale: medianRel={median_rel}, maxRel={max_rel}, ratio={median_ratio}"
        )
    absolute_thresholds=(1e-9,1e-6,1e-3,0.1,1.0)
    relative_thresholds=(0.001,0.0025,0.005,0.01,0.02)
    return {
        "linkedCycleCount":len(pairs),
        "scalarOnlyCycleCount":len(set(scalar)-{c for c,_,_ in pairs}),
        "waveformOnlyCycleCount":len(set(pressure["cycleIds"])-{c for c,_,_ in pairs}),
        "medianAbsoluteDifference":statistics.median(abs_errors),
        "maximumAbsoluteDifference":max(abs_errors),
        "medianRelativeDifference":median_rel,
        "maximumRelativeDifference":max_rel,
        "medianWaveformToScalarRatio":median_ratio,
        "matchCountsByAbsoluteTolerance":{str(t):sum(error<=t for error in abs_errors) for t in absolute_thresholds},
        "matchFractionsByAbsoluteTolerance":{str(t):sum(error<=t for error in abs_errors)/len(abs_errors) for t in absolute_thresholds},
        "matchFractionsByRelativeTolerance":{str(t):sum(error<=t for error in rel_errors)/len(rel_errors) for t in relative_thresholds},
        "relationship":"For each linked cycle, compare max(ds1_timeseries_injectionpressure) with ds1_scalar_and_quality.maximaler_spritzdruck. No scaling, interpolation or unit conversion is applied. Close agreement supports a shared source scale; exact identity is not asserted.",
        "scaleDecision":"same engineering scale supported: median relative peak difference <=1%, maximum <=5%, and median waveform/scalar ratio within 1% of unity"
    }


def flow_perturbation_consistency(flow: dict) -> dict:
    by_cycle={}
    invalid_cycle_headers=0
    for cycle_id, peak in zip(flow["cycleIds"], flow["maxima"]):
        number=cycle_number(cycle_id)
        if number is None or not math.isfinite(peak):
            invalid_cycle_headers += 1
            continue
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
            "paperLabel":spec["paperLabel"],
            "paperMultiplier":spec["multiplier"],
            "nonOverlappingCycleStart":spec["start"],
            "nonOverlappingCycleEnd":spec["end"],
            "deliveredCycleCount":len(values),
            "medianWaveformPeak":median_peak,
            "minimumWaveformPeak":min(values),
            "maximumWaveformPeak":max(values),
            "impliedUnperturbedBaseline":inferred_baseline,
        }
    baseline_mean=statistics.fmean(inferred_baselines)
    baseline_cv=statistics.pstdev(inferred_baselines)/abs(baseline_mean) if baseline_mean else None
    normalized={key:entry["medianWaveformPeak"]/baseline_mean for key,entry in windows.items()}
    return {
        "publishedTable":"doi:10.3390/polym15040978 Table 1",
        "publishedOverlapHandling":"The printed +10% and +20% ranges overlap at cycles 458-467. Those ten cycles are excluded from this check rather than assigned to either condition.",
        "invalidCycleHeadersExcluded":invalid_cycle_headers,
        "windows":windows,
        "meanImpliedUnperturbedBaseline":baseline_mean,
        "coefficientOfVariationAcrossImpliedBaselines":baseline_cv,
        "normalizedMedianPeaksUsingMeanImpliedBaseline":normalized,
        "interpretationBoundary":"Agreement with the paper's relative perturbations can show that the waveform represents the manipulated injection-flow quantity on a consistent source scale. It does not, by itself, establish the engineering unit."
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

    scalar_map,scalar_stats=scalar_profiles(scalar_rows)
    pressure=waveform_profile(pressure_rows,"injection-pressure")
    flow=waveform_profile(flow_rows,"injection-flow")
    pressure_agreement=pressure_peak_agreement(scalar_map,pressure)
    flow_consistency=flow_perturbation_consistency(flow)

    pressure_summary={k:v for k,v in pressure.items() if k not in {"cycleIds","maxima"}}
    flow_summary={k:v for k,v in flow.items() if k not in {"cycleIds","maxima"}}
    proof={
        "schemaVersion":4,"status":"source-proof-passed","datasetId":"scatimdata-avaps",
        "sourceArtifact":"dataset1.zip","url":URL,"sha256":"sha256:"+digest,
        "members":members,"rawSourceRetained":False,
        "scalarProfile":scalar_stats,
        "pressureWaveformProfile":pressure_summary,
        "flowWaveformProfile":flow_summary,
        "pressurePeakScalarAgreement":pressure_agreement,
        "flowPerturbationConsistency":flow_consistency,
        "unitEvidenceContext":{
            "peerReviewedDatasetPaper":"doi:10.3390/polym15040978",
            "datasetPaperEvidence":"AVAPS exports high-resolution injection-pressure and injection-flow curves directly from the standard Allrounder 520E 1500-800 machine control; Dataset 1 paper reports the flow perturbation schedule and quality anchors.",
            "machineQuantityConventionReference":"doi:10.3390/polym16010054",
            "machineQuantityConvention":"Arburg Allrounder 520 E engineering data reports injection pressure in bar and injection flow rate in cm3/s; the referenced machine has the same 1500 kN class and 45 mm screw as the AVAPS experiment.",
            "pressureDecision":"Pressure waveform is additionally tied to source maximaler_spritzdruck on a near-1:1 scale across linked Dataset 1 cycles.",
            "flowDecisionBoundary":"Flow is identified by the source and paper as the manipulated injection-flow quantity from the same machine control. Relative perturbation consistency is checked here, but Dataset 1 contains no independent scalar flow channel for a second absolute-scale cross-check."
        },
        "boundary":"Source proof only. No raw third-party rows or traces are retained. Scale-consistency metrics can inform a governed unit decision but do not authorize a learner case, production recipe or causal diagnosis."
    }
    path=out_dir/'avaps-dataset1-source-proof.json'
    path.write_text(json.dumps(proof,indent=2)+"\n",encoding='utf-8')
    print(json.dumps({
        "status":proof["status"],"datasetId":proof["datasetId"],"sha256":proof["sha256"],
        "memberCount":len(members),"pressureLinkedCycles":pressure_agreement["linkedCycleCount"],
        "pressureMedianRelativeDifference":pressure_agreement["medianRelativeDifference"],
        "pressureMaximumRelativeDifference":pressure_agreement["maximumRelativeDifference"],
        "pressureMedianWaveformToScalarRatio":pressure_agreement["medianWaveformToScalarRatio"],
        "pressureWithin1Pct":pressure_agreement["matchFractionsByRelativeTolerance"]["0.01"],
        "pressureWithin2Pct":pressure_agreement["matchFractionsByRelativeTolerance"]["0.02"],
        "weightMeanG":scalar_stats["qualityAnchors"]["weight"]["deliveredMean"],
        "distanceScaledMeanMm":scalar_stats["qualityAnchors"]["distanceA"]["scaledMeanMm"],
        "pressureCycleMaxRange":[pressure_summary["globalMinimumOfCycleMaxima"],pressure_summary["globalMaximumOfCycleMaxima"]],
        "flowCycleMaxRange":[flow_summary["globalMinimumOfCycleMaxima"],flow_summary["globalMaximumOfCycleMaxima"]],
        "flowImpliedBaseline":flow_consistency["meanImpliedUnperturbedBaseline"],
        "flowImpliedBaselineCV":flow_consistency["coefficientOfVariationAcrossImpliedBaselines"],
        "flowNormalizedMedians":flow_consistency["normalizedMedianPeaksUsingMeanImpliedBaseline"],
        "pressureTimeDeltaRange":[pressure_summary["deliveredMinimumSampleIntervalS"],pressure_summary["deliveredMaximumSampleIntervalS"]],
    },separators=(',',':')))
    return 0

if __name__=='__main__':
    raise SystemExit(main())
