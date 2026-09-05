#!/usr/bin/env python3
"""Retrieve benchmark-pinned open Mendeley workbooks and emit text/schema-only proof.

No numeric worksheet values are emitted. Every publisher file ID, filename and SHA-256 is
stored locally. Remote metadata is consistency evidence only. Downloads start from a fixed
Mendeley URL and redirects are checked before following them against an exact host allow-list.
"""
from __future__ import annotations
import hashlib, json, re, tempfile, urllib.error, urllib.parse, urllib.request, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

SOURCES=[
 {'datasetId':'mendeley-gtnb4j7bfx-v1','shortId':'gtnb4j7bfx','version':1,'files':[('5a234943-9f9d-45de-b82f-de0c64809dd7','modelo.xlsx','b231af5d49c0a258b5625d6e2ab2c324c233017c5c010e326a3ca485387ecc9f')]},
 {'datasetId':'mendeley-4h98rz9f92-v3','shortId':'4h98rz9f92','version':3,'files':[('368356fe-618c-4eab-82e6-53dc86762943','Raw Data.xlsx','39210169aac62a1455603d37cdffaca93cf0c46189ea4258c5f3c0a4a37255c9')]},
 {'datasetId':'mendeley-6k8fpbrd9s-v1','shortId':'6k8fpbrd9s','version':1,'files':[('8598d42d-f794-47e2-ad84-dd952c900d27','Data.xlsx','14c056dd86e11cc47e1e97834174631f9dc0806442917a7149ddf5856dc9b11c')]},
 {'datasetId':'mendeley-yxz2w7ctnh-v1','shortId':'yxz2w7ctnh','version':1,'files':[
   ('0dde1c6b-3618-4a62-bab4-af3ff5286f12','data_3pbending_3d_print_d_ryan.xlsx','5c8e5967a95d90a9652ed9167885118bc4ffe4792bf9167c19254ff526fa6742'),
   ('ff9cce79-7132-4375-956a-4b4948635cdc','data_energy_3d_print_d_ryan.xlsx','378f371f7d3b2a31902d59e4d654b8de3a7be6d057ba73dc8f1bd819b9cfcda0'),
   ('9893bf52-bbc7-4853-adba-45f8e38880d0','data_impact_3d_print_d_ryan.xlsx','2eba6818e340e963f88dcb03729aac793d5686c9c1416e81b00c104da3e41196'),
   ('e30b2a0b-12d2-461a-a119-efed84b2c82e','data_tensile_3d_print_d_ryan.xlsx','670fb27b14e34f68ee17de115c4f14b22c4aa4b9887ff8c73a42eb7b2a7e3b79')
 ]}
]
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
RELNS='{http://schemas.openxmlformats.org/package/2006/relationships}'
MENDELEY_API='https://data.mendeley.com/public-api/datasets/'
MENDELEY_DOWNLOAD='https://data.mendeley.com/public-files/datasets/'
MENDELEY_HOST='data.mendeley.com'
MENDELEY_FILE_HOST='prod-dcd-datasets-public-files-eu-west-1.s3.eu-west-1.amazonaws.com'
FILE_ID_RE=re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
SHORT_ID_RE=re.compile(r'^[a-z0-9]{10}$')


def assert_https_host(url,allowed_hosts):
    parsed=urllib.parse.urlsplit(url)
    if parsed.scheme!='https' or parsed.hostname not in allowed_hosts or parsed.username or parsed.password:
        raise RuntimeError(f'Mendeley retrieval escaped fixed HTTPS hosts: {url}')
    return url


class AllowlistedRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        assert_https_host(newurl,{MENDELEY_HOST,MENDELEY_FILE_HOST})
        return super().redirect_request(req,fp,code,msg,headers,newurl)


DOWNLOAD_OPENER=urllib.request.build_opener(AllowlistedRedirect())


def get_json(url):
    assert_https_host(url,{MENDELEY_HOST})
    req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster-measured-learning/2.3'})
    with urllib.request.urlopen(req,timeout=60) as r:
        assert_https_host(r.geturl(),{MENDELEY_HOST})
        return json.load(r)


def walk_files(value):
    if isinstance(value,dict):
        name=value.get('filename') or value.get('file_name') or value.get('name')
        file_id=value.get('id') or value.get('file_id')
        if name or file_id: yield value
        for child in value.values(): yield from walk_files(child)
    elif isinstance(value,list):
        for child in value: yield from walk_files(child)


def public_files(short_id,version):
    if not SHORT_ID_RE.fullmatch(short_id) or not isinstance(version,int) or version<1:
        raise RuntimeError('invalid locally governed Mendeley dataset identity')
    endpoint=f'{MENDELEY_API}{short_id}/files?folder_id=root&version={version}'
    return endpoint,get_json(endpoint)


def validate_pinned_identity(file_id,name):
    if not FILE_ID_RE.fullmatch(file_id):
        raise RuntimeError(f'invalid locally pinned Mendeley file id: {file_id!r}')
    if not name or '/' in name or '\\' in name or name in {'.','..'}:
        raise RuntimeError(f'invalid locally pinned Mendeley filename: {name!r}')


def verify_metadata_identity(meta,file_id,name,short_id):
    validate_pinned_identity(file_id,name)
    for obj in walk_files(meta):
        obj_id=str(obj.get('id') or obj.get('file_id') or '')
        obj_name=str(obj.get('filename') or obj.get('file_name') or obj.get('name') or '')
        if obj_id==file_id:
            if obj_name!=name:
                raise RuntimeError(f'Mendeley filename drift for {short_id}/{name}: {obj_name!r}')
            return
    raise RuntimeError(f'pinned Mendeley file id/name missing from metadata: {short_id}/{name}')


def pinned_download_urls(short_id,version,file_id):
    if not SHORT_ID_RE.fullmatch(short_id) or not isinstance(version,int) or version<1:
        raise RuntimeError('invalid locally governed Mendeley dataset identity')
    if not FILE_ID_RE.fullmatch(file_id):
        raise RuntimeError('invalid locally pinned Mendeley file id')
    encoded_id=urllib.parse.quote(file_id,safe='')
    return [
        assert_https_host(f'{MENDELEY_DOWNLOAD}{short_id}/files/{encoded_id}/file_downloaded',{MENDELEY_HOST}),
        assert_https_host(f'{MENDELEY_DOWNLOAD}{short_id}/versions/{version}/files/{encoded_id}/file_downloaded',{MENDELEY_HOST}),
    ]


def download_first(urls,destination):
    errors=[]
    for url in urls:
        try:
            assert_https_host(url,{MENDELEY_HOST})
            req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster-measured-learning/2.3'})
            with DOWNLOAD_OPENER.open(req,timeout=90) as r, open(destination,'wb') as out:
                assert_https_host(r.geturl(),{MENDELEY_HOST,MENDELEY_FILE_HOST})
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
            verify_metadata_identity(meta,file_id,name,source['shortId'])
            urls=pinned_download_urls(source['shortId'],source['version'],file_id)
            with tempfile.NamedTemporaryFile(suffix='.xlsx') as tmp:
                used=download_first(urls,tmp.name)
                digest=hashlib.sha256(Path(tmp.name).read_bytes()).hexdigest()
                if digest!=expected_sha: raise SystemExit(f'{source["datasetId"]}/{name} SHA mismatch: {digest}')
                schema=workbook_text_schema(tmp.name)
            source_proof['files'].append({'name':name,'resolvedFileId':file_id,'sha256':'sha256:'+digest,'downloadRoute':used,'sheets':schema})
        source_proof['status']='source-proof-passed'; source_proof['rawNumericValuesEmitted']=False; proofs.append(source_proof)
        print(json.dumps({'status':'source-proof-passed','datasetId':source['datasetId'],'files':[f['name'] for f in source_proof['files']]},separators=(',',':')))
    result={'schemaVersion':2,'status':'source-proofs-passed','sources':proofs,'boundary':'Workbook IDs, names, exact hashes, sheet names and bounded text/header labels only. Remote metadata is consistency evidence only. Download redirects are checked before following and restricted to Mendeley plus its exact public-file S3 host. Numeric worksheet values are not emitted.'}
    (out/'mendeley-open-workbook-source-proofs.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return 0
if __name__=='__main__': raise SystemExit(main())
