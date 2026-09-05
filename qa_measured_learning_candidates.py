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
}

def canonical_sha(value):
    raw=json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')
    return 'sha256:'+hashlib.sha256(raw).hexdigest()

def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))

def main():
    x=json.loads(CANDIDATES.read_text(encoding='utf-8'))
    assert x.get('status')=='unreviewed-source-derived-candidates'
    assert x.get('promotionEligible') is False
    cases=x.get('candidates',[])
    assert x.get('candidateCount')==len(cases)==5
    ids={c['candidateId'] for c in cases}
    assert ids==EXPECTED, f'candidate set drifted: {sorted(ids)}'
    artifact_map={}
    for source in json.loads(ARTIFACTS.read_text(encoding='utf-8')).get('sources',[]):
        artifact_map[source['datasetId']]={a['name']:a['sha256'] for a in source.get('artifacts',[])}
    seen_fp=set()
    for c in cases:
        dataset=c['datasetId']; artifact=c['sourceArtifact']; source_fp=c['sourceFingerprint']
        assert dataset in artifact_map and artifact in artifact_map[dataset], f"{c['candidateId']}: unregistered source artifact"
        assert source_fp==artifact_map[dataset][artifact], f"{c['candidateId']}: source fingerprint drift"
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
            assert all(float(a)<=float(b) for a,b in zip(xs,xs[1:])), f"{c['candidateId']}/{s.get('id')}: x axis not monotonic"
            assert s.get('representationFingerprint')==canonical_sha(rep), f"{c['candidateId']}/{s.get('id')}: representation fingerprint drift"
            assert s.get('sourceChannel') and s.get('semantic') and s.get('unit'), f"{c['candidateId']}/{s.get('id')}: provenance metadata missing"
    # Guard expected physical domains without turning them into causal claims.
    by_id={c['candidateId']:c for c in cases}
    fig7=by_id['MEND-6K8-FIGURE7-01']
    assert {s['semantic'] for s in fig7['signals']}=={'pressure-special-isothermal','specific-volume-special-isothermal'}
    h98=by_id['MEND-4H98-REPLICATE-SUMMARY-01']
    assert len(h98['signals'])==6
    print(json.dumps({'status':'candidate-qa-passed','candidateCount':len(cases),'candidateIds':sorted(ids)},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
