#!/usr/bin/env python3
from __future__ import annotations
import argparse, html, json, re, urllib.parse, urllib.request
from pathlib import Path

DATASET_ID='yxz2w7ctnh'; VERSION=1; DOI='10.17632/yxz2w7ctnh.1'
PAGE=f'https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}'
PUBLIC_API=f'https://data.mendeley.com/public-api/datasets/{DATASET_ID}'
UA='MouldMaster-Educational-Evidence-Profiler/1.0'

def request_bytes(url,accept='*/*'):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept})
    with urllib.request.urlopen(req,timeout=60) as r: return r.read(),r.geturl(),r.headers.get('Content-Type')

def request_json_optional(url):
    try:
        raw,final,ctype=request_bytes(url,'application/json')
        return json.loads(raw.decode('utf-8')), {'url':url,'finalUrl':final,'contentType':ctype,'ok':True}
    except Exception as e: return None, {'url':url,'ok':False,'error':f'{type(e).__name__}: {e}'}

def flatten(payload):
    if isinstance(payload,list): return payload
    if isinstance(payload,dict):
        for k in ('results','files','folders','items','data'):
            if isinstance(payload.get(k),list): return payload[k]
    return []

def route_flags(name):
    low=name.lower()
    injection=any(x in low for x in ['injection','injected','mould','mold','im '])
    fdm=any(x in low for x in ['fdm','3d print','3d-print','printed','print '])
    mechanical=any(x in low for x in ['tensile','bend','bending','impact','structural','mechanical'])
    energy='energy' in low or 'power' in low
    return injection,fdm,mechanical,energy

def compact_file(f,src):
    cd=f.get('content_details') or f.get('contentDetails') or {}
    name=str(f.get('filename') or f.get('name') or '').strip(); inj,fdm,mech,energy=route_flags(name)
    return {'id':f.get('id') or f.get('file_id') or f.get('uuid'),'filename':name,'folderId':f.get('folder_id') or f.get('folderId'),'sizeBytes':cd.get('size') if cd.get('size') is not None else f.get('size'),'sha256':cd.get('sha256_hash') or cd.get('sha256Hash') or f.get('sha256'),'md5':f.get('md5') or f.get('md5_hash'),'contentType':cd.get('content_type') or f.get('content_type'),'listingSource':src,'routeMarkers':{'injection':inj,'fdm':fdm},'mechanicalTestMarker':mech,'energyMarker':energy,'rawPayloadDownloaded':False}

def compact_folder(f,src):
    name=str(f.get('name') or '').strip(); inj,fdm,mech,energy=route_flags(name)
    return {'id':f.get('id') or f.get('folder_id') or f.get('uuid'),'name':name,'parentId':f.get('parent_id') or f.get('parentId'),'listingSource':src,'routeMarkers':{'injection':inj,'fdm':fdm},'mechanicalTestMarker':mech,'energyMarker':energy}

def page_links():
    raw,final,ctype=request_bytes(PAGE,'text/html,application/xhtml+xml'); text=html.unescape(raw.decode('utf-8','replace')).replace('\\u002F','/').replace('\\/','/')
    pat=re.compile(rf'https://data\.mendeley\.com/public-files/datasets/{DATASET_ID}/files/([0-9a-fA-F-]{{36}})/file_downloaded')
    out=[]; seen=set()
    for m in pat.finditer(text):
        fid=m.group(1).lower()
        if fid in seen: continue
        seen.add(fid); ctx=text[max(0,m.start()-900):min(len(text),m.end()+900)]
        nm=re.search(r'"(?:filename|name)"\s*:\s*"([^"\\]{1,240})"',ctx); name=nm.group(1) if nm else ''
        inj,fdm,mech,energy=route_flags(name)
        out.append({'id':fid,'filename':name,'folderId':None,'sizeBytes':None,'sha256':None,'md5':None,'contentType':None,'listingSource':PAGE,'routeMarkers':{'injection':inj,'fdm':fdm},'mechanicalTestMarker':mech,'energyMarker':energy,'rawPayloadDownloaded':False})
    return out, {'url':PAGE,'finalUrl':final,'contentType':ctype,'ok':True,'publicFileLinksFound':len(out)}

def enumerate_manifest():
    files=[]; folders=[]; attempts=[]
    for url in [f'{PUBLIC_API}/files?folder_id=root&version={VERSION}',f'{PUBLIC_API}/files?version={VERSION}']:
        p,d=request_json_optional(url); attempts.append(d)
        for item in flatten(p):
            (folders if str(item.get('type') or '').lower()=='folder' else files).append(compact_folder(item,url) if str(item.get('type') or '').lower()=='folder' else compact_file(item,url))
    for url in [f'{PUBLIC_API}/folders?version={VERSION}',f'{PUBLIC_API}/folders?parent_id=root&version={VERSION}']:
        p,d=request_json_optional(url); attempts.append(d); folders.extend(compact_folder(i,url) for i in flatten(p))
    byfolder={f['id']:f for f in folders if f.get('id')}; folders=list(byfolder.values())
    for f in folders:
        url=f"{PUBLIC_API}/files?folder_id={urllib.parse.quote(str(f['id']))}&version={VERSION}"; p,d=request_json_optional(url); attempts.append(d); files.extend(compact_file(i,url) for i in flatten(p))
    links,d=page_links(); attempts.append(d); files.extend(links)
    byid={}; anonymous=[]
    for f in files:
        if f.get('id'):
            old=byid.get(f['id']);
            if old is None or (not old.get('filename') and f.get('filename')): byid[f['id']]=f
        elif f.get('filename'): anonymous.append(f)
    return list(byid.values())+anonymous,folders,attempts

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--output',required=True); ap.add_argument('--retrieved-date',required=True); a=ap.parse_args()
    files,folders,attempts=enumerate_manifest()
    inj=[x['filename'] for x in files if x['routeMarkers']['injection']]; fdm=[x['filename'] for x in files if x['routeMarkers']['fdm']]; mech=[x['filename'] for x in files if x['mechanicalTestMarker']]; energy=[x['filename'] for x in files if x['energyMarker']]
    result={'schema':1,'status':'publisher-file-manifest-profiled' if files else 'publisher-folder-manifest-profiled-no-files-yet','retrievedDate':a.retrieved_date,'source':{'datasetId':'mendeley-yxz2w7ctnh-v1','datasetDoi':DOI,'mendeleyDatasetId':DATASET_ID,'version':VERSION,'publisher':'Mendeley Data','datasetPage':PAGE,'license':'CC BY 4.0'},'manifest':{'files':files,'folders':folders,'fileCount':len(files),'folderCount':len(folders),'totalBytes':sum(int(x.get('sizeBytes') or 0) for x in files),'filesWithPublisherSha256':sum(1 for x in files if isinstance(x.get('sha256'),str) and len(x['sha256'])==64),'injectionFilesByName':inj,'fdmFilesByName':fdm,'mechanicalTestFilesByName':mech,'energyFilesByName':energy,'listingAttempts':attempts,'rawPayloadsDownloaded':False,'rawRowsOrArraysEmitted':False},'acceptance':{'stage1ManifestComplete':bool(files or folders),'countsAsFullyProfiledMeasuredDataset':False,'acceptedInjectionProcessTimeSeriesSamples':0,'stage2Required':True},'evidenceBoundary':'Stage 1 enumerates publisher metadata only. Injection-moulded ABS/PLA mechanical-test evidence must be isolated from FDM and energy records before measured values count. Raw payloads are not downloaded.'}
    Path(a.output).parent.mkdir(parents=True,exist_ok=True); Path(a.output).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':result['status'],'fileCount':len(files),'folderCount':len(folders),'totalBytes':result['manifest']['totalBytes'],'injectionFilesByName':inj,'fdmFilesByName':fdm,'mechanicalTestFilesByName':mech,'energyFilesByName':energy},indent=2))
if __name__=='__main__': main()
