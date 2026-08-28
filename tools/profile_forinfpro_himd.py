#!/usr/bin/env python3
from __future__ import annotations

import argparse, csv, hashlib, io, json, math, urllib.request
from pathlib import Path

RECORD_ID="20744054"
DOI="10.5281/zenodo.20744054"
API=f"https://zenodo.org/api/records/{RECORD_ID}"
UA="MouldMaster-FORinFPRO-HIMD-profiler/1.0"
EXPECTED={
 "cycle_001_machine_data.csv":"d2a7d96d133f3d7b43a5089ad4bf0b09",
 "cycle_001_pt.csv":"40d8511c11e8e0575dc3930ddd258c19",
 "cycle_001_us_rms.csv":"c767196cfd1b6dec0d09ed0a2dba2551",
}


def get(url,accept="*/*"):
    req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":accept})
    with urllib.request.urlopen(req,timeout=180) as r:return r.read()

def md5(b): return hashlib.md5(b).hexdigest()
def sha256(b): return hashlib.sha256(b).hexdigest()

def files(record):
    x=record.get("files")
    if isinstance(x,list): return x
    if isinstance(x,dict):
        y=x.get("entries") or x.get("items") or x.get("files")
        if isinstance(y,list): return y
        if isinstance(y,dict): return list(y.values())
    return []

def name(x): return str(x.get("key") or x.get("filename") or x.get("name") or "")
def url(x):
    links=x.get("links") or {}
    return links.get("content") or links.get("self") or links.get("download") or x.get("url")

def finite(v):
    try:return math.isfinite(float(v))
    except Exception:return False

def profile_csv(data):
    text=data.decode("utf-8-sig",errors="replace")
    try: delim=csv.Sniffer().sniff(text[:30000],delimiters=",;\t").delimiter
    except Exception: delim="," 
    rows=list(csv.reader(io.StringIO(text),delimiter=delim)); header=rows[0] if rows else []; body=rows[1:]
    width=len(header); missing=0; stats=[]
    for i,h in enumerate(header):
        vals=[]; miss=0
        for r in body:
            v=r[i] if i<len(r) else ""
            if str(v).strip()=="": miss+=1
            elif finite(v): vals.append(float(v))
        missing+=miss
        stats.append({"name":h,"numericCount":len(vals),"missing":miss,"min":min(vals) if vals else None,"max":max(vals) if vals else None})
    return {"delimiter":delim,"rows":len(body),"columns":width,"missingCells":missing,"header":header,"columnStats":stats}

def license_meta(record):
    m=record.get("metadata") or {}
    return {"accessRight":m.get("access_right") or m.get("accessRight"),"license":m.get("license"),"rights":m.get("rights")}


def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--output",default="forinfpro-himd-v1.json");args=ap.parse_args()
    rec=json.loads(get(API,"application/json").decode("utf-8")); fmap={name(x):x for x in files(rec)}
    missing=set(EXPECTED)-set(fmap)
    if missing: raise RuntimeError(f"expected Zenodo files missing: {sorted(missing)}")
    profiles={}
    for fname,expected_md5 in EXPECTED.items():
        item=fmap[fname]; link=url(item)
        if not link: raise RuntimeError(f"download link missing for {fname}")
        data=get(link); obs=md5(data)
        if obs!=expected_md5: raise RuntimeError(f"MD5 mismatch for {fname}: {obs} != {expected_md5}")
        profiles[fname]={"sizeBytes":len(data),"md5":obs,"sha256":sha256(data),"table":profile_csv(data)}
    payload={
      "schema":1,"status":"profile-generated-review-required","completedDate":"2026-08-28",
      "source":{"title":"FORinFPRO-HIMD: Multimodal Sensor Dataset for Hybrid Injection Molding of Continuous Fiber-Reinforced Polypropylene Composites","doi":DOI,"recordId":RECORD_ID,"recordUrl":f"https://zenodo.org/records/{RECORD_ID}","apiUrl":API,"publisher":"Zenodo","version":"v1","datasetOpen":True,"licenseMetadata":license_meta(rec)},
      "experimentalContext":{"machine":"ENGEL V-Duo hybrid injection moulding cell","process":"in-situ forming of continuous glass-fibre reinforced polypropylene organosheet followed by PP overmoulding in one cycle","visibleCycles":1,"inMouldSensors":{"ultrasonic":4,"pressureTemperature":6,"dielectricAnalysis":2,"total":12},"machineSignals":["injection pressure","screw position","injection speed","clamping force","temperatures"]},
      "files":profiles,
      "acceptedMeasuredCycles":0,"acceptedMeasuredTimeSeriesSamples":0,"rawSourceRowsCommitted":False,
      "boundary":"Exact v1 files are checksum-verified and schema-profiled, but acceptance/sample promotion waits for the observed CSV channel semantics, time bases, units and Zenodo licence metadata to be reviewed. The visible v1 source contains one rich hybrid injection-moulding cycle; one cycle is not inflated into multiple dataset packages."
    }
    Path(args.output).write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"license":payload['source']['licenseMetadata'],"files":{k:{"sizeBytes":v['sizeBytes'],"sha256":v['sha256'],"rows":v['table']['rows'],"columns":v['table']['columns'],"header":v['table']['header']} for k,v in profiles.items()}},indent=2,ensure_ascii=False))

if __name__=='__main__':main()
