#!/usr/bin/env python3
"""Audit transient numeric authoring coverage separately from learner promotion."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROOF = ROOT / "measured-source-proof"
FILES = [
    "mendeley-unreviewed-learning-candidates.json",
    "4h98-direct-unreviewed-learning-candidate.json",
    "6k8-pressure-unreviewed-learning-candidate.json",
    "gtnb-unreviewed-learning-candidates.json",
    "gtnb-rejection-unreviewed-learning-candidate.json",
    "sustainability-unreviewed-learning-candidates.json",
    "openmms-unreviewed-learning-candidates.json",
    "avaps-unreviewed-learning-candidates.json",
    "impure-unreviewed-learning-candidates.json",
]
REPORT = PROOF / "measured-learning-authoring-coverage-v2.json"
SUSTAINABILITY = "su13148102-supplement"
GENERATED_INDEX_MODE = "generated-source-order-observation-index-v1"


def load(path): return json.loads(path.read_text(encoding="utf-8"))
def sha(value): return "sha256:" + hashlib.sha256(json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
def finite(value): return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(float(value))
def rows(manifest):
    fields=manifest["fields"]; return [dict(zip(fields,row)) for row in manifest["cases"]]
def monotonic(xs, declared=None):
    inc=all(float(a)<=float(b) for a,b in zip(xs,xs[1:])); dec=all(float(a)>=float(b) for a,b in zip(xs,xs[1:]))
    if not (inc or dec): return False
    return declared in (None, "increasing" if inc else "decreasing")


def merged_channels():
    result={}; docs=[load(ROOT/"data/measured-learning/source-channels-v2.json")]
    for path in sorted((ROOT/"data/measured-learning").glob("source-channels-*-v2.json")):
        doc=load(path); docs.append({"sources":[{"datasetId":doc["datasetId"],"channels":doc.get("channels",[])}]} if "datasetId" in doc else doc)
    for doc in docs:
        for source in doc.get("sources",[]):
            bucket=result.setdefault(source["datasetId"],{})
            for channel in source.get("channels",[]):
                key=channel["sourceChannel"]; assert key not in bucket, f'duplicate channel {source["datasetId"]}/{key}'; bucket[key]=channel
    return result


def requirements(): return load(ROOT/"data/measured-learning/case-requirements-v2.json")
def required_capabilities(case):
    rules=requirements(); result=set()
    for tag in case.get("coverageTags",[]): result.update(rules.get("requirementsByCoverageTag",{}).get(tag,[]))
    result.update(rules.get("caseOverrides",{}).get(case["id"],[])); return result
def required_channels(case): return set(requirements().get("requiredSourceChannelsByCase",{}).get(case["id"],[]))
def case_ready(case, readiness, channels):
    gate=readiness.get(case["sourceFamily"],{})
    if gate.get("promotionReady") is not True: return False
    if any(gate.get("capabilities",{}).get(cap) is not True for cap in required_capabilities(case)): return False
    governed=channels.get(case["sourceFamily"],{})
    return all(governed.get(ch,{}).get("promotionReady") is True for ch in required_channels(case))


def candidate_members(candidate):
    raw=candidate.get("sourceMembers")
    if raw is None:
        single=candidate.get("sourceMember"); raw=[] if single is None else [single]
    assert isinstance(raw,list) and all(isinstance(v,str) and v for v in raw), f'{candidate.get("candidateId")}: invalid sourceMembers'
    assert len(raw)==len(set(raw)), f'{candidate.get("candidateId")}: duplicate sourceMembers'
    return set(raw)


def candidate_artifacts(candidate, registry):
    dataset=candidate["datasetId"]
    if candidate.get("sourceArtifacts") is not None:
        raw=candidate["sourceArtifacts"]
        assert candidate.get("sourceArtifact") in (None,"") and candidate.get("sourceFingerprint") in (None,""), f'{candidate["candidateId"]}: multi-artifact candidate must not declare singular artifact fields'
        assert isinstance(raw,list) and raw, f'{candidate["candidateId"]}: sourceArtifacts must be a non-empty list'
        selected=[]; names=set()
        for item in raw:
            assert isinstance(item,dict) and item.get("name") and item.get("sha256"), f'{candidate["candidateId"]}: invalid sourceArtifacts entry'
            name=item["name"]; digest=item["sha256"]
            assert name not in names, f'{candidate["candidateId"]}: duplicate selected artifact {name}'; names.add(name)
            assert name in registry.get(dataset,{}), f'{candidate["candidateId"]}: unregistered artifact {name}'
            assert digest==registry[dataset][name]["sha256"], f'{candidate["candidateId"]}: artifact hash mismatch {name}'
            selected.append({"name":name,"sha256":digest})
        return sorted(selected,key=lambda item:item["name"])
    name=candidate.get("sourceArtifact"); digest=candidate.get("sourceFingerprint")
    assert name in registry.get(dataset,{}), f'{candidate["candidateId"]}: unregistered artifact {name}'
    assert digest==registry[dataset][name]["sha256"], f'{candidate["candidateId"]}: artifact hash mismatch'
    return [{"name":name,"sha256":digest}]


def main():
    manifest=rows(load(ROOT/"data/measured-learning/manifest-v1.json")); by_id={c["id"]:c for c in manifest}
    readiness={s["datasetId"]:s for s in load(ROOT/"data/measured-learning/source-readiness-v2.json")["sources"]}
    ready={k for k,v in readiness.items() if v.get("promotionReady")}
    artifacts={s["datasetId"]:{a["name"]:a for a in s.get("artifacts",[])} for s in load(ROOT/"data/measured-learning/source-artifacts-v2.json")["sources"]}
    channels=merged_channels(); methods={m["id"]:m for m in load(ROOT/"data/measured-learning/feature-methods-v1.json")["methods"]}
    ready_slots={c["id"] for c in manifest if case_ready(c,readiness,channels)}
    assert len(ready_slots)==53, f'current case-level source/channel-ready catalogue slot count drifted: {len(ready_slots)}'
    assert "MLM-037" not in ready_slots, "AVAPS dimension case must remain blocked while distanceA transform is unresolved"
    impure_ids={"MLM-005","MLM-006","MLM-011","MLM-012","MLM-020","MLM-023","MLM-024","MLM-032","MLM-060","MLM-061"}
    assert impure_ids <= ready_slots, f'ImPure governed case set incomplete: {sorted(impure_ids-ready_slots)}'

    candidate_ids=set(); candidate_fps=set(); numeric_coverage=set(); direct_coverage=set(); source_counts={}; details=[]
    for filename in FILES:
        path=PROOF/filename; assert path.is_file(), f'missing authoring candidate artifact: {filename}'
        doc=load(path); assert doc.get("status")=="unreviewed-source-derived-candidates" and doc.get("promotionEligible") is False
        assert doc.get("candidateCount")==len(doc.get("candidates",[]))
        for c in doc["candidates"]:
            cid=c["candidateId"]; dataset=c["datasetId"]
            assert cid not in candidate_ids, f'duplicate candidate id {cid}'; candidate_ids.add(cid)
            assert dataset in ready, f'{cid}: candidate source is not promotion-ready: {dataset}'
            selected_artifacts=candidate_artifacts(c,artifacts); selected_names={a["name"] for a in selected_artifacts}
            signals=c.get("signals",[]); assert signals and c.get("candidateFingerprint")==sha(signals)
            assert c["candidateFingerprint"] not in candidate_fps, f'{cid}: duplicate numeric representation'; candidate_fps.add(c["candidateFingerprint"])
            suggested=set(c.get("suggestedCatalogueCases",[])); assert suggested, f'{cid}: no catalogue mapping'
            assert not (suggested-set(by_id)), f'{cid}: unknown catalogue ids'
            assert all(by_id[i]["sourceFamily"]==dataset for i in suggested), f'{cid}: mapped to wrong source family'
            assert suggested<=ready_slots, f'{cid}: maps to blocked cases: {sorted(suggested-ready_slots)}'
            source_channels={s.get("sourceChannel") for s in signals}
            for case_id in suggested:
                missing=required_channels(by_id[case_id])-source_channels
                assert not missing, f'{cid}/{case_id}: missing required source channels {sorted(missing)}'
            numeric_coverage.update(suggested)

            direct=True; reasons=list(c.get("bindingBlockers",[])); governed=channels.get(dataset,{}); signal_ids={s.get("id") for s in signals}; governed_members=set()
            for signal in signals:
                rep=signal.get("representation",{}); xs=rep.get("x",[]); ys=rep.get("y",[])
                assert 1<len(xs)==len(ys)<=600 and all(finite(v) for v in xs+ys), f'{cid}/{signal.get("id")}: invalid numeric representation'
                assert monotonic(xs,rep.get("xDirection")), f'{cid}/{signal.get("id")}: invalid monotonic axis declaration'
                assert signal.get("representationFingerprint")==sha(rep), f'{cid}/{signal.get("id")}: representation fingerprint mismatch'
                ch=signal.get("sourceChannel"); g=governed.get(ch)
                if not g: direct=False; reasons.append(f'unregistered-channel:{ch}'); continue
                if g.get("promotionReady") is not True: direct=False; reasons.append(f'blocked-channel:{ch}')
                if signal.get("semantic")!=g.get("semantic") or signal.get("unit")!=g.get("unit"): direct=False; reasons.append(f'transformed-semantic:{ch}')
                if rep.get("xSemantic")!=g.get("coordinateSemantic") or rep.get("xUnit")!=g.get("coordinateUnit"): direct=False; reasons.append(f'coordinate-review:{ch}')
                if signal.get("sourceArtifact") and signal["sourceArtifact"] not in selected_names: direct=False; reasons.append(f'unselected-artifact:{signal["sourceArtifact"]}')
                if g.get("sourceMember"): governed_members.add(g["sourceMember"])
                if dataset==SUSTAINABILITY:
                    assert g.get("coordinateChannel")=="generated-observation-index"
                    assert rep.get("coordinateMode")==GENERATED_INDEX_MODE
                    assert xs==[float(i) for i in range(1,len(xs)+1)]
                    assert rep.get("xSemantic")=="observation-index" and rep.get("xUnit")=="index" and rep.get("xDirection")=="increasing"
                    reduction=str(rep.get("reductionMethod","")).lower(); assert "source-order" in reduction and "sort" not in reduction
                    assert signal.get("coordinateRequiresBindingReview") is False
            members=candidate_members(c)
            if governed_members: assert members==governed_members, f'{cid}: sourceMembers must exactly match governed bound-channel members'
            elif members:
                assert len(selected_artifacts)==1, f'{cid}: archive members require one selected artifact'
                assert members<=set(artifacts[dataset][selected_artifacts[0]["name"]].get("members",[])), f'{cid}: unregistered archive member'
            if dataset==SUSTAINABILITY:
                assert c.get("sourceScope",{}).get("coordinateMode")==GENERATED_INDEX_MODE
                assert c.get("sourceScope",{}).get("selectedSourceRowFingerprint","").startswith("sha256:")
            for feature in c.get("recommendedFeatures",[]):
                method_id=feature.get("method"); registered=methods.get(method_id)
                if not registered: direct=False; reasons.append(f'unregistered-feature-method:{method_id}'); continue
                if int(feature.get("methodVersion",0))!=int(registered.get("version",0)): direct=False; reasons.append(f'feature-method-version-drift:{method_id}')
                refs=feature.get("inputs") or []
                if not refs or any(not isinstance(ref,str) or not ref.startswith("signal:") or ref.split(":",1)[1] not in signal_ids for ref in refs): direct=False; reasons.append(f'feature-input-review:{feature.get("id")}')
                if registered.get("unit") is not None and feature.get("unit")!=registered.get("unit"): direct=False; reasons.append(f'feature-unit-review:{feature.get("id")}')
            if "MLM-039" in suggested:
                assert any(f.get("method")=="ratio_of_sums_percent" and int(f.get("methodVersion",0))==1 for f in c.get("recommendedFeatures",[]))
            if c.get("bindingBlockers"): direct=False
            if direct: direct_coverage.update(suggested)
            source_counts[dataset]=source_counts.get(dataset,0)+1
            details.append({"candidateId":cid,"datasetId":dataset,"selectedArtifacts":[a["name"] for a in selected_artifacts],"suggestedCatalogueCases":sorted(suggested),"directBindingShapeReady":direct,"directBindingBlockers":sorted(set(reasons)),"recommendedFeatureMethods":[f.get("method") for f in c.get("recommendedFeatures",[])]})

    assert numeric_coverage<=ready_slots, "candidate coverage includes a blocked catalogue case"
    missing_numeric=sorted(ready_slots-numeric_coverage); missing_direct=sorted(ready_slots-direct_coverage)
    assert not missing_numeric, f'unexpected numeric candidate gaps: {missing_numeric}'
    assert not missing_direct, f'unexpected direct-binding gaps: {missing_direct}'
    assert len(direct_coverage)==53, f'direct-binding-shape coverage drifted: {len(direct_coverage)}'
    report={
        "schemaVersion":3,"status":"authoring-coverage-qa-passed","promotionReadySourceFamilies":sorted(ready),
        "sourceAndChannelReadyCatalogueSlots":len(ready_slots),"sourceAndChannelReadyCaseIds":sorted(ready_slots),
        "numericAuthoringCandidateCount":len(candidate_ids),"numericCandidateCatalogueCoverage":len(numeric_coverage),"numericCandidateCaseIds":sorted(numeric_coverage),"numericCandidateGaps":missing_numeric,
        "directBindingShapeCatalogueCoverage":len(direct_coverage),"directBindingShapeCaseIds":sorted(direct_coverage),"directBindingShapeGaps":missing_direct,
        "candidateCountBySource":source_counts,"candidates":details,"promotedLearnerCases":0,
        "blockedKnownCaseReasons":{"MLM-037":"AVAPS distanceA source transform remains unresolved; pressure/flow/weight readiness does not authorize the dimension channel."},
        "boundary":"Numeric and direct-binding-shape authoring coverage are not learner promotion. Multi-file candidates retain every exact publisher artifact identity; case-specific wording, novelty and independent engineering review are still required before promotion."
    }
    REPORT.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:report[k] for k in ("status","sourceAndChannelReadyCatalogueSlots","numericAuthoringCandidateCount","numericCandidateCatalogueCoverage","numericCandidateGaps","directBindingShapeCatalogueCoverage","directBindingShapeGaps")},separators=(",",":")))
    return 0


if __name__=="__main__":
    raise SystemExit(main())
