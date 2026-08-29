#!/usr/bin/env python3
from __future__ import annotations

import argparse, hashlib, html, io, json, re, tempfile, urllib.parse, urllib.request, zipfile
from pathlib import Path
from openpyxl import load_workbook

ROOT=Path(__file__).resolve().parents[1]
CONTRACT=ROOT/'data/public-benchmark-contracts/strathclyde-rtim-tablets-v1.json'
UA='MouldMaster-Educational-Evidence-Profiler/1.0'

def get(url,accept='*/*'):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept})
    with urllib.request.urlopen(req,timeout=120) as r:return r.read(),r.geturl(),dict(r.headers)

def sanit(v):
    s=' '.join(str(v or '').replace('\x00',' ').split())
    if not s:return None
    s=re.sub(r'(?<![A-Za-z])[-+]?\d+(?:[.,]\d+)?(?:[Ee][-+]?\d+)?(?![A-Za-z])','<n>',s)
    return s[:220]

def discover_xlsx(page,expected):
    raw,final,_=get(page,'text/html,application/xhtml+xml')
    text=html.unescape(raw.decode('utf-8','replace')).replace('\\/','/')
    hrefs=re.findall(r'href=["\']([^"\']+)["\']',text,re.I)
    candidates=[]
    for href in hrefs:
        u=urllib.parse.urljoin(final,href)
        label=urllib.parse.unquote(u)
        if expected.lower() in label.lower() or label.lower().endswith('.xlsx'):
            candidates.append(u)
    dedup=[]
    for u in candidates:
        if u not in dedup:dedup.append(u)
    if not dedup:raise RuntimeError('publisher page exposed no XLSX download link')
    preferred=[u for u in dedup if expected.lower() in urllib.parse.unquote(u).lower()]
    return (preferred or dedup)[0],dedup

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);ap.add_argument('--retrieved-date',required=True);a=ap.parse_args()
    c=json.loads(CONTRACT.read_text());page=c['source']['datasetPage'];expected=c['source']['expectedPublisherFile']
    url,candidates=discover_xlsx(page,expected)
    data,final,headers=get(url)
    if not zipfile.is_zipfile(io.BytesIO(data)):raise RuntimeError('publisher workbook response is not a valid XLSX/ZIP')
    digest=hashlib.sha256(data).hexdigest()
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'source.xlsx';p.write_bytes(data)
        wbf=load_workbook(p,data_only=False,read_only=False)
        sheets=[]
        for ws in wbf.worksheets:
            rows=[];labels=[];numeric=0;formulas=0;nonempty=0
            for row in ws.iter_rows():
                rc=fc=nc=0;rlabels=[]
                for cell in row:
                    v=cell.value
                    if v is None:continue
                    nonempty+=1;nc+=1
                    if cell.data_type=='f' or (isinstance(v,str) and v.startswith('=')):
                        formulas+=1;fc+=1
                    elif isinstance(v,(int,float)) and not isinstance(v,bool):
                        numeric+=1;rc+=1
                    elif isinstance(v,str):
                        s=sanit(v)
                        if s:rlabels.append(s);labels.append(s)
                if nc:
                    rows.append({'row':row[0].row,'nonEmptyCells':nc,'numericLiteralCells':rc,'formulaCells':fc,'safeTextLabels':rlabels[:30]})
            uniq=[]
            for s in labels:
                if s not in uniq:uniq.append(s)
            sheets.append({'sheet':ws.title,'maxRow':ws.max_row,'maxColumn':ws.max_column,'nonEmptyCells':nonempty,'numericLiteralCells':numeric,'formulaCells':formulas,'safeTextLabels':uniq[:120],'rows':rows,'rawNumericValuesEmitted':False})
        wbf.close()
    result={'schema':1,'status':'retrieved-profile-needs-semantic-review','retrievedDate':a.retrieved_date,'source':{'datasetId':c['datasetId'],'datasetDoi':c['source']['datasetDoi'],'license':c['source']['license'],'publisherFileName':expected,'discoveredDownloadUrl':url,'resolvedUrl':final,'candidateDownloadLinksFound':len(candidates),'retrievedSizeBytes':len(data),'sha256':digest,'contentType':headers.get('Content-Type')},'profile':{'sheetCount':len(sheets),'sheets':sheets,'totalNumericLiteralCells':sum(x['numericLiteralCells'] for x in sheets),'totalFormulaCells':sum(x['formulaCells'] for x in sheets),'rawRowsOrNumericValuesEmitted':False},'acceptance':{'countsAsFullyProfiledMeasuredDataset':False,'acceptedMeasuredTimeSeriesSamples':0,'semanticReviewRequired':True},'retrieval':{'rawPublisherFileCommitted':False,'rawNumericValuesUploadedAsArtifact':False},'evidenceBoundary':c['evidenceBoundary']}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'status':result['status'],'sheets':result['profile']['sheetCount'],'numericLiteralCells':result['profile']['totalNumericLiteralCells'],'formulaCells':result['profile']['totalFormulaCells'],'sha256':digest},indent=2))
if __name__=='__main__':main()
