#!/usr/bin/env python3
"""Extract a compact 6k8 pressure/specific-volume authoring candidate for MLM-052."""
from __future__ import annotations
import hashlib, json, math, re, tempfile
from pathlib import Path
from openpyxl import load_workbook
from prove_mendeley_open_sources import SOURCES, public_files, resolve_file, download_first

OUT=Path('measured-source-proof/6k8-pressure-unreviewed-learning-candidate.json')
NUMERIC_TEXT=re.compile(r'^[+-]?(?:\d+(?:[\.,]\d*)?|[\.,]\d+)(?:[eE][+-]?\d+)?$')

def sha(v): return 'sha256:'+hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))
def as_number(v):
    if finite(v): return float(v)
    if isinstance(v,str):
        text=v.strip()
        if NUMERIC_TEXT.fullmatch(text):
            value=float(text.replace(',','.'))
            if math.isfinite(value): return value
    return None
def reduce(x,y,limit=400):
    if len(x)<=limit:return x,y
    idx=sorted({round(i*(len(x)-1)/(limit-1)) for i in range(limit)})
    return [x[i] for i in idx],[y[i] for i in idx]
def make_signal(sid,source_channel,semantic,x,y,original_count):
    increasing=all(a<=b for a,b in zip(x,x[1:])); decreasing=all(a>=b for a,b in zip(x,x[1:]))
    if not (increasing or decreasing): raise RuntimeError(f'{sid}: pressure axis is not monotonic')
    rep={'xSemantic':'pressure','xUnit':'MPa','xDirection':'increasing' if increasing else 'decreasing','reductionMethod':'deterministic-endpoint-preserving-index-reduction','originalPointCount':original_count,'x':x,'y':y}
    return {'id':sid,'label':sid.replace('-',' '),'sourceChannel':source_channel,'semantic':semantic,'unit':'mm3/g','representation':rep,'representationFingerprint':sha(rep)}
def main():
    source=next(s for s in SOURCES if s['datasetId']=='mendeley-6k8fpbrd9s-v1')
    file_id,name,expected=source['files'][0]; _,meta=public_files(source['shortId'],source['version']); _,_,urls=resolve_file(meta,file_id,name,source['shortId'],source['version'])
    td=tempfile.TemporaryDirectory(); path=Path(td.name)/name
    try:
        download_first(urls,path); digest=hashlib.sha256(path.read_bytes()).hexdigest()
        if digest!=expected: raise RuntimeError(f'6k8 SHA mismatch: {digest}')
        wb=load_workbook(path,read_only=False,data_only=False); ws=wb['Figure10abc']
        specs=[('decompression','A','B','Figure10abc!B','specific-volume-50degC-decompression-1mmps'),('compression','C','D','Figure10abc!D','specific-volume-50degC-compression-1mmps')]
        signals=[]; parse_summary={}
        for sid,xc,yc,source_channel,semantic in specs:
            x=[]; y=[]; native_pairs=0; string_pairs=0; formula_cells=0
            for r in range(1,ws.max_row+1):
                cx,cy=ws[f'{xc}{r}'],ws[f'{yc}{r}']
                if cx.data_type=='f' or cy.data_type=='f':
                    formula_cells+=int(cx.data_type=='f')+int(cy.data_type=='f')
                    continue
                a,b=as_number(cx.value),as_number(cy.value)
                if a is not None and b is not None:
                    native_pairs+=int(finite(cx.value) and finite(cy.value))
                    string_pairs+=int(isinstance(cx.value,str) or isinstance(cy.value,str))
                    x.append(a); y.append(b)
            parse_summary[sid]={'sourcePairCount':len(x),'nativeNumericPairCount':native_pairs,'numericStringPairCount':string_pairs,'formulaCellCountExcluded':formula_cells}
            if len(x)<100: raise RuntimeError(f'6k8 {sid}: insufficient direct/string-numeric source pairs: {len(x)}; parse={parse_summary[sid]}')
            rx,ry=reduce(x,y); signals.append(make_signal(sid,source_channel,semantic,rx,ry,len(x)))
        candidate={'candidateId':'MEND-6K8-FIGURE10ABC-PRESSURE-01','datasetId':source['datasetId'],'sourceArtifact':'Data.xlsx','sourceFingerprint':'sha256:'+digest,'sourceScope':{'sheet':'Figure10abc','temperatureDegC':50,'pistonSpeedMmPerS':1,'series':['decompression','compression'],'parseSummary':parse_summary,'formulaCellsExcluded':True},'signals':signals,'candidateFingerprint':sha(signals),'suggestedCatalogueCases':['MLM-052'],'evidenceBoundary':'Source-labelled polypropylene pvT compression/decompression measurements at 50 °C and 1 mm/s. Only native numeric cells or strict numeric cell strings are accepted; formula cells are excluded. This is material-characterization evidence, not a production process window or root-cause result.'}
        result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':1,'candidates':[candidate],'boundary':'Authoring evidence only; independent engineering review and a case-specific governed binding are required before promotion.'}
        OUT.parent.mkdir(exist_ok=True); OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(json.dumps({'status':result['status'],'candidateId':candidate['candidateId'],'parseSummary':parse_summary},separators=(',',':')))
    finally: td.cleanup()
    return 0
if __name__=='__main__': raise SystemExit(main())
