#!/usr/bin/env python3
from __future__ import annotations

import argparse, csv, hashlib, io, json, math, urllib.request
from collections import Counter
from pathlib import Path

COMMIT="41b8f392923d37b50b5098ed918dd2f0de1bc328"
RAW=f"https://raw.githubusercontent.com/airtlab/machine-learning-for-quality-prediction-in-plastic-injection-molding/{COMMIT}/dataset/data.csv"
README=f"https://raw.githubusercontent.com/airtlab/machine-learning-for-quality-prediction-in-plastic-injection-molding/{COMMIT}/readme.md"
DOI="10.3390/info13060272"
UA="MouldMaster-iGuzzini-profiler/1.0"

UNITS={
"Melt temperature":"degC","Mold temperature":"degC","time_to_fill":"s","ZDx - Plasticizing time":"s","ZUx - Cycle time":"s","SKx - Closing force":"N","SKs - Clamping force peak value":"N","Ms - Torque peak value current cycle":"N*m","Mm - Torque mean value current cycle":"N*m","APSs - Specific back pressure peak value":"bar","APVs - Specific injection pressure peak value":"bar","CPn - Screw position at the end of hold pressure":"cm","SVo - Shot volume":"cm3"}


def get(url):
    req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"text/plain,*/*"})
    with urllib.request.urlopen(req,timeout=120) as r: return r.read()

def sha256(b): return hashlib.sha256(b).hexdigest()

def finite(s):
    try: return math.isfinite(float(s))
    except Exception: return False


def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--output",default="iguzzini-road-lenses-v1.json"); args=ap.parse_args()
    raw=get(RAW); readme=get(README); text=raw.decode("utf-8-sig")
    rows=list(csv.DictReader(io.StringIO(text),delimiter=';'))
    fields=list(rows[0].keys()) if rows else []
    missing=sum(1 for r in rows for v in r.values() if v is None or str(v).strip()=="")
    labels=Counter(str(float(r['quality'])) for r in rows)
    ranges={}
    for f in fields:
        vals=[float(r[f]) for r in rows if finite(r.get(f,''))]
        if vals: ranges[f]={"min":min(vals),"max":max(vals),"numericCount":len(vals)}
    payload={
      "schema":1,"status":"completed-public-measured-benchmark","completedDate":"2026-08-28",
      "source":{"repository":"https://github.com/airtlab/machine-learning-for-quality-prediction-in-plastic-injection-molding","commit":COMMIT,"file":"dataset/data.csv","rawUrl":RAW,"peerReviewedCompanion":DOI,"releaseTerms":"Freely released for research and educational purposes; citation requested; no broader standard data licence inferred","useContext":"MouldMaster educational/research profiling is within the stated release purpose; raw redistribution is not claimed"},
      "file":{"sizeBytes":len(raw),"sha256":sha256(raw),"gitBlobShaFromPublisherMetadata":"1ca731e1e80451f6ebf857f3db69bc9f4566d073","rows":len(rows),"columns":len(fields),"missingCells":missing,"delimiter":";"},
      "schemaInspection":{"fields":fields,"processParameterFields":fields[:-1],"qualityField":"quality","units":UNITS,"numericRanges":ranges},
      "experimentalContext":{"producer":"iGuzzini Illuminazione, Recanati, Italy","machine":"Engel E-MAC 310/100","collectionSystem":"TIG Manufacturing Execution System (MES)","productionDays":["2019-09-18","2019-09-19","2019-09-20","2020-02-07","2020-05-20"],"recordUnit":"one produced road-lens process feature vector","material":"Polymer/material grade not specified in the repository README; retained as an explicit limitation"},
      "quality":{"definition":"Four classes based on photometric general uniformity U0 relative to UNI EN 13201-2:2016 and company target bands","observedLabelCounts":dict(sorted(labels.items())),"readmePublishedCounts":{"1.0":370,"2.0":406,"3.0":310,"4.0":360},"readmePublishedCountSum":1446,"observedRows":len(rows)},
      "acceptedMeasuredRecords":len(rows),"acceptedMeasuredTimeSeriesSamples":0,"rawSourceRowsCommitted":False,"rawSourceRedistributed":False,
      "boundary":"Accepted as one real record-level industrial injection-moulding dataset package. It contains machine/MES process parameters linked to a measured quality class, not high-frequency waveforms, so it contributes zero time-series scalar samples. The source's research/education release is preserved without widening it into general redistribution rights; unspecified polymer grade remains a documented limitation."
    }
    Path(args.output).write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"file":payload['file'],"labels":payload['quality'],"fields":fields},indent=2,ensure_ascii=False))

if __name__=='__main__': main()
