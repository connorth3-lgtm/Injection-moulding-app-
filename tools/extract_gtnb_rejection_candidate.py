#!/usr/bin/env python3
"""Recover exact GTNB rejected-product and production-total fields for MLM-039 authoring."""
from __future__ import annotations
import hashlib, json, math, re, tempfile
from pathlib import Path
from openpyxl import load_workbook
from prove_mendeley_open_sources import SOURCES, public_files, resolve_file, download_first

OUT=Path('measured-source-proof/gtnb-rejection-unreviewed-learning-candidate.json')

def sha(v): return 'sha256:'+hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))
def header_text(v): return str(v or '').strip()
def signal(sid,source_channel,semantic,unit,rows,key):
    points=[r for r in rows if finite(r[key])]; x=[float(r['_sourceRow']) for r in points]; y=[float(r[key]) for r in points]
    rep={'xSemantic':'observation-index','xUnit':'index','xDirection':'increasing','reductionMethod':'contiguous-source-order-window-no-interpolation','originalPointCount':len(rows),'x':x,'y':y}
    return {'id':sid,'label':sid.replace('-',' '),'sourceChannel':source_channel,'semantic':semantic,'unit':unit,'representation':rep,'representationFingerprint':sha(rep)}
def main():
    source=next(s for s in SOURCES if s['datasetId']=='mendeley-gtnb4j7bfx-v1')
    file_id,name,expected=source['files'][0]; _,meta=public_files(source['shortId'],source['version']); _,_,urls=resolve_file(meta,file_id,name,source['shortId'],source['version'])
    td=tempfile.TemporaryDirectory(); path=Path(td.name)/name
    try:
        download_first(urls,path); digest=hashlib.sha256(path.read_bytes()).hexdigest()
        if digest!=expected: raise RuntimeError(f'GTNB SHA mismatch: {digest}')
        wb=load_workbook(path,read_only=True,data_only=False); ws=wb['nicky']
        headers=[header_text(ws.cell(1,c).value) for c in range(1,ws.max_column+1)]
        nonempty=[h for h in headers if h]
        if len(nonempty)!=len(set(nonempty)): raise RuntimeError('GTNB rejection duplicate normalized headers')
        col={h:i+1 for i,h in enumerate(headers) if h}
        required=['Maquina','Producto_rechazados','Produccion_total','Presion_inyeccion_bares','Tiempo_ciclo']
        missing=[h for h in required if h not in col]
        if missing: raise RuntimeError(f'GTNB rejection header drift after whitespace normalization: {missing}')
        rows=[]
        for r in range(2,ws.max_row+1):
            machine=header_text(ws.cell(r,col['Maquina']).value).upper()
            if not (re.fullmatch(r'I(?:-|_)?\d+',machine) or machine.startswith('INY')): continue
            row={'_sourceRow':r}
            for h,key in [('Producto_rechazados','rejected'),('Produccion_total','production'),('Presion_inyeccion_bares','pressure'),('Tiempo_ciclo','cycle')]:
                v=ws.cell(r,col[h]).value; row[key]=float(v) if finite(v) else None
            rows.append(row)
        if len(rows)!=4502: raise RuntimeError(f'GTNB injection row drift: {len(rows)}')
        # Select a bounded contiguous source-order interval with valid numerator/denominator data.
        valid=[r for r in rows if finite(r['rejected']) and finite(r['production']) and r['production']>0]
        if len(valid)<400: raise RuntimeError(f'GTNB insufficient valid rejection records: {len(valid)}')
        start=max(0,(len(valid)-400)//2); selected=valid[start:start+400]
        signals=[
            signal('rejected-products','Rejected_Products','recorded-rejected-product-count','count',selected,'rejected'),
            signal('production-total','Production_Total','recorded-total-production-count','count',selected,'production'),
            signal('injection-pressure','Injection_Pressure','recorded-injection-pressure','bar',selected,'pressure'),
            signal('cycle-time','Cycle_Time','recorded-cycle-time','s',selected,'cycle'),
        ]
        candidate={'candidateId':'GTNB-REJECTION-NUMERATOR-DENOMINATOR-01','datasetId':source['datasetId'],'sourceArtifact':'modelo.xlsx','sourceFingerprint':'sha256:'+digest,'sourceScope':{'selection':'bounded 400-record interval from valid injection records with non-zero production totals','validInjectionRecords':len(valid),'selectedOrdinalStart':start,'selectedOrdinalEndExclusive':start+len(selected)},'signals':signals,'candidateFingerprint':sha(signals),'suggestedCatalogueCases':['MLM-039'],'bindingBlockers':['Rejected_Products and Production_Total require explicit V2 source-channel registry entries','A versioned rejection-rate feature must define aggregation/zero-denominator handling before promotion'],'evidenceBoundary':'The source directly supplies rejected-product counts and total production counts. Their presence supports constructing a governed rejection-rate feature after channel and calculation governance; no rate is invented in this authoring artifact.'}
        result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':1,'candidates':[candidate],'boundary':'Numeric source evidence recovered; intentionally not direct-binding-ready until channel and feature governance are added.'}
        OUT.parent.mkdir(exist_ok=True); OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(json.dumps({'status':result['status'],'candidateId':candidate['candidateId'],'bindingBlockers':candidate['bindingBlockers']},separators=(',',':')))
    finally: td.cleanup()
    return 0
if __name__=='__main__': raise SystemExit(main())
