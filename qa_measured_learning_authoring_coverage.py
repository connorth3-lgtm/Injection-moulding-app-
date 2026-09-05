#!/usr/bin/env python3
"""Audit transient numeric authoring coverage separately from learner promotion."""
from __future__ import annotations
import hashlib, json, math
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PROOF=ROOT/'measured-source-proof'
FILES=[
 'mendeley-unreviewed-learning-candidates.json',
 '4h98-direct-unreviewed-learning-candidate.json',
 '6k8-pressure-unreviewed-learning-candidate.json',
 'gtnb-unreviewed-learning-candidates.json',
 'gtnb-rejection-unreviewed-learning-candidate.json',
 'sustainability-unreviewed-learning-candidates.json',
 'openmms-unreviewed-learning-candidates.json',
]
REPORT=PROOF/'measured-learning-authoring-coverage-v2.json'
SUSTAINABILITY='su13148102-supplement'
GENERATED_INDEX_MODE='generated-source-order-observation-index-v1'

def load(p): return json.loads(p.read_text(encoding='utf-8'))
def sha(v): return 'sha256:'+hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))
def rows(manifest):
    fields=manifest['fields']; return [dict(zip(fields,row)) for row in manifest['cases']]
def monotonic(xs,declared=None):
    inc=all(float(a)<=float(b) for a,b in zip(xs,xs[1:])); dec=all(float(a)>=float(b) for a,b in zip(xs,xs[1:]))
    if not (inc or dec): return False
    actual='increasing' if inc else 'decreasing'
    return declared in (None,actual)
def main():
    manifest=rows(load(ROOT/'data/measured-learning/manifest-v1.json')); by_id={c['id']:c for c in manifest}
    readiness={s['datasetId']:s for s in load(ROOT/'data/measured-learning/source-readiness-v2.json')['sources']}
    ready={k for k,v in readiness.items() if v.get('promotionReady')}
    artifacts={s['datasetId']:{a['name']:a for a in s.get('artifacts',[])} for s in load(ROOT/'data/measured-learning/source-artifacts-v2.json')['sources']}
    channels={s['datasetId']:{c['sourceChannel']:c for c in s.get('channels',[])} for s in load(ROOT/'data/measured-learning/source-channels-v2.json')['sources']}
    methods={m['id']:m for m in load(ROOT/'data/measured-learning/feature-methods-v1.json')['methods']}
    ready_slots={c['id'] for c in manifest if c['sourceFamily'] in ready}
    assert len(ready_slots)==30, f'current source-ready catalogue slot count drifted: {len(ready_slots)}'
    candidate_ids=set(); candidate_fps=set(); numeric_coverage=set(); direct_coverage=set(); source_counts={}; details=[]
    for filename in FILES:
        path=PROOF/filename; assert path.is_file(), f'missing authoring candidate artifact: {filename}'
        doc=load(path); assert doc.get('status')=='unreviewed-source-derived-candidates' and doc.get('promotionEligible') is False
        assert doc.get('candidateCount')==len(doc.get('candidates',[]))
        for c in doc['candidates']:
            cid=c['candidateId']; dataset=c['datasetId']; artifact=c['sourceArtifact']
            assert cid not in candidate_ids, f'duplicate candidate id {cid}'; candidate_ids.add(cid)
            assert dataset in ready, f'{cid}: candidate source is not promotion-ready: {dataset}'
            assert artifact in artifacts.get(dataset,{}), f'{cid}: unregistered artifact {artifact}'
            assert c['sourceFingerprint']==artifacts[dataset][artifact]['sha256'], f'{cid}: artifact hash mismatch'
            member=c.get('sourceMember')
            if member is not None: assert member in artifacts[dataset][artifact].get('members',[]), f'{cid}: unregistered archive member'
            signals=c.get('signals',[]); assert signals and c.get('candidateFingerprint')==sha(signals)
            assert c['candidateFingerprint'] not in candidate_fps, f'{cid}: duplicate numeric representation'; candidate_fps.add(c['candidateFingerprint'])
            suggested=set(c.get('suggestedCatalogueCases',[])); assert suggested, f'{cid}: no catalogue mapping'
            assert not (suggested-set(by_id)), f'{cid}: unknown catalogue ids'
            assert all(by_id[i]['sourceFamily']==dataset for i in suggested), f'{cid}: mapped to wrong source family'
            numeric_coverage.update(suggested)
            direct=True; reasons=list(c.get('bindingBlockers',[]))
            governed=channels.get(dataset,{})
            signal_ids={s.get('id') for s in signals}
            for s in signals:
                rep=s.get('representation',{}); xs=rep.get('x',[]); ys=rep.get('y',[])
                assert 1<len(xs)==len(ys)<=600 and all(finite(v) for v in xs+ys), f'{cid}/{s.get("id")}: invalid numeric representation'
                assert monotonic(xs,rep.get('xDirection')), f'{cid}/{s.get("id")}: invalid monotonic axis declaration'
                assert s.get('representationFingerprint')==sha(rep), f'{cid}/{s.get("id")}: representation fingerprint mismatch'
                source_channel=s.get('sourceChannel'); g=governed.get(source_channel)
                if not g:
                    direct=False; reasons.append(f'unregistered-channel:{source_channel}'); continue
                if s.get('semantic')!=g.get('semantic') or s.get('unit')!=g.get('unit'):
                    direct=False; reasons.append(f'transformed-semantic:{source_channel}')
                if rep.get('xSemantic')!=g.get('coordinateSemantic') or rep.get('xUnit')!=g.get('coordinateUnit'):
                    direct=False; reasons.append(f'coordinate-review:{source_channel}')
                if dataset==SUSTAINABILITY:
                    assert g.get('coordinateChannel')=='generated-observation-index', f'{cid}/{source_channel}: Sustainability registry must use generated observation index'
                    assert rep.get('coordinateMode')==GENERATED_INDEX_MODE, f'{cid}/{source_channel}: generated coordinate mode missing or drifted'
                    expected=[float(i) for i in range(1,len(xs)+1)]
                    assert xs==expected, f'{cid}/{source_channel}: generated observation index must be exact 1..N'
                    assert rep.get('xSemantic')=='observation-index' and rep.get('xUnit')=='index' and rep.get('xDirection')=='increasing', f'{cid}/{source_channel}: generated observation coordinate declaration drifted'
                    reduction=str(rep.get('reductionMethod','')).lower()
                    assert 'source-order' in reduction and 'sort' not in reduction, f'{cid}/{source_channel}: generated index must preserve source order without sorting'
                    assert s.get('coordinateRequiresBindingReview') is False, f'{cid}/{source_channel}: governed generated observation index must not remain coordinate-review-blocked'
            if dataset==SUSTAINABILITY:
                assert c.get('sourceScope',{}).get('coordinateMode')==GENERATED_INDEX_MODE, f'{cid}: Sustainability source scope must declare generated coordinate mode'
                assert c.get('sourceScope',{}).get('selectedSourceRowFingerprint','').startswith('sha256:'), f'{cid}: selected source-row identity fingerprint required'
            recommended_features=c.get('recommendedFeatures',[])
            for feature in recommended_features:
                method_id=feature.get('method'); registered=methods.get(method_id)
                if not registered:
                    direct=False; reasons.append(f'unregistered-feature-method:{method_id}'); continue
                if int(feature.get('methodVersion',0))!=int(registered.get('version',0)):
                    direct=False; reasons.append(f'feature-method-version-drift:{method_id}')
                refs=feature.get('inputs') or []
                if not refs or any(not isinstance(ref,str) or not ref.startswith('signal:') or ref.split(':',1)[1] not in signal_ids for ref in refs):
                    direct=False; reasons.append(f'feature-input-review:{feature.get("id")}')
                method_unit=registered.get('unit')
                if method_unit is not None and feature.get('unit')!=method_unit:
                    direct=False; reasons.append(f'feature-unit-review:{feature.get("id")}')
            if 'MLM-039' in suggested:
                assert any(f.get('method')=='ratio_of_sums_percent' and int(f.get('methodVersion',0))==1 for f in recommended_features), 'MLM-039 candidate must carry the governed ratio-of-sums feature recipe'
            if c.get('bindingBlockers'): direct=False
            if direct: direct_coverage.update(suggested)
            source_counts[dataset]=source_counts.get(dataset,0)+1
            details.append({'candidateId':cid,'datasetId':dataset,'suggestedCatalogueCases':sorted(suggested),'directBindingShapeReady':direct,'directBindingBlockers':sorted(set(reasons)),'recommendedFeatureMethods':[f.get('method') for f in recommended_features]})
    assert numeric_coverage<=ready_slots, 'candidate coverage includes a source-blocked catalogue case'
    missing_numeric=sorted(ready_slots-numeric_coverage)
    missing_direct=sorted(ready_slots-direct_coverage)
    assert not missing_numeric, f'unexpected numeric candidate gaps: {missing_numeric}'
    assert not missing_direct, f'unexpected direct-binding gaps: {missing_direct}'
    assert len(direct_coverage)==30, f'direct-binding-shape coverage drifted: {len(direct_coverage)}'
    report={'schemaVersion':1,'status':'authoring-coverage-qa-passed','promotionReadySourceFamilies':sorted(ready),'sourceReadyCatalogueSlots':len(ready_slots),'numericAuthoringCandidateCount':len(candidate_ids),'numericCandidateCatalogueCoverage':len(numeric_coverage),'numericCandidateCaseIds':sorted(numeric_coverage),'numericCandidateGaps':missing_numeric,'directBindingShapeCatalogueCoverage':len(direct_coverage),'directBindingShapeCaseIds':sorted(direct_coverage),'directBindingShapeGaps':missing_direct,'candidateCountBySource':source_counts,'candidates':details,'promotedLearnerCases':0,'boundary':'Numeric and direct-binding-shape authoring coverage are not learner promotion. Candidate data remain unreviewed and cannot count as learner cases until case-specific wording, novelty and independent engineering review pass the promotion builder/QA.'}
    REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:report[k] for k in ('status','sourceReadyCatalogueSlots','numericAuthoringCandidateCount','numericCandidateCatalogueCoverage','numericCandidateGaps','directBindingShapeCatalogueCoverage','directBindingShapeGaps')},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
