#!/usr/bin/env python3
"""Fail-closed QA for transient source-derived measured-learning authoring candidates."""
from __future__ import annotations
import hashlib, json, math
from pathlib import Path

ROOT=Path(__file__).resolve().parent
CANDIDATES=ROOT/'measured-source-proof'/'mendeley-unreviewed-learning-candidates.json'
ARTIFACTS=ROOT/'data'/'measured-learning'/'source-artifacts-v2.json'
EXPECTED={
 'MEND-4H98-REPLICATE-SUMMARY-01',
 'MEND-6K8-FIGURE7-01',
 'MEND-6K8-FIGURE2-01',
 'MEND-YXZ-TENSILE_PLA-01',
 'MEND-YXZ-BENDING_PLA-01',
 'MEND-YXZ-TENSILE-BENDING-FORCE-01',
}

def canonical_sha(value):
    raw=json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')
    return 'sha256:'+hashlib.sha256(raw).hexdigest()

def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))

def monotonic_direction(xs):
    increasing=all(float(a)<=float(b) for a,b in zip(xs,xs[1:]))
    decreasing=all(float(a)>=float(b) for a,b in zip(xs,xs[1:]))
    assert increasing or decreasing, 'x axis is not monotonic in source order'
    return 'increasing' if increasing else 'decreasing'

def selected_artifacts(candidate, artifact_map):
    dataset=candidate['datasetId']
    if candidate.get('sourceArtifacts') is not None:
        assert candidate.get('sourceArtifact') in (None,'') and candidate.get('sourceFingerprint') in (None,''), f"{candidate['candidateId']}: multi-artifact candidate must not declare singular source fields"
        raw=candidate['sourceArtifacts']; assert isinstance(raw,list) and raw
        names=set(); selected=[]
        for item in raw:
            name=item.get('name'); digest=item.get('sha256')
            assert name and digest and name not in names, f"{candidate['candidateId']}: invalid multi-artifact entry"
            names.add(name)
            assert dataset in artifact_map and name in artifact_map[dataset], f"{candidate['candidateId']}: unregistered source artifact {name}"
            assert digest==artifact_map[dataset][name], f"{candidate['candidateId']}: source fingerprint drift {name}"
            selected.append(name)
        return set(selected)
    artifact=candidate.get('sourceArtifact'); source_fp=candidate.get('sourceFingerprint')
    assert dataset in artifact_map and artifact in artifact_map[dataset], f"{candidate['candidateId']}: unregistered source artifact"
    assert source_fp==artifact_map[dataset][artifact], f"{candidate['candidateId']}: source fingerprint drift"
    return {artifact}

def main():
    x=json.loads(CANDIDATES.read_text(encoding='utf-8'))
    assert x.get('status')=='unreviewed-source-derived-candidates'
    assert x.get('promotionEligible') is False
    cases=x.get('candidates',[])
    assert x.get('candidateCount')==len(cases)==6
    ids={c['candidateId'] for c in cases}
    assert ids==EXPECTED, f'candidate set drifted: {sorted(ids)}'
    artifact_map={}
    for source in json.loads(ARTIFACTS.read_text(encoding='utf-8')).get('sources',[]):
        artifact_map[source['datasetId']]={a['name']:a['sha256'] for a in source.get('artifacts',[])}
    seen_fp=set()
    for c in cases:
        selected=selected_artifacts(c,artifact_map)
        signals=c.get('signals',[]); assert signals
        assert c.get('candidateFingerprint')==canonical_sha(signals), f"{c['candidateId']}: candidate fingerprint drift"
        assert c['candidateFingerprint'] not in seen_fp, f"{c['candidateId']}: duplicate candidate representation"
        seen_fp.add(c['candidateFingerprint'])
        assert c.get('suggestedCatalogueCases'), f"{c['candidateId']}: no catalogue mapping"
        assert c.get('evidenceBoundary'), f"{c['candidateId']}: missing evidence boundary"
        for s in signals:
            rep=s.get('representation',{}); xs=rep.get('x',[]); ys=rep.get('y',[])
            assert 1 < len(xs)==len(ys)<=400, f"{c['candidateId']}/{s.get('id')}: invalid compact vector length"
            assert rep.get('originalPointCount',0)>=len(ys), f"{c['candidateId']}/{s.get('id')}: invalid source count"
            assert all(finite(v) for v in xs+ys), f"{c['candidateId']}/{s.get('id')}: non-finite value"
            direction=monotonic_direction(xs)
            if rep.get('xDirection') is not None:
                assert rep['xDirection']==direction, f"{c['candidateId']}/{s.get('id')}: declared xDirection mismatch"
            assert s.get('representationFingerprint')==canonical_sha(rep), f"{c['candidateId']}/{s.get('id')}: representation fingerprint drift"
            assert s.get('sourceChannel') and s.get('semantic') and s.get('unit'), f"{c['candidateId']}/{s.get('id')}: provenance metadata missing"
            if s.get('sourceArtifact'):
                assert s['sourceArtifact'] in selected, f"{c['candidateId']}/{s.get('id')}: signal references unselected source artifact"
    by_id={c['candidateId']:c for c in cases}
    fig7=by_id['MEND-6K8-FIGURE7-01']
    assert {s['semantic'] for s in fig7['signals']}=={'pressure-special-isothermal','specific-volume-special-isothermal'}
    h98=by_id['MEND-4H98-REPLICATE-SUMMARY-01']
    assert len(h98['signals'])==6
    combined=by_id['MEND-YXZ-TENSILE-BENDING-FORCE-01']
    assert combined['suggestedCatalogueCases']==['MLM-055']
    assert {s['sourceChannel'] for s in combined['signals']}=={'tensile_PLA!P','bending_PLA!R'}
    assert {s['unit'] for s in combined['signals']}=={'N'}
    assert {a['name'] for a in combined['sourceArtifacts']}=={'data_tensile_3d_print_d_ryan.xlsx','data_3pbending_3d_print_d_ryan.xlsx'}
    assert by_id['MEND-YXZ-TENSILE_PLA-01']['suggestedCatalogueCases']==['MLM-033']
    assert by_id['MEND-YXZ-BENDING_PLA-01']['suggestedCatalogueCases']==['MLM-034']
    print(json.dumps({'status':'candidate-qa-passed','candidateCount':len(cases),'candidateIds':sorted(ids)},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
