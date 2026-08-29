#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
import urllib.request
from pathlib import Path

from vamas import Vamas

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data/public-benchmark-contracts/crmb7xjymg-v1.json"
DATASET_ID = "crmb7xjymg"
VERSION = 1
UA = "MouldMaster-Educational-Evidence-Profiler/1.0"
API_ROOT = "https://api.data.mendeley.com"


def get(url: str) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read(), r.geturl()


def listing():
    raw, _ = get(f"https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}")
    x = json.loads(raw.decode("utf-8"))
    if isinstance(x, list): return x
    if isinstance(x, dict):
        for k in ("results","files","items","data"):
            if isinstance(x.get(k), list): return x[k]
    return []


def fid(item): return str(item.get("id") or item.get("file_id") or item.get("uuid") or "")


def furl(item):
    d = item.get("content_details") or item.get("contentDetails") or {}
    for key in ("download_url","downloadUrl"):
        if d.get(key): return str(d[key])
        if item.get(key): return str(item[key])
    return f"{API_ROOT}/datasets/{DATASET_ID}/files/{fid(item)}/file_downloaded?version={VERSION}"


def safe_text(v):
    if v is None: return None
    s = " ".join(str(v).replace("\x00"," ").split())
    return s[:180] if s else None


def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--output",type=Path,required=True); ap.add_argument("--retrieved-date",required=True); args=ap.parse_args()
    c=json.loads(CONTRACT.read_text(encoding="utf-8")); expected=c["source"]["vamasFile"]
    pub={fid(x):x for x in listing()}; item=pub.get(expected["id"])
    if item is None: raise RuntimeError("VAMAS publisher file disappeared")
    data,final=get(furl(item)); digest=hashlib.sha256(data).hexdigest()
    if digest.lower()!=expected["sha256"].lower(): raise RuntimeError(f"publisher SHA mismatch: {digest}")
    # CasaXPS comments in this source contain CP1252 characters (for example German umlauts).
    # The vamas package opens paths as UTF-8, so normalize only the temporary parser copy.
    # Original publisher bytes remain the SHA-verified authority and are never committed.
    normalized_text=data.decode("cp1252")
    normalized_bytes=normalized_text.encode("utf-8")
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/"source-utf8.vms"; p.write_bytes(normalized_bytes); parsed=Vamas(p)
        blocks=[]; total_counts=0; total_other=0; xps_blocks=0; labels={}
        for i,b in enumerate(parsed.blocks):
            if str(getattr(b,"technique","")).upper()=="XPS": xps_blocks+=1
            vars_out=[]
            for cv in getattr(b,"corresponding_variables",[]) or []:
                label=safe_text(getattr(cv,"label",None)) or ""
                unit=safe_text(getattr(cv,"unit",None))
                n=len(getattr(cv,"y_values",[]) or [])
                labels[label]=labels.get(label,0)+n
                is_detector=label.strip().lower()=="counts"
                if is_detector: total_counts+=n
                else: total_other+=n
                vars_out.append({"label":label,"unit":unit,"pointCount":n,"countedAsMeasuredDetectorValues":is_detector})
            blocks.append({
                "index":i,
                "blockIdentifier":safe_text(getattr(b,"block_identifier",None)),
                "sampleIdentifier":safe_text(getattr(b,"sample_identifier",None)),
                "technique":safe_text(getattr(b,"technique",None)),
                "speciesLabel":safe_text(getattr(b,"species_label",None)),
                "transitionOrChargeStateLabel":safe_text(getattr(b,"transition_or_charge_state_label",None)),
                "xLabel":safe_text(getattr(b,"x_label",None)),
                "xUnits":safe_text(getattr(b,"x_units",None)),
                "scanPointSets": (int(getattr(b,"num_y_values",0)) // int(getattr(b,"num_corresponding_variables",1))) if int(getattr(b,"num_corresponding_variables",1) or 1)>0 else 0,
                "correspondingVariables":vars_out,
                "rawValuesEmitted":False
            })
    result={
      "schema":1,"status":"completed-profiled-xps-vamas-material-tool-interface","retrievedDate":args.retrieved_date,
      "source":{"datasetId":c["datasetId"],"datasetDoi":c["source"]["datasetDoi"],"license":c["source"]["license"],"version":VERSION,"publisherFileName":expected["name"],"sha256":digest,"publisherSha256Matched":True,"retrievedSizeBytes":len(data),"resolvedUrl":final,"parserTextEncodingNormalization":"cp1252-to-utf8-temporary-copy","normalizedParserCopySha256":hashlib.sha256(normalized_bytes).hexdigest()},
      "profile":{"vamasBlockCount":len(blocks),"xpsBlockCount":xps_blocks,"dependentVariablePointCountsByLabel":labels,"measuredDetectorCountsValues":total_counts,"otherDependentVariableValuesExcluded":total_other,"blocks":blocks,"rawSpectralValuesEmitted":False},
      "acceptance":{"countsAsFullyProfiledMeasuredDataset":len(blocks)>0 and xps_blocks==len(blocks) and total_counts>0,"evidenceClass":"material-tool-interface-xps-characterization","injectionMouldingCycleDataset":False,"acceptedMeasuredTimeSeriesSamples":0,"acceptedMaterialCharacterizationTraceValues":total_counts,"energyAxisExcluded":True,"transmissionAndCalibrationVariablesExcluded":True},
      "retrieval":{"rawPublisherFileCommitted":False,"rawSpectralValuesUploadedAsArtifact":False},"evidenceBoundary":c["evidenceBoundary"]}
    args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"status":result["status"],"blocks":len(blocks),"xpsBlocks":xps_blocks,"measuredDetectorCountsValues":total_counts,"variables":labels},indent=2))

if __name__=="__main__": main()
