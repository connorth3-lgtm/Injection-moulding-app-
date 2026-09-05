#!/usr/bin/env python3
"""Retrieve exact ImPure cycles 250-255 and emit compact unreviewed learning candidates.

Only the four cavity channels already accepted by the project semantic review are used.
Raw publisher CSVs are temporary and are never committed or uploaded as workflow artifacts.
"""
from __future__ import annotations

import csv
import hashlib
import json
import tempfile
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data/measured-learning/source-artifacts-v2.json"
OUT = Path("measured-source-proof/impure-unreviewed-learning-candidates.json")
RECORD_API = "https://zenodo.org/api/records/6913660"
USER_AGENT = "MouldMaster-Measured-Learning-ImPure/1.0"
DATASET = "impure-pascoe-2022"
SELECTED = [250, 251, 252, 253, 254, 255]
EXPECTED_HEADERS = [
    "Time", "HydPressure[IRT/Pascoe]", "ScrewPosition[IRT/Pascoe]",
    "Analog Input[1]", "Analog Input[2]", "TempMold1[IRT/Pascoe]",
    "TempMold2[IRT/Pascoe]", "Pressure1[IRT/Pascoe]", "Pressure2[IRT/Pascoe]",
]
GOVERNED = {
    "Pressure1[IRT/Pascoe]": ("mould-cavity-1-pressure", "bar"),
    "Pressure2[IRT/Pascoe]": ("mould-cavity-2-pressure", "bar"),
    "TempMold1[IRT/Pascoe]": ("mould-cavity-1-contact-temperature", "degC"),
    "TempMold2[IRT/Pascoe]": ("mould-cavity-2-contact-temperature", "degC"),
}


def canonical_sha(value) -> str:
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return "sha256:"+hashlib.sha256(raw).hexdigest()


def fetch_json(url: str) -> dict:
    for attempt in range(6):
        try:
            with urlopen(Request(url,headers={"User-Agent":USER_AGENT}),timeout=90) as response:
                return json.load(response)
        except HTTPError as exc:
            if exc.code not in {429,500,502,503,504} or attempt==5: raise
            time.sleep(min(30,2**attempt))
    raise AssertionError("unreachable")


def download(url: str, target: Path, expected_size: int | None) -> str:
    digest=hashlib.sha256()
    for attempt in range(6):
        try:
            with urlopen(Request(url,headers={"User-Agent":USER_AGENT}),timeout=120) as response, target.open("wb") as out:
                for chunk in iter(lambda:response.read(1024*1024),b""):
                    out.write(chunk); digest.update(chunk)
            break
        except HTTPError as exc:
            if exc.code not in {429,500,502,503,504} or attempt==5: raise
            time.sleep(min(30,2**attempt)); digest=hashlib.sha256()
    if expected_size is not None and target.stat().st_size != expected_size:
        raise RuntimeError(f"ImPure size mismatch for {target.name}")
    return "sha256:"+digest.hexdigest()


def parse_clock(value: str) -> float:
    text=value.strip().replace(",", ".")
    for fmt in ("%H:%M:%S.%f","%H:%M:%S"):
        try:
            dt=datetime.strptime(text,fmt)
            return dt.hour*3600+dt.minute*60+dt.second+dt.microsecond/1_000_000
        except ValueError:
            pass
    raise ValueError(f"unparsed ImPure source time {value!r}")


def parse_cycle(path: Path) -> dict:
    times=[]; values={ch:[] for ch in GOVERNED}; day_offset=0.0; previous=None
    with path.open("r",encoding="utf-8-sig",newline="") as fh:
        reader=csv.DictReader(fh)
        if reader.fieldnames != EXPECTED_HEADERS:
            raise RuntimeError(f"ImPure schema drift: {reader.fieldnames}")
        for row in reader:
            raw_time=parse_clock(row["Time"])
            adjusted=raw_time+day_offset
            if previous is not None and adjusted < previous:
                if previous-adjusted > 12*3600:
                    day_offset += 86400.0; adjusted=raw_time+day_offset
                else:
                    raise RuntimeError("ImPure source time is not source-order monotonic")
            previous=adjusted; times.append(adjusted)
            for channel in GOVERNED:
                values[channel].append(float(row[channel].strip().replace(",",".")))
    if len(times)<3 or any(len(v)!=len(times) for v in values.values()):
        raise RuntimeError("ImPure cycle lacks complete governed cavity measurements")
    origin=times[0]; elapsed=[round(v-origin,9) for v in times]
    if not all(a<=b for a,b in zip(elapsed,elapsed[1:])):
        raise RuntimeError("ImPure elapsed source coordinate is not ordered")
    return {"x":elapsed,"values":values}


def decimation_indices(n: int, cap: int=240) -> list[int]:
    if n<=cap: return list(range(n))
    return [(i*(n-1))//(cap-1) for i in range(cap)]


def signal(channel: str, cycle: int, artifact: str, parsed: dict) -> dict:
    semantic,unit=GOVERNED[channel]; indices=decimation_indices(len(parsed["x"])); rep={
        "originalPointCount":len(parsed["x"]),
        "reductionMethod":"deterministic-even-index-decimation-v1; source-order; endpoints-preserved",
        "xSemantic":"elapsed-time-from-cycle-start","xUnit":"s","xDirection":"increasing",
        "x":[parsed["x"][i] for i in indices],
        "y":[parsed["values"][channel][i] for i in indices],
    }
    item={
        "id":f"c{cycle}-{channel.split('[')[0].lower()}",
        "sourceChannel":channel,"sourceArtifact":artifact,
        "label":f"Cycle {cycle} {semantic}","semantic":semantic,"unit":unit,
        "representation":rep,
    }
    item["representationFingerprint"]=canonical_sha(rep); return item


def candidate(candidate_id: str, suggested: list[str], artifacts: list[dict], signals: list[dict], description: str) -> dict:
    return {
        "candidateId":candidate_id,"datasetId":DATASET,
        "sourceReference":"doi:10.5281/zenodo.6913660",
        "sourceArtifacts":artifacts,
        "sourceScope":{"description":description,"sourceOrderingPreserved":True,"selectedCycles":SELECTED if len(artifacts)>1 else [250]},
        "signals":signals,"recommendedFeatures":[],"suggestedCatalogueCases":suggested,
        "bindingBlockers":[],"candidateFingerprint":canonical_sha(signals),
    }


def main() -> int:
    registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    source=next(s for s in registry["sources"] if s["datasetId"]==DATASET)
    governed_artifacts={a["name"]:a for a in source["artifacts"]}
    expected_names=[f"Pascoe_17_05_2022_Cycle{n}.csv" for n in SELECTED]
    if sorted(governed_artifacts) != sorted(expected_names):
        raise RuntimeError("ImPure measured-learning artifact selection drifted")
    record=fetch_json(RECORD_API)
    licence=((record.get("metadata") or {}).get("license") or {}).get("id")
    if licence != "cc-by-4.0": raise RuntimeError(f"ImPure licence drifted: {licence}")
    publisher={item["key"]:item for item in record.get("files",[])}
    parsed={}; selected=[]
    with tempfile.TemporaryDirectory(prefix="mouldmaster-impure-learning-") as temp:
        root=Path(temp)
        for cycle,name in zip(SELECTED,expected_names):
            if name not in publisher: raise RuntimeError(f"ImPure publisher file missing: {name}")
            item=publisher[name]; target=root/name
            digest=download(item["links"]["self"],target,item.get("size"))
            expected=governed_artifacts[name]["sha256"]
            if digest != expected: raise RuntimeError(f"ImPure SHA mismatch: {name}")
            parsed[cycle]=parse_cycle(target); selected.append({"name":name,"sha256":expected})
            target.unlink(missing_ok=True)

    pressure=[]; thermal=[]
    for cycle,name in zip(SELECTED,expected_names):
        pressure.extend([signal("Pressure1[IRT/Pascoe]",cycle,name,parsed[cycle]),signal("Pressure2[IRT/Pascoe]",cycle,name,parsed[cycle])])
        thermal.extend([signal("TempMold1[IRT/Pascoe]",cycle,name,parsed[cycle]),signal("TempMold2[IRT/Pascoe]",cycle,name,parsed[cycle])])
    single_artifact=[selected[0]]
    event=[
        signal("Pressure1[IRT/Pascoe]",250,expected_names[0],parsed[250]),
        signal("Pressure2[IRT/Pascoe]",250,expected_names[0],parsed[250]),
        signal("TempMold1[IRT/Pascoe]",250,expected_names[0],parsed[250]),
        signal("TempMold2[IRT/Pascoe]",250,expected_names[0],parsed[250]),
    ]
    candidates=[
        candidate("IMPURE-C250-255-PRESSURE-01",["MLM-005","MLM-012","MLM-032"],selected,pressure,"Six exact consecutive publisher cycle files; both source-backed cavity-pressure traces retained as bounded source-order representations."),
        candidate("IMPURE-C250-255-THERMAL-01",["MLM-006","MLM-011"],selected,thermal,"Six exact consecutive publisher cycle files; both source-backed cavity contact-temperature traces retained as bounded source-order representations."),
        candidate("IMPURE-C250-MULTISIGNAL-01",["MLM-020","MLM-023","MLM-024","MLM-060","MLM-061"],single_artifact,event,"One exact publisher cycle file with the four source-backed Kistler cavity channels on the source-derived elapsed-time coordinate."),
    ]
    source_boundary="Only the four previously accepted Kistler cavity channels are emitted: cavity 1/2 pressure and cavity 1/2 contact temperature. HydPressure, ScrewPosition and Analog Input[1]/[2] remain excluded. The traces support bounded measured comparisons only and do not establish a causal production diagnosis. Raw publisher rows/files are not retained."
    doc={
        "schemaVersion":1,"status":"unreviewed-source-derived-candidates","datasetId":DATASET,
        "promotionEligible":False,"candidateCount":len(candidates),"candidates":candidates,
        "boundary":source_boundary,
        "sourceBoundary":source_boundary,
    }
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(doc,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":doc["status"],"candidateCount":len(candidates),"catalogueCoverage":sorted({i for c in candidates for i in c["suggestedCatalogueCases"]}),"selectedArtifacts":expected_names},separators=(",",":")))
    return 0


if __name__=="__main__":
    raise SystemExit(main())
