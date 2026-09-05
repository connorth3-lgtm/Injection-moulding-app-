#!/usr/bin/env python3
"""Extract compact, unreviewed Sustainability DOE measured-learning candidates."""
from __future__ import annotations
import csv, hashlib, io, json, math, tempfile, zipfile
from collections import Counter
from pathlib import Path

from prove_sustainability_measured_source import retrieve, EXPECTED_SHA, MEMBER, EXPECTED_ROWS

OUT=Path('measured-source-proof/sustainability-unreviewed-learning-candidates.json')
META={
 'Cycle Time, s':('cycle-time','s'),
 'Max Inj Pres, MPa':('maximum-injection-pressure','MPa'),
 'Max Cav1 Pres, MPa':('maximum-cavity-1-pressure','MPa'),
 'Inj Flow Rate, ccps':('injection-flow-rate','cm3/s'),
 'Melt Temp, C':('melt-temperature','degC'),
 'Thickness, mm':('specimen-thickness','mm'),
 'Max Strain, pct':('maximum-strain','%'),
 'Ult Stress, MPa':('ultimate-stress','MPa'),
 'Modulus, MPa':('tensile-modulus','MPa'),
 'Toughness, MJ/m^3':('toughness','MJ/m3'),
}

def canonical_sha(v):
    return 'sha256:'+hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()

def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))

def parse_float(v):
    try:
        n=float(v); return n if math.isfinite(n) else None
    except Exception: return None

def uniform(rows,limit=190):
    if len(rows)<=limit:return rows
    idx=sorted({round(i*(len(rows)-1)/(limit-1)) for i in range(limit)})
    return [rows[i] for i in idx]

def make_signal(field,rows):
    semantic,unit=META[field]
    points=[r for r in rows if finite(r['_cycle']) and finite(r[field])]
    xs=[r['_cycle'] for r in points]; ys=[r[field] for r in points]
    increasing=all(a<=b for a,b in zip(xs,xs[1:])); decreasing=all(a>=b for a,b in zip(xs,xs[1:]))
    if not (increasing or decreasing):
        # The source repeatedly resets Cycle # (10, 20, 30) between DOE conditions.
        # Preserve delivered source order with an explicit source-row axis; final
        # promotion must choose a governed condition/observation coordinate or a
        # reviewed condition-level feature representation rather than silently sort.
        xs=[float(r['_sourceRow']) for r in points]
        xsem,xunit='source-row-index','index'; direction='increasing'; coordinate_review=True
    else:
        xsem,xunit='cycle-index','cycle'; direction='increasing' if increasing else 'decreasing'; coordinate_review=False
    rep={'xSemantic':xsem,'xUnit':xunit,'xDirection':direction,'reductionMethod':'source-order-subset-no-interpolation','originalPointCount':len(rows),'x':xs,'y':ys}
    return {'id':field.lower().replace(' ','-').replace(',','').replace('/','-'),'label':field,'sourceChannel':field,'semantic':semantic,'unit':unit,'coordinateRequiresBindingReview':coordinate_review,'representation':rep,'representationFingerprint':canonical_sha(rep)}

def main():
    out_dir=OUT.parent; out_dir.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.zip') as tmp:
        used_url=retrieve(tmp); tmp.seek(0); payload=tmp.read(); digest=hashlib.sha256(payload).hexdigest()
        if digest!=EXPECTED_SHA: raise SystemExit(f'Sustainability SHA mismatch: {digest}')
        with zipfile.ZipFile(io.BytesIO(payload)) as z:
            raw=z.read(MEMBER).decode('utf-8-sig')
    reader=csv.DictReader(io.StringIO(raw)); raw_rows=list(reader)
    if len(raw_rows)!=EXPECTED_ROWS: raise SystemExit(f'Sustainability row count drift: {len(raw_rows)}')
    rows=[]
    for i,r in enumerate(raw_rows,2):
        material=str(r['Material #']).strip(); cycle=parse_float(r['Cycle #'])
        row={'_sourceRow':i,'_material':material,'_cycle':cycle}
        for f in META: row[f]=parse_float(r[f])
        rows.append(row)
    groups=sorted({r['_material'] for r in rows})
    if len(groups)!=5: raise SystemExit(f'expected 5 material groups, got {groups}')
    candidates=[]
    channel_set=['Cycle Time, s','Max Inj Pres, MPa','Max Cav1 Pres, MPa','Inj Flow Rate, ccps','Melt Temp, C','Thickness, mm','Max Strain, pct','Ult Stress, MPa','Modulus, MPa','Toughness, MJ/m^3']
    case_map=[['MLM-043','MLM-046'],['MLM-044'],['MLM-045'],['MLM-047'],['MLM-066']]
    for idx,material in enumerate(groups):
        material_rows=[r for r in rows if r['_material']==material]
        sampled=uniform(material_rows)
        sigs=[make_signal(f,sampled) for f in channel_set]
        alias='sha256:'+hashlib.sha256(material.encode('utf-8')).hexdigest()
        candidates.append({'candidateId':f'SUST-MATERIAL-GROUP-{idx+1:02d}','datasetId':'su13148102-supplement','sourceArtifact':'sustainability-13-08102-s001.zip','sourceMember':MEMBER,'sourceFingerprint':'sha256:'+digest,'sourceScope':{'selection':'one source-defined Material # group','materialGroupAlias':alias,'sourceRecords':len(material_rows),'displayedRecords':len(sampled),'retrievalUrl':used_url,'cycleStructure':'source Cycle # repeats 10,20,30 across DOE conditions; no cross-condition monotonic cycle axis is asserted'},'signals':sigs,'candidateFingerprint':canonical_sha(sigs),'suggestedCatalogueCases':case_map[idx],'evidenceBoundary':'One source-defined material group from the measured DOE/tensile-linked supplement. The candidate supports bounded comparison and variability teaching only. Repeated 10/20/30 Cycle # blocks mean the full material-group representation requires coordinate review before promotion; experimental associations are not universal production settings or root-cause proof.'})
    result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':len(candidates),'materialGroupCount':len(groups),'candidates':candidates,'boundary':'Authoring evidence only. Material identifiers are emitted only as one-way aliases; raw rows are not retained. Source Cycle # resets between DOE conditions are not reordered or disguised: non-monotonic full-group candidates use source-row order and are explicitly flagged for binding-coordinate review.'}
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['status'],'candidateCount':len(candidates),'candidateIds':[c['candidateId'] for c in candidates]},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
