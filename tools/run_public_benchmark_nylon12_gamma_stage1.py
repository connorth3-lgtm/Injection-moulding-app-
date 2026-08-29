#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, urllib.request
from pathlib import Path

DATASET_ID='8c8fjwcw86'; VERSION=1
PAGE=f'https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}'
PUBLIC_FILES=f'https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}'
UA='MouldMaster-Educational-Evidence-Profiler/1.0'

def get(url,accept='*/*'):
    req=urllib.request.Request(url,headers={'Accept':accept,'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=60) as r: return r.read(),r.geturl()

def flatten(payload):
    if isinstance(payload,list): return payload
    if isinstance(payload,dict):
        for key in ('results','files','items','data'):
            if isinstance(payload.get(key),list): return payload[key]
    return []

def compact(item):
    d=item.get('content_details') or item.get('contentDetails') or {}
    name=str(item.get('filename') or item.get('name') or '').strip()
    low=name.lower()
    injection=any(x in low for x in ['injection','mold','mould','im_',' im ','injection-molded','injection_molded'])
    sls=any(x in low for x in ['sls','selective laser','laser sinter','laser_sinter'])
    return {'id':item.get('id') or item.get('file_id'),'filename':name,'folderId':item.get('folder_id'),'sizeBytes':d.get('size') if d.get('size') is not None else item.get('size'),'sha256':d.get('sha256_hash') or d.get('sha256Hash'),'contentType':d.get('content_type') or d.get('contentType'),'injectionMarkerByName':bool(injection and not sls),'slsMarkerByName':bool(sls and not injection),'mixedOrAmbiguousRouteByName':bool((injection and sls) or (not injection and not sls)),'rawPayloadDownloaded':False}

def page_link_ids():
    raw,_=get(PAGE,'text/html,application/xhtml+xml'); text=raw.decode('utf-8','replace').replace('\\u002F','/').replace('\\/','/')
    ids=[]
    for m in re.finditer(rf'/public-files/datasets/{DATASET_ID}/files/([0-9a-fA-F-]{{36}})/file_downloaded',text):
        fid=m.group(1).lower()
        if fid not in ids: ids.append(fid)
    return ids

def main():
    a=argparse.ArgumentParser(); a.add_argument('--output',type=Path,required=True); a.add_argument('--retrieved-date',required=True); args=a.parse_args()
    errors=[]; files=[]
    try:
        raw,_=get(PUBLIC_FILES,'application/json'); files=[compact(x) for x in flatten(json.loads(raw.decode('utf-8')))]
    except Exception as e: errors.append(f'public-api:{type(e).__name__}:{e}')
    html_ids=[]
    try: html_ids=page_link_ids()
    except Exception as e: errors.append(f'page:{type(e).__name__}:{e}')
    status='publisher-file-manifest-profiled' if files else ('publisher-links-visible-names-unresolved' if html_ids else 'publisher-record-no-files-exposed')
    result={'schema':1,'status':status,'retrievedDate':args.retrieved_date,'source':{'datasetId':'mendeley-8c8fjwcw86-v1','datasetDoi':'10.17632/8c8fjwcw86.1','version':VERSION,'license':'CC BY 4.0','datasetPage':PAGE},'manifest':{'files':files,'fileCount':len(files),'totalBytes':sum(int(x.get('sizeBytes') or 0) for x in files),'injectionCandidateFiles':[x['filename'] for x in files if x['injectionMarkerByName']],'slsCandidateFiles':[x['filename'] for x in files if x['slsMarkerByName']],'ambiguousRouteFiles':[x['filename'] for x in files if x['mixedOrAmbiguousRouteByName']],'htmlDiscoveredFileIds':html_ids,'rawPayloadsDownloaded':False,'rawRowsOrArraysEmitted':False},'retrievalDiagnostics':{'errors':errors,'payloadDownloadEndpointsCalled':False},'acceptance':{'countsAsFullyProfiledMeasuredDataset':False,'acceptedInjectionProcessTimeSeriesSamples':0,'stage2Required':bool(files)},'evidenceBoundary':'Manifest-only route separation. Injection-moulded and SLS payloads must remain distinct before any Stage 2 download or measurement counting.'}
    args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':status,'fileCount':len(files),'injectionCandidates':result['manifest']['injectionCandidateFiles'],'slsCandidates':result['manifest']['slsCandidateFiles'],'ambiguousCount':len(result['manifest']['ambiguousRouteFiles']),'htmlFileIds':len(html_ids)},indent=2))
if __name__=='__main__': main()
