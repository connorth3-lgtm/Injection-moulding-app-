#!/usr/bin/env python3
from __future__ import annotations
import argparse,html,json,re,urllib.parse,urllib.request
from pathlib import Path
DATASET='47k6jswwg7';VERSION=1;DOI='10.17632/47k6jswwg7.1';PAGE=f'https://data.mendeley.com/datasets/{DATASET}/{VERSION}';UA='MouldMaster-Educational-Evidence-Profiler/1.0'
def get(url,accept='*/*'):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept})
    with urllib.request.urlopen(req,timeout=90) as r:return r.read(),r.geturl()
def flatten(x):
    if isinstance(x,list):return x
    if isinstance(x,dict):
        for k in ('results','files','items','data'):
            if isinstance(x.get(k),list):return x[k]
    return []
def compact(x,folder=None):
    d=x.get('content_details') or x.get('contentDetails') or {};name=str(x.get('filename') or x.get('name') or '')
    lo=name.lower();structured=any(lo.endswith(e) for e in ('.csv','.tsv','.txt','.xlsx','.xls','.json','.mat','.npy','.npz','.vms','.spc','.dx','.dta'))
    image=any(lo.endswith(e) for e in ('.png','.jpg','.jpeg','.tif','.tiff','.bmp','.gif'))
    document=any(lo.endswith(e) for e in ('.pdf','.doc','.docx','.ppt','.pptx'))
    return {'id':x.get('id') or x.get('file_id') or x.get('uuid'),'filename':name,'folderId':x.get('folder_id') or folder,'sizeBytes':d.get('size') if d.get('size') is not None else x.get('size'),'sha256':d.get('sha256_hash') or d.get('sha256Hash'),'contentType':d.get('content_type') or d.get('contentType'),'structuredNumericCandidateByExtension':structured,'imageOnlyCandidateByExtension':image,'documentCandidateByExtension':document,'rawPayloadDownloaded':False}
def api_files(folder_id='root'):
    url=f'https://data.mendeley.com/public-api/datasets/{DATASET}/files?folder_id={urllib.parse.quote(str(folder_id))}&version={VERSION}'
    raw,_=get(url,'application/json');return flatten(json.loads(raw.decode('utf-8')))
def page_ids():
    raw,_=get(PAGE,'text/html,application/xhtml+xml');text=html.unescape(raw.decode('utf-8','replace')).replace('\\u002F','/').replace('\\/','/')
    pat=re.compile(rf'https://data\.mendeley\.com/public-files/datasets/{DATASET}/files/([0-9a-fA-F-]{{36}})/file_downloaded')
    return sorted(set(m.group(1).lower() for m in pat.finditer(text)))
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);ap.add_argument('--retrieved-date',required=True);a=ap.parse_args();errors=[];items=[]
    try:items=[compact(x,'root') for x in api_files('root')]
    except Exception as e:errors.append(f'public-api root: {type(e).__name__}: {e}')
    html_ids=[]
    try:html_ids=page_ids()
    except Exception as e:errors.append(f'page links: {type(e).__name__}: {e}')
    known={str(x.get('id') or '').lower() for x in items};html_only=[x for x in html_ids if x not in known]
    status='publisher-file-manifest-exposed' if items or html_ids else 'publisher-record-no-files-exposed'
    result={'schema':1,'status':status,'retrievedDate':a.retrieved_date,'source':{'datasetFamilyId':'sic-nylon6-injection-moulded-v1','alternateDatasetDoi':DOI,'alternateMendeleyDatasetId':DATASET,'alternateLicense':'CC BY-NC 3.0','version':VERSION},'manifest':{'apiFiles':items,'htmlFileIds':html_ids,'htmlOnlyFileIds':html_only,'fileCountLowerBound':max(len(items),len(html_ids)),'structuredNumericCandidates':[x['filename'] for x in items if x['structuredNumericCandidateByExtension']],'imageOnlyCandidates':[x['filename'] for x in items if x['imageOnlyCandidateByExtension']],'documentCandidates':[x['filename'] for x in items if x['documentCandidateByExtension']],'errors':errors,'rawPayloadsDownloaded':False,'rawRowsOrArraysEmitted':False},'acceptance':{'countsAsFullyProfiledMeasuredDataset':False,'acceptedMeasuredTimeSeriesSamples':0,'sameStudyAlternateReleaseDoesNotCreateSecondFamily':True},'evidenceBoundary':'Metadata/file-manifest pass only. The alternate CC BY-NC 3.0 release may recover files for the existing SiC/Nylon-6 injection-moulding family, but never creates a second family. No payloads are downloaded. Structured numeric files may advance; images alone cannot yield numeric counts by OCR.'}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'status':status,'apiFiles':[(x['filename'],x['sizeBytes']) for x in items],'htmlOnlyFileIds':html_only,'structured':result['manifest']['structuredNumericCandidates'],'images':result['manifest']['imageOnlyCandidates']},indent=2))
if __name__=='__main__':main()
