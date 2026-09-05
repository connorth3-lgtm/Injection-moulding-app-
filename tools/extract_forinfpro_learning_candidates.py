#!/usr/bin/env python3
"""Retrieve the exact FORinFPRO machine cycle and emit a compact unreviewed candidate.

Only source-accepted ENGEL Heating.sv_Zone*.rActualTemp channels are used. The visible
release contains one cycle; the candidate therefore supports within-cycle interpretation
and the explicit evidence boundary that one cycle cannot establish repeatability.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import tempfile
import urllib.request
from datetime import datetime
from pathlib import Path

OUT = Path("measured-source-proof/forinfpro-unreviewed-learning-candidates.json")
URL = "https://zenodo.org/records/20744054/files/cycle_001_machine_data.csv?download=1"
NAME = "cycle_001_machine_data.csv"
SHA = "d249cbe4980b00f1565a100c3363dde4cf621c490233a4c184d47ad8d202e480"
ROWS = 10132
TIME = "Datum/Zeit"
SELECTED = [
    "Heating.sv_Zone14.rActualTemp",
    "Heating.sv_Zone13.rActualTemp",
    "Heating.sv_Zone12.rActualTemp",
    "Heating.sv_Zone11.rActualTemp",
]


def canonical_sha(value) -> str:
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return "sha256:"+hashlib.sha256(raw).hexdigest()


def parse_number(value: str) -> float:
    text=value.strip().replace("\u00a0","")
    if text.count(",")==1 and "." not in text: text=text.replace(",",".")
    number=float(text)
    if not math.isfinite(number): raise ValueError("non-finite FORinFPRO numeric value")
    return number


def parse_time(value: str) -> datetime:
    text=value.strip()
    for fmt in (
        "%d.%m.%Y %H:%M:%S.%f","%d.%m.%Y %H:%M:%S,%f","%d.%m.%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f","%Y-%m-%d %H:%M:%S,%f","%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f","%Y-%m-%dT%H:%M:%S",
    ):
        try: return datetime.strptime(text,fmt)
        except ValueError: pass
    try: return datetime.fromisoformat(text.replace("Z","+00:00")).replace(tzinfo=None)
    except ValueError as exc: raise ValueError(f"unparsed FORinFPRO timestamp {text!r}") from exc


def indices(n: int, cap: int=320) -> list[int]:
    if n<=cap: return list(range(n))
    return [(i*(n-1))//(cap-1) for i in range(cap)]


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="mouldmaster-forinfpro-learning-") as temp:
        path=Path(temp)/NAME
        req=urllib.request.Request(URL,headers={"User-Agent":"MouldMaster-measured-learning/2"})
        digest=hashlib.sha256()
        with urllib.request.urlopen(req,timeout=180) as response, path.open("wb") as out:
            for chunk in iter(lambda:response.read(1024*1024),b""):
                out.write(chunk); digest.update(chunk)
        if digest.hexdigest()!=SHA: raise SystemExit(f"FORinFPRO machine CSV SHA mismatch: {digest.hexdigest()}")
        times=[]; values={name:[] for name in SELECTED}; delivered_columns=None; rows=0
        with path.open("r",encoding="utf-8-sig",newline="") as fh:
            reader=csv.reader(fh,delimiter=";"); headers=next(reader); delivered_columns=len(headers)
            missing=[name for name in [TIME,*SELECTED] if name not in headers]
            if missing: raise SystemExit(f"FORinFPRO required headers missing: {missing}")
            time_i=headers.index(TIME); value_i={name:headers.index(name) for name in SELECTED}
            for row in reader:
                rows+=1
                if len(row)!=len(headers): raise SystemExit(f"FORinFPRO width drift at row {rows}")
                times.append(parse_time(row[time_i]))
                for name in SELECTED: values[name].append(parse_number(row[value_i[name]]))
        if rows!=ROWS: raise SystemExit(f"FORinFPRO row count drift: {rows}")
        deltas=[(b-a).total_seconds() for a,b in zip(times,times[1:])]
        if not deltas or not all(delta>0 for delta in deltas): raise SystemExit("FORinFPRO delivered time is not strictly increasing")
        origin=times[0]; elapsed=[round((t-origin).total_seconds(),9) for t in times]
        keep=indices(rows)

    signals=[]
    for name in SELECTED:
        zone=name.split("Zone",1)[1].split(".",1)[0]
        rep={
            "originalPointCount":rows,
            "reductionMethod":"deterministic-even-index-decimation-v1; source-order; endpoints-preserved",
            "xSemantic":"elapsed-time-from-cycle-start","xUnit":"s","xDirection":"increasing",
            "x":[elapsed[i] for i in keep],"y":[values[name][i] for i in keep],
        }
        signals.append({
            "id":f"zone-{zone}-actual-temp","sourceChannel":name,"sourceArtifact":NAME,
            "label":f"ENGEL heating zone {zone} actual temperature",
            "semantic":f"engel-heating-zone-{zone}-actual-temperature","unit":"degC",
            "representation":rep,"representationFingerprint":canonical_sha(rep),
        })
    candidate={
        "candidateId":"FORINFPRO-CYCLE001-HEATING-ACTUAL-01","datasetId":"forinfpro-himd-v1",
        "sourceReference":"doi:10.5281/zenodo.20744054","sourceArtifact":NAME,"sourceFingerprint":"sha256:"+SHA,
        "sourceScope":{
            "description":"One exact publisher machine-data cycle; four first-party-governed ENGEL rActualTemp channels on source-derived elapsed time.",
            "sourceOrderingPreserved":True,"visibleReleaseCycles":1,"deliveredRows":rows,"deliveredColumns":delivered_columns,
            "timeDeltaSeconds":{"minimum":min(deltas),"maximum":max(deltas)},
            "physicalZoneAffiliationRelabelled":False,
        },
        "signals":signals,"recommendedFeatures":[],
        "suggestedCatalogueCases":["MLM-028","MLM-062","MLM-063","MLM-068"],
        "bindingBlockers":[],"candidateFingerprint":canonical_sha(signals),
    }
    doc={
        "schemaVersion":1,"status":"unreviewed-source-derived-candidates","datasetId":"forinfpro-himd-v1","promotionEligible":False,
        "candidateCount":1,"candidates":[candidate],
        "sourceBoundary":"Only accepted ENGEL Heating.sv_Zone*.rActualTemp actual-temperature channels are emitted. One visible cycle cannot establish repeatability; other unit-limited machine, cavity and ultrasonic channels remain excluded.",
    }
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(doc,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":doc["status"],"candidateCount":1,"catalogueCoverage":candidate["suggestedCatalogueCases"],"selectedChannels":SELECTED,"displayedPointsPerSignal":len(keep)},separators=(",",":")))
    return 0


if __name__=="__main__": raise SystemExit(main())
