#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,urllib.request
from pathlib import Path
DATASET='ypf95p4bs4';VERSION=1;DOI='10.17632/ypf95p4bs4.1';UA='MouldMaster-Educational-Evidence-Profiler/1.0'
ENDPOINT=f'https://data.mendeley.com/public-api/datasets/{DATASET}/files?folder_id=root&version={VERSION}'
def get_json(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=90) as r:return json.loads(r.read().decode())
def flatten(x):
    if isinstance(x,list):return x
    if isinstance(x,dict):
        for k in ('results','files','items','data'):
            if isinstance(x.get(k),list):return x[k]
    return []
def compact(x):
    d=x.get('content_details') or x.get('contentDetails') or {};n=str(x.get('filename') or x.get('name') or '')
    lo=n.lower();sim=any(t in lo for t in ('arena','simulation','simulacion','simulación','model'))
    operational=any(t in lo for t in ('database','data base','base de datos','registro','record','production','produccion','producción','downtime','availability','disponibilidad','sm ed','smed','tpm','excel','data')) and not sim
    return {'id':x.get('id') or x.get('file_id'),'filename':n,'sizeBytes':d.get('size') if d.get('size') is not None else x.get('size'),'sha256':d.get('sha256_hash') or d.get('sha256Hash'),'contentType':d.get('content_type') or d.get('contentType'),'likelySimulationByName':sim,'likelyOperationalByName':operational,'rawPayloadDownloaded':False}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);ap.add_argument('--retrieved-date',required=True);a=ap.parse_args();files=[compact(x) for x in flatten(get_json(ENDPOINT))]
    result={'schema':1,'status':'publisher-file-manifest-profiled' if files else 'publisher-record-no-files-exposed','retrievedDate':a.retrieved_date,'source':{'datasetId':'mendeley-ypf95p4bs4-v1','datasetDoi':DOI,'license':'CC BY 4.0','version':VERSION},'manifest':{'fileCount':len(files),'files':files,'totalBytes':sum(int(f.get('sizeBytes') or 0) for f in files),'likelyOperationalFiles':[f['filename'] for f in files if f['likelyOperationalByName']],'likelySimulationFiles':[f['filename'] for f in files if f['likelySimulationByName']],'rawPayloadsDownloaded':False,'rawRowsOrArraysEmitted':False},'acceptance':{'countsAsFullyProfiledMeasuredDataset':False,'acceptedMeasuredTimeSeriesSamples':0,'stage2Required':bool(files)},'evidenceBoundary':'Publisher metadata only. File-name classification is triage, not evidence acceptance. Arena/simulation artifacts never count as measured evidence. Operational files require exact payload fingerprint and semantic profiling before acceptance.'}
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'status':result['status'],'files':len(files),'operational':result['manifest']['likelyOperationalFiles'],'simulation':result['manifest']['likelySimulationFiles']},indent=2))
if __name__=='__main__':main()
