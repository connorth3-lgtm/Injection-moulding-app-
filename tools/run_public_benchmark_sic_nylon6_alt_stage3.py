#!/usr/bin/env python3
from __future__ import annotations
import argparse,hashlib,io,json,re,urllib.request,zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];M=json.loads((ROOT/'data/public-benchmark-results/sic-nylon6-alt-stage1.json').read_text());DATASET='47k6jswwg7';UA='MouldMaster-Educational-Evidence-Profiler/1.0';W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ENTRY=M['manifest']['publisherFileEntries'][0]
def get():
    u=f'https://data.mendeley.com/public-files/datasets/{DATASET}/files/{ENTRY["id"]}/file_downloaded';req=urllib.request.Request(u,headers={'User-Agent':UA,'Accept':'*/*','Referer':f'https://data.mendeley.com/datasets/{DATASET}/1'})
    with urllib.request.urlopen(req,timeout=180) as r:return r.read(),r.geturl()
def text(node):return ' '.join((t.text or '') for t in node.iter(f'{{{W}}}t')).strip()
def numeric_count(s):return len(re.findall(r'[-+]?\d+(?:\.\d+)?(?:[Ee][-+]?\d+)?',str(s or '')))
def norm(s):return re.sub(r'\s+','',str(s or '')).upper()
def parse_table(tbl,index,title):
    rows=tbl.findall(f'{{{W}}}tr');
    if len(rows)!=6:raise RuntimeError(f'{title} table row count changed: {len(rows)}')
    matrix=[[text(tc) for tc in tr.findall(f'{{{W}}}tc')] for tr in rows]
    if any(len(r)!=5 for r in matrix):raise RuntimeError(f'{title} table column count changed')
    headers=[norm(x) for x in matrix[0]]
    if headers[0] not in {'DESIGNATIONOFSPECIMEN','DESIGNATIONOFSPECIMEN'}:raise RuntimeError(f'{title} specimen header changed: {matrix[0][0]}')
    if headers[1:]!=['5N','10N','20N','30N']:raise RuntimeError(f'{title} load headers changed: {matrix[0][1:]}')
    if [norm(r[0]) for r in matrix[1:]]!=['S1','S2','S3','S4','S5']:raise RuntimeError(f'{title} specimen labels changed')
    direct=0
    for r in matrix[1:]:
        for c in r[1:]:
            if numeric_count(c)!=1:raise RuntimeError(f'{title} expected one numeric measurement in every specimen/load cell')
            direct+=1
    return {'tableIndex':index,'semanticTitle':title,'specimenCount':5,'appliedLoadLevelsN':[5,10,20,30],'measurementCellsPerSpecimen':4,'directMeasuredValues':direct,'rawNumericValuesEmitted':False}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);ap.add_argument('--retrieved-date',required=True);a=ap.parse_args();data,final=get();digest=hashlib.sha256(data).hexdigest()
    if digest!=ENTRY['sha256']:raise RuntimeError('publisher SHA mismatch for SiC/Nylon-6 tribology DOCX')
    with zipfile.ZipFile(io.BytesIO(data)) as z:root=ET.fromstring(z.read('word/document.xml'))
    paras=[text(p) for p in root.iter(f'{{{W}}}p') if text(p)];joined='\n'.join(paras).lower()
    if 'variations of co-efficient of friction for n6 and n6 composites' not in joined:raise RuntimeError('coefficient-of-friction semantic title missing')
    if 'variations of wear for n6 and n6 composites' not in joined:raise RuntimeError('wear semantic title missing')
    tables=list(root.iter(f'{{{W}}}tbl'))
    if len(tables)!=2:raise RuntimeError(f'expected exactly two delivered numeric tables, found {len(tables)}')
    blocks=[parse_table(tables[0],1,'coefficient-of-friction'),parse_table(tables[1],2,'wear')];total=sum(x['directMeasuredValues'] for x in blocks)
    if total!=40:raise RuntimeError(f'exact tribology reconciliation failed: {total}')
    result={'schema':1,'status':'accepted-profiled-injection-moulded-tribology','retrievedDate':a.retrieved_date,'source':{'datasetFamilyId':'sic-nylon6-injection-moulded-v1','primaryDatasetDoi':'10.17632/ztkc87d6sr.1','alternateDatasetDoi':'10.17632/47k6jswwg7.1','useLicenseBoundary':'CC BY-NC 3.0','companionArticleDoi':'10.1016/j.dib.2020.105662','publisherFileName':ENTRY['filename'],'sha256':digest,'publisherSha256Matched':True,'resolvedUrl':final},'profile':{'acceptedDirectMeasuredBlocks':blocks,'directRecordLevelTribologyMeasurements':total,'excludedEvidence':{'tga':'image-only in delivered DOCX; no OCR numeric reconstruction','ftir':'image-only in delivered DOCX; no OCR numeric reconstruction','sem':'image-only qualitative morphology evidence; no numeric count','duplicatePublisherEntry':'same payload SHA; not downloaded or counted twice','loadHeaderNumbers':'experimental conditions, not measured outcomes','specimenIdentifiers':'labels, not measured outcomes'},'rawNumericValuesEmitted':False,'imageOcrPerformed':False},'acceptance':{'countsAsFullyProfiledMeasuredDataset':True,'recoversPreviouslyBlockedDatasetFamily':True,'createsNewSecondFamilyForAlternateDoi':False,'acceptedRecordLevelMeasuredValues':40,'acceptedMeasuredTimeSeriesSamples':0,'commercialReuseAllowed':False,'rawRedistributionAllowedUnderProjectPolicy':False},'retrieval':{'duplicateSecondPublisherEntryDownloaded':False,'rawPublisherFileCommitted':False,'rawNumericValuesUploadedAsArtifact':False,'imagesOcred':False},'evidenceBoundary':'The alternate CC BY-NC 3.0 DOCX recovers the previously blocked SiC/Nylon-6 family. Exactly 40 direct tribology values are accepted from two machine-readable Word tables: coefficient of friction and wear, each 5 specimens by 4 applied loads. TGA, FTIR and SEM are image-only and are not OCR-counted. The alternate DOI does not create a second family.'}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'status':result['status'],'blocks':blocks,'accepted':total},indent=2))
if __name__=='__main__':main()
