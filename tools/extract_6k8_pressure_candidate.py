#!/usr/bin/env python3
"""Extract a compact 6k8 pressure/specific-volume authoring candidate for MLM-052."""
from __future__ import annotations
import hashlib, json, math, tempfile
from pathlib import Path
from openpyxl import load_workbook
from prove_mendeley_open_sources import SOURCES, public_files, resolve_file, download_first

OUT=Path('measured-source-proof/6k8-pressure-unreviewed-learning-candidate.json')

def sha(v): return 'sha256:'+hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))
def reduce(x,y,limit=400):
    if len(x)<=limit:return x,y
    idx=sorted({round(i*(len(x)-1)/(limit-1)) for i in range(limit)})
    return [x[i] for i in idx],[y[i] for i in idx]
def make_signal(sid,source_channel,semantic,x,y):
    increasing=all(a<=b for a,b in zip(x,x[1:])); decreasing=all(a>=b for a,b in zip(x,x[1:]))
    if not (increasing or decreasing): raise RuntimeError(f'{sid}: pressure axis is not monotonic')
    rep={'xSemantic':'pressure','xUnit':'MPa','xDirection':'increasing' if increasing else 'decreasing','reductionMethod':'deterministic-endpoint-preserving-index-reduction','originalPointCount':len(x),'x':x,'y':y}
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
        signals=[]
        for sid,xc,yc,source_channel,semantic in specs:
            x=[]; y=[]
            for r in range(1,ws.max_row+1):
                a,b=ws[f'{xc}{r}'].value,ws[f'{yc}{r}'].value
                if finite(a) and finite(b): x.append(float(a)); y.append(float(b))
            if len(x)<100: raise RuntimeError(f'6k8 {sid}: insufficient source pairs: {len(x)}')
            rx,ry=reduce(x,y); sig=make_signal(sid,source_channel,semantic,rx,ry); sig['representation']['originalPointCount']=len(x); sig['representationFingerprint']=sha(sig['representation']); signals.append(sig)
        candidate={'candidateId':'MEND-6K8-FIGURE10ABC-PRESSURE-01','datasetId':source['datasetId'],'sourceArtifact':'Data.xlsx','sourceFingerprint':'sha256:'+digest,'sourceScope':{'sheet':'Figure10abc','temperatureDegC':50,'pistonSpeedMmPerS':1,'series':['decompression','compression']},'signals':signals,'candidateFingerprint':sha(signals),'suggestedCatalogueCases':['MLM-052'],'evidenceBoundary':'Source-labelled polypropylene pvT compression/decompression measurements at 50 °C and 1 mm/s. This is material-characterization evidence, not a production process window or root-cause result.'}
        result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':1,'candidates':[candidate],'boundary':'Authoring evidence only; independent engineering review and a case-specific governed binding are required before promotion.'}
        OUT.parent.mkdir(exist_ok=True); OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(json.dumps({'status':result['status'],'candidateId':candidate['candidateId']},separators=(',',':')))
    finally: td.cleanup()
    return 0
if __name__=='__main__': raise SystemExit(main())
