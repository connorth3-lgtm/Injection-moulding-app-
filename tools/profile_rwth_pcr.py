#!/usr/bin/env python3
from __future__ import annotations

import argparse, csv, hashlib, io, json, urllib.request, http.cookiejar, zipfile
from pathlib import Path

RECORD_URL = "https://publications.rwth-aachen.de/record/1016199/"
URL = RECORD_URL + "files/ExperimentalData.zip"
VERSIONED_URL = URL + "?version=1"
DOI = "10.18154/RWTH-2025-06809"
UA = "Mozilla/5.0 MouldMaster-RWTH-PCR-profiler/1.3"


def digest_bytes(data: bytes, algo="sha256"):
    h = hashlib.new(algo); h.update(data); return h.hexdigest()


def download_archive():
    jar=http.cookiejar.CookieJar(); opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    opener.addheaders=[("User-Agent",UA),("Accept-Language","en-US,en;q=0.9")]
    try:
        with opener.open(RECORD_URL,timeout=60) as r: r.read(4096)
    except Exception:
        pass
    variants=[VERSIONED_URL,VERSIONED_URL+"&download=1",URL,URL+"?download=1"]
    diagnostics=[]
    for candidate in variants:
        req=urllib.request.Request(candidate,headers={"User-Agent":UA,"Accept":"application/zip,application/octet-stream,*/*","Referer":RECORD_URL})
        try:
            with opener.open(req,timeout=300) as r:
                data=r.read(); ct=r.headers.get("Content-Type"); final=r.geturl()
            diagnostics.append({"url":candidate,"finalUrl":final,"contentType":ct,"bytes":len(data),"prefixHex":data[:16].hex()})
            if zipfile.is_zipfile(io.BytesIO(data)): return data,candidate,diagnostics
        except Exception as e:
            diagnostics.append({"url":candidate,"error":f"{type(e).__name__}: {e}"})
    return None,None,diagnostics


def inspect_csv(data: bytes):
    text=data.decode("utf-8-sig",errors="replace")
    try: delim=csv.Sniffer().sniff(text[:20000],delimiters=",;\t").delimiter
    except Exception: delim=","
    rows=[]
    for i,row in enumerate(csv.reader(io.StringIO(text),delimiter=delim)):
        rows.append(row)
        if i>=4: break
    return {"delimiter":delim,"lineCount":text.count("\n")+(1 if text and not text.endswith("\n") else 0),"header":rows[0] if rows else [],"previewRowWidths":[len(r) for r in rows]}


def inspect_mat(data: bytes):
    tmp=Path(".rwth_tmp.mat"); tmp.write_bytes(data); out={"format":"mat","variables":[]}
    try:
        import scipy.io
        for name,shape,dtype in scipy.io.whosmat(tmp): out["variables"].append({"name":name,"shape":list(shape),"dtype":dtype})
    except Exception as e:
        out["scipyError"]=type(e).__name__
        try:
            import h5py
            with h5py.File(tmp,"r") as f:
                def visit(name,obj):
                    if hasattr(obj,"shape"): out["variables"].append({"name":name,"shape":list(obj.shape),"dtype":str(obj.dtype)})
                f.visititems(visit)
        except Exception as e2: out["hdf5Error"]=type(e2).__name__
    tmp.unlink(missing_ok=True); return out


def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--output",default="rwth-pcr-v1.json"); args=ap.parse_args()
    raw,used_url,fetch_diag=download_archive(); members=[]
    if raw is not None:
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            for info in z.infolist():
                if info.is_dir(): continue
                data=z.read(info.filename); suffix=Path(info.filename).suffix.lower()
                rec={"path":info.filename,"sizeBytes":len(data),"sha256":digest_bytes(data),"suffix":suffix}
                if suffix in {".csv",".txt",".tsv"} and len(data)<=100_000_000: rec["tableInspection"]=inspect_csv(data)
                elif suffix==".mat": rec["matInspection"]=inspect_mat(data)
                members.append(rec)
    source={"title":"Injection Molding Process Data for Post-Consumer-Recycled Materials","doi":DOI,"recordUrl":RECORD_URL,"downloadUrl":URL,"versionedDownloadUrl":VERSIONED_URL,"downloadVariantUsed":used_url,"publisher":"RWTH Publications","license":"CC BY 4.0","openAccess":True,"peerReviewedCompanion":"10.1016/j.jprocont.2026.103725","fileVersion":1,"publishedFileSizeLabel":"1,007.55 KB"}
    context={"materials":["Systalen PP-24000 gr000 PCR","SABIC PP579S virgin PP"],"machine":"Arburg Allrounder 520 A 1500-800","mouldGeometry":"flat plate","signals":["screw-antechamber pressure","cavity pressure","controller output","screw velocity","screw-antechamber volume"],"quality":["part mass","part-mass reference"],"controllers":["learning-based nonlinear MPC","proportional cavity-pressure control","part-mass control"]}
    if raw is None:
        payload={"schema":1,"status":"source-access-blocked-not-profiled","completedDate":"2026-08-28","source":source,"fetchDiagnostics":fetch_diag,"publishedContext":context,"acceptedMeasuredCycles":0,"acceptedMeasuredTimeSeriesSamples":0,"rawSourceRowsCommitted":False,"boundary":"RWTH metadata, file version, licence and experimental context are verified, but the public file endpoint returns a 248-byte HTML interstitial to GitHub-hosted automation. This source is not fully profiled and contributes no accepted dataset/sample count until exact source bytes are lawfully obtained and inspected."}
    else:
        payload={"schema":1,"status":"profile-generated-review-required","completedDate":"2026-08-28","source":source,"archive":{"name":"ExperimentalData.zip","sizeBytes":len(raw),"sha256":digest_bytes(raw),"members":len(members)},"fetchDiagnostics":fetch_diag,"members":members,"publishedContext":context,"acceptedMeasuredCycles":0,"acceptedMeasuredTimeSeriesSamples":0,"rawSourceRowsCommitted":False,"boundary":"Discovery profile only. Promotion requires reconciling experiment/cycle cardinality, signal matrices, units/time basis, controller/setpoint versus direct measurements, and part-mass linkage from the exact archive."}
    Path(args.output).write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"status":payload["status"],"archive":payload.get("archive"),"fetch":fetch_diag,"memberCount":len(members)},indent=2,ensure_ascii=False))

if __name__=="__main__": main()
