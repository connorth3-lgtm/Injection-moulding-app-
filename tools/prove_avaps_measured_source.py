#!/usr/bin/env python3
"""Retrieve pinned AVAPS Dataset 1 and emit bounded source/unit diagnostics.

The proof verifies the exact archive, delivered timing, pressure same-scale agreement and
published flow perturbation consistency. Quality means are compared across source-defined
waveform intersections instead of choosing rows merely because they match the paper.
Paper perturbation cycle numbers are treated as 1-based experiment-sequence positions,
not as the machine cycle_counter identifiers delivered in the CSV headers.
No raw third-party rows or full traces are retained.
"""
from __future__ import annotations

import csv, hashlib, io, json, math, statistics, tempfile, urllib.request, zipfile
from collections import Counter
from pathlib import Path

URL="https://raw.githubusercontent.com/sc4t1m/scatimdata/7bd35941d75c97a3f276439377dc430ab47402be/dataset1.zip"
EXPECTED_SHA256="f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09"
SCALAR_MEMBER="dataset1/ds1_scalar_and_quality.csv"
PRESSURE_MEMBER="dataset1/ds1_timeseries_injectionpressure.csv"
FLOW_MEMBER="dataset1/ds1_timeseries_injectionflow.csv"
EXPECTED_TIME_SERIES_POINTS=2048
PAPER_SAMPLE_INTERVAL_S=0.006
PAPER_WEIGHT_MEAN_G=58.92
PAPER_DISTANCE_A_MEAN_MM=84.9372
FLOW_PERTURBATION_WINDOWS={
 "minus10pct":{"start":324,"end":384,"multiplier":0.90,"paperLabel":"-10%"},
 "plus10pct_nonoverlap":{"start":385,"end":457,"multiplier":1.10,"paperLabel":"+10%"},
 "plus20pct_nonoverlap":{"start":468,"end":528,"multiplier":1.20,"paperLabel":"+20%"},
}

def as_float(value):
    text=str(value).strip().replace("\u00a0","")
    if not text:return None
    if "," in text and "." not in text:text=text.replace(",",".")
    try:number=float(text)
    except ValueError:return None
    return number if math.isfinite(number) else None

def parse_csv(payload): return list(csv.reader(io.StringIO(payload.decode("utf-8-sig"))))

def waveform_profile(rows,label):
    if len(rows)<3: raise RuntimeError(f"AVAPS {label} waveform table is too short")
    header=rows[0]
    if not header or header[0].strip().lower()!="time": raise RuntimeError(f"AVAPS {label} waveform first column must be time")
    cycle_ids=[c.strip() for c in header[1:]]
    if not cycle_ids or len(cycle_ids)!=len(set(cycle_ids)): raise RuntimeError(f"AVAPS {label} waveform cycle headers are missing or duplicated")
    maxima=[-math.inf]*len(cycle_ids); numeric_counts=[0]*len(cycle_ids); times=[]
    for row in rows[1:]:
        if not row: continue
        t=as_float(row[0])
        if t is None: continue
        times.append(t)
        for i,raw in enumerate(row[1:len(cycle_ids)+1]):
            v=as_float(raw)
            if v is None: continue
            numeric_counts[i]+=1; maxima[i]=max(maxima[i],v)
    if len(times)!=EXPECTED_TIME_SERIES_POINTS: raise RuntimeError(f"AVAPS {label} point-count drift: {len(times)}")
    if not all(a<b for a,b in zip(times,times[1:])): raise RuntimeError(f"AVAPS {label} time coordinate is not strictly increasing")
    if any(c!=EXPECTED_TIME_SERIES_POINTS for c in numeric_counts): raise RuntimeError(f"AVAPS {label} contains incomplete cycle columns")
    deltas=[b-a for a,b in zip(times,times[1:])]; median_interval=statistics.median(deltas)
    if abs(median_interval-PAPER_SAMPLE_INTERVAL_S)>1e-9: raise RuntimeError(f"AVAPS {label} median sample interval drift: {median_interval}")
    if min(deltas)<0.003 or max(deltas)>0.012: raise RuntimeError(f"AVAPS {label} delivered timing contains an unexpected interval range")
    counts=Counter(round(d,9) for d in deltas); finite_maxima=[v for v in maxima if math.isfinite(v)]
    return {"cycleIds":cycle_ids,"maxima":maxima,"cycleSeriesCount":len(cycle_ids),"pointsPerSeries":len(times),
      "timeStartS":times[0],"timeEndS":times[-1],"paperReportedSampleIntervalS":PAPER_SAMPLE_INTERVAL_S,
      "deliveredMedianSampleIntervalS":median_interval,"deliveredMinimumSampleIntervalS":min(deltas),"deliveredMaximumSampleIntervalS":max(deltas),
      "deliveredSampleIntervalCounts":{str(k):counts[k] for k in sorted(counts)},
      "timeCoordinatePolicy":"Preserve delivered strictly increasing time values; do not synthesize a uniform 6 ms axis.",
      "globalMinimumOfCycleMaxima":min(finite_maxima),"globalMaximumOfCycleMaxima":max(finite_maxima),"medianOfCycleMaxima":statistics.median(finite_maxima)}

def quality_subset_summary(records,name):
    weights=[r["weight"] for r in records if r["weight"] is not None]; distances=[r["distanceA"] for r in records if r["distanceA"] is not None]
    both=[r for r in records if r["weight"] is not None and r["distanceA"] is not None]
    out={"name":name,"records":len(records),"weightNumericRecords":len(weights),"distanceNumericRecords":len(distances),"completeQualityRecords":len(both)}
    if weights:
        mean=statistics.fmean(weights); out.update({"weightMeanDelivered":mean,"weightPaperMeanG":PAPER_WEIGHT_MEAN_G,"weightMeanDifferenceFromPaper":mean-PAPER_WEIGHT_MEAN_G})
    if distances:
        raw=statistics.fmean(distances); scaled=raw/1000.0
        out.update({"distanceRawMean":raw,"distanceMeanIfDividedBy1000Mm":scaled,"distancePaperMeanMm":PAPER_DISTANCE_A_MEAN_MM,"distanceScaledMeanDifferenceFromPaperMm":scaled-PAPER_DISTANCE_A_MEAN_MM})
    return out

def scalar_profiles(rows,pressure_cycle_ids,flow_cycle_ids):
    if not rows: raise RuntimeError("AVAPS scalar table is empty")
    header=rows[0]; required=["cycle_counter","maximaler_spritzdruck","weight","distanceA"]
    missing=[n for n in required if n not in header]
    if missing: raise RuntimeError(f"AVAPS scalar header drift: {missing}")
    idx={n:header.index(n) for n in required}; records=[]; pressure_map={}; duplicate=0
    for row in rows[1:]:
        if max(idx.values())>=len(row): continue
        cycle=row[idx["cycle_counter"]].strip()
        if not cycle: continue
        rec={"cycle":cycle,"pressure":as_float(row[idx["maximaler_spritzdruck"]]),"weight":as_float(row[idx["weight"]]),"distanceA":as_float(row[idx["distanceA"]])}; records.append(rec)
        if rec["pressure"] is not None:
            if cycle in pressure_map: duplicate+=1
            else: pressure_map[cycle]=rec["pressure"]
    if not records or not pressure_map: raise RuntimeError("AVAPS scalar table lacks source records/pressure evidence")
    pressure_linked=[r for r in records if r["cycle"] in pressure_cycle_ids]; flow_linked=[r for r in records if r["cycle"] in flow_cycle_ids]
    both=[r for r in records if r["cycle"] in pressure_cycle_ids and r["cycle"] in flow_cycle_ids]
    pressure_plus_scalar=[r for r in pressure_linked if r["pressure"] is not None]
    complete=[r for r in pressure_linked if r["pressure"] is not None and r["weight"] is not None and r["distanceA"] is not None]
    return pressure_map,{"scalarRecordCount":len(records),"numericScalarMaxPressureRecords":len(pressure_map),"duplicateCycleCountersIgnored":duplicate,
      "sourceDefinedQualitySubsets":[quality_subset_summary(records,"all-scalar-records"),quality_subset_summary(pressure_linked,"pressure-waveform-linked"),quality_subset_summary(flow_linked,"flow-waveform-linked"),quality_subset_summary(both,"both-waveforms-linked"),quality_subset_summary(pressure_plus_scalar,"pressure-waveform-plus-scalar-pressure"),quality_subset_summary(complete,"pressure-linked-complete-quality")],
      "qualityDecisionBoundary":"Paper aggregate means are diagnostics, not row-selection criteria. A unit/transform decision must be supported by a source-defined subset, not cherry-picked rows."}

def pressure_peak_agreement(scalar,pressure):
    pairs=[(cycle,scalar[cycle],peak) for cycle,peak in zip(pressure["cycleIds"],pressure["maxima"]) if cycle in scalar and math.isfinite(peak)]
    if not pairs: raise RuntimeError("AVAPS pressure waveform has no cycles linked to scalar max-pressure records")
    abs_errors=[abs(s-p) for _,s,p in pairs]; rel_errors=[abs(s-p)/max(abs(s),1e-12) for _,s,p in pairs]; ratios=[p/s for _,s,p in pairs if s!=0]
    median_rel=statistics.median(rel_errors); max_rel=max(rel_errors); median_ratio=statistics.median(ratios)
    if median_rel>0.01 or max_rel>0.05 or abs(median_ratio-1)>0.01: raise RuntimeError(f"AVAPS pressure waveform not on scalar pressure scale: {median_rel}, {max_rel}, {median_ratio}")
    thresholds=(0.001,0.0025,0.005,0.01,0.02)
    return {"linkedCycleCount":len(pairs),"medianAbsoluteDifference":statistics.median(abs_errors),"maximumAbsoluteDifference":max(abs_errors),"medianRelativeDifference":median_rel,"maximumRelativeDifference":max_rel,"medianWaveformToScalarRatio":median_ratio,
      "matchFractionsByRelativeTolerance":{str(t):sum(e<=t for e in rel_errors)/len(rel_errors) for t in thresholds},"relationship":"Compare waveform maximum with same-cycle maximaler_spritzdruck without scaling or conversion.","scaleDecision":"same numerical engineering scale supported; exact identity is not asserted"}

def flow_perturbation_consistency(flow):
    maxima=[float(v) for v in flow["maxima"]]
    windows={}; inferred=[]
    for key,spec in FLOW_PERTURBATION_WINDOWS.items():
        start=spec["start"]-1; end=spec["end"]
        if start<0 or end>len(maxima): raise RuntimeError(f"AVAPS paper ordinal flow window {key} is outside delivered series count {len(maxima)}")
        values=[v for v in maxima[start:end] if math.isfinite(v)]
        expected=spec["end"]-spec["start"]+1
        if len(values)!=expected: raise RuntimeError(f"AVAPS flow ordinal window {key} incomplete: {len(values)}/{expected}")
        med=statistics.median(values); baseline=med/spec["multiplier"]; inferred.append(baseline)
        windows[key]={"paperLabel":spec["paperLabel"],"paperMultiplier":spec["multiplier"],"paperOrdinalStart":spec["start"],"paperOrdinalEnd":spec["end"],"deliveredCycleCount":len(values),"medianWaveformPeak":med,"minimumWaveformPeak":min(values),"maximumWaveformPeak":max(values),"impliedUnperturbedBaseline":baseline}
    mean=statistics.fmean(inferred)
    return {"publishedTable":"doi:10.3390/polym15040978 Table 1","paperCycleCoordinateInterpretation":"1-based experiment sequence position, distinct from delivered machine cycle_counter headers","publishedOverlapHandling":"Printed +10%/+20% ranges overlap at 458-467; those positions are excluded from both non-overlapping checks.","windows":windows,"meanImpliedUnperturbedBaseline":mean,"coefficientOfVariationAcrossImpliedBaselines":statistics.pstdev(inferred)/abs(mean),"normalizedMedianPeaksUsingMeanImpliedBaseline":{k:v["medianWaveformPeak"]/mean for k,v in windows.items()},"interpretationBoundary":"Relative perturbation consistency supports flow-quantity identity on a source scale; it does not alone establish the engineering unit."}

def main():
    out_dir=Path("measured-source-proof"); out_dir.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".zip",delete=True) as tmp:
        with urllib.request.urlopen(URL,timeout=90) as response:
            while True:
                chunk=response.read(1024*1024)
                if not chunk: break
                tmp.write(chunk)
        tmp.flush(); tmp.seek(0); digest=hashlib.sha256(tmp.read()).hexdigest()
        if digest!=EXPECTED_SHA256: raise SystemExit(f"AVAPS dataset1 SHA mismatch: {digest}")
        tmp.seek(0)
        with zipfile.ZipFile(tmp) as archive:
            required={SCALAR_MEMBER,PRESSURE_MEMBER,FLOW_MEMBER}; missing=sorted(required-set(archive.namelist()))
            if missing: raise SystemExit(f"AVAPS required archive members missing: {missing}")
            members=[]
            for info in archive.infolist():
                item={"name":info.filename,"sizeBytes":info.file_size,"compressedBytes":info.compress_size}
                if not info.is_dir() and info.filename.lower().endswith((".csv",".txt")):
                    raw=archive.read(info.filename)[:65536]; item["firstRows"]=list(csv.reader(io.StringIO(raw.decode("utf-8-sig",errors="replace"))))[:3]
                members.append(item)
            scalar_rows=parse_csv(archive.read(SCALAR_MEMBER)); pressure_rows=parse_csv(archive.read(PRESSURE_MEMBER)); flow_rows=parse_csv(archive.read(FLOW_MEMBER))
    pressure=waveform_profile(pressure_rows,"injection-pressure"); flow=waveform_profile(flow_rows,"injection-flow")
    scalar_map,scalar_stats=scalar_profiles(scalar_rows,set(pressure["cycleIds"]),set(flow["cycleIds"]))
    pressure_agreement=pressure_peak_agreement(scalar_map,pressure); flow_consistency=flow_perturbation_consistency(flow)
    pressure_summary={k:v for k,v in pressure.items() if k not in {"cycleIds","maxima"}}; flow_summary={k:v for k,v in flow.items() if k not in {"cycleIds","maxima"}}
    proof={"schemaVersion":6,"status":"source-proof-passed-with-unit-diagnostics","datasetId":"scatimdata-avaps","sourceArtifact":"dataset1.zip","url":URL,"sha256":"sha256:"+digest,"members":members,"rawSourceRetained":False,"scalarProfile":scalar_stats,"pressureWaveformProfile":pressure_summary,"flowWaveformProfile":flow_summary,"pressurePeakScalarAgreement":pressure_agreement,"flowPerturbationConsistency":flow_consistency,
      "unitEvidenceContext":{"peerReviewedDatasetPaper":"doi:10.3390/polym15040978","paperReportedDataset1WeightMeanG":PAPER_WEIGHT_MEAN_G,"paperReportedDataset1DistanceAMeanMm":PAPER_DISTANCE_A_MEAN_MM,"machineQuantityConventionReference":"doi:10.3390/polym16010054","machineQuantityConvention":"Arburg Allrounder 520 E engineering data reports injection pressure in bar and injection flow rate in cm3/s.","decisionBoundary":"Pressure has a same-cycle scale cross-check. Quality fields are diagnosed on source-defined intersections. Flow has ordinal perturbation consistency but no independent scalar absolute-scale channel in Dataset 1."},
      "boundary":"Diagnostic source proof only. AVAPS promotion readiness remains fail-closed until channel-level unit/transform decisions are explicitly governed; no learner case, recipe or causal diagnosis is authorized here."}
    (out_dir/"avaps-dataset1-source-proof.json").write_text(json.dumps(proof,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":proof["status"],"datasetId":proof["datasetId"],"sha256":proof["sha256"],"pressureLinkedCycles":pressure_agreement["linkedCycleCount"],"pressureMedianRelativeDifference":pressure_agreement["medianRelativeDifference"],"pressureMaximumRelativeDifference":pressure_agreement["maximumRelativeDifference"],"pressureMedianWaveformToScalarRatio":pressure_agreement["medianWaveformToScalarRatio"],"qualitySubsets":scalar_stats["sourceDefinedQualitySubsets"],"flowImpliedBaselineCV":flow_consistency["coefficientOfVariationAcrossImpliedBaselines"],"flowNormalizedMedians":flow_consistency["normalizedMedianPeaksUsingMeanImpliedBaseline"],"pressureTimeDeltaRange":[pressure_summary["deliveredMinimumSampleIntervalS"],pressure_summary["deliveredMaximumSampleIntervalS"]]},separators=(",",":")))
    return 0
if __name__=="__main__": raise SystemExit(main())
