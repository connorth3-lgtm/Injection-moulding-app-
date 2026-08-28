#!/usr/bin/env python3
"""Retrieve and structurally profile Mendeley vc3k9tt5zj v2 without retaining raw rows."""
from __future__ import annotations
import argparse, hashlib, html, io, json, re, shutil, tempfile, urllib.request, zipfile
from pathlib import Path, PurePosixPath
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
CONTRACT=ROOT/'data/public-benchmark-contracts/pet-preform-v2.json'
DATASET_ID='vc3k9tt5zj'; VERSION=2; PAGE=f'https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}'

def get(url,accept='*/*'):
    req=urllib.request.Request(url,headers={'Accept':accept,'User-Agent':'MouldMaster-Academy-public-benchmark/1.0'})
    with urllib.request.urlopen(req,timeout=120) as r: return r.read(),r.geturl()

def file_links():
    raw,_=get(PAGE,'text/html,application/xhtml+xml'); text=html.unescape(raw.decode('utf-8','replace')).replace('\\u002F','/').replace('\\/','/')
    pattern=re.compile(rf'https://data\.mendeley\.com/public-files/datasets/{DATASET_ID}/files/([0-9a-fA-F-]{{36}})/file_downloaded')
    out=[]; seen=set()
    for m in pattern.finditer(text):
        fid=m.group(1).lower()
        if fid in seen: continue
        seen.add(fid); out.append({'fileId':fid,'url':m.group(0)})
    if not out: raise RuntimeError('version-pinned Mendeley page exposed no public-file links')
    return out

def suffix(data):
    if data.startswith(b'PK\x03\x04'):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                if 'xl/workbook.xml' in z.namelist(): return '.xlsx'
        except zipfile.BadZipFile: pass
        return '.zip'
    sample=data[:8192]
    try: text=sample.decode('utf-8-sig')
    except UnicodeDecodeError: return ''
    first=next((x for x in text.splitlines() if x.strip()),'')
    if '\t' in first:return '.tsv'
    if ',' in first or ';' in first:return '.csv'
    return '.txt' if first else ''

def safe_extract(data,out):
    paths=[]
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for m in z.infolist():
            p=PurePosixPath(m.filename)
            if p.is_absolute() or '..' in p.parts: raise RuntimeError('unsafe zip path')
            if m.is_dir(): continue
            ext=Path(m.filename).suffix.lower()
            if ext not in {'.csv','.tsv','.txt','.xlsx','.xls'}: continue
            target=out/Path(m.filename).name
            with z.open(m) as s,target.open('wb') as d: shutil.copyfileobj(s,d)
            paths.append(target)
    return paths

def read_tables(path):
    ext=path.suffix.lower(); out=[]
    if ext=='.csv': out=[(path.name,pd.read_csv(path,sep=None,engine='python'))]
    elif ext=='.tsv': out=[(path.name,pd.read_csv(path,sep='\t'))]
    elif ext=='.txt': out=[(path.name,pd.read_csv(path,sep=None,engine='python'))]
    elif ext in {'.xlsx','.xls'}:
        out=[(str(s),df) for s,df in pd.read_excel(path,sheet_name=None).items()]
    return out

def header_semantics(headers):
    low=[str(h).strip().lower() for h in headers]; joined=' '.join(low)
    measured=['weight','mass','dimension','diameter','length','thickness','temperature','pressure','time','speed','velocity']
    simulation=['warpage','shrinkage','residual stress','orientation','simulation','moldflow','predicted']
    process=['melt','mold','mould','holding','cooling','packing','injection','temperature','pressure','time','speed']
    return {
      'measuredOrProcessHeaderMarkers':sorted({t for t in measured if t in joined}),
      'simulationHeaderMarkers':sorted({t for t in simulation if t in joined}),
      'processHeaderMarkers':sorted({t for t in process if t in joined}),
      'headerNames':[str(h) for h in headers],
      'rawValuesEmitted':False}

def run(output,retrieved_date):
    c=json.loads(CONTRACT.read_text()); work=Path(tempfile.mkdtemp(prefix='mouldmaster-pet-preform-'))
    try:
        sources=[]; tables=[]
        for i,item in enumerate(file_links(),1):
            data,final=get(item['url']); ext=suffix(data); digest=hashlib.sha256(data).hexdigest()
            src={'fileId':item['fileId'],'downloadUrl':item['url'],'resolvedUrl':final,'sizeBytes':len(data),'sha256':digest,'detectedType':ext}
            sources.append(src)
            paths=[]
            if ext=='.zip': paths=safe_extract(data,work/f'unzip-{i}'); (work/f'unzip-{i}').mkdir(exist_ok=True) if False else None
            elif ext in {'.csv','.tsv','.txt','.xlsx'}:
                p=work/f'file-{i}{ext}'; p.write_bytes(data); paths=[p]
            for p in paths:
                try:
                    for name,df in read_tables(p): tables.append({'sourceFileId':item['fileId'],'fileName':p.name,'table':name,'rows':int(len(df)),'columns':int(len(df.columns)),'semantics':header_semantics(df.columns)})
                except Exception as e: tables.append({'sourceFileId':item['fileId'],'fileName':p.name,'readError':f'{type(e).__name__}: {e}'})
        readable=[t for t in tables if 'rows' in t]
        result={'schema_version':1,'status':'retrieved-profile-needs-semantic-review','retrieved_date':retrieved_date,'source':{'datasetId':c['datasetId'],'datasetDoi':c['source']['datasetDoi'],'datasetPage':PAGE,'license':c['source']['license'],'version':VERSION},'files':sources,'tables':readable,'profile':{'publicFilesRetrieved':len(sources),'readableTables':len(readable),'totalTabularRowsAcrossTables':sum(t['rows'] for t in readable),'rawRowsOrCellValuesEmitted':False},'retrieval':{'rawPublisherFilesCommitted':False,'rawRowsUploadedAsArtifact':False},'evidenceBoundary':c['evidenceBoundary']}
        output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(result,indent=2)+'\n'); return result
    finally: shutil.rmtree(work,ignore_errors=True)

def main():
    a=argparse.ArgumentParser(); a.add_argument('--output',type=Path,required=True); a.add_argument('--retrieved-date',required=True); x=a.parse_args(); r=run(x.output,x.retrieved_date); print(json.dumps({'status':r['status'],'files':r['profile']['publicFilesRetrieved'],'readableTables':r['profile']['readableTables'],'rows':r['profile']['totalTabularRowsAcrossTables']},indent=2))
if __name__=='__main__': main()
