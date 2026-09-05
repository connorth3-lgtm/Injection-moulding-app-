#!/usr/bin/env python3
"""Extract compact, unreviewed Sustainability DOE measured-learning candidates.

The source repeats Cycle # (typically 10/20/30) within DOE conditions. For material-level
learning cases, the source-defined DOE Run # is therefore tested as the primary ordering
coordinate. Source order is always preserved; no rows are sorted by measured values.
"""
from __future__ import annotations
import csv, hashlib, io, json, math, tempfile, zipfile
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
    points=[r for r in rows if finite(r[field])]
    if len(points)<20: raise SystemExit(f'{field}: fewer than 20 numeric source values in selected material group')
    doe_ready=all(finite(r['_doeRun']) for r in points)
    if doe_ready:
        doe_x=[r['_doeRun'] for r in points]
        doe_inc=all(a<=b for a,b in zip(doe_x,doe_x[1:])); doe_dec=all(a>=b for a,b in zip(doe_x,doe_x[1:]))
    else:
        doe_x=[]; doe_inc=doe_dec=False
    if doe_ready and (doe_inc or doe_dec):
        xs=doe_x
        xsem,xunit='doe-run-index','run'; direction='increasing' if doe_inc else 'decreasing'; coordinate_review=False
        reduction='source-order-subset-indexed-by-source-doe-run-no-interpolation'
    else:
        # Fail visibly back to delivered record order rather than sort or synthesize a
        # cross-condition Cycle # axis. This remains authoring-only until reviewed.
        xs=[float(r['_sourceRow']) for r in points]
        xsem,xunit='source-row-index','index'; direction='increasing'; coordinate_review=True
        reduction='source-order-subset-no-interpolation-coordinate-review-required'
    ys=[r[field] for r in points]
    rep={'xSemantic':xsem,'xUnit':xunit,'xDirection':direction,'reductionMethod':reduction,'originalPointCount':len(rows),'x':xs,'y':ys}
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
    required_headers={'Material #','DOE Run #','Cycle #'}|set(META)
    missing=sorted(required_headers-set(reader.fieldnames or []))
    if missing: raise SystemExit(f'Sustainability required header drift: {missing}')
    rows=[]
    for i,r in enumerate(raw_rows,2):
        material=str(r['Material #']).strip(); cycle=parse_float(r['Cycle #']); doe_run=parse_float(r['DOE Run #'])
        row={'_sourceRow':i,'_material':material,'_cycle':cycle,'_doeRun':doe_run}
        for f in META: row[f]=parse_float(r[f])
        rows.append(row)
    groups=sorted({r['_material'] for r in rows})
    if len(groups)!=5: raise SystemExit(f'expected 5 material groups, got {groups}')
    candidates=[]
    channel_set=list(META)
    case_map=[['MLM-043','MLM-046'],['MLM-044'],['MLM-045'],['MLM-047'],['MLM-066']]
    coordinate_summary=[]
    for idx,material in enumerate(groups):
        material_rows=[r for r in rows if r['_material']==material]
        sampled=uniform(material_rows)
        sigs=[make_signal(f,sampled) for f in channel_set]
        alias='sha256:'+hashlib.sha256(material.encode('utf-8')).hexdigest()
        finite_doe=[r['_doeRun'] for r in material_rows if finite(r['_doeRun'])]
        finite_cycle=[r['_cycle'] for r in material_rows if finite(r['_cycle'])]
        doe_inc=bool(finite_doe) and all(a<=b for a,b in zip(finite_doe,finite_doe[1:])); doe_dec=bool(finite_doe) and all(a>=b for a,b in zip(finite_doe,finite_doe[1:]))
        coord_ready=all(not s['coordinateRequiresBindingReview'] for s in sigs)
        coord_info={'materialGroupAlias':alias,'sourceRecords':len(material_rows),'finiteDoeRunRecords':len(finite_doe),'doeRunMin':min(finite_doe) if finite_doe else None,'doeRunMax':max(finite_doe) if finite_doe else None,'doeRunSourceOrderMonotonic':doe_inc or doe_dec,'distinctCycleNumbers':sorted(set(finite_cycle)),'allCandidateSignalsUseDoeRunCoordinate':coord_ready}
        coordinate_summary.append(coord_info)
        candidates.append({'candidateId':f'SUST-MATERIAL-GROUP-{idx+1:02d}','datasetId':'su13148102-supplement','sourceArtifact':'sustainability-13-08102-s001.zip','sourceMember':MEMBER,'sourceFingerprint':'sha256:'+digest,'sourceScope':{'selection':'one source-defined Material # group, preserving delivered source order','materialGroupAlias':alias,'sourceRecords':len(material_rows),'displayedRecords':len(sampled),'retrievalUrl':used_url,'cycleStructure':'source Cycle # repeats within DOE conditions; DOE Run # is evaluated as the source-native material-level ordering coordinate','coordinateDiagnostics':coord_info},'signals':sigs,'candidateFingerprint':canonical_sha(sigs),'suggestedCatalogueCases':case_map[idx],'evidenceBoundary':'One source-defined material group from the measured DOE/tensile-linked supplement. DOE Run # is used only when it is complete and monotonic in delivered source order. Experimental associations remain bounded to this dataset and do not establish universal settings or production root cause.'})
    result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':len(candidates),'materialGroupCount':len(groups),'coordinateDiagnostics':coordinate_summary,'candidates':candidates,'boundary':'Authoring evidence only. Material identifiers are emitted only as one-way aliases; raw rows are not retained. Repeated Cycle # blocks are not flattened. Source-defined DOE Run # is accepted only when it provides a complete monotonic coordinate in delivered material-group order; otherwise the candidate stays coordinate-review-blocked.'}
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['status'],'candidateCount':len(candidates),'candidateIds':[c['candidateId'] for c in candidates],'coordinateDiagnostics':coordinate_summary},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
