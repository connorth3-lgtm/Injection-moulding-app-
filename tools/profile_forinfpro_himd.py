#!/usr/bin/env python3
from __future__ import annotations

import argparse, csv, hashlib, io, json, math, re, urllib.request
from pathlib import Path

RECORD_ID="20744054"
DOI="10.5281/zenodo.20744054"
API=f"https://zenodo.org/api/records/{RECORD_ID}"
UA="MouldMaster-FORinFPRO-HIMD-profiler/1.1"
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

def parse_number(v):
    s=str(v).strip().replace("\u00a0","")
    if not s:return None
    # ENGEL export uses semicolon-delimited CSV with decimal commas. Keep thousands
    # separators conservative: only normalize a single decimal comma when no dot exists.
    if re.fullmatch(r"[+-]?\d+,\d+(?:[eE][+-]?\d+)?",s):
        s=s.replace(",",".")
    try:
        x=float(s)
        return x if math.isfinite(x) else None
    except Exception:
        return None

def field_role(h):
    n=h.lower()
    if not h.strip(): return "blank"
    if h in {"Datum/Zeit","Maschinennummer"}: return "identifier-or-time"
    if any(k in n for k in ["setpoint","rset","rsetval","rsettemp","rsetref","rmmpset","rshotsizeset","set_"]): return "setpoint"
    if any(k in n for k in ["ractder","calc","derived","peak","cutoff","corr"]): return "derived-or-aggregate"
    if any(k in n for k in ["bstate","bactive","bnoz","state","trigger"]): return "state"
    if any(k in n for k in ["ractual","ractval","ract","measact","actual"]): return "direct-machine-actual"
    return "unclassified"

def profile_csv(data):
    text=data.decode("utf-8-sig",errors="replace")
    try: delim=csv.Sniffer().sniff(text[:30000],delimiters=",;\t").delimiter
    except Exception: delim="," 
    rows=list(csv.reader(io.StringIO(text),delimiter=delim)); header=rows[0] if rows else []; body=rows[1:]
    width=len(header); missing=0; stats=[]
    role_counts={}
    for i,h in enumerate(header):
        vals=[]; miss=0
        for r in body:
            v=r[i] if i<len(r) else ""
            if str(v).strip()=="": miss+=1
            else:
                x=parse_number(v)
                if x is not None: vals.append(x)
        missing+=miss
        role=field_role(h); role_counts[role]=role_counts.get(role,0)+1
        stats.append({"name":h,"role":role,"numericCount":len(vals),"missing":miss,"min":min(vals) if vals else None,"max":max(vals) if vals else None})
    named=[x for x in stats if x["name"].strip()]
    numeric_named=[x for x in named if x["numericCount"]>0]
    direct=[x for x in numeric_named if x["role"]=="direct-machine-actual"]
    return {"delimiter":delim,"rows":len(body),"columns":width,"namedColumns":len(named),"numericNamedColumns":len(numeric_named),"directMachineActualColumns":len(direct),"missingCells":missing,"header":header,"roleCounts":role_counts,"columnStats":stats}

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
    machine=profiles["cycle_001_machine_data.csv"]["table"]
    pt=profiles["cycle_001_pt.csv"]["table"]
    us=profiles["cycle_001_us_rms.csv"]["table"]
    payload={
      "schema":1,"status":"completed-public-measured-benchmark","completedDate":"2026-08-28",
      "source":{"title":"FORinFPRO-HIMD: Multimodal Sensor Dataset for Hybrid Injection Molding of Continuous Fiber-Reinforced Polypropylene Composites","doi":DOI,"recordId":RECORD_ID,"recordUrl":f"https://zenodo.org/records/{RECORD_ID}","apiUrl":API,"publisher":"Zenodo","version":"v1","datasetOpen":True,"licenseMetadata":license_meta(rec)},
      "experimentalContext":{"machine":"ENGEL V-Duo hybrid injection moulding cell","process":"in-situ forming of continuous glass-fibre reinforced polypropylene organosheet followed by PP overmoulding in one cycle","material":"continuous glass-fibre reinforced polypropylene organosheet with polypropylene overmoulding","visibleCycles":1,"inMouldSensors":{"ultrasonic":4,"pressureTemperature":6,"dielectricAnalysis":2,"total":12},"machineSignals":["injection pressure","screw position","injection speed","clamping force","temperatures"],"qualityLabelsPresentInVisibleV1":False},
      "files":profiles,
      "observedStructure":{"machineRows":machine["rows"],"machineNamedColumns":machine["namedColumns"],"machineNumericNamedColumns":machine["numericNamedColumns"],"directMachineActualColumns":machine["directMachineActualColumns"],"pressureTemperatureRows":pt["rows"],"pressureTemperatureHeader":pt["header"],"ultrasoundRmsRows":us["rows"],"ultrasoundRmsHeader":us["header"]},
      "measurementBoundary":{"directMachineActualsSeparatedFromSetpointsDerivedAndStates":True,"pressureTemperatureDirectMeasurementsIdentified":True,"ultrasoundRmsIsDerivedFeature":True,"sourceUnitsExplicitInCsvHeaders":False,"acceptedMeasuredCycles":1,"acceptedMeasuredTimeSeriesSamples":0,"rawSourceRowsCommitted":False},
      "acceptedMeasuredCycles":1,"acceptedMeasuredTimeSeriesSamples":0,"rawSourceRowsCommitted":False,
      "boundary":"Exact Zenodo v1 files are checksum-verified and schema-profiled. ENGEL decimal-comma machine values are parsed and machine actuals are separated from setpoints, derived/aggregate and state fields by source naming semantics. The pressure/temperature file contains direct measurements and the ultrasound file contains derived RMS features. The visible source/file headers do not explicitly state physical units, so no scalar values are promoted to the measured-sample ledger until units/time-basis semantics are source-verified. One visible hybrid injection-moulding cycle counts as one profiled dataset package, never as multiple packages."
    }
    Path(args.output).write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"license":payload['source']['licenseMetadata'],"status":payload['status'],"acceptedMeasuredCycles":1,"acceptedMeasuredTimeSeriesSamples":0,"observedStructure":payload['observedStructure'],"roles":machine['roleCounts'],"files":{k:{"sizeBytes":v['sizeBytes'],"sha256":v['sha256'],"rows":v['table']['rows'],"columns":v['table']['columns']} for k,v in profiles.items()}},indent=2,ensure_ascii=False))

if __name__=='__main__':main()
