#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import tempfile
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import olefile

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'data/public-benchmark-results/mendeley-wave2-batch3-stage1.json'
DATASET_ID='8c8fjwcw86'; VERSION=1; UA='MouldMaster-Educational-Evidence-Profiler/1.0'; API_ROOT='https://api.data.mendeley.com'
C='http://schemas.openxmlformats.org/drawingml/2006/chart'; A='http://schemas.openxmlformats.org/drawingml/2006/main'; W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'; R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'*/*'})
    with urllib.request.urlopen(req,timeout=240) as r:return r.read(),r.geturl()

def listing():
    raw,_=get(f'https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}')
    x=json.loads(raw.decode());
    if isinstance(x,list):return x
    for k in ('results','files','items','data'):
        if isinstance(x.get(k),list):return x[k]
    return []

def fid(x):return str(x.get('id') or x.get('file_id') or x.get('uuid') or '')
def furl(x):
    d=x.get('content_details') or x.get('contentDetails') or {}
    for k in ('download_url','downloadUrl'):
        if d.get(k):return str(d[k])
        if x.get(k):return str(x[k])
    return f'{API_ROOT}/datasets/{DATASET_ID}/files/{fid(x)}/file_downloaded?version={VERSION}'

def sanit(s):
    s=' '.join(str(s or '').replace('\x00',' ').split())
    if not s:return None
    s=re.sub(r'(?<![A-Za-z])[-+]?\d+(?:[.,]\d+)?(?:[Ee][-+]?\d+)?(?![A-Za-z])','<n>',s)
    return s[:180]

def texts(root,tag):return [sanit(e.text) for e in root.iter(tag) if e.text and sanit(e.text)]
def point_count(node):
    if node is None:return 0
    return sum(1 for _ in node.iter(f'{{{C}}}pt'))
def cache_text(node):
    if node is None:return []
    out=[]
    for pt in node.iter(f'{{{C}}}pt'):
        v=pt.find(f'{{{C}}}v')
        if v is not None and v.text:
            s=sanit(v.text)
            if s and re.search('[A-Za-z]',s):out.append(s)
    return out

def chart_series(z,n):
    root=ET.fromstring(z.read(n)); out=[]
    for ser in root.findall('.//c:ser',{'c':C}):
        title=[]
        tx=ser.find('c:tx',{'c':C})
        if tx is not None:
            title=cache_text(tx)
            if not title:
                v=tx.find('.//c:v',{'c':C});
                if v is not None and v.text:title=[sanit(v.text)]
        val=ser.find('c:val',{'c':C}) or ser.find('c:yVal',{'c':C})
        cat=ser.find('c:cat',{'c':C}) or ser.find('c:xVal',{'c':C})
        valcache=None; catcache=None
        if val is not None:
            valcache=val.find('.//c:numCache',{'c':C})
        if cat is not None:
            catcache=cat.find('.//c:numCache',{'c':C}) or cat.find('.//c:strCache',{'c':C})
        out.append({'seriesTitleLabels':[x for x in title if x], 'numericValuePointCount':point_count(valcache), 'categoryPointCount':point_count(catcache), 'categoryTextLabels':cache_text(cat)[:30], 'rawNumericValuesEmitted':False})
    return {'chartXml':n,'series':out,'seriesCount':len(out)}

def slide_chart_map(z):
    names=set(z.namelist()); out=[]
    for slide in sorted(n for n in names if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)):
        root=ET.fromstring(z.read(slide)); labels=texts(root,f'{{{A}}}t')
        relname=slide.replace('ppt/slides/','ppt/slides/_rels/')+'.rels'
        targets={}
        if relname in names:
            rr=ET.fromstring(z.read(relname))
            for rel in rr:
                rid=rel.attrib.get('Id'); target=rel.attrib.get('Target','')
                if 'chart' in target:targets[rid]=target
        chart_ids=[]
        for gf in root.findall('.//*[@{%s}id]'%R):
            rid=gf.attrib.get('{%s}id'%R)
            if rid in targets:
                target=targets[rid].replace('../','ppt/')
                chart_ids.append(target)
        out.append({'slideXml':slide,'safeTextLabels':labels[:120],'chartTargets':chart_ids})
    return out

def profile_pptx(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names=z.namelist(); charts=[chart_series(z,n) for n in sorted(x for x in names if re.fullmatch(r'ppt/charts/chart\d+\.xml',x))]
        embeddings=[]
        for n in sorted(x for x in names if x.startswith('ppt/embeddings/')):
            b=z.read(n); ent={'member':n,'sizeBytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'magicHex':b[:16].hex(),'oleCompoundFile':olefile.isOleFile(io.BytesIO(b))}
            if ent['oleCompoundFile']:
                ole=olefile.OleFileIO(io.BytesIO(b)); ent['streams']=[{'name':'/'.join(p),'sizeBytes':ole.get_size(p)} for p in ole.listdir(streams=True,storages=False)][:100]; ole.close()
            printable=[]
            for m in re.findall(rb'[ -~]{8,140}',b):
                s=sanit(m.decode('latin1','replace'))
                if s and re.search('[A-Za-z]',s):printable.append(s)
                if len(printable)>=80:break
            ent['safePrintableLabels']=printable; embeddings.append(ent)
        return {'charts':charts,'chartCount':len(charts),'slides':slide_chart_map(z),'embeddings':embeddings,'rawNumericValuesEmitted':False}

def profile_docx(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        root=ET.fromstring(z.read('word/document.xml')); tables=[]
        for ti,tbl in enumerate(root.iter(f'{{{W}}}tbl'),1):
            rows=[]
            for ri,tr in enumerate(tbl.iter(f'{{{W}}}tr'),1):
                cells=[]
                for ci,tc in enumerate(tr.findall(f'{{{W}}}tc'),1):
                    vals=[]; numeric_text_tokens=0
                    for t in tc.iter(f'{{{W}}}t'):
                        raw=t.text or ''
                        numeric_text_tokens+=len(re.findall(r'[-+]?\d+(?:[.,]\d+)?',raw))
                        s=sanit(raw)
                        if s:vals.append(s)
                    cells.append({'column':ci,'safeTextLabels':vals,'numericTokenCount':numeric_text_tokens})
                rows.append({'row':ri,'cells':cells})
            tables.append({'tableIndex':ti,'rows':rows})
        return {'tableCount':len(tables),'tables':tables,'rawNumericValuesEmitted':False}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);ap.add_argument('--retrieved-date',required=True);args=ap.parse_args()
    m=json.loads(MANIFEST.read_text());src=next(x for x in m['sources'] if x['datasetId']=='mendeley-8c8fjwcw86-v1'); pub={fid(x):x for x in listing()}; files=[]
    for e in src['apiFiles']:
        item=pub[e['id']];data,final=get(furl(item));digest=hashlib.sha256(data).hexdigest()
        if digest!=e['sha256']:raise RuntimeError(f'publisher SHA mismatch for {e["name"]}')
        prof=profile_docx(data) if e['name'].lower().endswith('.docx') else profile_pptx(data)
        files.append({'fileName':e['name'],'sha256':digest,'publisherSha256Matched':True,'resolvedUrl':final,'profile':prof,'rawPublisherFileCommitted':False})
    result={'schema':1,'status':'retrieved-nylon12-supporting-package-needs-semantic-decision','retrievedDate':args.retrieved_date,'source':{'datasetId':src['datasetId'],'datasetDoi':src['doi'],'license':src['license']},'files':files,'acceptance':{'countsAsFullyProfiledMeasuredDataset':False,'acceptedMeasuredTimeSeriesSamples':0},'retrieval':{'rawPublisherFilesCommitted':False,'rawNumericValuesUploadedAsArtifact':False},'evidenceBoundary':'Only chart-cache point counts, sanitized series/table labels, table numeric-token counts and embedded-object structure are emitted. No raw chart/table numeric values or source files are retained. Injection-moulded evidence must be distinguishable from SLS and direct measurements from averages/standard deviations before acceptance.'}
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'status':result['status'],'files':len(files)},indent=2))
if __name__=='__main__':main()
