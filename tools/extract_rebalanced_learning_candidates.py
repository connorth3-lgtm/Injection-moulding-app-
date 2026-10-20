#!/usr/bin/env python3
"""Build distinct unreviewed authoring candidates for V2 source rebalances.

This tool does not retrieve or invent measurements. It derives smaller, case-specific
representations from already hash-verified transient authoring candidates produced
in the same workflow. Restricted iGuzzini/FHJ data are never copied or re-licensed.
"""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "measured-source-proof"
OUT = PROOF / "rebalanced-unreviewed-learning-candidates.json"


def load(name: str) -> dict:
    return json.loads((PROOF / name).read_text(encoding="utf-8"))


def sha(value) -> str:
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return "sha256:"+hashlib.sha256(raw).hexdigest()


def find(doc: dict, candidate_id: str) -> dict:
    return next(c for c in doc["candidates"] if c["candidateId"]==candidate_id)


def choose_signals(parent: dict, channels: list[str], start: int | None = None, end: int | None = None) -> list[dict]:
    by_channel={s["sourceChannel"]:s for s in parent["signals"]}
    result=[]
    for channel in channels:
        if channel not in by_channel:
            raise AssertionError(f"{parent['candidateId']}: missing channel {channel}")
        signal=copy.deepcopy(by_channel[channel])
        if start is not None or end is not None:
            rep=signal["representation"]
            xs=rep["x"][start:end]; ys=rep["y"][start:end]
            if len(xs) != len(ys) or len(xs) < 2:
                raise AssertionError(f"{parent['candidateId']}/{channel}: invalid slice")
            rep["x"]=xs; rep["y"]=ys; rep["originalPointCount"]=len(ys)
            rep["reductionMethod"]=str(rep.get("reductionMethod", "source-order"))+";fixed-case-authoring-window-v1"
            signal["representationFingerprint"]=sha(rep)
        result.append(signal)
    return result


def make(parent: dict, candidate_id: str, cases: list[str], channels: list[str], start: int | None = None, end: int | None = None, note: str = "") -> dict:
    signals=choose_signals(parent,channels,start,end)
    candidate={
        "candidateId":candidate_id,
        "datasetId":parent["datasetId"],
        "sourceArtifact":parent.get("sourceArtifact"),
        "sourceFingerprint":parent.get("sourceFingerprint"),
        "sourceScope":copy.deepcopy(parent.get("sourceScope",{})),
        "signals":signals,
        "candidateFingerprint":sha(signals),
        "suggestedCatalogueCases":cases,
        "evidenceBoundary":parent.get("evidenceBoundary","")+" Rebalance boundary: "+note,
    }
    if parent.get("sourceMember") is not None: candidate["sourceMember"]=parent["sourceMember"]
    if parent.get("sourceMembers") is not None: candidate["sourceMembers"]=copy.deepcopy(parent["sourceMembers"])
    if start is not None or end is not None:
        candidate["sourceScope"]["parentCandidateId"]=parent["candidateId"]
        candidate["sourceScope"]["fixedRepresentationSlice"]={"startInclusive":start or 0,"endExclusive":end}
        candidate["sourceScope"]["selectionRule"]="fixed non-overlapping array-index slice of the existing source-order authoring representation; no sorting or value-based selection"
    return candidate


def main() -> int:
    gtnb=load("gtnb-unreviewed-learning-candidates.json")
    direct=load("4h98-direct-unreviewed-learning-candidate.json")
    sust=load("sustainability-unreviewed-learning-candidates.json")
    quality=find(gtnb,"GTNB-QUALITY-ASSOCIATION-01")
    group=find(gtnb,"GTNB-LARGEST-PRODUCT-GROUP-01")
    mech=find(direct,"MEND-4H98-DIRECT-REPLICATES-01")
    material=find(sust,"SUST-MATERIAL-GROUP-01")

    candidates=[
        make(quality,"REBAL-GTNB-MLM013-01",["MLM-013"],["Injection_Pressure","%Defective"],0,60,"Open GTNB source replaces research/education-only iGuzzini for distribution-shift authoring."),
        make(quality,"REBAL-GTNB-MLM035-01",["MLM-035"],["Injection_Pressure","Retention_Pressure","Mold_Temp","%Defective"],70,130,"Open GTNB source replaces iGuzzini for multivariate outlier review; no root cause is assigned."),
        make(quality,"REBAL-GTNB-MLM041-01",["MLM-041"],["Injection_Pressure","Mold_Temp","%Defective"],140,200,"Open process and recorded quality outcomes replace the restricted categorical-quality source."),
        make(quality,"REBAL-GTNB-MLM042-01",["MLM-042"],["Injection_Pressure","Retention_Pressure","%Defective"],210,270,"The authoring window supports process/outcome comparison but does not pre-select or claim a causal pair."),
        make(quality,"REBAL-GTNB-MLM065-01",["MLM-065"],["Injection_Pressure","%Defective","%Flash"],280,340,"Association is measurable; production root cause remains unsupported."),
        make(group,"REBAL-GTNB-MLM070-01",["MLM-070"],["Injection_Pressure","Cycle_Time","Product_Weight"],5,55,"An incomplete open process/outcome window supports choosing a next measurement without assuming a diagnosis."),
        make(mech,"REBAL-4H98-MLM029-01",["MLM-029"],["Sheet1!E:I"],0,50,"CC BY 4.0 direct tensile-modulus replicates replace the noncommercial FHJ dependency."),
        make(mech,"REBAL-4H98-MLM048-01",["MLM-048"],["Sheet1!E:I","Sheet1!Q:U"],60,110,"Two direct physical replicate families support comparison without using CC BY-NC data."),
        make(mech,"REBAL-4H98-MLM069-01",["MLM-069"],["Sheet1!K:O","Sheet1!Q:U"],120,170,"Mechanical-test evidence remains explicitly insufficient for a production root-cause claim."),
        make(material,"REBAL-SUST-MLM037-01",["MLM-037"],["Max Inj Pres, MPa","Melt Temp, C","Thickness, mm"],None,None,"Direct unit-bearing DOE process measurements and specimen thickness replace the unresolved AVAPS distance transform; no AVAPS offset is inferred."),
    ]
    ids=[c["candidateId"] for c in candidates]
    fps=[c["candidateFingerprint"] for c in candidates]
    if len(ids)!=len(set(ids)) or len(fps)!=len(set(fps)):
        raise AssertionError("rebalanced candidate identities must be unique")
    doc={
        "schemaVersion":1,
        "status":"unreviewed-source-derived-candidates",
        "promotionEligible":False,
        "candidateCount":len(candidates),
        "candidates":candidates,
        "boundary":"These are deterministic authoring candidates from already proven open-source measurements. They do not constitute independent review or learner promotion, and the original restricted/unresolved sources remain blocked rather than being re-licensed or numerically inferred."
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(doc,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":doc["status"],"candidateCount":len(candidates),"catalogueCoverage":sorted(c for x in candidates for c in x["suggestedCatalogueCases"])},separators=(",",":")))
    return 0


if __name__=="__main__": raise SystemExit(main())
