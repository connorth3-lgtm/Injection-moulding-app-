#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,html,io,json,re,urllib.request,zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
M=ROOT/'data/public-benchmark-results/sic-nylon6-alt-stage1.json'
DATASET='47k6jswwg7';VERSION=1;UA='MouldMaster-Educational-Evidence-Profiler/1.0'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';C='http://schemas.openxmlformats.org/drawingml/2006/chart';A='http://schemas.openxmlformats.org/drawingml/2006/main'
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'*/*','Referer':f'https://data.mendeley.com/datasets/{DATASET}/{VERSION}'})
    with urllib.request.urlopen(req,timeout=180) as r:return r.read(),r.geturl()
def num_tokens(s):return len(re.findall(r'(?<![A-Za-z])[-+]?\d+(?:[.,]\d+)?(?:[Ee][-+]?\d+)?(?![A-Za-z])',str(s or '')))
def sanit(s):
    s=html.unescape(' '.join(str(s or '').replace('\x00',' ').split()))
    if not s:return None
    s=re.sub(r'(?<![A-Za-z])[-+]?\d+(?:[.,]\d+)?(?:[Ee][-+]?\d+)?(?![A-Za-z])','<n>',s)
    return s[:240]
def cell_text(tc):
    raw=' '.join((t.text or '') for t in tc.iter(f'{{{W}}}t'));return raw,sanit(raw),num_tokens(raw)
def doc_tables(root):
    out=[]
    for ti,tbl in enumerate(root.iter(f'{{{W}}}tbl'),1):
        rows=[];total_num=0
        for ri,tr in enumerate(tbl.findall(f'{{{W}}}tr'),1):
            cells=[]
            for ci,tc in enumerate(tr.findall(f'{{{W}}}tc'),1):
                raw,safe,n=cell_text(tc);total_num+=n;cells.append({'column':ci,'safeText':safe,'numericTokenCount':n,'nonEmpty':bool(raw.strip())})
            rows.append({'row':ri,'cells':cells})
        out.append({'tableIndex':ti,'rowCount':len(rows),'maxCellCount':max([len(r['cells']) for r in rows] or [0]),'numericTokenCount':total_num,'rows':rows,'rawNumericValuesEmitted':False})
    return out
def doc_paragraphs(root):
    out=[]
    for pi,p in enumerate(root.iter(f'{{{W}}}p'),1):
        raw=' '.join((t.text or '') for t in p.iter(f'{{{W}}}t')).strip()
        if not raw:continue
        out.append({'paragraphIndex':pi,'safeText':sanit(raw),'numericTokenCount':num_tokens(raw)})
    return out
def cache_points(node):
    if node is None:return 0
    return sum(1 for _ in node.iter(f'{{{C}}}pt'))
def chart_profile(z,name):
    root=ET.fromstring(z.read(name));series=[]
    for ser in root.findall('.//c:ser',{'c':C}):
        labels=[]
        for v in ser.findall('.//c:tx//c:v',{'c':C}):
            if v.text:
                s=sanit(v.text)
                if s:labels.append(s)
        val=ser.find('c:val',{'c':C}) or ser.find('c:yVal',{'c':C});cat=ser.find('c:cat',{'c':C}) or ser.find('c:xVal',{'c':C})
        vcache=val.find('.//c:numCache',{'c':C}) if val is not None else None
        ccache=None
        if cat is not None:ccache=cat.find('.//c:numCache',{'c':C}) or cat.find('.//c:strCache',{'c':C})
        series.append({'seriesTitleLabels':labels[:10],'numericValuePointCount':cache_points(vcache),'categoryPointCount':cache_points(ccache),'rawNumericValuesEmitted':False})
    texts=[]
    for t in root.iter(f'{{{A}}}t'):
        if t.text:
            s=sanit(t.text)
            if s:texts.append(s)
    return {'chartXml':name,'safeChartTextLabels':texts[:80],'seriesCount':len(series),'series':series,'rawNumericValuesEmitted':False}
def embedded_profile(z,name):
    b=z.read(name);magic=b[:16].hex();kind='xlsx-or-zip' if b.startswith(b'PK\x03\x04') else 'ole-or-binary' if b.startswith(bytes.fromhex('d0cf11e0a1b11ae1')) else 'other'
    return {'member':name,'sizeBytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'kind':kind,'magicHex':magic,'rawPayloadEmitted':False}
def profile(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names=z.namelist();root=ET.fromstring(z.read('word/document.xml'));tables=doc_tables(root);pars=doc_paragraphs(root)
        charts=[chart_profile(z,n) for n in sorted(x for x in names if re.fullmatch(r'word/charts/chart\d+\.xml',x))]
        embedded=[embedded_profile(z,n) for n in sorted(x for x in names if x.startswith('word/embeddings/') and not x.endswith('/'))]
        media=[{'member':n,'sizeBytes':z.getinfo(n).file_size,'extension':Path(n).suffix.lower(),'rawImageEmitted':False} for n in sorted(x for x in names if x.startswith('word/media/') and not x.endswith('/'))]
        return {'paragraphCount':len(pars),'paragraphs':pars,'tableCount':len(tables),'tables':tables,'chartCount':len(charts),'charts':charts,'embeddedObjectCount':len(embedded),'embeddedObjects':embedded,'mediaImageCount':len(media),'media':media,'rawNumericValuesEmitted':False,'imageOcrPerformed':False}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);ap.add_argument('--retrieved-date',required=True);a=ap.parse_args();m=json.loads(M.read_text());entry=m['manifest']['publisherFileEntries'][0]
    url=f'https://data.mendeley.com/public-files/datasets/{DATASET}/files/{entry["id"]}/file_downloaded';data,final=get(url);digest=hashlib.sha256(data).hexdigest()
    if digest!=entry['sha256']:raise RuntimeError('publisher SHA mismatch for SiC/Nylon-6 alternate DOCX')
    p=profile(data)
    result={'schema':1,'status':'retrieved-document-profile-needs-semantic-decision','retrievedDate':a.retrieved_date,'source':{'datasetFamilyId':'sic-nylon6-injection-moulded-v1','primaryDatasetDoi':'10.17632/ztkc87d6sr.1','alternateDatasetDoi':'10.17632/47k6jswwg7.1','licenseBoundary':'CC BY-NC 3.0','publisherFileName':entry['filename'],'sha256':digest,'publisherSha256Matched':True,'resolvedUrl':final},'profile':p,'acceptance':{'countsAsFullyProfiledMeasuredDataset':False,'acceptedMeasuredTimeSeriesSamples':0,'acceptedRecordLevelOrCharacterizationValues':0,'semanticDecisionRequired':True,'sameStudyAlternateReleaseDoesNotCreateSecondFamily':True},'retrieval':{'duplicateSecondPublisherEntryDownloaded':False,'rawPublisherFileCommitted':False,'rawNumericValuesUploadedAsArtifact':False,'imagesOcred':False},'evidenceBoundary':'One unique DOCX payload is retrieved and SHA-verified. Duplicate publisher entry is not downloaded twice. Only sanitized text, table numeric-token counts, chart-cache point counts, embedded-object metadata and image metadata are emitted. Images are never OCR-counted. Direct measured data must be explicitly identifiable before acceptance.'}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'status':result['status'],'tables':p['tableCount'],'charts':p['chartCount'],'embedded':p['embeddedObjectCount'],'images':p['mediaImageCount']},indent=2))
if __name__=='__main__':main()
