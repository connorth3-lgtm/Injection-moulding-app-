#!/usr/bin/env python3
"""Extract compact, unreviewed Sustainability DOE measured-learning candidates.

Each source-defined material group can contain separate production/experimental runs whose
Cycle # values restart. Learner authoring candidates therefore use only the largest
contiguous source-row run with a non-decreasing source Cycle #. Resets are excluded and
reported explicitly; rows are never sorted by measured values and no generated X axis is
substituted for the governed cycle coordinate.
"""
from __future__ import annotations
import csv, hashlib, io, json, math, tempfile, zipfile
from pathlib import Path

from prove_sustainability_measured_source import retrieve, EXPECTED_SHA, MEMBER, EXPECTED_ROWS

OUT=Path('measured-source-proof/sustainability-unreviewed-learning-candidates.json')
MIN_RUN_RECORDS=20
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

def monotonic_contiguous_runs(material_rows):
    runs=[]; current=[]; previous_cycle=None; previous_source_row=None
    for row in material_rows:
        cycle=row['_cycle']; source_row=row['_sourceRow']
        if not finite(cycle):
            if current: runs.append(current); current=[]
            previous_cycle=None; previous_source_row=None
            continue
        breaks_source_contiguity=previous_source_row is not None and source_row != previous_source_row+1
        resets_cycle=previous_cycle is not None and cycle < previous_cycle
        if current and (breaks_source_contiguity or resets_cycle):
            runs.append(current); current=[]
        current.append(row); previous_cycle=cycle; previous_source_row=source_row
    if current: runs.append(current)
    return runs

def select_run(material_rows):
    runs=monotonic_contiguous_runs(material_rows)
    if not runs: raise SystemExit('material group has no finite Cycle # run')
    selected=max(runs,key=lambda r:(len(r),-r[0]['_sourceRow']))
    if len(selected)<MIN_RUN_RECORDS:
        raise SystemExit(f'largest monotonic material run below {MIN_RUN_RECORDS} records: {len(selected)}')
    reset_boundaries=max(0,len(runs)-1)
    return selected,{'materialSourceRecords':len(material_rows),'monotonicContiguousRunCount':len(runs),'excludedRunCount':max(0,len(runs)-1),'selectedRunRecords':len(selected),'selectedSourceRowStart':selected[0]['_sourceRow'],'selectedSourceRowEnd':selected[-1]['_sourceRow'],'selectedCycleStart':selected[0]['_cycle'],'selectedCycleEnd':selected[-1]['_cycle'],'cycleResetOrSourceGapBoundaries':reset_boundaries}

def make_signal(field,rows):
    semantic,unit=META[field]
    points=[r for r in rows if finite(r['_cycle']) and finite(r[field])]
    xs=[r['_cycle'] for r in points]; ys=[r[field] for r in points]
    if len(xs)<MIN_RUN_RECORDS: raise SystemExit(f'{field}: fewer than {MIN_RUN_RECORDS} numeric points in selected cycle run')
    if not all(a<=b for a,b in zip(xs,xs[1:])): raise SystemExit(f'{field}: selected Cycle # axis is not non-decreasing')
    rep={'xSemantic':'cycle-index','xUnit':'cycle','xDirection':'increasing','reductionMethod':'largest-contiguous-nondecreasing-source-cycle-run-then-uniform-source-order-subset','originalPointCount':len(rows),'x':xs,'y':ys}
    return {'id':field.lower().replace(' ','-').replace(',','').replace('/','-'),'label':field,'sourceChannel':field,'semantic':semantic,'unit':unit,'coordinateRequiresBindingReview':False,'representation':rep,'representationFingerprint':canonical_sha(rep)}

def main():
    out_dir=OUT.parent; out_dir.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.zip') as tmp:
        used_url=retrieve(tmp); tmp.seek(0); payload=tmp.read(); digest=hashlib.sha256(payload).hexdigest()
        if digest!=EXPECTED_SHA: raise SystemExit(f'Sustainability SHA mismatch: {digest}')
        with zipfile.ZipFile(io.BytesIO(payload)) as z: raw=z.read(MEMBER).decode('utf-8-sig')
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
    candidates=[]; channel_set=list(META)
    case_map=[['MLM-043','MLM-046'],['MLM-044'],['MLM-045'],['MLM-047'],['MLM-066']]
    run_summaries=[]
    for idx,material in enumerate(groups):
        material_rows=[r for r in rows if r['_material']==material]
        selected_run,run_summary=select_run(material_rows); sampled=uniform(selected_run)
        sigs=[make_signal(f,sampled) for f in channel_set]
        alias='sha256:'+hashlib.sha256(material.encode('utf-8')).hexdigest(); run_summary['materialGroupAlias']=alias; run_summary['displayedRecords']=len(sampled); run_summaries.append(run_summary)
        candidates.append({'candidateId':f'SUST-MATERIAL-GROUP-{idx+1:02d}','datasetId':'su13148102-supplement','sourceArtifact':'sustainability-13-08102-s001.zip','sourceMember':MEMBER,'sourceFingerprint':'sha256:'+digest,'sourceScope':{'selection':'largest contiguous source-row run within one source-defined Material # group whose source Cycle # remains non-decreasing','materialGroupAlias':alias,'runSelection':run_summary,'retrievalUrl':used_url},'signals':sigs,'candidateFingerprint':canonical_sha(sigs),'suggestedCatalogueCases':case_map[idx],'evidenceBoundary':'One bounded source-defined material/run segment from the measured DOE/tensile-linked supplement. Cycle-number resets and discontiguous material blocks are excluded rather than reordered. The candidate supports comparison and variability teaching only; experimental associations are not universal production settings or root-cause proof.'})
    result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':len(candidates),'materialGroupCount':len(groups),'runSelectionSummaries':run_summaries,'candidates':candidates,'boundary':'Authoring evidence only. Material identifiers are emitted only as one-way aliases; raw rows are not retained. Every signal uses the governed source Cycle # coordinate from one explicit monotonic contiguous run; resets are excluded and reported rather than silently sorted.'}
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['status'],'candidateCount':len(candidates),'candidateIds':[c['candidateId'] for c in candidates],'selectedRunRecords':[s['selectedRunRecords'] for s in run_summaries],'runCounts':[s['monotonicContiguousRunCount'] for s in run_summaries]},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
