#!/usr/bin/env python3
"""Retrieve PMC4753395 supplementary data and prove the benchmarked tensile workbook."""
from __future__ import annotations
import hashlib, json, tempfile, urllib.request, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

URLS=[
 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4753395/bin/mmc1.zip',
 'https://pmc.ncbi.nlm.nih.gov/articles/instance/4753395/bin/mmc1.zip'
]
EXPECTED_WORKBOOK_SHA='6e376e0acdfc614b6c16e0fef99e0e74cace8bc4d931a08a729e05dfc2cd7783'
WORKBOOK='Tensile-Data.xlsx'
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
RELNS='{http://schemas.openxmlformats.org/package/2006/relationships}'

def retrieve():
    errors=[]
    for url in URLS:
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster-measured-learning/2'})
            with urllib.request.urlopen(req,timeout=90) as r: data=r.read()
            if data.startswith(b'PK'): return url,data
            errors.append(f'{url}: not zip ({len(data)} bytes)')
        except Exception as exc: errors.append(f'{url}: {exc}')
    raise SystemExit('PMC supplementary retrieval failed: '+'; '.join(errors))

def string_schema(blob):
    with zipfile.ZipFile(blob) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root.findall('m:si',NS): shared.append(''.join(t.text or '' for t in si.iterfind('.//m:t',NS)))
        wb=ET.fromstring(z.read('xl/workbook.xml')); relroot=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rels={r.attrib['Id']:r.attrib['Target'] for r in relroot.findall(f'{RELNS}Relationship')}; sheets=[]
        for sheet in wb.find('m:sheets',NS):
            name=sheet.attrib['name']; target=rels[sheet.attrib[f'{{{NS["r"]}}}id']]; target='xl/'+target.lstrip('/') if not target.startswith('xl/') else target
            xml=ET.fromstring(z.read(target)); labels=[]
            for row in xml.findall('.//m:sheetData/m:row',NS):
                if int(row.attrib.get('r','0'))>20: continue
                for cell in row.findall('m:c',NS):
                    typ=cell.attrib.get('t'); text=None
                    if typ=='s':
                        v=cell.find('m:v',NS)
                        if v is not None and v.text is not None: text=shared[int(v.text)]
                    elif typ=='inlineStr': text=''.join(t.text or '' for t in cell.iterfind('.//m:t',NS))
                    elif typ=='str':
                        v=cell.find('m:v',NS); text=v.text if v is not None else None
                    if text and text.strip(): labels.append({'cell':cell.attrib.get('r'),'text':text.strip()[:240]})
            sheets.append({'name':name,'boundedTextLabels':labels[:120]})
        return sheets

def main():
    out=Path('measured-source-proof'); out.mkdir(exist_ok=True)
    url,data=retrieve()
    with zipfile.ZipFile(tempfile.SpooledTemporaryFile()) as _:
        pass
    import io
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        matches=[n for n in z.namelist() if n.endswith('/'+WORKBOOK) or n==WORKBOOK]
        if len(matches)!=1: raise SystemExit(f'expected exactly one {WORKBOOK}, found {matches}')
        member=matches[0]; workbook=z.read(member)
    digest=hashlib.sha256(workbook).hexdigest()
    if digest!=EXPECTED_WORKBOOK_SHA: raise SystemExit(f'PMC measured workbook SHA mismatch: {digest}')
    schema=string_schema(io.BytesIO(workbook))
    proof={'schemaVersion':1,'status':'source-proof-passed','datasetId':'pmc4753395-hdpe-cenosphere-v1','retrievalUrl':url,'sourceMember':member,'workbookSha256':'sha256:'+digest,'sheets':schema,'rawNumericValuesEmitted':False,'rawSourceRetained':False}
    (out/'pmc-hdpe-tensile-source-proof.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':proof['status'],'datasetId':proof['datasetId'],'workbookSha256':proof['workbookSha256'],'sheets':[s['name'] for s in schema]},separators=(',',':')))
    return 0
if __name__=='__main__': raise SystemExit(main())
