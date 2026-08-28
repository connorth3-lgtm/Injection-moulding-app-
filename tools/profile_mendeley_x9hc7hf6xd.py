#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,hashlib,html,io,json,re,urllib.parse,urllib.request,zipfile
from pathlib import Path

DATASET_ID='x9hc7hf6xd'; VERSION='2'; DOI='10.17632/x9hc7hf6xd.2'
TITLE='Demoulding behaviour of material jetted surfaces'; LICENSE='CC BY 4.0'
PAGE=f'https://data.mendeley.com/datasets/{DATASET_ID}/{VERSION}'
API=f'https://data.mendeley.com/public-api/datasets/{DATASET_ID}/files?folder_id=root&version={VERSION}'
UA='MouldMaster-Warwick-demoulding-profiler/1.0'

def sha256(b): return hashlib.sha256(b).hexdigest()
def get(url,accept='*/*'):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept})
    with urllib.request.urlopen(req,timeout=180) as r:return r.read(),r.headers,r.geturl()
def flatten(x):
    if isinstance(x,list):return x
    if isinstance(x,dict):
        for k in ('results','files','items','data'):
            if isinstance(x.get(k),list):return x[k]
    return []
def discover():
    out=[]
    try:
        raw,_,_=get(API,'application/json')
        for item in flatten(json.loads(raw.decode('utf-8'))):
            url=item.get('download_url') or item.get('downloadUrl') or (item.get('content_details') or {}).get('download_url')
            name=item.get('name') or item.get('filename') or item.get('file_name')
            if url:out.append({'name':name,'url':url,'publisherId':item.get('id')})
    except Exception:pass
    if out:return out
    raw,_,_=get(PAGE,'text/html')
    text=html.unescape(raw.decode('utf-8','replace')).replace('\\u002F','/').replace('\\/','/')
    pat=re.compile(rf'https://data\.mendeley\.com/public-files/datasets/{DATASET_ID}/files/([0-9a-fA-F-]{{36}})/file_downloaded')
    seen=set()
    for m in pat.finditer(text):
        u=m.group(0)
        if u not in seen:seen.add(u);out.append({'name':None,'url':u,'publisherId':m.group(1)})
    if not out:raise RuntimeError('No version-pinned Mendeley files discovered')
    return out
def filename(final,headers,fallback):
    cd=headers.get('Content-Disposition')
    if cd:
        m=re.search(r'filename\*?=(?:UTF-8\'\'|")?([^";]+)',cd,re.I)
        if m:return urllib.parse.unquote(m.group(1).strip().strip('"'))
    n=Path(urllib.parse.urlparse(final).path).name
    return n if Path(n).suffix else fallback
def profile_csv(raw,name):
    text=raw.decode('utf-8-sig','replace')
    try:d=csv.Sniffer().sniff(text[:65536],delimiters=',;\t|')
    except Exception:d=csv.excel
    rows=list(csv.reader(io.StringIO(text),d)); h=[str(x).strip() for x in rows[0]] if rows else []; body=[r for r in rows[1:] if any(str(x).strip() for x in r)] if rows else []
    return {'format':'csv','rows':len(body),'columns':len(h),'header':h}
def profile_zip(raw):
    from collections import Counter
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        infos=[i for i in z.infolist() if not i.is_dir()]
        return {'format':'zip','members':len(infos),'memberNames':[i.filename for i in infos[:200]],'suffixCounts':dict(Counter(Path(i.filename).suffix.lower() or '<none>' for i in infos))}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',default='warwick-demoulding-v2.json');a=ap.parse_args()
    files=[]
    for i,rec in enumerate(discover(),1):
        raw,h,final=get(rec['url']);name=rec.get('name') or filename(final,h,f'publisher-file-{i}')
        ext=Path(name).suffix.lower();p={'name':name,'publisherId':rec.get('publisherId'),'resolvedUrl':final,'sizeBytes':len(raw),'sha256':sha256(raw),'suffix':ext}
        if ext in {'.csv','.tsv','.txt'}:p.update(profile_csv(raw,name))
        elif ext=='.zip' and zipfile.is_zipfile(io.BytesIO(raw)):p.update(profile_zip(raw))
        elif ext in {'.opj','.opju','.ogg','.ogw'}:p.update({'format':'origin-project','schemaInspection':'dedicated Origin adapter required'})
        else:p['format']=ext.lstrip('.') or 'unknown'
        files.append(p)
    payload={'schema':1,'status':'profile-generated-review-required','completedDate':'2026-08-28','source':{'datasetId':DATASET_ID,'version':VERSION,'doi':DOI,'title':TITLE,'license':LICENSE,'publisher':'Mendeley Data','page':PAGE,'studyDomain':'high-speed demoulding/ejection data acquisition for injection-moulded/material-jetted surfaces'},'files':files,'fileCount':len(files),'originProjectFiles':sum(1 for x in files if x.get('format')=='origin-project'),'tabularFiles':sum(1 for x in files if x.get('format')=='csv'),'acceptedMeasuredCycles':0,'acceptedMeasuredTimeSeriesSamples':0,'rawSourceRowsCommitted':False,'boundary':'Exact version-2 publisher files are fingerprinted and formats enumerated. The source is CC BY 4.0, but no dataset-package or scalar promotion occurs until demoulding trial grouping, high-speed DAQ channel semantics, units and sample ordering are extracted. Origin project files require a dedicated lawful adapter/export path rather than guessed parsing.'}
    Path(a.output).write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'fileCount':len(files),'files':files,'originProjectFiles':payload['originProjectFiles'],'tabularFiles':payload['tabularFiles']},indent=2,ensure_ascii=False))
if __name__=='__main__':main()
