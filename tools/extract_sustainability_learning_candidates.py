#!/usr/bin/env python3
"""Extract compact, unreviewed Sustainability DOE measured-learning candidates.

The publisher supplement is record-level DOE/tensile evidence, not a continuous time
series. Cycle # repeats within DOE conditions and DOE Run # is not monotonic in delivered
material-group order. Candidates therefore use a generated 1..N observation index over
complete learner-channel records while preserving publisher row order. DOE Run # and
Cycle # remain grouping/provenance context and are never flattened into a fake trace axis.
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
COORDINATE_MODE='generated-source-order-observation-index-v1'

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

def make_signal(field,rows,original_count):
    semantic,unit=META[field]
    if len(rows)<20 or not all(finite(r[field]) for r in rows):
        raise SystemExit(f'{field}: generated-index representation requires >=20 complete numeric source records')
    xs=[float(i) for i in range(1,len(rows)+1)]
    ys=[float(r[field]) for r in rows]
    rep={
        'xSemantic':'observation-index','xUnit':'index','xDirection':'increasing',
        'coordinateMode':COORDINATE_MODE,
        'reductionMethod':'source-order-complete-record-subset-uniform-no-interpolation',
        'originalPointCount':original_count,'x':xs,'y':ys,
    }
    return {
        'id':field.lower().replace(' ','-').replace(',','').replace('/','-'),
        'label':field,'sourceChannel':field,'semantic':semantic,'unit':unit,
        'coordinateRequiresBindingReview':False,
        'representation':rep,'representationFingerprint':canonical_sha(rep),
    }

def main():
    OUT.parent.mkdir(exist_ok=True)
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
        row={
            '_sourceRow':i,
            '_material':str(r['Material #']).strip(),
            '_cycle':parse_float(r['Cycle #']),
            '_doeRun':parse_float(r['DOE Run #']),
        }
        for f in META: row[f]=parse_float(r[f])
        rows.append(row)
    groups=sorted({r['_material'] for r in rows})
    if len(groups)!=5: raise SystemExit(f'expected 5 material groups, got {groups}')

    candidates=[]; diagnostics=[]; channel_set=list(META)
    case_map=[['MLM-043','MLM-046'],['MLM-044'],['MLM-045'],['MLM-047'],['MLM-066']]
    for idx,material in enumerate(groups):
        material_rows=[r for r in rows if r['_material']==material]
        complete=[r for r in material_rows if all(finite(r[f]) for f in channel_set)]
        if len(complete)<20:
            raise SystemExit(f'material group {idx+1}: fewer than 20 complete learner-channel records: {len(complete)}')
        sampled=uniform(complete)
        sigs=[make_signal(f,sampled,len(complete)) for f in channel_set]
        expected_x=[float(i) for i in range(1,len(sampled)+1)]
        if any(s['representation']['x']!=expected_x for s in sigs):
            raise SystemExit(f'material group {idx+1}: generated observation axes are not aligned')
        alias='sha256:'+hashlib.sha256(material.encode('utf-8')).hexdigest()
        finite_doe=[r['_doeRun'] for r in material_rows if finite(r['_doeRun'])]
        finite_cycle=[r['_cycle'] for r in material_rows if finite(r['_cycle'])]
        selected_row_fp=canonical_sha([r['_sourceRow'] for r in sampled])
        diag={
            'materialGroupAlias':alias,
            'sourceRecords':len(material_rows),
            'completeLearnerChannelRecords':len(complete),
            'displayedRecords':len(sampled),
            'selectedSourceRowFingerprint':selected_row_fp,
            'finiteDoeRunRecords':len(finite_doe),
            'doeRunMin':min(finite_doe) if finite_doe else None,
            'doeRunMax':max(finite_doe) if finite_doe else None,
            'distinctCycleNumbers':sorted(set(finite_cycle)),
            'coordinateMode':COORDINATE_MODE,
            'generatedIndexStart':1,
            'generatedIndexEnd':len(sampled),
        }
        diagnostics.append(diag)
        candidates.append({
            'candidateId':f'SUST-MATERIAL-GROUP-{idx+1:02d}',
            'datasetId':'su13148102-supplement',
            'sourceArtifact':'sustainability-13-08102-s001.zip','sourceMember':MEMBER,
            'sourceFingerprint':'sha256:'+digest,
            'sourceScope':{
                'selection':'complete ten-channel records within one source-defined Material # group, preserving delivered publisher order',
                'materialGroupAlias':alias,'sourceRecords':len(material_rows),
                'completeLearnerChannelRecords':len(complete),'displayedRecords':len(sampled),
                'selectedSourceRowFingerprint':selected_row_fp,'retrievalUrl':used_url,
                'groupingContext':'DOE Run # and Cycle # remain source grouping/provenance fields; neither is represented as a continuous material-group axis',
                'coordinateMode':COORDINATE_MODE,
            },
            'signals':sigs,'candidateFingerprint':canonical_sha(sigs),
            'suggestedCatalogueCases':case_map[idx],
            'evidenceBoundary':'One bounded source-defined material group from the measured DOE/tensile-linked supplement. X is a generated display index over complete records in publisher order, not time, cycle progression or DOE-run magnitude. Experimental associations remain dataset-bounded and do not establish universal settings or production root cause.',
        })
    result={
        'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,
        'candidateCount':len(candidates),'materialGroupCount':len(groups),
        'coordinateMode':COORDINATE_MODE,'coordinateDiagnostics':diagnostics,
        'candidates':candidates,
        'boundary':'Authoring evidence only. Raw rows and material identifiers are not emitted. The generated 1..N observation coordinate preserves the order of complete publisher records and is explicitly not a physical process axis. DOE Run # and Cycle # stay as provenance/grouping context.',
    }
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({
        'status':result['status'],'candidateCount':len(candidates),
        'candidateIds':[c['candidateId'] for c in candidates],
        'coordinateMode':COORDINATE_MODE,
        'completeRecordCounts':[d['completeLearnerChannelRecords'] for d in diagnostics],
        'displayedRecordCounts':[d['displayedRecords'] for d in diagnostics],
    },separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
