#!/usr/bin/env python3
"""Retrieve and aggregate-profile the MDPI su13148102 supplementary dataset."""
from __future__ import annotations
import argparse, hashlib, io, json, re, shutil, tempfile, urllib.request, zipfile
from pathlib import Path, PurePosixPath
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
CONTRACT=ROOT/'data/public-benchmark-contracts/su13148102-supplement-v1.json'
DIRECT='https://mdpi-res.com/d_attachment/sustainability/sustainability-13-08102/article_deploy/sustainability-13-08102-s001.zip'
LANDING='https://www.mdpi.com/article/10.3390/su13148102/s1'

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster measured-data profiler/1','Accept':'*/*'})
    with urllib.request.urlopen(req,timeout=120) as r: return r.read(), r.geturl(), r.headers.get('Content-Type','')

def sha(data): return hashlib.sha256(data).hexdigest()

def safe_zip(data, out):
    paths=[]
    out.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for m in z.infolist():
            p=PurePosixPath(m.filename)
            if p.is_absolute() or '..' in p.parts: raise RuntimeError('unsafe zip path')
            if m.is_dir(): continue
            target=out/Path(m.filename).name
            with z.open(m) as s,target.open('wb') as d: shutil.copyfileobj(s,d)
            paths.append(target)
    return paths

def classify_headers(headers):
    names=[str(h).strip() for h in headers]
    low=[x.lower() for x in names]
    process=[n for n,h in zip(names,low) if any(tok in h for tok in ['temp','cycle','speed','velocity','pressure','pres','flow','screw','shear','cool','energy','viscosity'])]
    mechanical=[n for n,h in zip(names,low) if any(tok in h for tok in ['stress','modulus','strain','tough','thickness','structural'])]
    identifiers=[n for n,h in zip(names,low) if any(tok in h for tok in ['part #','material #','doe run','cycle #','test #','specimen','cavity #'])]
    derived=[n for n,h in zip(names,low) if any(tok in h for tok in ['viscosity','shear rate','trend','energy','structural norm','structural loss','degradation','dd/dt','dd/dt','intercept'])]
    material=[n for n,h in zip(names,low) if 'material' in h]
    return {
      'processFields':process,'mechanicalOutcomeFields':mechanical,'identifierGroupingFields':identifiers,'derivedOrEngineeredFields':derived,'materialFields':material,
      'processAndMechanicalFieldsObserved':bool(process and mechanical),'headerCount':len(headers),'rawValuesEmitted':False}

def header_diagnostics(headers):
    names=[str(h).strip() for h in headers]
    unnamed=[name for name in names if re.fullmatch(r'Unnamed:\s*\d+',name,flags=re.I)]
    index_like=[name for name in names if name.lower() in {'index','row','row id','id'} or name.lower().startswith('unnamed:')]
    return {'columnNames':names,'columnNameCount':len(names),'unnamedColumns':unnamed,'indexLikeColumns':index_like,'namedColumnsExcludingIndexLike':len([name for name in names if name not in index_like]),'rawValuesEmitted':False}

def material_groups(df):
    candidates=[]
    for c in df.columns:
        name=str(c).lower()
        if any(t in name for t in ['material','resin','polymer','grade']):
            vals=df[c].dropna().astype(str).str.strip(); n=vals[vals!=''].nunique()
            if 2<=n<=20: candidates.append({'column':str(c),'uniqueGroups':int(n)})
    if candidates: return max(candidates,key=lambda x:x['uniqueGroups'])
    for c in df.columns:
        vals=df[c].dropna()
        if vals.dtype=='object':
            n=vals.astype(str).str.strip().nunique()
            if n==5: return {'column':str(c),'uniqueGroups':5,'identifiedBy':'five-level categorical field'}
    return None

def run(output,retrieved_date):
    c=json.loads(CONTRACT.read_text()); work=Path(tempfile.mkdtemp(prefix='mouldmaster-su13148102-'))
    try:
        errors=[]; data=None; final=None; ctype=None
        for url in [DIRECT,LANDING]:
            try:
                b,f,ct=get(url)
                if b.startswith(b'PK\x03\x04') or b[:200].lstrip().startswith(b'<') is False: data,final,ctype=b,f,ct; break
                errors.append(f'{url}: returned HTML')
            except Exception as e: errors.append(f'{url}: {type(e).__name__}: {e}')
        if data is None: raise RuntimeError('supplement retrieval failed: '+' | '.join(errors))
        source_sha=sha(data)
        files=safe_zip(data,work/'supplement') if data.startswith(b'PK\x03\x04') else []
        if not files:
            leaf=work/'supplement.bin'; leaf.write_bytes(data); files=[leaf]
        tables=[]
        for p in files:
            ext=p.suffix.lower()
            try:
                if ext=='.csv': df=pd.read_csv(p)
                elif ext in {'.xlsx','.xls'}: df=pd.read_excel(p)
                elif ext in {'.tsv','.txt'}: df=pd.read_csv(p,sep=None,engine='python')
                else: continue
                tables.append((p,df))
            except Exception: continue
        if not tables: raise RuntimeError('no readable tabular supplement file found')
        p,df=max(tables,key=lambda x: len(x[1])*max(1,len(x[1].columns)))
        dims={'rows':int(len(df)),'columns':int(len(df.columns))}
        headers=classify_headers(list(df.columns)); schema=header_diagnostics(list(df.columns)); groups=material_groups(df)
        delivered=c.get('deliveredRelease') or {}
        accepted=(dims['rows']==delivered.get('rows')==955 and dims['columns']==delivered.get('columns')==45 and source_sha==delivered.get('sha256') and schema['columnNameCount']==45 and not schema['unnamedColumns'] and headers['processAndMechanicalFieldsObserved'] and groups is not None and groups['uniqueGroups']==5)
        result={
          'schema_version':1,'status':'completed-public-measured-benchmark' if accepted else 'retrieved-profile-needs-semantic-review','retrieved_date':retrieved_date,
          'source':{'datasetId':c['datasetId'],'articleDoi':c['source']['articleDoi'],'license':c['source']['license'],'requestedUrl':LANDING,'resolvedUrl':final,'contentType':ctype,'sizeBytes':len(data),'sha256':source_sha},
          'profile':{**dims,'selectedFile':p.name,'fieldRoles':headers,'schemaDiagnostics':schema,'materialGrouping':groups,'paperReported':c['paperReported'],'deliveredRelease':delivered,'paperReleaseColumnDelta':dims['columns']-int(c['paperReported']['columns']),'recordUnit':'experimental observation / tensile-linked process record','countsAsTimeSeriesSamples':False,'rawRowsOrCellValuesEmitted':False},
          'retrieval':{'rawSupplementCommitted':False,'rawRowsUploadedAsArtifact':False},'evidenceBoundary':c['evidenceBoundary']}
        output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(result,indent=2)+'\n'); return result
    finally: shutil.rmtree(work,ignore_errors=True)

def main():
    a=argparse.ArgumentParser(); a.add_argument('--output',type=Path,required=True); a.add_argument('--retrieved-date',required=True); x=a.parse_args(); r=run(x.output,x.retrieved_date); print(json.dumps({'status':r['status'],'rows':r['profile']['rows'],'columns':r['profile']['columns'],'paperReleaseColumnDelta':r['profile']['paperReleaseColumnDelta'],'materialGrouping':r['profile']['materialGrouping']},indent=2))
if __name__=='__main__': main()
