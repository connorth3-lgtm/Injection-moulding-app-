#!/usr/bin/env python3
"""Extract compact, unreviewed AVAPS Dataset 1 authoring candidates.

The exact CC BY 4.0 archive is downloaded and SHA-verified transiently. Only bounded,
deterministically reduced source-derived representations are written to the workflow
artifact. Raw publisher files are not committed and the unresolved distanceA transform is
not emitted as a learner-ready signal.
"""
from __future__ import annotations

import csv, hashlib, io, json, math, tempfile, urllib.request, zipfile
from pathlib import Path

URL="https://raw.githubusercontent.com/sc4t1m/scatimdata/7bd35941d75c97a3f276439377dc430ab47402be/dataset1.zip"
EXPECTED_SHA="f8c7f6363ecbd541735b374746ce8549aaa50dae754aaaa2efa980c227b19c09"
SCALAR="dataset1/ds1_scalar_and_quality.csv"
PRESSURE="dataset1/ds1_timeseries_injectionpressure.csv"
FLOW="dataset1/ds1_timeseries_injectionflow.csv"
OUT=Path("measured-source-proof/avaps-unreviewed-learning-candidates.json")
PRESSURE_CH="dataset1/ds1_timeseries_injectionpressure.csv:value"
FLOW_CH="dataset1/ds1_timeseries_injectionflow.csv:value"
WEIGHT_CH="dataset1/ds1_scalar_and_quality.csv:weight"


def f(v):
    t=str(v).strip().replace("\u00a0","")
    if not t:return None
    if "," in t and "." not in t:t=t.replace(",",".")
    try:n=float(t)
    except ValueError:return None
    return n if math.isfinite(n) else None

def sha(v): return "sha256:"+hashlib.sha256(json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
def parse(payload): return list(csv.reader(io.StringIO(payload.decode("utf-8-sig"))))
def sample_indices(n,limit=400):
    if n<=limit:return list(range(n))
    return sorted({round(i*(n-1)/(limit-1)) for i in range(limit)})

def read_wave(rows,ordinals,source_channel,semantic,unit,prefix):
    header=rows[0]; ids=[c.strip() for c in header[1:]]
    if max(ordinals)>len(ids): raise RuntimeError(f"AVAPS ordinal outside {source_channel}: {max(ordinals)}/{len(ids)}")
    cols=[o for o in ordinals]  # CSV column number equals 1-based experiment ordinal.
    cycle_ids=[ids[o-1] for o in ordinals]
    times=[]; series=[[] for _ in ordinals]
    for row in rows[1:]:
        if not row: continue
        t=f(row[0])
        if t is None: continue
        values=[]
        for col in cols:
            value=f(row[col]) if col<len(row) else None
            if value is None: raise RuntimeError(f"AVAPS nonnumeric waveform value at ordinal {col}")
            values.append(value)
        times.append(t)
        for i,value in enumerate(values): series[i].append(value)
    if len(times)!=2048 or not all(a<b for a,b in zip(times,times[1:])): raise RuntimeError("AVAPS waveform time structure drift")
    idx=sample_indices(len(times)); x=[times[i] for i in idx]
    signals=[]
    for ordinal,cycle_id,ys in zip(ordinals,cycle_ids,series):
        y=[ys[i] for i in idx]
        rep={"xSemantic":"time","xUnit":"s","xDirection":"increasing","reductionMethod":"deterministic-uniform-index-subset-preserving-delivered-time-no-interpolation","originalPointCount":len(times),"x":x,"y":y}
        signals.append({"id":f"{prefix}-ordinal-{ordinal:04d}","label":f"{prefix.replace('-',' ')} paper cycle {ordinal:04d}","sourceChannel":source_channel,"sourceCycleCounter":cycle_id,"paperOrdinal":ordinal,"semantic":semantic,"unit":unit,"representation":rep,"representationFingerprint":sha(rep)})
    return signals,cycle_ids

def read_weight(rows,start_ordinal=590,count=200):
    header=rows[0]; required=["cycle_counter","weight"]; missing=[x for x in required if x not in header]
    if missing: raise RuntimeError(f"AVAPS scalar header drift: {missing}")
    ci,wi=header.index("cycle_counter"),header.index("weight"); records=[]
    for row in rows[1:]:
        if max(ci,wi)>=len(row):continue
        cycle=f(row[ci]); weight=f(row[wi])
        if cycle is not None and weight is not None: records.append((cycle,weight))
    if len(records)!=1167: raise RuntimeError(f"AVAPS quality record drift: {len(records)}")
    start=start_ordinal-1; selected=records[start:start+count]
    if len(selected)!=count: raise RuntimeError("AVAPS weight window incomplete")
    x=[r[0] for r in selected]; y=[r[1] for r in selected]
    if not all(a<b for a,b in zip(x,x[1:])): raise RuntimeError("AVAPS cycle_counter is not ordered in weight window")
    rep={"xSemantic":"machine-cycle-counter","xUnit":"cycle","xDirection":"increasing","reductionMethod":"contiguous-source-record-window-no-interpolation","originalPointCount":count,"x":x,"y":y}
    return {"id":"part-weight-window","label":"Measured part weight","sourceChannel":WEIGHT_CH,"semantic":"measured-part-weight","unit":"g","representation":rep,"representationFingerprint":sha(rep)},[str(int(v)) for v in x]

def candidate(cid,signals,cases,scope,members,digest):
    return {"candidateId":cid,"datasetId":"scatimdata-avaps","sourceArtifact":"dataset1.zip","sourceMembers":members,"sourceFingerprint":"sha256:"+digest,"sourceScope":scope,"signals":signals,"candidateFingerprint":sha(signals),"suggestedCatalogueCases":cases,"evidenceBoundary":"Unreviewed measured authoring evidence only. Paper ordinal positions and delivered machine cycle_counter identifiers are kept distinct. Unit-governed pressure/flow/weight channels do not establish root cause or a production recipe."}

def main():
    with tempfile.NamedTemporaryFile(suffix=".zip") as tmp:
        with urllib.request.urlopen(URL,timeout=90) as response:
            while True:
                chunk=response.read(1024*1024)
                if not chunk:break
                tmp.write(chunk)
        tmp.flush(); tmp.seek(0); payload=tmp.read(); digest=hashlib.sha256(payload).hexdigest()
        if digest!=EXPECTED_SHA: raise RuntimeError(f"AVAPS SHA drift: {digest}")
        with zipfile.ZipFile(io.BytesIO(payload)) as z:
            pressure_rows=parse(z.read(PRESSURE)); flow_rows=parse(z.read(FLOW)); scalar_rows=parse(z.read(SCALAR))
    late_ord=[90,95,100]
    p_late,pids=read_wave(pressure_rows,late_ord,PRESSURE_CH,"machine-injection-pressure","bar","pressure")
    f_late,fids=read_wave(flow_rows,late_ord,FLOW_CH,"machine-injection-flow-rate","cm3/s","flow")
    if pids!=fids: raise RuntimeError("AVAPS pressure/flow cycle identity drift")
    early_ord=[1,40,80]
    p_early,pids2=read_wave(pressure_rows,early_ord,PRESSURE_CH,"machine-injection-pressure","bar","pressure-startup")
    f_early,fids2=read_wave(flow_rows,early_ord,FLOW_CH,"machine-injection-flow-rate","cm3/s","flow-startup")
    if pids2!=fids2: raise RuntimeError("AVAPS startup pressure/flow identity drift")
    weight,weight_cycles=read_weight(scalar_rows)
    qord=[650]
    p_q,qpid=read_wave(pressure_rows,qord,PRESSURE_CH,"machine-injection-pressure","bar","pressure-quality")
    f_q,qfid=read_wave(flow_rows,qord,FLOW_CH,"machine-injection-flow-rate","cm3/s","flow-quality")
    if qpid!=qfid: raise RuntimeError("AVAPS quality pressure/flow identity drift")
    candidates=[
      candidate("AVAPS-LATE-DAY1-WAVEFORMS-01",p_late+f_late,["MLM-001","MLM-002","MLM-003","MLM-015","MLM-016","MLM-017","MLM-018","MLM-022","MLM-064"],{"selection":"paper experiment ordinals 90,95,100; late portion of the published day-1 start-up block","paperOrdinals":late_ord,"machineCycleCounters":pids},[PRESSURE,FLOW],digest),
      candidate("AVAPS-STARTUP-WAVEFORMS-01",p_early+f_early,["MLM-008","MLM-009","MLM-010"],{"selection":"paper experiment ordinals 1,40,80 within day-1 start-up; source order preserved","paperOrdinals":early_ord,"machineCycleCounters":pids2},[PRESSURE,FLOW],digest),
      candidate("AVAPS-TRACE-WEIGHT-LINK-01",p_q+f_q+[weight],["MLM-036"],{"selection":"one governed pressure/flow trace plus a contiguous 200-record measured-weight window for quality-linked authoring","tracePaperOrdinal":qord[0],"traceMachineCycleCounter":qpid[0],"weightMachineCycleCounters":weight_cycles},[PRESSURE,FLOW,SCALAR],digest),
    ]
    result={"schemaVersion":1,"status":"unreviewed-source-derived-candidates","promotionEligible":False,"candidateCount":len(candidates),"candidates":candidates,"blockedCatalogueCases":{"MLM-037":"distanceA source transform remains unresolved and its channel is explicitly not promotion-ready"},"boundary":"Numeric authoring coverage is not learner promotion. The raw archive is transient and no independent engineering review is invented."}
    OUT.parent.mkdir(exist_ok=True); OUT.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":result["status"],"candidateCount":len(candidates),"candidateIds":[c["candidateId"] for c in candidates],"coveredCatalogueCases":sorted({i for c in candidates for i in c["suggestedCatalogueCases"]}),"blockedCatalogueCases":result["blockedCatalogueCases"]},separators=(",",":")))
    return 0
if __name__=="__main__": raise SystemExit(main())
