#!/usr/bin/env python3
"""Retrieve benchmark-pinned open Mendeley workbooks and emit text/schema-only proof.

No numeric worksheet values are emitted. Exact file SHA-256 is verified before workbook
sheet names and bounded string/header labels are inspected.
"""
from __future__ import annotations
import hashlib, json, re, tempfile, urllib.parse, urllib.request, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

SOURCES=[
 {'datasetId':'mendeley-gtnb4j7bfx-v1','shortId':'gtnb4j7bfx','version':1,'files':[('5a234943-9f9d-45de-b82f-de0c64809dd7','modelo.xlsx','b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f')]},
 {'datasetId':'mendeley-4h98rz9f92-v3','shortId':'4h98rz9f92','version':3,'files':[('368356fe-618c-4eab-82e6-53dc86762943','Raw Data.xlsx','39210169aac62a1455603d37cdffaca93cf0c46189ea4258c5f3c0a4a37255c9')]},
 {'datasetId':'mendeley-6k8fpbrd9s-v1','shortId':'6k8fpbrd9s','version':1,'files':[('8598d42d-f794-47e2-ad84-dd952c900d27','Data.xlsx','14c056dd86e11cc47e1e97834174631f9dc0806442917a7149ddf5856dc9b11c')]},
 {'datasetId':'mendeley-yxz2w7ctnh-v1','shortId':'yxz2w7ctnh','version':1,'files':[
   (None,'data_3pbending_3d_print_d_ryan.xlsx','5c8e5967a95d90a9652ed9167885118bc4ffe4792bf9167c19254ff526fa6742'),
   (None,'data_energy_3d_print_d_ryan.xlsx','378f371f7d3b2a31902d59e4d654b8de3a7be6d057ba73dc8f1bd819b9cfcda0'),
   (None,'data_impact_3d_print_d_ryan.xlsx','2eba6818e340e963f88dcb03729aac793d5686c9c1416e81b00c104da3e41196'),
   (None,'data_tensile_3d_print_d_ryan.xlsx','670fb27b14e34f68ee17de115c4f14b22c4aa4b9887ff8c73a42eb7b2a7e3b79')
 ]}
]
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
RELNS='{http://schemas.openxmlformats.org/package/2006/relationships}'


def get_json(url):
    req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster-measured-learning/2'})
    with urllib.request.urlopen(req,timeout=60) as r: return json.load(r)

def walk_files(value):
    if isinstance(value,dict):
        # Yield any object that looks file-like before walking children.
        name=value.get('filename') or value.get('file_name') or value.get('name')
        file_id=value.get('id') or value.get('file_id')
        if name or file_id: yield value
        for child in value.values(): yield from walk_files(child)
    elif isinstance(value,list):
        for child in value: yield from walk_files(child)

def find_url(value):
    urls=[]
    def rec(v,key=''):
        if isinstance(v,dict):
            for k,c in v.items(): rec(c,str(k))
        elif isinstance(v,list):
            for c in v: rec(c,key)
        elif isinstance(v,str) and v.startswith('http'):
            score=0
            kl=key.lower(); vl=v.lower()
            if 'download' in kl: score+=5
            if 'download' in vl or 'file_downloaded' in vl: score+=4
            if 'public-files' in vl: score+=2
            urls.append((score,v))
    rec(value)
    return max(urls,default=(0,None))[1]

def public_files(short_id,version):
    endpoint=f'https://data.mendeley.com/public-api/datasets/{short_id}/files?folder_id=root&version={version}'
    return endpoint,get_json(endpoint)

def resolve_file(meta,file_id,name,short_id,version):
    candidates=list(walk_files(meta))
    chosen=None
    for obj in candidates:
        obj_id=str(obj.get('id') or obj.get('file_id') or '')
        obj_name=str(obj.get('filename') or obj.get('file_name') or obj.get('name') or '')
        if file_id and obj_id==file_id: chosen=obj; break
        if obj_name==name: chosen=obj
    if chosen:
        resolved_id=str(chosen.get('id') or chosen.get('file_id') or file_id or '')
        url=find_url(chosen)
    else:
        resolved_id=str(file_id or '')
        url=None
    direct=[]
    if resolved_id:
        direct.extend([
            f'https://data.mendeley.com/public-files/datasets/{short_id}/files/{resolved_id}/file_downloaded',
            f'https://data.mendeley.com/public-files/datasets/{short_id}/versions/{version}/files/{resolved_id}/file_downloaded',
        ])
    if url: direct.insert(0,url)
    if not direct: raise RuntimeError(f'could not resolve file id/url for {short_id}/{name}')
    return chosen,resolved_id,direct

def download_first(urls,destination):
    errors=[]
    for url in urls:
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster-measured-learning/2'})
            with urllib.request.urlopen(req,timeout=90) as r, open(destination,'wb') as out:
                while True:
                    chunk=r.read(1024*1024)
                    if not chunk: break
                    out.write(chunk)
            if Path(destination).stat().st_size>0: return url
        except Exception as exc:
            errors.append(f'{url}: {exc}')
    raise RuntimeError('; '.join(errors))

def col_index(ref):
    letters=''.join(ch for ch in ref if ch.isalpha()).upper(); n=0
    for ch in letters: n=n*26+(ord(ch)-64)
    return n

def workbook_text_schema(path):
    with zipfile.ZipFile(path) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root.findall('m:si',NS): shared.append(''.join(t.text or '' for t in si.iterfind('.//m:t',NS)))
        wb=ET.fromstring(z.read('xl/workbook.xml'))
        relroot=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rels={r.attrib['Id']:r.attrib['Target'] for r in relroot.findall(f'{RELNS}Relationship')}
        sheets=[]
        for sheet in wb.find('m:sheets',NS):
            name=sheet.attrib['name']; target=rels[sheet.attrib[f'{{{NS["r"]}}}id']]
            target='xl/'+target.lstrip('/') if not target.startswith('xl/') else target
            xml=ET.fromstring(z.read(target))
            labels=[]
            max_col=0; max_row=0
            for row in xml.findall('.//m:sheetData/m:row',NS):
                rnum=int(row.attrib.get('r','0')); max_row=max(max_row,rnum)
                if rnum>25: continue
                for cell in row.findall('m:c',NS):
                    ref=cell.attrib.get('r',''); max_col=max(max_col,col_index(ref))
                    typ=cell.attrib.get('t'); text=None
                    if typ=='s':
                        v=cell.find('m:v',NS)
                        if v is not None and v.text is not None:
                            idx=int(v.text); text=shared[idx] if 0<=idx<len(shared) else None
                    elif typ=='inlineStr':
                        text=''.join(t.text or '' for t in cell.iterfind('.//m:t',NS))
                    elif typ=='str':
                        v=cell.find('m:v',NS); text=v.text if v is not None else None
                    if text and text.strip(): labels.append({'cell':ref,'text':text.strip()[:240]})
            sheets.append({'name':name,'boundedTextLabels':labels[:120],'maxObservedTextColumnIndexFirst25Rows':max_col,'maxRowFromWorksheetXml':max_row})
        return sheets

def main():
    out=Path('measured-source-proof'); out.mkdir(exist_ok=True)
    proofs=[]
    for source in SOURCES:
        endpoint,meta=public_files(source['shortId'],source['version'])
        source_proof={'datasetId':source['datasetId'],'metadataEndpoint':endpoint,'files':[]}
        for file_id,name,expected_sha in source['files']:
            chosen,resolved_id,urls=resolve_file(meta,file_id,name,source['shortId'],source['version'])
            with tempfile.NamedTemporaryFile(suffix='.xlsx') as tmp:
                used=download_first(urls,tmp.name)
                digest=hashlib.sha256(Path(tmp.name).read_bytes()).hexdigest()
                if digest!=expected_sha: raise SystemExit(f'{source["datasetId"]}/{name} SHA mismatch: {digest}')
                schema=workbook_text_schema(tmp.name)
            source_proof['files'].append({'name':name,'resolvedFileId':resolved_id or None,'sha256':'sha256:'+digest,'downloadRoute':used,'sheets':schema})
        source_proof['status']='source-proof-passed'; source_proof['rawNumericValuesEmitted']=False; proofs.append(source_proof)
        print(json.dumps({'status':'source-proof-passed','datasetId':source['datasetId'],'files':[f['name'] for f in source_proof['files']]},separators=(',',':')))
    result={'schemaVersion':1,'status':'source-proofs-passed','sources':proofs,'boundary':'Workbook names, exact hashes, sheet names and bounded text/header labels only. Numeric worksheet values are not emitted.'}
    (out/'mendeley-open-workbook-source-proofs.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return 0
if __name__=='__main__': raise SystemExit(main())
